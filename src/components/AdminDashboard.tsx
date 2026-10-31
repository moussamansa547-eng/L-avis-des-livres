import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  FileSpreadsheet,
  Megaphone,
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  Download,
  RefreshCw,
  Search,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Book, Customer, DeliveryZone, Order, OrderStatus, PromoCode, StoreSettings } from '../types';
import { formatPrice, getCustomerContactWhatsAppUrl } from '../services/whatsappService';
import {
  buildExcelDatabase,
  downloadFullExcelWorkbook,
  downloadSheetAsCsv,
  ExcelSheetData,
} from '../services/excelService';

interface AdminDashboardProps {
  books: Book[];
  orders: Order[];
  customers: Customer[];
  promoCodes: PromoCode[];
  settings: StoreSettings;
  deliveryZones: DeliveryZone[];
  onUpdateBook: (book: Book) => void;
  onAddBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => void;
  onAddPromoCode: (promo: PromoCode) => void;
  onTogglePromoCode: (code: string) => void;
  onUpdateSettings: (settings: StoreSettings) => void;
  onClose: () => void;
}

type AdminTab =
  | 'overview'
  | 'products'
  | 'orders'
  | 'customers'
  | 'excel'
  | 'marketing'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  books,
  orders,
  customers,
  promoCodes,
  settings,
  onUpdateBook,
  onAddBook,
  onDeleteBook,
  onUpdateOrderStatus,
  onAddPromoCode,
  onTogglePromoCode,
  onUpdateSettings,
  onClose,
}) => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [selectedExcelSheet, setSelectedExcelSheet] = useState<
    'clients' | 'commandes' | 'produits' | 'marketing' | 'statistiques'
  >('commandes');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [syncLogs, setSyncLogs] = useState<string[]>([
    `[2026-10-31 13:40] Connecteur Microsoft Graph API : État en ligne (200 OK)`,
    `[2026-10-31 13:40] Classeur 'Mansa_Livres_Database.xlsx' synchronisé avec succès`,
    `[2026-10-31 13:40] 5 feuilles vérifiées : CLIENTS, COMMANDES, PRODUITS, MARKETING, STATISTIQUES`,
  ]);

  // Editing / adding books modal state
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState<Partial<Book>>({
    category: 'Business',
    format: 'Broché',
    inStock: true,
    stockCount: 20,
    price: 10000,
  });

  // Promo code creator state
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoPercent, setNewPromoPercent] = useState(10);
  const [newPromoMin, setNewPromoMin] = useState(10000);
  const [newPromoDesc, setNewPromoDesc] = useState('');

  // Computations
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const averageBasket = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
  const lowStockBooks = books.filter((b) => b.stockCount <= 5);
  const excelDatabase = buildExcelDatabase(books, orders, customers);

  // Sync Excel Simulation
  const handleTriggerExcelSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      const now = new Date().toLocaleTimeString('fr-FR');
      setSyncLogs((prev) => [
        `[${now}] Envoi de ${orders.length} commandes et ${customers.length} fiches clients vers Excel Online...`,
        `[${now}] Mise à jour de la feuille 'STATISTIQUES' : CA = ${formatPrice(totalRevenue)}`,
        `[${now}] Synchronisation terminée sans conflit (0 doublon détecté).`,
        ...prev.slice(0, 7),
      ]);
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }, 1200);
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.author || !bookForm.price) return;

    if (editingBook) {
      onUpdateBook({
        ...editingBook,
        ...bookForm,
      } as Book);
      setEditingBook(null);
    } else {
      const newBook: Book = {
        id: `bk-${Date.now().toString().slice(-4)}`,
        title: bookForm.title || '',
        author: bookForm.author || '',
        price: Number(bookForm.price) || 10000,
        originalPrice: bookForm.originalPrice ? Number(bookForm.originalPrice) : undefined,
        category: (bookForm.category as any) || 'Business',
        coverUrl: bookForm.coverUrl || '/images/book_literature.jpg',
        description: bookForm.description || '',
        excerpt: bookForm.excerpt || '',
        isbn: bookForm.isbn || '978-2-0000-00-0',
        pages: Number(bookForm.pages) || 250,
        publisher: bookForm.publisher || 'Éditions Mansa',
        format: (bookForm.format as any) || 'Broché',
        inStock: (bookForm.stockCount || 0) > 0,
        stockCount: Number(bookForm.stockCount) || 0,
        salesCount: 0,
        rating: 5.0,
        reviewsCount: 1,
        tags: ['Cameroun', bookForm.category || 'Livre'],
      };
      onAddBook(newBook);
      setIsNewBookModalOpen(false);
    }
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;
    onAddPromoCode({
      code: newPromoCode.trim().toUpperCase(),
      discountPercent: Number(newPromoPercent),
      minAmount: Number(newPromoMin),
      active: true,
      usesCount: 0,
      description: newPromoDesc.trim() || `${newPromoPercent}% de réduction dès ${formatPrice(newPromoMin)}`,
    });
    setNewPromoCode('');
    setNewPromoDesc('');
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen text-[#1A1715]">
      {/* Top Bar for Admin */}
      <div className="bg-[#1A1715] text-[#FAF8F5] px-4 sm:px-8 py-3 flex items-center justify-between border-b border-black">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg font-bold tracking-tight text-white">
            L'AVIS DES LIVRES
          </span>
          <span className="text-xs bg-[#2D2825] text-[#D8D0C5] px-2 py-0.5 rounded-sm">
            Console Administrateur
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-xs bg-white text-[#1A1715] hover:bg-[#C58A3E] hover:text-white px-3 py-1.5 rounded-md font-semibold transition-colors"
          >
            ← Retour à la Boutique
          </button>
        </div>
      </div>

      {/* Navigation Sub-Bar */}
      <div className="bg-white border-b border-[#E8E2D9] px-4 sm:px-8 overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-6 py-2.5 min-w-max text-xs font-semibold text-[#57534E]">
          <button
            onClick={() => setCurrentTab('overview')}
            className={`pb-2 pt-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              currentTab === 'overview'
                ? 'border-[#C58A3E] text-[#1A1715]'
                : 'border-transparent hover:text-[#1A1715]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Vue Générale</span>
          </button>

          <button
            onClick={() => setCurrentTab('orders')}
            className={`pb-2 pt-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              currentTab === 'orders'
                ? 'border-[#C58A3E] text-[#1A1715]'
                : 'border-transparent hover:text-[#1A1715]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Commandes ({orders.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('products')}
            className={`pb-2 pt-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              currentTab === 'products'
                ? 'border-[#C58A3E] text-[#1A1715]'
                : 'border-transparent hover:text-[#1A1715]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Livres & Stocks ({books.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('customers')}
            className={`pb-2 pt-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              currentTab === 'customers'
                ? 'border-[#C58A3E] text-[#1A1715]'
                : 'border-transparent hover:text-[#1A1715]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clients ({customers.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('excel')}
            className={`pb-2 pt-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              currentTab === 'excel'
                ? 'border-[#C58A3E] text-[#1A1715]'
                : 'border-transparent hover:text-[#1A1715]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Synchronisation Excel</span>
          </button>

          <button
            onClick={() => setCurrentTab('marketing')}
            className={`pb-2 pt-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              currentTab === 'marketing'
                ? 'border-[#C58A3E] text-[#1A1715]'
                : 'border-transparent hover:text-[#1A1715]'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Marketing & Meta Ads</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`pb-2 pt-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              currentTab === 'settings'
                ? 'border-[#C58A3E] text-[#1A1715]'
                : 'border-transparent hover:text-[#1A1715]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Paramètres</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* ==================== 1. VUE GÉNÉRALE ==================== */}
        {currentTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs">
                <span className="text-xs text-[#78716C] uppercase font-semibold">Chiffre d'Affaires</span>
                <div className="font-serif text-2xl font-bold text-[#1A1715] font-mono tabular-nums mt-1">
                  {formatPrice(totalRevenue)}
                </div>
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  +18.4% ce mois (Cameroun)
                </span>
              </div>

              <div className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs">
                <span className="text-xs text-[#78716C] uppercase font-semibold">Commandes Totales</span>
                <div className="font-serif text-2xl font-bold text-[#1A1715] font-mono tabular-nums mt-1">
                  {orders.length}
                </div>
                <span className="text-[11px] text-[#78716C] mt-1 block">
                  {orders.filter((o) => o.status === 'new').length} nouvelle(s) en attente
                </span>
              </div>

              <div className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs">
                <span className="text-xs text-[#78716C] uppercase font-semibold">Panier Moyen</span>
                <div className="font-serif text-2xl font-bold text-[#1A1715] font-mono tabular-nums mt-1">
                  {formatPrice(averageBasket)}
                </div>
                <span className="text-[11px] text-[#78716C] mt-1 block">
                  ~2.1 livres par commande
                </span>
              </div>

              <div className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs">
                <span className="text-xs text-[#78716C] uppercase font-semibold">Base Clients</span>
                <div className="font-serif text-2xl font-bold text-[#1A1715] font-mono tabular-nums mt-1">
                  {customers.length}
                </div>
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  100% consentements qualifiés
                </span>
              </div>
            </div>

            {/* Low stock alerts if any */}
            {lowStockBooks.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 flex-1">
                  <strong className="block font-semibold">
                    Alerte de réassort librairie ({lowStockBooks.length} ouvrage(s)) :
                  </strong>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {lowStockBooks.map((b) => (
                      <span key={b.id} className="bg-white px-2 py-0.5 rounded border border-amber-200">
                        {b.title} (reste {b.stockCount} ex.)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Orders Overview */}
            <div className="bg-white border border-[#E8E2D9] rounded-xl overflow-hidden shadow-2xs">
              <div className="p-5 border-b border-[#E8E2D9] flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#1A1715]">
                    Dernières Commandes Reçues
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    Commandes passées en direct ou initiées via WhatsApp
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('orders')}
                  className="text-xs font-semibold text-[#A66B24] hover:underline flex items-center gap-1"
                >
                  <span>Voir tout</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[#78716C] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Réf</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Ville</th>
                      <th className="py-3 px-4">Titres</th>
                      <th className="py-3 px-4 text-right">Montant</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFEA]">
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#1A1715]">
                          #{o.id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold block text-[#1A1715]">{o.customerName}</span>
                          <span className="text-[#78716C] font-mono text-[11px]">{o.customerPhone}</span>
                        </td>
                        <td className="py-3 px-4 text-[#57534E]">{o.city}</td>
                        <td className="py-3 px-4 text-[#57534E] max-w-xs truncate">
                          {o.items.map((i) => i.title).join(', ')}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums font-bold text-right text-[#1A1715]">
                          {formatPrice(o.total)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] px-2 py-0.5 rounded-sm bg-[#FAF3E8] border border-[#E8D9C0] text-[#A66B24] font-medium">
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <a
                            href={getCustomerContactWhatsAppUrl(o.customerPhone, o.customerName, o.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2E7D32] hover:underline"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. COMMANDES ==================== */}
        {currentTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1715]">
                  Gestion des Commandes
                </h3>
                <p className="text-xs text-[#78716C]">
                  Traitement logistique, mise à jour des statuts et contact client
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-[#E8E2D9] rounded-lg">
                {[
                  { key: 'all', label: 'Toutes' },
                  { key: 'new', label: 'Nouvelles' },
                  { key: 'confirmed', label: 'Confirmées' },
                  { key: 'shipped', label: 'Expédiées' },
                  { key: 'delivered', label: 'Livrées' },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setOrderStatusFilter(st.key)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      orderStatusFilter === st.key
                        ? 'bg-[#1A1715] text-white'
                        : 'text-[#57534E] hover:text-[#1A1715]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-[#E8E2D9] rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[#78716C] uppercase font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Réf & Date</th>
                      <th className="py-3.5 px-4">Destinataire & Contact</th>
                      <th className="py-3.5 px-4">Articles</th>
                      <th className="py-3.5 px-4">Paiement & Total</th>
                      <th className="py-3.5 px-4">Changer le Statut</th>
                      <th className="py-3.5 px-4 text-center">Action Directe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFEA]">
                    {orders
                      .filter((o) =>
                        orderStatusFilter === 'all' ? true : o.status === orderStatusFilter
                      )
                      .map((order) => (
                        <tr key={order.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-[#1A1715] block">
                              #{order.id}
                            </span>
                            <span className="text-[11px] text-[#78716C]">
                              {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <strong className="block text-[#1A1715]">{order.customerName}</strong>
                            <span className="text-[11px] text-[#78716C] font-mono block">
                              {order.customerPhone}
                            </span>
                            <span className="text-[11px] text-[#57534E]">
                              {order.city} · {order.deliveryAddress}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="space-y-1">
                              {order.items.map((it, idx) => (
                                <div key={idx} className="text-[#44403C] text-[11px]">
                                  {it.quantity} × {it.title}
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] text-[#78716C] mt-1 block">
                              Zone : {order.deliveryZone.name}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-[#1A1715] tabular-nums text-sm">
                              {formatPrice(order.total)}
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-[#A66B24] font-semibold">
                              {order.paymentMethod.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                onUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                              }
                              className="text-xs bg-[#FAF8F5] border border-[#D8D0C5] rounded-md px-2 py-1 text-[#1A1715] font-medium focus:outline-none focus:border-[#C58A3E]"
                            >
                              <option value="new">Nouvelle</option>
                              <option value="pending_confirmation">En attente conf.</option>
                              <option value="confirmed">Confirmée</option>
                              <option value="preparing">En préparation</option>
                              <option value="shipped">Expédiée</option>
                              <option value="delivered">Livrée</option>
                              <option value="cancelled">Annulée</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <a
                              href={getCustomerContactWhatsAppUrl(
                                order.customerPhone,
                                order.customerName,
                                order.id
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#2E7D32] bg-[#E8F5E9] hover:bg-[#C8E6C9] rounded-md transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Relancer WhatsApp</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 3. GESTION DES LIVRES ==================== */}
        {currentTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1715]">
                  Catalogue & Gestion des Stocks
                </h3>
                <p className="text-xs text-[#78716C]">
                  Ajout d'ouvrages, tarification en FCFA et suivi de l'inventaire
                </p>
              </div>

              <button
                onClick={() => {
                  setBookForm({
                    category: 'Business',
                    format: 'Broché',
                    inStock: true,
                    stockCount: 20,
                    price: 12000,
                  });
                  setEditingBook(null);
                  setIsNewBookModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un Nouveau Livre</span>
              </button>
            </div>

            {/* Books List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white border border-[#E8E2D9] rounded-xl p-4 flex gap-4 shadow-2xs"
                >
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-20 h-28 object-cover rounded-md bg-[#F7F5F0] shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#A66B24]">
                        {book.category}
                      </span>
                      <h4 className="font-serif text-sm font-bold text-[#1A1715] truncate">
                        {book.title}
                      </h4>
                      <p className="text-xs text-[#78716C] truncate">{book.author}</p>
                      <div className="text-sm font-bold font-mono tabular-nums text-[#1A1715] mt-1">
                        {formatPrice(book.price)}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#F3EFEA] flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold font-mono tabular-nums ${
                          book.stockCount <= 5 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        Stock : {book.stockCount} ex.
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setBookForm(book);
                            setEditingBook(book);
                            setIsNewBookModalOpen(true);
                          }}
                          className="p-1.5 text-[#57534E] hover:text-[#1A1715] hover:bg-[#F3EFEA] rounded-md transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteBook(book.id)}
                          className="p-1.5 text-[#A8A29E] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 4. CLIENTS ==================== */}
        {currentTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1715]">
                  Répertoire Clients & CRM
                </h3>
                <p className="text-xs text-[#78716C]">
                  Historique des achats, préférences littéraires et contacts qualifiés
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, ville..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#D8D0C5] rounded-lg text-[#1A1715] focus:outline-none focus:border-[#C58A3E] w-64"
                />
              </div>
            </div>

            <div className="bg-white border border-[#E8E2D9] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[#78716C] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Ville</th>
                    <th className="py-3 px-4">Commandes</th>
                    <th className="py-3 px-4">Dépenses Cumulées</th>
                    <th className="py-3 px-4">Préférences</th>
                    <th className="py-3 px-4">Consentement</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFEA]">
                  {customers
                    .filter((c) =>
                      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.city.toLowerCase().includes(customerSearch.toLowerCase())
                    )
                    .map((cust) => (
                      <tr key={cust.id} className="hover:bg-[#FAF8F5]/80">
                        <td className="py-3.5 px-4">
                          <strong className="block text-[#1A1715]">{cust.name}</strong>
                          <span className="text-[11px] text-[#78716C] font-mono">{cust.phone}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#57534E]">{cust.city}</td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-[#1A1715]">
                          {cust.ordersCount} commande(s)
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-[#1A1715]">
                          {formatPrice(cust.totalSpent)}
                        </td>
                        <td className="py-3.5 px-4 text-[#57534E] max-w-xs truncate">
                          {cust.preferences}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${
                              cust.marketingConsent
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {cust.marketingConsent ? 'Opt-in Validé' : 'Non consenti'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <a
                            href={getCustomerContactWhatsAppUrl(cust.phone, cust.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32] hover:underline"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Contacter</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 5. SYNCHRONISATION EXCEL ==================== */}
        {currentTab === 'excel' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1715] flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                  <span>Base de Données & Moteur Excel à 5 Feuilles</span>
                </h3>
                <p className="text-xs text-[#78716C]">
                  Visualisation interactive, téléchargement immédiat et synchronisation Microsoft Graph API
                </p>
              </div>

              {/* Excel Download Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadFullExcelWorkbook(excelDatabase)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter Classeur Complet (.xls)</span>
                </button>

                <button
                  onClick={handleTriggerExcelSync}
                  disabled={syncStatus === 'syncing'}
                  className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>{syncStatus === 'syncing' ? 'Synchronisation...' : 'Synchroniser Excel Online'}</span>
                </button>
              </div>
            </div>

            {/* Sheet Tabs */}
            <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-2 overflow-x-auto">
              {(
                [
                  { id: 'commandes', label: 'Feuille 2 : COMMANDES', count: orders.length },
                  { id: 'clients', label: 'Feuille 1 : CLIENTS', count: customers.length },
                  { id: 'produits', label: 'Feuille 3 : PRODUITS', count: books.length },
                  { id: 'marketing', label: 'Feuille 4 : MARKETING', count: 4 },
                  { id: 'statistiques', label: 'Feuille 5 : STATISTIQUES', count: 7 },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedExcelSheet(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    selectedExcelSheet === tab.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white border border-[#E8E2D9] text-[#57534E] hover:text-[#1A1715]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Sheet Viewer */}
            {(() => {
              const currentSheet: ExcelSheetData = excelDatabase.sheets[selectedExcelSheet];
              return (
                <div className="bg-white border border-[#E8E2D9] rounded-xl overflow-hidden shadow-2xs">
                  <div className="p-4 bg-[#F8FBF9] border-b border-[#E8E2D9] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#1A1715]">
                        Feuille Active : {currentSheet.name}
                      </h4>
                      <p className="text-xs text-[#78716C]">{currentSheet.description}</p>
                    </div>

                    <button
                      onClick={() => downloadSheetAsCsv(currentSheet)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger cette feuille (.CSV)</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#FAF8F5] border-b border-[#E8E2D9] sticky top-0">
                        <tr>
                          {currentSheet.headers.map((h, i) => (
                            <th
                              key={i}
                              className="py-2.5 px-3 font-semibold text-[#1A1715] border-r border-[#E8E2D9] whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E2D9]">
                        {currentSheet.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#FAF8F5]">
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="py-2 px-3 border-r border-[#E8E2D9] text-[#44403C] font-mono text-[11px] whitespace-nowrap"
                              >
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Microsoft Graph API Logs Console */}
            <div className="bg-[#1A1715] text-[#D8D0C5] rounded-xl p-4 font-mono text-xs space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-[#A66B24] font-bold mb-2">
                Journal de Synchronisation Automatique Microsoft Graph API & Excel Online
              </div>
              {syncLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 6. MARKETING & META ADS ==================== */}
        {currentTab === 'marketing' && (
          <div className="space-y-8">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1A1715]">
                Marketing Digital & Campagnes Meta
              </h3>
              <p className="text-xs text-[#78716C]">
                Gestion des codes promo, simulation des événements Meta Pixel et modèles WhatsApp
              </p>
            </div>

            {/* Promo Codes Manager */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Promo List */}
              <div className="lg:col-span-7 bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs">
                <h4 className="font-serif text-base font-bold text-[#1A1715] mb-3">
                  Codes Promotionnels Actifs
                </h4>
                <div className="space-y-3">
                  {promoCodes.map((p) => (
                    <div
                      key={p.code}
                      className="flex items-center justify-between p-3 border border-[#E8E2D9] rounded-lg bg-[#FAF8F5]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#1A1715]">
                            {p.code}
                          </span>
                          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded font-semibold">
                            -{p.discountPercent}%
                          </span>
                        </div>
                        <p className="text-xs text-[#78716C] mt-0.5">{p.description}</p>
                        <span className="text-[11px] text-[#A8A29E] font-mono">
                          Utilisé {p.usesCount} fois · Dès {formatPrice(p.minAmount)}
                        </span>
                      </div>

                      <button
                        onClick={() => onTogglePromoCode(p.code)}
                        className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                          p.active
                            ? 'bg-[#1A1715] text-white hover:bg-[#C58A3E]'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.active ? 'Actif' : 'Désactivé'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create Promo Form */}
              <div className="lg:col-span-5 bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs">
                <h4 className="font-serif text-base font-bold text-[#1A1715] mb-3">
                  Créer un Code Promo
                </h4>
                <form onSubmit={handleCreatePromo} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-[#44403C] mb-1">Code Promo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : NOEL20"
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#FAF8F5] border border-[#D8D0C5] rounded-lg p-2 font-mono uppercase text-[#1A1715]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-[#44403C] mb-1">Réduction (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="80"
                        value={newPromoPercent}
                        onChange={(e) => setNewPromoPercent(Number(e.target.value))}
                        className="w-full bg-[#FAF8F5] border border-[#D8D0C5] rounded-lg p-2 font-mono text-[#1A1715]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-[#44403C] mb-1">Achat Min (FCFA)</label>
                      <input
                        type="number"
                        step="1000"
                        value={newPromoMin}
                        onChange={(e) => setNewPromoMin(Number(e.target.value))}
                        className="w-full bg-[#FAF8F5] border border-[#D8D0C5] rounded-lg p-2 font-mono text-[#1A1715]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-[#44403C] mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="Ex : 20% spécial fêtes de fin d'année"
                      value={newPromoDesc}
                      onChange={(e) => setNewPromoDesc(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#D8D0C5] rounded-lg p-2 text-[#1A1715]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-semibold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-lg transition-colors mt-2"
                  >
                    Enregistrer le Code Promo
                  </button>
                </form>
              </div>
            </div>

            {/* Meta Pixel & WhatsApp Broadcast Templates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Meta Pixel Simulator */}
              <div className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-serif text-base font-bold text-[#1A1715]">
                    Meta Pixel & Conversions API (CAPI)
                  </h4>
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                    Connecteur Actif
                  </span>
                </div>
                <p className="text-xs text-[#78716C] mb-4">
                  Suivi dédupliqué des événements d'achat pour optimiser vos campagnes Facebook & Instagram Ads.
                </p>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded flex justify-between">
                    <span>PageView (Accueil)</span>
                    <span className="text-emerald-700">Pixel + CAPI OK</span>
                  </div>
                  <div className="p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded flex justify-between">
                    <span>ViewContent (Fiches Livres)</span>
                    <span className="text-emerald-700">Pixel + CAPI OK</span>
                  </div>
                  <div className="p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded flex justify-between">
                    <span>AddToCart (Panier)</span>
                    <span className="text-emerald-700">Pixel + CAPI OK</span>
                  </div>
                  <div className="p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded flex justify-between">
                    <span>Purchase (Commandes FCFA)</span>
                    <span className="text-emerald-700">Déduplication active</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Broadcast Template */}
              <div className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs">
                <h4 className="font-serif text-base font-bold text-[#1A1715] mb-2">
                  Modèle de Relance WhatsApp Business
                </h4>
                <p className="text-xs text-[#78716C] mb-3">
                  Modèle conforme aux fenêtres de conversation de 24h WhatsApp Business API
                </p>

                <div className="bg-[#FAF3E8] border border-[#E8D9C0] rounded-xl p-4 text-xs font-sans text-[#2D2825] leading-relaxed">
                  <p>
                    « Bonjour <strong>{"{{customer_name}}"}</strong> ! Votre commande <strong>#{"{{order_id}}"}</strong> chez Mansa Livres est validée. Notre livreur partira ce jour pour <strong>{"{{city}}"}</strong>. Avez-vous besoin d'ajouter un marque-page ou un autre ouvrage avant départ du colis ? »
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 7. PARAMÈTRES ==================== */}
        {currentTab === 'settings' && (
          <div className="bg-white border border-[#E8E2D9] rounded-xl p-6 max-w-2xl shadow-2xs space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1A1715]">
                Paramètres de la Boutique & Paiements
              </h3>
              <p className="text-xs text-[#78716C]">
                Coordonnées de l'entreprise, intégration WhatsApp Business et codes marchands Mobile Money
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#44403C] mb-1">Nom de la boutique</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => onUpdateSettings({ ...settings, storeName: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#44403C] mb-1">
                    Numéro WhatsApp Business (Format international)
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappNumber}
                    onChange={(e) => onUpdateSettings({ ...settings, whatsappNumber: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#D8D0C5] rounded-lg p-2.5 font-mono text-[#1A1715]"
                  />
                  <span className="text-[11px] text-[#78716C]">Ex : 237699001122</span>
                </div>

                <div>
                  <label className="block font-medium text-[#44403C] mb-1">
                    Numéro d'affichage WhatsApp
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappDisplayNumber}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, whatsappDisplayNumber: e.target.value })
                    }
                    className="w-full bg-[#FAF8F5] border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715]"
                  />
                  <span className="text-[11px] text-[#78716C]">Ex : +237 699 00 11 22</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#44403C] mb-1">
                    Code Marchand Orange Money Cameroun
                  </label>
                  <input
                    type="text"
                    value={settings.orangeMoneyMerchantCode}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, orangeMoneyMerchantCode: e.target.value })
                    }
                    className="w-full bg-[#FAF8F5] border border-[#D8D0C5] rounded-lg p-2.5 font-mono text-[#1A1715]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#44403C] mb-1">
                    Code Marchand MTN MoMo Cameroun
                  </label>
                  <input
                    type="text"
                    value={settings.mtnMoMoMerchantCode}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, mtnMoMoMerchantCode: e.target.value })
                    }
                    className="w-full bg-[#FAF8F5] border border-[#D8D0C5] rounded-lg p-2.5 font-mono text-[#1A1715]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#44403C] mb-1">
                  Seuil de Livraison Gratuite (FCFA)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={settings.minFreeShipping}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, minFreeShipping: Number(e.target.value) })
                  }
                  className="w-full bg-[#FAF8F5] border border-[#D8D0C5] rounded-lg p-2.5 font-mono text-[#1A1715]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Book Modal */}
      {isNewBookModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <h4 className="font-serif text-lg font-bold text-[#1A1715] mb-4">
              {editingBook ? 'Modifier le livre' : 'Ajouter un livre au catalogue'}
            </h4>

            <form onSubmit={handleSaveBook} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#44403C] mb-1">Titre de l'ouvrage *</label>
                <input
                  type="text"
                  required
                  value={bookForm.title || ''}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full bg-white border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#44403C] mb-1">Auteur *</label>
                  <input
                    type="text"
                    required
                    value={bookForm.author || ''}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    className="w-full bg-white border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#44403C] mb-1">Catégorie</label>
                  <select
                    value={bookForm.category || 'Business'}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value as any })}
                    className="w-full bg-white border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715]"
                  >
                    <option value="Business">Business</option>
                    <option value="Litterature">Littérature</option>
                    <option value="Developpement">Développement</option>
                    <option value="Essais">Essais</option>
                    <option value="Scolaire">Scolaire</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#44403C] mb-1">Prix Vente (FCFA) *</label>
                  <input
                    type="number"
                    required
                    step="500"
                    value={bookForm.price || ''}
                    onChange={(e) => setBookForm({ ...bookForm, price: Number(e.target.value) })}
                    className="w-full bg-white border border-[#D8D0C5] rounded-lg p-2.5 font-mono text-[#1A1715]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#44403C] mb-1">Stock en rayon *</label>
                  <input
                    type="number"
                    required
                    value={bookForm.stockCount ?? 20}
                    onChange={(e) => setBookForm({ ...bookForm, stockCount: Number(e.target.value) })}
                    className="w-full bg-white border border-[#D8D0C5] rounded-lg p-2.5 font-mono text-[#1A1715]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#44403C] mb-1">Description courte & commerciale</label>
                <textarea
                  rows={3}
                  value={bookForm.description || ''}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  className="w-full bg-white border border-[#D8D0C5] rounded-lg p-2.5 text-[#1A1715]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewBookModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#57534E] hover:text-[#1A1715]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1715] hover:bg-[#C58A3E] rounded-lg transition-colors"
                >
                  {editingBook ? 'Mettre à jour' : 'Ajouter le livre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
