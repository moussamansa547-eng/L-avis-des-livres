import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Sparkles, RefreshCw, BookOpen, MessageCircle } from 'lucide-react';
import { Book } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onSelectBook: (book: Book) => void;
  onAddToCart: (book: Book) => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  isOpen,
  onClose,
  books,
  onSelectBook,
  onAddToCart,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Bonjour et bienvenue chez **L'AVIS DES LIVRES** ! 📚\n\nJe suis votre Conseiller Littéraire & Critique IA. Vous hésitez entre plusieurs lectures, cherchez un livre pour booster votre activité à Douala ou Yaoundé, ou souhaitez un conseil pour un concours ?\n\nPosez-moi votre question, je vous partage mon avis critique et mes meilleures recommandations !",
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelPreference, setModelPreference] = useState<'standard' | 'fast' | 'complex'>('standard');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Map to server payload
      const payload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payload,
          modelPreference,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur de réponse de l’assistant.');
      }

      const assistantMessage: ChatMessage = {
        id: `reply-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Désolé, une erreur s'est produite : ${err.message || "Impossible de contacter l'agent IA."}`,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Quel est le meilleur livre de business pour entreprendre au Cameroun ?',
    'Recommande-moi un grand roman littéraire africain émouvant.',
    'Quels ouvrages pour préparer les concours d’ingénieurs ?',
    'Comment commander et payer par Mobile Money ?',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] border-l border-[#E8E2D9] h-full flex flex-col shadow-2xl">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-[#E8E2D9] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1A1715] text-[#C58A3E] flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-[#1A1715]">
                  Conseiller IA · L'AVIS DES LIVRES
                </h3>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded">
                  En ligne
                </span>
              </div>
              <p className="text-[11px] text-[#78716C]">
                Recommandations littéraires & avis personnalisés
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1A1715] rounded-lg hover:bg-[#F3EFEA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Selector Bar */}
        <div className="bg-[#FAF3E8] border-b border-[#E8D9C0] px-4 py-1.5 flex items-center justify-between text-[11px]">
          <span className="text-[#8A581A] font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#C58A3E]" />
            <span>Moteur Gemini :</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setModelPreference('standard')}
              className={`px-2 py-0.5 rounded transition-colors ${
                modelPreference === 'standard'
                  ? 'bg-[#1A1715] text-white font-semibold'
                  : 'text-[#8A581A] hover:text-[#1A1715]'
              }`}
              title="gemini-3.8-flash (Tâches générales)"
            >
              Équilibré (3.8 Flash)
            </button>
            <button
              onClick={() => setModelPreference('fast')}
              className={`px-2 py-0.5 rounded transition-colors ${
                modelPreference === 'fast'
                  ? 'bg-[#1A1715] text-white font-semibold'
                  : 'text-[#8A581A] hover:text-[#1A1715]'
              }`}
              title="gemini-3.1-flash-lite (Ultra-rapide)"
            >
              Rapide (Lite)
            </button>
            <button
              onClick={() => setModelPreference('complex')}
              className={`px-2 py-0.5 rounded transition-colors ${
                modelPreference === 'complex'
                  ? 'bg-[#1A1715] text-white font-semibold'
                  : 'text-[#8A581A] hover:text-[#1A1715]'
              }`}
              title="gemini-4-argon (Analyses complexes)"
            >
              Expert (Argon)
            </button>
          </div>
        </div>

        {/* Messages Thread (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-[#1A1715] text-[#C58A3E] flex items-center justify-center shrink-0 text-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#1A1715] text-[#FAF8F5] rounded-br-xs'
                    : 'bg-white border border-[#E8E2D9] text-[#1A1715] rounded-bl-xs shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>

                <div
                  className={`mt-1.5 flex items-center justify-between text-[10px] ${
                    m.role === 'user' ? 'text-white/60' : 'text-[#78716C]'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {m.modelUsed && (
                    <span className="font-mono text-[9px] opacity-75">
                      via {m.modelUsed}
                    </span>
                  )}
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-[#C58A3E] text-white flex items-center justify-center shrink-0 text-xs mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#78716C] bg-white border border-[#E8E2D9] p-3 rounded-xl max-w-xs shadow-2xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C58A3E]" />
              <span>L'Avis des Livres réfléchit et rédige sa recommandation...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-2.5 bg-white border-t border-[#E8E2D9] overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp)}
                disabled={isLoading}
                className="px-2.5 py-1 text-[11px] bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#E8E2D9] text-[#57534E] hover:text-[#1A1715] rounded-md transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="p-3.5 bg-white border-t border-[#E8E2D9]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Posez votre question littéraire ou demandez un conseil..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 text-xs bg-[#FAF8F5] border border-[#D8D0C5] rounded-xl px-3.5 py-2.5 text-[#1A1715] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C58A3E]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-[#1A1715] hover:bg-[#C58A3E] text-white rounded-xl transition-colors disabled:opacity-40"
              title="Envoyer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
