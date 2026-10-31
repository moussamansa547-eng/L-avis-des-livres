import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Lock, Smartphone, Banknote, ArrowRight, Truck } from 'lucide-react';
import { CartItem, DeliveryZone, Order, PaymentMethod, PromoCode, StoreSettings } from '../types';
import { formatPrice } from '../services/whatsappService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  selectedZone: DeliveryZone;
  appliedPromo: PromoCode | null;
  settings: StoreSettings;
  onOrderCreated: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  selectedZone,
  appliedPromo,
  settings,
  onOrderCreated,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+237 ');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState(selectedZone.city === 'Régions' ? 'Douala' : selectedZone.city);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('orange_money');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, it) => acc + it.book.price * it.quantity, 0);
  const discountAmount = appliedPromo
    ? Math.round((subtotal * appliedPromo.discountPercent) / 100)
    : 0;
  const isFreeShipping = subtotal >= settings.minFreeShipping;
  const shippingFee = isFreeShipping ? 0 : selectedZone.fee;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Veuillez renseigner votre nom complet.');
      return;
    }

    if (phone.trim().length < 9) {
      setError('Veuillez saisir un numéro de téléphone valide pour la livraison.');
      return;
    }

    if (!address.trim()) {
      setError('Veuillez préciser votre quartier et repère de livraison.');
      return;
    }

    setIsSubmitting(true);

    const newOrder: Order = {
      id: `ML-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: email.trim(),
      city: city.trim(),
      deliveryAddress: address.trim(),
      deliveryZone: selectedZone,
      items: cartItems.map((item) => ({
        bookId: item.book.id,
        title: item.book.title,
        author: item.book.author,
        quantity: item.quantity,
        unitPrice: item.book.price,
        subtotal: item.book.price * item.quantity,
      })),
      subtotal,
      discount: discountAmount,
      shippingFee,
      total: finalTotal,
      paymentMethod,
      status: 'new',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onOrderCreated(newOrder);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E8E2D9] bg-white flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1A1715]">
              Finaliser votre commande
            </h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              Paiement sécurisé · Livraison garantie à domicile ou bureau
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1A1715] rounded-lg hover:bg-[#F3EFEA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Section 1: Customer details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A66B24]">
              1. Informations de contact & livraison
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  Nom et Prénom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Michel Tchakounte"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-white border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715] focus:outline-none focus:border-[#C58A3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  Téléphone (WhatsApp / Appels) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+237 6XX XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs bg-white border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715] focus:outline-none focus:border-[#C58A3E] font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  Ville de destination *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Douala, Yaoundé, Bafoussam..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs bg-white border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715] focus:outline-none focus:border-[#C58A3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1">
                  E-mail (pour le reçu de paiement)
                </label>
                <input
                  type="email"
                  placeholder="nom@exemple.cm (optionnel)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs bg-white border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715] focus:outline-none focus:border-[#C58A3E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#44403C] mb-1">
                Adresse exacte ou repère de livraison *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Ex : Quartier Bonapriso, Rue des Palmiers, face pharmacie du Centre..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs bg-white border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715] focus:outline-none focus:border-[#C58A3E]"
              />
            </div>
          </div>

          {/* Section 2: Mode de paiement */}
          <div className="space-y-3 pt-2 border-t border-[#E8E2D9]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A66B24]">
              2. Mode de règlement au Cameroun
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Orange Money */}
              <label
                className={`relative border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors ${
                  paymentMethod === 'orange_money'
                    ? 'border-[#C58A3E] bg-[#FFF8EE]'
                    : 'border-[#E8E2D9] bg-white hover:border-[#D8D0C5]'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="orange_money"
                  checked={paymentMethod === 'orange_money'}
                  onChange={() => setPaymentMethod('orange_money')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-[#FF7900]" />
                  <span className="text-xs font-bold text-[#1A1715]">Orange Money</span>
                </div>
                <span className="text-[11px] text-[#78716C] leading-tight">
                  Code marchand DGI / Orange Money Cameroun
                </span>
              </label>

              {/* MTN MoMo */}
              <label
                className={`relative border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors ${
                  paymentMethod === 'mtn_momo'
                    ? 'border-[#C58A3E] bg-[#FFF8EE]'
                    : 'border-[#E8E2D9] bg-white hover:border-[#D8D0C5]'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="mtn_momo"
                  checked={paymentMethod === 'mtn_momo'}
                  onChange={() => setPaymentMethod('mtn_momo')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-[#FFCC00]" />
                  <span className="text-xs font-bold text-[#1A1715]">MTN MoMo</span>
                </div>
                <span className="text-[11px] text-[#78716C] leading-tight">
                  Code marchand MoMo Pay Cameroun (*126#)
                </span>
              </label>

              {/* Paiement à la livraison */}
              <label
                className={`relative border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors ${
                  paymentMethod === 'cod'
                    ? 'border-[#C58A3E] bg-[#FFF8EE]'
                    : 'border-[#E8E2D9] bg-white hover:border-[#D8D0C5]'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="w-4 h-4 text-[#2E7D32]" />
                  <span className="text-xs font-bold text-[#1A1715]">À la livraison</span>
                </div>
                <span className="text-[11px] text-[#78716C] leading-tight">
                  Paiement en espèces au livreur après contrôle
                </span>
              </label>
            </div>
          </div>

          {/* Section 3: Note & Consent */}
          <div className="space-y-2 pt-2 border-t border-[#E8E2D9]">
            <label className="block text-xs font-medium text-[#44403C]">
              Instructions spéciales pour le coursier (optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex : Appeler 30 minutes avant d'arriver..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-white border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715] focus:outline-none focus:border-[#C58A3E]"
            />

            <label className="flex items-start gap-2 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded text-[#C58A3E] focus:ring-0"
              />
              <span className="text-[11px] text-[#57534E]">
                J'accepte de recevoir les mises à jour concernant ma commande et les nouveautés littéraires par WhatsApp / SMS.
              </span>
            </label>
          </div>

          {/* Order Summary Recap */}
          <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 text-xs space-y-2">
            <div className="flex justify-between text-[#78716C]">
              <span>Nombre d'ouvrages</span>
              <span className="font-mono tabular-nums text-[#1A1715]">
                {cartItems.reduce((s, i) => s + i.quantity, 0)} livre(s)
              </span>
            </div>
            <div className="flex justify-between text-[#78716C]">
              <span>Sous-total</span>
              <span className="font-mono tabular-nums text-[#1A1715]">{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Remise code {appliedPromo?.code}</span>
                <span className="font-mono tabular-nums">-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#78716C]">
              <span>Livraison ({selectedZone.name})</span>
              <span className="font-mono tabular-nums text-[#1A1715]">
                {shippingFee === 0 ? <strong className="text-emerald-700">Offert</strong> : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#1A1715] pt-2 border-t border-[#F3EFEA]">
              <span>Montant Total à régler</span>
              <span className="font-serif text-base font-mono tabular-nums text-[#C58A3E]">
                {formatPrice(finalTotal)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 text-sm font-semibold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Traitement de la commande...' : 'Confirmer et Enregistrer la Commande'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#78716C] mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Commande enregistrée · Synchronisation automatique Excel & WhatsApp</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
