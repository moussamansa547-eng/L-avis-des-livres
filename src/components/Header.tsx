import React, { useState } from 'react';
import { ShoppingBag, Search, ShieldCheck, X, Bot, Film } from 'lucide-react';
import { CartItem } from '../types';

interface HeaderProps {
  cartItems: CartItem[];
  onOpenCart: () => void;
  isAdminOpen: boolean;
  onToggleAdmin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateSection: (sectionId: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenChatbot: () => void;
  onOpenAnimator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartItems,
  onOpenCart,
  isAdminOpen,
  onToggleAdmin,
  searchQuery,
  onSearchChange,
  onNavigateSection,
  onOpenChatbot,
  onOpenAnimator,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D9] transition-colors">
      {/* Top micro-announcement banner */}
      <div className="bg-[#1A1715] text-[#FAF8F5] text-xs py-1.5 px-4 text-center font-medium">
        <span>Livraison express à Douala & Yaoundé en 24h · Paiement Mobile Money & à la livraison · Conseiller IA disponible</span>
      </div>

      {/* Top Bar Contract: 3 zones strictly separated */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, single element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateSection('hero')}
            className="text-left group focus:outline-none"
          >
            <span className="font-serif text-2xl font-bold tracking-tight text-[#1A1715] group-hover:text-[#C58A3E] transition-colors">
              L'AVIS DES LIVRES
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-[#78716C] -mt-1 font-sans">
              Librairie & Éditions Littéraires · Cameroun
            </span>
          </button>
        </div>

        {/* Zone 2: 4-5 single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#44403C]">
          <button
            onClick={() => onNavigateSection('bestsellers')}
            className="hover:text-[#1A1715] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Meilleures Ventes
          </button>
          <button
            onClick={() => onNavigateSection('catalogue')}
            className="hover:text-[#1A1715] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Catalogue
          </button>
          <button
            onClick={onOpenChatbot}
            className="text-[#A66B24] hover:text-[#1A1715] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 font-semibold"
          >
            <Bot className="w-4 h-4" />
            <span>Conseiller IA</span>
          </button>
          <button
            onClick={onOpenAnimator}
            className="hover:text-[#1A1715] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <Film className="w-4 h-4 text-[#C58A3E]" />
            <span>Studio Vidéo IA</span>
          </button>
          <button
            onClick={() => onNavigateSection('avantages')}
            className="hover:text-[#1A1715] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Livraisons
          </button>
        </nav>

        {/* Zone 3: 1 primary action cluster */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Search Toggle / Input */}
          <div className="relative">
            {isSearchOpen ? (
              <div className="flex items-center bg-white border border-[#D8D0C5] rounded-full px-3 py-1.5 shadow-xs w-44 sm:w-56">
                <Search className="w-4 h-4 text-[#78716C] mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Titre, auteur, thème..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  className="w-full text-xs bg-transparent focus:outline-none text-[#1A1715] placeholder:text-[#A8A29E]"
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    onSearchChange('');
                  }}
                  className="text-[#78716C] hover:text-[#1A1715] ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-[#44403C] hover:text-[#1A1715] hover:bg-[#F3EFEA] rounded-full transition-colors"
                title="Rechercher un livre"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Admin Switcher Button */}
          <button
            onClick={onToggleAdmin}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isAdminOpen
                ? 'bg-[#1A1715] text-[#FAF8F5] border-[#1A1715]'
                : 'bg-white text-[#44403C] border-[#D8D0C5] hover:border-[#1A1715] hover:text-[#1A1715]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">{isAdminOpen ? 'Vitrine' : 'Admin'}</span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative px-3.5 py-2 text-xs font-semibold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Panier</span>
            {totalItemsCount > 0 && (
              <span className="bg-[#C58A3E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono tabular-nums min-w-[18px] text-center">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
