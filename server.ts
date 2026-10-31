import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser with 50mb limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * 1. Multi-turn Chatbot endpoint with Gemini
 * Models supported: gemini-3.8-flash (default), gemini-3.1-flash-lite, gemini-4-argon
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, modelPreference } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Historique de messages requis.' });
    }

    // Model selection logic based on requirements:
    // - gemini-4-argon for particularly complex tasks
    // - gemini-3.8-flash for general tasks (default)
    // - gemini-3.1-flash-lite for tasks that should happen fast
    let chosenModel = 'gemini-3.8-flash';
    if (modelPreference === 'fast') {
      chosenModel = 'gemini-3.1-flash-lite';
    } else if (modelPreference === 'complex') {
      chosenModel = 'gemini-4-argon';
    }

    const systemInstruction = `Tu es le Conseiller Littéraire & Critique IA officiel de la prestigieuse librairie et maison d'édition "L'AVIS DES LIVRES", basée au Cameroun (Douala et Yaoundé).

Ton rôle :
1. Tu conseilles les passionnés de lecture, étudiants, cadres, entrepreneurs et parents d'élèves.
2. Tu partages des avis éclairés, argumentés et passionnants sur les livres, les auteurs et les courants de pensée.
3. Tu recommandes des lectures adaptées aux besoins de l'utilisateur (Littérature africaine et mondiale, Entrepreneuriat & Finance, Développement personnel, Réussite scolaire & Concours).
4. Tu intègres naturellement les réalités camerounaises (monnaie en FCFA, livraison à Douala/Yaoundé, paiement Mobile Money Wave/Orange Money/MTN MoMo ou paiement à la livraison).
5. Ton ton est cultivé, chaleureux, bienveillant, élégant et enthousiaste. Sois concis et direct, tout en restant profondément inspirant.`;

    // Map conversation history
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents,
      config: {
        systemInstruction,
      },
    });

    const replyText = response.text || "Je suis à votre écoute pour vous conseiller les meilleurs ouvrages de L'AVIS DES LIVRES.";

    return res.json({
      reply: replyText,
      modelUsed: chosenModel,
    });
  } catch (error: any) {
    console.error('Gemini Chat error:', error);

    // If gemini-4-argon fails (e.g. requires paid tier), graceful fallback to gemini-3.8-flash
    if (req.body?.modelPreference === 'complex') {
      try {
        const contents = req.body.messages.map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const fallbackResp = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: "Tu es le Conseiller Littéraire IA de la librairie L'AVIS DES LIVRES au Cameroun.",
          },
        });

        return res.json({
          reply: fallbackResp.text || "À votre service pour vous guider dans vos lectures.",
          modelUsed: 'gemini-3.8-flash (relais)',
        });
      } catch (fallbackError: any) {
        return res.status(500).json({
          error: fallbackError.message || "Erreur lors de l'échange avec l'agent IA.",
        });
      }
    }

    return res.status(500).json({
      error: error.message || 'Une erreur est survenue lors de la communication avec Gemini.',
    });
  }
});

/**
 * 2. Animate Image into Video using Gemini Interactions API (gemini-omni-1.1-flash)
 * Aspect ratio: 16:9 or 9:16
 */
app.post('/api/animate-video', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', prompt, aspectRatio = '16:9' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image de départ requise (format Base64).' });
    }

    // Clean base64 string if data URL prefix exists
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const motionPrompt =
      prompt?.trim() ||
      "Animate this book cover with subtle cinematic camera movement, ambient warm lighting, and delicate dust motes floating gently.";

    const chosenAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';

    // Call Gemini Interactions API using gemini-omni-1.1-flash as strictly required
    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.1-flash',
        input: [
          {
            type: 'image',
            mime_type: mimeType,
            data: cleanBase64,
          },
          {
            type: 'text',
            text: motionPrompt,
          },
        ],
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: chosenAspectRatio,
          duration: '5s',
          resolution: '720p',
        },
      },
      { timeout: 180000 }
    );

    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      const videoDataUrl = `data:${videoPart.mime_type || 'video/mp4'};base64,${videoPart.data}`;
      return res.json({
        success: true,
        videoUrl: videoDataUrl,
        aspectRatio: chosenAspectRatio,
      });
    }

    // If no video was returned in output_video, check steps
    for (const step of interaction.steps || []) {
      if (step.type === 'model_output') {
        const vid = step.content?.find((c: any) => c.type === 'video') as any;
        if (vid && vid.data) {
          const videoDataUrl = `data:${vid.mime_type || 'video/mp4'};base64,${vid.data}`;
          return res.json({
            success: true,
            videoUrl: videoDataUrl,
            aspectRatio: chosenAspectRatio,
          });
        }
      }
    }

    return res.status(500).json({
      error: "Le modèle gemini-omni-1.1-flash n'a pas retourné de flux vidéo exploitable.",
    });
  } catch (error: any) {
    console.error('Video generation error with gemini-omni-1.1-flash:', error);
    const msg = error?.message || '';

    // Handle common billing / model access error gracefully
    if (msg.includes('PERMISSION_DENIED') || msg.includes('BILLING') || msg.includes('403') || msg.includes('RESOURCE_EXHAUSTED')) {
      return res.status(403).json({
        error: "L'animation vidéo via 'gemini-omni-1.1-flash' requiert une clé API avec facturation activée (Paid tier). Vous pouvez configurer votre clé dans Paramètres > Secrets.",
        needsPaidKey: true,
      });
    }

    return res.status(500).json({
      error: `Erreur d'animation vidéo : ${msg || 'Erreur inconnue'}`,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} with Gemini API integrations`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} is already bound by existing process.`);
    } else {
      console.error('[Server error]:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
