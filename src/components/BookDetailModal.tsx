import React, { useState } from 'react';
import { X, ShoppingBag, MessageCircle, Star, Truck, ShieldCheck, Check, BookOpen, Share2 } from 'lucide-react';
import { Book, StoreSettings } from '../types';
import { formatPrice, getBookWhatsAppUrl } from '../services/whatsappService';

interface BookDetailModalProps {
  book: Book | null;
  allBooks: Book[];
  settings: StoreSettings;
  onClose: () => void;
  onAddToCart: (book: Book, quantity: number) => void;
  onSelectBook: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  allBooks,
  settings,
  onClose,
  onAddToCart,
  onSelectBook,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  if (!book) return null;

  const whatsappUrl = getBookWhatsAppUrl(book, settings);
  const relatedBooks = allBooks
    .filter((b) => b.id !== book.id && (b.category === book.category || b.isBestseller))
    .slice(0, 3);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-[#78716C] hover:text-[#1A1715] bg-white/80 hover:bg-white rounded-full transition-colors border border-[#E8E2D9]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Book Cover Presentation */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-[280px] aspect-[3/4] bg-[#F7F5F0] rounded-xl border border-[#E8E2D9] p-4 flex items-center justify-center shadow-md">
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>

              {/* Book metadata card */}
              <div className="w-full mt-4 bg-white border border-[#E8E2D9] rounded-xl p-3.5 text-xs text-[#57534E] space-y-2">
                <div className="flex justify-between py-1 border-b border-[#F3EFEA]">
                  <span className="text-[#78716C]">Éditeur</span>
                  <span className="font-semibold text-[#1A1715]">{book.publisher}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3EFEA]">
                  <span className="text-[#78716C]">ISBN</span>
                  <span className="font-mono tabular-nums text-[#1A1715]">{book.isbn}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3EFEA]">
                  <span className="text-[#78716C]">Nombre de pages</span>
                  <span className="font-mono tabular-nums text-[#1A1715]">{book.pages} pages</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#78716C]">Reliure</span>
                  <span className="font-semibold text-[#1A1715]">{book.format}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Title, Copywriting, Purchase Box */}
            <div className="md:col-span-7 flex flex-col">
              {/* Category & Status */}
              <div className="flex items-center gap-2 text-xs text-[#78716C] mb-2">
                <span className="font-semibold uppercase tracking-wider text-[#A66B24]">
                  {book.category}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">
                  {book.inStock ? `En stock (${book.stockCount} exemplaires)` : 'Rupture temporaire'}
                </span>
              </div>

              {/* Book Title */}
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1715] leading-tight mb-2">
                {book.title}
              </h2>

              {/* Author */}
              <p className="text-sm font-medium text-[#78716C] mb-4">
                Par <span className="text-[#1A1715] font-semibold">{book.author}</span>
              </p>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-1 text-[#C58A3E]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(book.rating) ? 'fill-[#C58A3E]' : 'fill-[#E8E2D9] text-[#E8E2D9]'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#57534E]">
                  <strong className="font-mono tabular-nums">{book.rating}</strong> / 5 ({book.reviewsCount} avis certifiés)
                </span>
              </div>

              {/* Price & Quantity Purchase Box */}
              <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 sm:p-5 mb-6 shadow-2xs">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1715] font-mono tabular-nums">
                    {formatPrice(book.price)}
                  </span>
                  {book.originalPrice && (
                    <span className="text-sm text-[#A8A29E] line-through font-mono tabular-nums">
                      {formatPrice(book.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Quantity and Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
                  {/* Stepper */}
                  <div className="flex items-center border border-[#D8D0C5] rounded-lg bg-[#FAF8F5] shrink-0">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-sm text-[#57534E] hover:text-[#1A1715]"
                    >
                      -
                    </button>
                    <span className="px-3 py-2 text-sm font-semibold font-mono tabular-nums min-w-[32px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(book.stockCount, quantity + 1))}
                      className="px-3 py-2 text-sm text-[#57534E] hover:text-[#1A1715]"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    onClick={() => {
                      onAddToCart(book, quantity);
                      onClose();
                    }}
                    className="flex-1 py-3 px-5 text-sm font-semibold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Ajouter au Panier</span>
                  </button>
                </div>

                {/* WhatsApp Direct Buy Option */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 text-xs font-semibold text-[#1A1715] bg-[#E8F5E9] hover:bg-[#C8E6C9] border border-[#A5D6A7] rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-[#2E7D32]" />
                  <span>Commander immédiatement sur WhatsApp Business</span>
                </a>
              </div>

              {/* Pitch commercial & Description */}
              <div className="space-y-4 text-sm text-[#44403C] leading-relaxed">
                <h4 className="font-serif text-base font-bold text-[#1A1715]">Présentation de l'ouvrage</h4>
                <p>{book.description}</p>

                {/* Excerpt callout */}
                <div className="bg-[#FAF3E8] border border-[#E8D9C0] rounded-xl p-4 my-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#A66B24] uppercase tracking-wider mb-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Extrait choisi</span>
                  </div>
                  <p className="font-serif italic text-sm text-[#2D2825]">
                    « {book.excerpt} »
                  </p>
                </div>

                {/* Logistics reassurance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-[#57534E]">
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-[#C58A3E] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[#1A1715]">Livraison rapide</strong>
                      <span>24h à Douala & Yaoundé, 48-72h dans les autres régions.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#C58A3E] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[#1A1715]">Authenticité garantie</strong>
                      <span>Ouvrages neufs issus directement des éditeurs officiels.</span>
                    </div>
                  </div>
                </div>

                {/* Share action */}
                <div className="pt-2">
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#1A1715]"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Lien de la fiche copié !' : 'Partager cet ouvrage'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related Books */}
          {relatedBooks.length > 0 && (
            <div className="mt-10 pt-8 border-t border-[#E8E2D9]">
              <h4 className="font-serif text-lg font-bold text-[#1A1715] mb-4">
                Les lecteurs ont aussi commandé
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedBooks.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => {
                      onSelectBook(rel);
                      setQuantity(1);
                    }}
                    className="flex items-center gap-3 p-3 bg-white border border-[#E8E2D9] rounded-xl hover:border-[#A66B24] cursor-pointer transition-colors"
                  >
                    <img
                      src={rel.coverUrl}
                      alt={rel.title}
                      className="w-12 h-16 object-cover rounded-md shrink-0 bg-[#F7F5F0]"
                    />
                    <div className="overflow-hidden">
                      <h5 className="font-serif text-xs font-bold text-[#1A1715] truncate">
                        {rel.title}
                      </h5>
                      <p className="text-[11px] text-[#78716C] truncate">{rel.author}</p>
                      <span className="text-xs font-semibold text-[#1A1715] font-mono tabular-nums">
                        {formatPrice(rel.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
