import React from 'react';
import { ArrowRight, BookOpen, MessageCircle, Truck, ShieldCheck, CheckCircle2, Bot, Film } from 'lucide-react';
import { StoreSettings } from '../types';
import { getAdvisorWhatsAppUrl } from '../services/whatsappService';

interface HeroProps {
  settings: StoreSettings;
  onExploreClick: () => void;
  onOpenChatbot: () => void;
  onOpenAnimator: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  onExploreClick,
  onOpenChatbot,
  onOpenAnimator,
}) => {
  const whatsappAdvisorUrl = getAdvisorWhatsAppUrl(settings);

  return (
    <section id="hero" className="relative pt-6 pb-12 sm:pb-16 lg:pb-20 overflow-hidden border-b border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="text-xs uppercase tracking-widest text-[#A66B24] font-semibold mb-3 flex items-center gap-2">
              <span>L'AVIS DES LIVRES · Librairie & Pôle Éditorial au Cameroun</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1715] leading-[1.15] tracking-tight mb-5" style={{ textWrap: 'balance' }}>
              L'avis d'experts, l'excellence des savoirs et vos livres livrés chez vous.
            </h1>

            <p className="text-base sm:text-lg text-[#57534E] leading-relaxed mb-8 max-w-xl">
              Découvrez les chefs-d'œuvre de la littérature contemporaine, manuels d'entrepreneuriat, de finance, de développement personnel et annales scolaires au Cameroun. Échangez avec notre <strong>Conseiller IA</strong>, animez vos couvertures en vidéo et commandez en FCFA en 1 clic.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-8">
              <button
                onClick={onExploreClick}
                className="px-6 py-3.5 text-sm font-semibold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Explorer le Catalogue</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenChatbot}
                className="px-5 py-3.5 text-sm font-semibold text-[#1A1715] bg-[#FAF3E8] hover:bg-[#F0E4D0] border border-[#E8D9C0] rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4 text-[#C58A3E]" />
                <span>Conseiller Littéraire IA</span>
              </button>

              <button
                onClick={onOpenAnimator}
                className="px-4 py-3.5 text-xs font-semibold text-[#57534E] hover:text-[#1A1715] bg-white border border-[#E8E2D9] hover:border-[#C58A3E] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                title="Créer une animation vidéo de livre"
              >
                <Film className="w-3.5 h-3.5 text-[#C58A3E]" />
                <span>Studio Vidéo IA</span>
              </button>
            </div>

            {/* Reassurance points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#E8E2D9] text-xs text-[#57534E]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C58A3E] shrink-0" />
                <span>Livraison 24h Douala & Yaoundé</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C58A3E] shrink-0" />
                <span>Orange Money & MTN MoMo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C58A3E] shrink-0" />
                <span>Paiement à la réception</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative flex items-center">
            <div className="w-full relative rounded-2xl overflow-hidden border border-[#E8E2D9] shadow-md bg-[#F3EFEA] aspect-[4/3] lg:aspect-auto lg:h-full min-h-[340px]">
              <img
                src="/images/hero.jpg"
                alt="Salon de lecture et espace de critique littéraire L'AVIS DES LIVRES"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                <div className="text-white">
                  <span className="text-[11px] uppercase tracking-wider text-[#E8D5B5] font-semibold">
                    Grand coup de cœur littéraire
                  </span>
                  <p className="font-serif text-lg font-semibold mt-1">
                    « Penser l'Afrique de Demain : Souveraineté & Renaissance »
                  </p>
                  <span className="text-xs text-white/80">Dr. Jean-Marc Nkolo · Disponible en stock</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
