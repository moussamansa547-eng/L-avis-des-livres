import React from 'react';
import { CheckCircle2, MessageCircle, X, Printer, Package, Truck, Smartphone } from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { formatPrice, getOrderWhatsAppUrl } from '../services/whatsappService';

interface OrderConfirmationModalProps {
  order: Order | null;
  settings: StoreSettings;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  settings,
  onClose,
}) => {
  if (!order) return null;

  const whatsappUrl = getOrderWhatsAppUrl(order, settings);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#78716C] hover:text-[#1A1715] rounded-lg hover:bg-[#F3EFEA] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#1A1715]">
            Commande validée avec succès !
          </h3>
          <p className="text-xs text-[#78716C] mt-1">
            Référence de votre commande :{' '}
            <strong className="text-[#1A1715] font-mono tabular-nums text-sm">
              #{order.id}
            </strong>
          </p>
        </div>

        {/* WhatsApp Direct Notification Callout */}
        <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-xl p-4 sm:p-5 mb-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E7D32] mb-1.5">
            <MessageCircle className="w-4 h-4" />
            <span>Étape Recommandée</span>
          </div>
          <p className="text-xs text-[#1B5E20] leading-relaxed mb-4">
            Pour une expédition express immédiate, envoyez le récapitulatif prérempli à notre équipe via WhatsApp Business.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 text-sm font-bold text-white bg-[#25D366] hover:bg-[#1EBE5D] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Envoyer la Commande sur WhatsApp ({settings.whatsappDisplayNumber})</span>
          </a>
        </div>

        {/* Payment instructions */}
        <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 mb-6 text-xs space-y-2.5">
          <h4 className="font-semibold text-[#1A1715] flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#C58A3E]" />
            <span>Instructions de règlement ({order.paymentMethod.toUpperCase()})</span>
          </h4>

          {order.paymentMethod === 'orange_money' && (
            <div className="text-[#57534E] space-y-1">
              <p>Composez sur votre téléphone Orange :</p>
              <div className="font-mono bg-[#FFF8EE] border border-[#FFE0B2] text-[#E65100] px-3 py-1.5 rounded-md text-center font-bold">
                {settings.orangeMoneyMerchantCode}
              </div>
              <p className="text-[11px] text-[#78716C]">
                Montant exact : <strong className="text-[#1A1715]">{formatPrice(order.total)}</strong> · Réf : #{order.id}
              </p>
            </div>
          )}

          {order.paymentMethod === 'mtn_momo' && (
            <div className="text-[#57534E] space-y-1">
              <p>Composez sur votre téléphone MTN :</p>
              <div className="font-mono bg-[#FFFDE7] border border-[#FFF59D] text-[#F57F17] px-3 py-1.5 rounded-md text-center font-bold">
                {settings.mtnMoMoMerchantCode}
              </div>
              <p className="text-[11px] text-[#78716C]">
                Montant exact : <strong className="text-[#1A1715]">{formatPrice(order.total)}</strong> · Réf : #{order.id}
              </p>
            </div>
          )}

          {order.paymentMethod === 'cod' && (
            <p className="text-[#57534E]">
              Préparez le montant exact de <strong className="text-[#1A1715]">{formatPrice(order.total)}</strong> en espèces. Le livreur vous contactera par téléphone ({order.customerPhone}) dès son départ pour {order.city}.
            </p>
          )}
        </div>

        {/* Order Items summary */}
        <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 mb-6 text-xs">
          <div className="flex items-center gap-2 font-semibold text-[#1A1715] mb-2">
            <Package className="w-4 h-4 text-[#C58A3E]" />
            <span>Articles commandés ({order.items.length})</span>
          </div>

          <div className="space-y-1.5 divide-y divide-[#F3EFEA]">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between pt-1.5">
                <span className="text-[#57534E]">
                  {it.quantity} × {it.title}
                </span>
                <span className="font-mono tabular-nums text-[#1A1715] font-medium">
                  {formatPrice(it.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 mt-3 border-t border-[#E8E2D9] flex justify-between font-bold text-sm text-[#1A1715]">
            <span>Total réglé / dû</span>
            <span className="font-serif font-mono tabular-nums text-[#C58A3E]">
              {formatPrice(order.total)}
            </span>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-[#44403C] bg-white border border-[#D8D0C5] hover:bg-[#F3EFEA] rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer le reçu</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-lg transition-colors text-center"
          >
            Continuer la visite
          </button>
        </div>
      </div>
    </div>
  );
};
