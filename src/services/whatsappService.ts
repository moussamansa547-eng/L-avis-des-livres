import { Book, CartItem, Order, StoreSettings } from '../types';

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

/**
 * Generates a clean, professional, and well-structured WhatsApp message
 * for order confirmations or direct purchase requests.
 */
export function generateOrderWhatsAppMessage(order: Order, settings: StoreSettings): string {
  const itemsText = order.items
    .map((item, idx) => `  ${idx + 1}. *${item.title}* (${item.author})\n     Qté : ${item.quantity} × ${formatPrice(item.unitPrice)} = ${formatPrice(item.subtotal)}`)
    .join('\n');

  const paymentLabels: Record<string, string> = {
    orange_money: 'Orange Money Cameroun',
    mtn_momo: 'MTN Mobile Money Cameroun',
    cod: 'Paiement en espèces à la livraison',
  };

  const message = `📚 *NOUVELLE COMMANDE — L'AVIS DES LIVRES*
*Réf : #${order.id}*

👤 *Informations Client :*
• Nom : ${order.customerName}
• Téléphone : ${order.customerPhone}
${order.customerEmail ? `• Email : ${order.customerEmail}\n` : ''}• Ville : ${order.city}
• Adresse : ${order.deliveryAddress}

📦 *Livres commandés :*
${itemsText}

💰 *Détails financiers :*
• Sous-total : ${formatPrice(order.subtotal)}
${order.discount > 0 ? `• Réduction appliquée : -${formatPrice(order.discount)}\n` : ''}• Mode de livraison : ${order.deliveryZone.name}
• Frais de livraison : ${order.shippingFee === 0 ? 'Offert' : formatPrice(order.shippingFee)}
👉 *TOTAL À RÉGLER : ${formatPrice(order.total)}*

💳 *Mode de paiement choisi :*
${paymentLabels[order.paymentMethod] || order.paymentMethod}

${order.notes ? `📝 *Note client :* "${order.notes}"\n\n` : ''}Merci de confirmer la prise en charge de ma commande et le créneau d'expédition.`;

  return message;
}

/**
 * Generates a WhatsApp link with pre-filled text for direct cart order
 */
export function getOrderWhatsAppUrl(order: Order, settings: StoreSettings): string {
  const message = generateOrderWhatsAppMessage(order, settings);
  const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a WhatsApp link for a direct single book inquiry/buy
 */
export function getBookWhatsAppUrl(book: Book, settings: StoreSettings): string {
  const message = `Bonjour L'AVIS DES LIVRES ! 👋
Je souhaite commander l'ouvrage suivant :

📖 *${book.title}*
✍️ Auteur : ${book.author}
💵 Prix : ${formatPrice(book.price)}
🔖 Réf : ${book.id}

Pouvez-vous me confirmer sa disponibilité et les modalités de livraison à mon adresse au Cameroun ? Merci !`;

  const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a general advisory WhatsApp conversation link
 */
export function getAdvisorWhatsAppUrl(settings: StoreSettings): string {
  const message = `Bonjour L'AVIS DES LIVRES ! 👋
Je visite votre boutique en ligne et j'aimerais avoir le conseil d'un libraire pour choisir un livre.`;

  const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Customer contact URL for store admin to contact the customer back
 */
export function getCustomerContactWhatsAppUrl(customerPhone: string, customerName: string, orderId?: string): string {
  const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
  const prefix = cleanPhone.startsWith('237') ? cleanPhone : `237${cleanPhone}`;
  const text = orderId
    ? `Bonjour ${customerName}, ici l'équipe de L'AVIS DES LIVRES au sujet de votre commande #${orderId}. Votre colis est en cours de préparation.`
    : `Bonjour ${customerName}, ici l'équipe L'AVIS DES LIVRES à votre service.`;
  return `https://wa.me/${prefix}?text=${encodeURIComponent(text)}`;
}
