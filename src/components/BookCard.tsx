import React from 'react';
import { ShoppingBag, MessageCircle, Star } from 'lucide-react';
import { Book, StoreSettings } from '../types';
import { formatPrice, getBookWhatsAppUrl } from '../services/whatsappService';

interface BookCardProps {
  book: Book;
  settings: StoreSettings;
  onSelectBook: (book: Book) => void;
  onAddToCart: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  settings,
  onSelectBook,
  onAddToCart,
}) => {
  const whatsappUrl = getBookWhatsAppUrl(book, settings);

  return (
    <div
      onClick={() => onSelectBook(book)}
      className="group relative bg-white border border-[#E8E2D9] rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer"
    >
      {/* Visual Slot: 65-75% height ratio */}
      <div className="relative w-full aspect-[3/4] bg-[#F7F5F0] overflow-hidden flex items-center justify-center p-3">
        <img
          src={book.coverUrl}
          alt={book.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain drop-shadow-sm group-hover:scale-102 transition-transform duration-300"
        />

        {/* Subtle Status Tag (No Pill Clusters) */}
        {book.isBestseller && (
          <div className="absolute top-3 left-3 bg-[#1A1715] text-[#FAF8F5] text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm">
            Bestseller
          </div>
        )}
        {book.isNew && !book.isBestseller && (
          <div className="absolute top-3 left-3 bg-[#A66B24] text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm">
            Nouveauté
          </div>
        )}

        {/* Quick stock warning if low */}
        {book.stockCount <= 5 && book.inStock && (
          <div className="absolute bottom-2 right-2 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded-sm font-medium">
            Reste {book.stockCount} ex.
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Clean unboxed metadata with dot separators */}
          <div className="flex items-center gap-1.5 text-xs text-[#78716C] mb-1.5">
            <span className="font-medium text-[#A66B24]">{book.category}</span>
            <span aria-hidden="true">·</span>
            <span>{book.format}</span>
            <span aria-hidden="true">·</span>
            <div className="flex items-center gap-0.5 text-[#44403C]">
              <Star className="w-3 h-3 fill-[#C58A3E] text-[#C58A3E]" />
              <span className="font-mono tabular-nums text-[11px]">{book.rating}</span>
            </div>
          </div>

          {/* Book Title */}
          <h3 className="font-serif text-base font-bold text-[#1A1715] line-clamp-2 leading-snug group-hover:text-[#A66B24] transition-colors">
            {book.title}
          </h3>

          {/* Author */}
          <p className="text-xs text-[#78716C] mt-1 font-medium line-clamp-1">
            {book.author}
          </p>
        </div>

        {/* Price & Action Module */}
        <div className="mt-4 pt-3 border-t border-[#F3EFEA] flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-bold text-[#1A1715] font-mono tabular-nums">
              {formatPrice(book.price)}
            </div>
            {book.originalPrice && (
              <span className="text-xs text-[#A8A29E] line-through font-mono tabular-nums">
                {formatPrice(book.originalPrice)}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* WhatsApp direct buy button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[#2E7D32] bg-[#E8F5E9] hover:bg-[#C8E6C9] rounded-lg transition-colors"
              title="Commander directement sur WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            {/* Add to cart */}
            <button
              onClick={() => onAddToCart(book)}
              className="px-3 py-2 text-xs font-semibold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              title="Ajouter au panier"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
