import React, { useState } from 'react';
import { MessageCircle, Mail, Phone, MapPin, Check } from 'lucide-react';
import { StoreSettings } from '../types';
import { getAdvisorWhatsAppUrl } from '../services/whatsappService';

interface FooterProps {
  settings: StoreSettings;
  onNavigateSection: (sec: string) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onNavigateSection,
  onOpenAdmin,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const whatsappUrl = getAdvisorWhatsAppUrl(settings);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setNewsletterEmail('');
  };

  return (
    <footer className="bg-[#1A1715] text-[#FAF8F5] pt-14 pb-10 border-t border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-[#2D2825]">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2">
            <span className="font-serif text-2xl font-bold tracking-tight text-white block">
              L'AVIS DES LIVRES
            </span>
            <span className="text-xs uppercase tracking-widest text-[#C58A3E] font-medium block mt-1">
              Librairie & Éditions Littéraires · Douala & Yaoundé
            </span>

            <p className="text-xs text-[#A8A29E] leading-relaxed mt-4 max-w-sm">
              Plateforme e-commerce et critique littéraire dédiée à la diffusion de la pensée africaine, de l'entrepreneuriat et des savoirs d'excellence au Cameroun.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1EBE5D] rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Business : {settings.whatsappDisplayNumber}</span>
              </a>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4">
              Explorer
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A8A29E]">
              <li>
                <button
                  onClick={() => onNavigateSection('bestsellers')}
                  className="hover:text-white transition-colors"
                >
                  Meilleures Ventes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('catalogue')}
                  className="hover:text-white transition-colors"
                >
                  Catalogue Complet
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('avantages')}
                  className="hover:text-white transition-colors"
                >
                  Livraison & Paiements
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAdmin}
                  className="hover:text-[#C58A3E] transition-colors"
                >
                  Tableau de bord Admin
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Points Relais */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4">
              Comptoirs & Retrait
            </h4>
            <div className="space-y-3 text-xs text-[#A8A29E]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C58A3E] shrink-0 mt-0.5" />
                <span>
                  <strong>Douala :</strong> Boulevard de la Liberté, Akwa
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C58A3E] shrink-0 mt-0.5" />
                <span>
                  <strong>Yaoundé :</strong> Descente Bastos, face Ambassade
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C58A3E] shrink-0" />
                <span>{settings.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Col 4: Newsletter */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4">
              La Lettre Mansa
            </h4>
            <p className="text-xs text-[#A8A29E] leading-relaxed mb-3">
              Recevez les recommandations littéraires de nos libraires et des remises exclusives chaque mois.
            </p>

            {subscribed ? (
              <div className="bg-[#2D2825] border border-emerald-900/60 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Merci ! Inscription validée.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="Votre adresse email..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full bg-[#2D2825] border border-[#44403C] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#78716C] focus:outline-none focus:border-[#C58A3E]"
                />
                <button
                  type="submit"
                  className="w-full py-2 text-xs font-semibold text-[#1A1715] bg-[#FAF8F5] hover:bg-[#C58A3E] hover:text-white rounded-lg transition-colors"
                >
                  S'abonner
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom micro-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#78716C] gap-4">
          <p>© {new Date().getFullYear()} L'AVIS DES LIVRES Cameroun. Tous droits réservés.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Paiements Orange Money & MTN MoMo agréés</span>
            <span>·</span>
            <span>Conditions Générales de Vente</span>
            <span>·</span>
            <span>Données protégées RGPD & CAPI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
