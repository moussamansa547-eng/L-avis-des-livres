import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Truck, MessageCircle } from 'lucide-react';
import { CartItem, DeliveryZone, PromoCode, StoreSettings } from '../types';
import { formatPrice } from '../services/whatsappService';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (bookId: string, delta: number) => void;
  onRemoveItem: (bookId: string) => void;
  onClearCart: () => void;
  deliveryZones: DeliveryZone[];
  selectedZone: DeliveryZone;
  onSelectZone: (zone: DeliveryZone) => void;
  promoCodes: PromoCode[];
  appliedPromo: PromoCode | null;
  onApplyPromo: (code: string) => { success: boolean; message: string };
  onRemovePromo: () => void;
  onProceedToCheckout: () => void;
  settings: StoreSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  deliveryZones,
  selectedZone,
  onSelectZone,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
  onProceedToCheckout,
  settings,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.book.price * item.quantity,
    0
  );

  const discountAmount = appliedPromo
    ? Math.round((subtotal * appliedPromo.discountPercent) / 100)
    : 0;

  const isFreeShipping = subtotal >= settings.minFreeShipping;
  const shippingFee = isFreeShipping ? 0 : selectedZone.fee;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');
    const res = onApplyPromo(promoInput);
    if (res.success) {
      setPromoSuccess(res.message);
      setPromoInput('');
    } else {
      setPromoError(res.message);
    }
  };

  // WhatsApp cart preorder message
  const handleDirectWhatsAppCart = () => {
    if (cartItems.length === 0) return;
    const itemsList = cartItems
      .map(
        (it, idx) =>
          `  ${idx + 1}. *${it.book.title}* (${it.book.author})\n     Qté : ${it.quantity} × ${formatPrice(it.book.price)}`
      )
      .join('\n');

    const msg = `Bonjour Mansa Livres ! 👋
Je souhaite commander mon panier en ligne :

📚 *Articles sélectionnés :*
${itemsList}

💰 *Montant estimé :*
• Sous-total : ${formatPrice(subtotal)}
• Zone de livraison souhaitée : ${selectedZone.name}
• Total estimé : ${formatPrice(finalTotal)}

Pouvez-vous valider ma commande et m'indiquer la démarche pour le règlement et la livraison ? Merci !`;

    const clean = settings.whatsappNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-md bg-[#FAF8F5] border-l border-[#E8E2D9] h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#E8E2D9] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#1A1715]" />
            <h3 className="font-serif text-lg font-bold text-[#1A1715]">Votre Panier</h3>
            <span className="text-xs text-[#78716C] font-mono tabular-nums">
              ({cartItems.reduce((s, i) => s + i.quantity, 0)} articles)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1A1715] rounded-lg hover:bg-[#F3EFEA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-[#FAF3E8] border-b border-[#E8D9C0] px-5 py-2.5 text-xs text-[#8A581A]">
          {subtotal >= settings.minFreeShipping ? (
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Félicitations ! Frais de livraison offerts pour votre commande.</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span>
                Plus que <strong className="font-mono tabular-nums">{formatPrice(settings.minFreeShipping - subtotal)}</strong> pour la livraison offerte
              </span>
              <span className="font-mono tabular-nums text-[11px] font-semibold">
                {Math.round((subtotal / settings.minFreeShipping) * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#78716C]">
              <ShoppingBag className="w-12 h-12 text-[#D8D0C5] mb-3 stroke-[1.5]" />
              <p className="font-serif text-lg font-bold text-[#1A1715] mb-1">Votre panier est vide</p>
              <p className="text-xs text-[#78716C] max-w-xs mb-6">
                Explorez notre catalogue de littérature, entrepreneuriat et manuels d'études pour débuter vos achats.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-lg transition-colors"
              >
                Parcourir les Livres
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.book.id}
                className="bg-white border border-[#E8E2D9] rounded-xl p-3.5 flex gap-3 shadow-2xs"
              >
                <img
                  src={item.book.coverUrl}
                  alt={item.book.title}
                  className="w-16 h-22 object-cover rounded-md bg-[#F7F5F0] shrink-0"
                />

                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#1A1715] truncate">
                      {item.book.title}
                    </h4>
                    <p className="text-xs text-[#78716C] truncate">{item.book.author}</p>
                    <div className="text-xs font-semibold text-[#1A1715] font-mono tabular-nums mt-1">
                      {formatPrice(item.book.price)}
                    </div>
                  </div>

                  {/* Quantity Stepper and Remove */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F3EFEA]">
                    <div className="flex items-center border border-[#D8D0C5] rounded-md bg-[#FAF8F5]">
                      <button
                        onClick={() => onUpdateQuantity(item.book.id, -1)}
                        className="px-2 py-0.5 text-xs text-[#57534E] hover:text-[#1A1715]"
                      >
                        -
                      </button>
                      <span className="px-2 py-0.5 text-xs font-bold font-mono tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.book.id, 1)}
                        className="px-2 py-0.5 text-xs text-[#57534E] hover:text-[#1A1715]"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.book.id)}
                      className="text-[#A8A29E] hover:text-red-600 p-1 transition-colors"
                      title="Supprimer du panier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Calculation Module */}
        {cartItems.length > 0 && (
          <div className="p-5 bg-white border-t border-[#E8E2D9] space-y-4">
            {/* Delivery Zone Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1715] mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#C58A3E]" />
                <span>Zone de livraison (Cameroun)</span>
              </label>
              <select
                value={selectedZone.id}
                onChange={(e) => {
                  const z = deliveryZones.find((dz) => dz.id === e.target.value);
                  if (z) onSelectZone(z);
                }}
                className="w-full text-xs bg-[#FAF8F5] border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715] focus:outline-none focus:border-[#C58A3E]"
              >
                {deliveryZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} — {isFreeShipping ? 'Gratuit' : formatPrice(zone.fee)}
                  </option>
                ))}
              </select>
              <span className="block text-[11px] text-[#78716C] mt-1">{selectedZone.delay}</span>
            </div>

            {/* Promo Code Input */}
            <div>
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2 text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Code <strong>{appliedPromo.code}</strong> (-{appliedPromo.discountPercent}%)</span>
                  </div>
                  <button
                    onClick={onRemovePromo}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Retirer
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromoCode} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Code promo (ex: MANSA10)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="flex-1 text-xs bg-[#FAF8F5] border border-[#D8D0C5] rounded-lg px-3 py-2 text-[#1A1715] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C58A3E]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-semibold text-[#1A1715] bg-[#F3EFEA] hover:bg-[#E8E2D9] border border-[#D8D0C5] rounded-lg transition-colors shrink-0"
                  >
                    Appliquer
                  </button>
                </form>
              )}
              {promoError && <p className="text-[11px] text-red-600 mt-1">{promoError}</p>}
              {promoSuccess && <p className="text-[11px] text-emerald-600 mt-1">{promoSuccess}</p>}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs text-[#57534E] pt-2 border-t border-[#F3EFEA]">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span className="font-mono tabular-nums text-[#1A1715]">{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Réduction promo</span>
                  <span className="font-mono tabular-nums">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Livraison ({selectedZone.city})</span>
                <span className="font-mono tabular-nums text-[#1A1715]">
                  {shippingFee === 0 ? <strong className="text-emerald-700">Offert</strong> : formatPrice(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#1A1715] pt-2 border-t border-[#E8E2D9]">
                <span>Total à régler</span>
                <span className="font-serif text-base font-mono tabular-nums">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 pt-1">
              <button
                onClick={onProceedToCheckout}
                className="w-full py-3.5 px-4 text-sm font-semibold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Valider la Commande</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleDirectWhatsAppCart}
                className="w-full py-2.5 px-4 text-xs font-semibold text-[#1A1715] bg-[#E8F5E9] hover:bg-[#C8E6C9] border border-[#A5D6A7] rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#2E7D32]" />
                <span>Envoyer le panier sur WhatsApp Business</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
