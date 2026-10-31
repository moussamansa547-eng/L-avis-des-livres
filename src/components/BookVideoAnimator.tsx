import React, { useState } from 'react';
import { Video, Film, Upload, Play, Download, Sparkles, RefreshCw, X, AlertCircle } from 'lucide-react';
import { Book } from '../types';

interface BookVideoAnimatorProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
}

export const BookVideoAnimator: React.FC<BookVideoAnimatorProps> = ({
  isOpen,
  onClose,
  books,
}) => {
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>(books[0]?.coverUrl || '/images/book_literature.jpg');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [prompt, setPrompt] = useState(
    "Cinematic camera glide across the book cover with soft golden dust motes, gentle breeze rippling pages, warm studio lighting."
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local user photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImageSrc(result);
      setUploadedBase64(result);
      setGeneratedVideoUrl(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Convert image URL to base64 for API submission if needed
  const getBase64FromUrl = async (url: string): Promise<string> => {
    if (url.startsWith('data:')) {
      return url;
    }
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const base64Data = uploadedBase64 || (await getBase64FromUrl(selectedImageSrc));

      const res = await fetch('/api/animate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          prompt,
          aspectRatio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la génération de la vidéo.');
      }

      if (data.videoUrl) {
        setGeneratedVideoUrl(data.videoUrl);
      } else {
        throw new Error("Aucun lien vidéo n'a été retourné.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Échec de la génération vidéo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const presetPrompts = [
    'Animation cinématique avec lumière dorée et reflets métalliques sur le titre.',
    'Effet de vent doux feuilletant les pages du livre avec poussière lumineuse.',
    'Zoom avant dynamique et révélation dramatique de la couverture en haute définition.',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#78716C] hover:text-[#1A1715] rounded-lg hover:bg-[#F3EFEA] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-lg bg-[#1A1715] text-[#C58A3E] flex items-center justify-center shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1A1715]">
              Studio d'Animation Vidéo IA
            </h3>
            <span className="text-[11px] text-[#78716C]">
              Animez vos couvertures et photos en vidéo avec Gemini Omni Flash (gemini-omni-1.1-flash)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* Left Column: Image Selection & Preview */}
          <div className="md:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1715] mb-2">
                1. Image source à animer
              </label>

              {/* Upload trigger */}
              <label className="flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-[#D8D0C5] hover:border-[#C58A3E] rounded-xl cursor-pointer transition-colors text-xs text-[#57534E] hover:text-[#1A1715]">
                <Upload className="w-4 h-4 text-[#C58A3E]" />
                <span>Téléverser une photo / couverture</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Quick selection from bookstore catalog */}
            <div>
              <span className="text-[11px] text-[#78716C] block mb-1.5">
                Ou choisir un livre du catalogue :
              </span>
              <div className="grid grid-cols-4 gap-2">
                {books.slice(0, 4).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedImageSrc(b.coverUrl);
                      setUploadedBase64(null);
                      setGeneratedVideoUrl(null);
                    }}
                    className={`aspect-[3/4] rounded-md overflow-hidden border-2 transition-all p-0.5 bg-white ${
                      selectedImageSrc === b.coverUrl
                        ? 'border-[#C58A3E] ring-2 ring-[#C58A3E]/20'
                        : 'border-[#E8E2D9] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={b.coverUrl}
                      alt={b.title}
                      className="w-full h-full object-cover rounded-xs"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Image Preview */}
            <div className="bg-white border border-[#E8E2D9] rounded-xl p-3 flex flex-col items-center">
              <span className="text-[10px] uppercase font-semibold text-[#78716C] mb-2">
                Aperçu de la première image
              </span>
              <div className="max-h-48 aspect-[3/4] rounded-lg overflow-hidden border border-[#E8E2D9] shadow-xs">
                <img
                  src={selectedImageSrc}
                  alt="Aperçu sélection"
                  className="w-full h-full object-contain bg-[#FAF8F5]"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Video Configuration & Player */}
          <div className="md:col-span-7 space-y-4">
            {/* Aspect Ratio Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1715] mb-1.5">
                2. Format vidéo (Ratio d'aspect obligatoire)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    aspectRatio === '16:9'
                      ? 'border-[#C58A3E] bg-[#FFF8EE] text-[#1A1715]'
                      : 'border-[#E8E2D9] bg-white text-[#57534E] hover:border-[#D8D0C5]'
                  }`}
                >
                  <div className="w-5 h-3 border-2 border-current rounded-xs" />
                  <span>16:9 (Paysage / Web)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    aspectRatio === '9:16'
                      ? 'border-[#C58A3E] bg-[#FFF8EE] text-[#1A1715]'
                      : 'border-[#E8E2D9] bg-white text-[#57534E] hover:border-[#D8D0C5]'
                  }`}
                >
                  <div className="w-3 h-5 border-2 border-current rounded-xs" />
                  <span>9:16 (Portrait / Reels)</span>
                </button>
              </div>
            </div>

            {/* Motion Prompt */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1715] mb-1.5">
                3. Consigne de mouvement & ambiance
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Décrivez les mouvements de caméra, la lumière ou les effets souhaités..."
                className="w-full text-xs bg-white border border-[#D8D0C5] rounded-xl p-2.5 text-[#1A1715] focus:outline-none focus:border-[#C58A3E]"
              />

              <div className="flex flex-wrap gap-1.5 mt-2">
                {presetPrompts.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(preset)}
                    className="text-[10px] bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#E8E2D9] text-[#57534E] hover:text-[#1A1715] px-2 py-0.5 rounded transition-colors"
                  >
                    + {preset.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Error / Notice Display */}
            {errorMessage && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{errorMessage}</p>
                  <p className="text-[11px] text-amber-800">
                    Le modèle `gemini-omni-1.1-flash` via l'Interactions API nécessite une clé API avec facturation activée pour la génération vidéo en direct.
                  </p>
                </div>
              </div>
            )}

            {/* Generate Action Button */}
            <div>
              <button
                type="button"
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className="w-full py-3 px-4 text-xs font-bold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#C58A3E]" />
                    <span>Génération en cours avec Gemini Omni Flash... (cela peut prendre 30-60s)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C58A3E]" />
                    <span>Animer la photo en vidéo ({aspectRatio})</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Video Player */}
            {generatedVideoUrl && (
              <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-emerald-600" />
                    <span>Vidéo générée avec succès !</span>
                  </span>

                  <a
                    href={generatedVideoUrl}
                    download={`video_livre_${aspectRatio === '9:16' ? 'portrait' : 'paysage'}.mp4`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A1715] hover:text-[#C58A3E]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger MP4</span>
                  </a>
                </div>

                <div
                  className={`w-full overflow-hidden rounded-lg bg-black flex items-center justify-center ${
                    aspectRatio === '9:16' ? 'max-h-80 aspect-[9/16]' : 'aspect-video'
                  }`}
                >
                  <video
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
