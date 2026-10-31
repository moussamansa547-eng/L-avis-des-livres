export interface Book {
  id: string;
  title: string;
  author: string;
  price: number; // in FCFA (XAF)
  originalPrice?: number;
  category: 'Litterature' | 'Business' | 'Developpement' | 'Scolaire' | 'Essais';
  coverUrl: string;
  description: string;
  excerpt: string;
  isbn: string;
  pages: number;
  publisher: string;
  format: 'Broché' | 'Relié' | 'Poche';
  inStock: boolean;
  stockCount: number;
  salesCount: number;
  rating: number;
  reviewsCount: number;
  isBestseller?: boolean;
  isNew?: boolean;
  tags: string[];
}

export interface CartItem {
  book: Book;
  quantity: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  delay: string;
  fee: number; // in FCFA
  description: string;
}

export type PaymentMethod = 'mtn_momo' | 'orange_money' | 'cod';

export type OrderStatus =
  | 'new'
  | 'pending_confirmation'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  bookId: string;
  title: string;
  author: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  city: string;
  deliveryAddress: string;
  deliveryZone: DeliveryZone;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  notes: string;
  createdAt: string;
  whatsappMessage?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  registeredAt: string;
  ordersCount: number;
  totalSpent: number;
  preferences: string;
  marketingConsent: boolean;
  lastOrderDate: string;
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  minAmount: number;
  active: boolean;
  usesCount: number;
  description: string;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string; // e.g. "237699001122"
  whatsappDisplayNumber: string; // e.g. "+237 699 00 11 22"
  contactEmail: string;
  currency: string;
  minFreeShipping: number;
  orangeMoneyMerchantCode: string;
  mtnMoMoMerchantCode: string;
  excelSyncEnabled: boolean;
  lastExcelSyncTime: string;
}

export interface MetaPixelEvent {
  id: string;
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';
  timestamp: string;
  value?: number;
  currency?: string;
  contentName?: string;
  status: 'sent' | 'deduplicated';
}
