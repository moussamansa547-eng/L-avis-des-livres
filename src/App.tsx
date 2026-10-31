import React, { useState, useEffect } from 'react';
import {
  Book,
  CartItem,
  Customer,
  DeliveryZone,
  Order,
  OrderStatus,
  PromoCode,
  StoreSettings,
} from './types';
import {
  INITIAL_BOOKS,
  DELIVERY_ZONES,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_PROMO_CODES,
  INITIAL_SETTINGS,
} from './data/mockData';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BookCard } from './components/BookCard';
import { BookDetailModal } from './components/BookDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { AdminDashboard } from './components/AdminDashboard';
import { GeminiChatbot } from './components/GeminiChatbot';
import { BookVideoAnimator } from './components/BookVideoAnimator';
import { Footer } from './components/Footer';
import {
  MessageCircle,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Search,
  BookOpen,
  ShoppingBag,
  Bot,
  Film,
} from 'lucide-react';
import { getAdvisorWhatsAppUrl } from './services/whatsappService';

export default function App() {
  // Persistent State Initializations
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('lavis_books');
    return saved ? JSON.parse(saved) : INITIAL_BOOKS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('lavis_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('lavis_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => {
    const saved = localStorage.getItem('lavis_promos');
    return saved ? JSON.parse(saved) : INITIAL_PROMO_CODES;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('lavis_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('lavis_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // UI Interactive States
  const [selectedZone, setSelectedZone] = useState<DeliveryZone>(DELIVERY_ZONES[0]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // New AI Feature States
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isAnimatorOpen, setIsAnimatorOpen] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'price-asc' | 'price-desc' | 'newest'>('popularity');

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('lavis_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('lavis_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('lavis_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('lavis_promos', JSON.stringify(promoCodes));
  }, [promoCodes]);

  useEffect(() => {
    localStorage.setItem('lavis_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('lavis_cart', JSON.stringify(cart));
  }, [cart]);

  // Cart Operations
  const handleAddToCart = (book: Book, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.book.id === book.id);
      if (existing) {
        return prev.map((item) =>
          item.book.id === book.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { book, quantity }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (bookId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.book.id === bookId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (bookId: string) => {
    setCart((prev) => prev.filter((item) => item.book.id !== bookId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Promo Code Application
  const handleApplyPromo = (code: string): { success: boolean; message: string } => {
    const promo = promoCodes.find((p) => p.code === code.trim().toUpperCase() && p.active);
    if (!promo) {
      return { success: false, message: 'Code promo invalide ou expiré.' };
    }

    const subtotal = cart.reduce((acc, it) => acc + it.book.price * it.quantity, 0);
    if (subtotal < promo.minAmount) {
      return {
        success: false,
        message: `Ce code nécessite un achat minimum de ${promo.minAmount.toLocaleString()} FCFA.`,
      };
    }

    setAppliedPromo(promo);
    return {
      success: true,
      message: `Code ${promo.code} appliqué : -${promo.discountPercent}% de réduction !`,
    };
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  // Order Creation Handler
  const handleOrderCreated = (order: Order) => {
    setOrders((prev) => [order, ...prev]);

    setBooks((prev) =>
      prev.map((b) => {
        const ordered = order.items.find((i) => i.bookId === b.id);
        if (ordered) {
          const newStock = Math.max(0, b.stockCount - ordered.quantity);
          return {
            ...b,
            stockCount: newStock,
            salesCount: b.salesCount + ordered.quantity,
            inStock: newStock > 0,
          };
        }
        return b;
      })
    );

    setCustomers((prev) => {
      const existing = prev.find((c) => c.phone === order.customerPhone);
      if (existing) {
        return prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                ordersCount: c.ordersCount + 1,
                totalSpent: c.totalSpent + order.total,
                lastOrderDate: new Date().toISOString().slice(0, 10),
              }
            : c
        );
      } else {
        const newCust: Customer = {
          id: `CUST-${(prev.length + 1).toString().padStart(3, '0')}`,
          name: order.customerName,
          phone: order.customerPhone,
          email: order.customerEmail || 'client@lavisdeslivres.cm',
          city: order.city,
          registeredAt: new Date().toISOString().slice(0, 10),
          ordersCount: 1,
          totalSpent: order.total,
          preferences: order.items.map((i) => i.title).join(', '),
          marketingConsent: true,
          lastOrderDate: new Date().toISOString().slice(0, 10),
        };
        return [newCust, ...prev];
      }
    });

    setCart([]);
    setAppliedPromo(null);
    setCompletedOrder(order);
  };

  // Book Admin Handlers
  const handleAddBook = (newBook: Book) => {
    setBooks((prev) => [newBook, ...prev]);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus, notes?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              notes: notes !== undefined ? notes : o.notes,
            }
          : o
      )
    );
  };

  const handleAddPromoCode = (promo: PromoCode) => {
    setPromoCodes((prev) => [promo, ...prev]);
  };

  const handleTogglePromoCode = (code: string) => {
    setPromoCodes((prev) =>
      prev.map((p) => (p.code === code ? { ...p, active: !p.active } : p))
    );
  };

  // Filtered & Sorted Books
  const filteredBooks = books.filter((b) => {
    const matchesCategory =
      selectedCategory === 'all' ? true : b.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'popularity') return b.salesCount - a.salesCount;
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    return 0;
  });

  const bestsellers = books.filter((b) => b.isBestseller).slice(0, 3);
  const advisorWhatsAppUrl = getAdvisorWhatsAppUrl(settings);

  // Smooth scroll
  const handleNavigateSection = (sectionId: string) => {
    if (isAdminOpen) setIsAdminOpen(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1715] flex flex-col font-sans selection:bg-[#C58A3E]/20">
      {/* If Admin view is active, display full back-office */}
      {isAdminOpen ? (
        <AdminDashboard
          books={books}
          orders={orders}
          customers={customers}
          promoCodes={promoCodes}
          settings={settings}
          deliveryZones={DELIVERY_ZONES}
          onUpdateBook={handleUpdateBook}
          onAddBook={handleAddBook}
          onDeleteBook={handleDeleteBook}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onAddPromoCode={handleAddPromoCode}
          onTogglePromoCode={handleTogglePromoCode}
          onUpdateSettings={setSettings}
          onClose={() => setIsAdminOpen(false)}
        />
      ) : (
        <>
          {/* Header */}
          <Header
            cartItems={cart}
            onOpenCart={() => setIsCartOpen(true)}
            isAdminOpen={isAdminOpen}
            onToggleAdmin={() => setIsAdminOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNavigateSection={handleNavigateSection}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onOpenChatbot={() => setIsChatbotOpen(true)}
            onOpenAnimator={() => setIsAnimatorOpen(true)}
          />

          {/* Main Content */}
          <main className="flex-1">
            {/* Hero Section */}
            <Hero
              settings={settings}
              onExploreClick={() => handleNavigateSection('catalogue')}
              onOpenChatbot={() => setIsChatbotOpen(true)}
              onOpenAnimator={() => setIsAnimatorOpen(true)}
            />

            {/* Bestsellers Spotlight Section */}
            <section id="bestsellers" className="py-12 sm:py-16 border-b border-[#E8E2D9]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#A66B24] font-semibold block mb-1">
                      Les Indispensables de L'Avis des Livres
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1715]">
                      Les Meilleures Ventes du Moment
                    </h2>
                  </div>
                  <button
                    onClick={() => handleNavigateSection('catalogue')}
                    className="text-xs font-semibold text-[#1A1715] hover:text-[#C58A3E] hover:underline transition-colors flex items-center gap-1 shrink-0"
                  >
                    <span>Voir tout le catalogue ({books.length} titres)</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {bestsellers.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      settings={settings}
                      onSelectBook={setSelectedBook}
                      onAddToCart={(b) => handleAddToCart(b, 1)}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Main Catalogue Section */}
            <section id="catalogue" className="py-12 sm:py-16 border-b border-[#E8E2D9]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#A66B24] font-semibold block mb-1">
                      Rayons & Collections
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1715]">
                      Parcourir les Livres
                    </h2>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#78716C]">Trier par :</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-white border border-[#D8D0C5] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1715] focus:outline-none focus:border-[#C58A3E]"
                    >
                      <option value="popularity">Popularité & Ventes</option>
                      <option value="newest">Nouveautés</option>
                      <option value="price-asc">Prix croissant</option>
                      <option value="price-desc">Prix décroissant</option>
                    </select>
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
                  {[
                    { id: 'all', label: 'Tous les livres' },
                    { id: 'Business', label: 'Business & Entrepreneuriat' },
                    { id: 'Litterature', label: 'Littérature & Romans' },
                    { id: 'Developpement', label: 'Développement Personnel' },
                    { id: 'Essais', label: 'Essais & Panafricanisme' },
                    { id: 'Scolaire', label: 'Scolaire & Concours' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === cat.id
                          ? 'bg-[#1A1715] text-white shadow-xs'
                          : 'bg-white border border-[#E8E2D9] text-[#57534E] hover:text-[#1A1715] hover:border-[#D8D0C5]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search Feedback if active */}
                {searchQuery && (
                  <div className="mb-6 p-3 bg-white border border-[#E8E2D9] rounded-lg flex items-center justify-between text-xs text-[#57534E]">
                    <span>
                      Résultats pour la recherche « <strong>{searchQuery}</strong> » : {sortedBooks.length} ouvrage(s)
                    </span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[#C58A3E] hover:underline font-semibold"
                    >
                      Effacer la recherche
                    </button>
                  </div>
                )}

                {/* Products Grid */}
                {sortedBooks.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-[#E8E2D9] rounded-2xl p-8">
                    <BookOpen className="w-12 h-12 text-[#D8D0C5] mx-auto mb-3" />
                    <h3 className="font-serif text-lg font-bold text-[#1A1715] mb-1">
                      Aucun livre ne correspond à votre sélection
                    </h3>
                    <p className="text-xs text-[#78716C] mb-4">
                      Essayez un autre mot-clé ou demandez conseil à notre Conseiller IA.
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1715] rounded-lg hover:bg-[#C58A3E]"
                      >
                        Voir tous les livres
                      </button>
                      <button
                        onClick={() => setIsChatbotOpen(true)}
                        className="px-4 py-2 text-xs font-semibold text-[#1A1715] bg-[#FAF3E8] border border-[#E8D9C0] rounded-lg hover:bg-[#F0E4D0]"
                      >
                        Consulter l'IA
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {sortedBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        settings={settings}
                        onSelectBook={setSelectedBook}
                        onAddToCart={(b) => handleAddToCart(b, 1)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Reassurance & Logistics Section */}
            <section id="avantages" className="py-12 sm:py-16 bg-white border-b border-[#E8E2D9]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <span className="text-xs uppercase tracking-widest text-[#A66B24] font-semibold block mb-1">
                    Fiabilité & Sérénité
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1715]">
                    Pourquoi Choisir L'AVIS DES LIVRES au Cameroun ?
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#FAF3E8] text-[#C58A3E] flex items-center justify-center mb-3">
                      <Truck className="w-6 h-6" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#1A1715] mb-1">
                      Livraison Rapide 24h
                    </h4>
                    <p className="text-xs text-[#78716C] leading-relaxed">
                      Livreurs dédiés à moto en 24h à Douala et Yaoundé. Expédition sécurisée 48-72h dans toutes les régions.
                    </p>
                  </div>

                  <div className="p-5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#FAF3E8] text-[#C58A3E] flex items-center justify-center mb-3">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#1A1715] mb-1">
                      Mobile Money Intégré
                    </h4>
                    <p className="text-xs text-[#78716C] leading-relaxed">
                      Réglez sans frais via Orange Money, MTN Mobile Money ou directement en espèces à la livraison.
                    </p>
                  </div>

                  <div className="p-5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#FAF3E8] text-[#C58A3E] flex items-center justify-center mb-3">
                      <Bot className="w-6 h-6 text-[#A66B24]" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#1A1715] mb-1">
                      Conseiller Littéraire IA
                    </h4>
                    <p className="text-xs text-[#78716C] leading-relaxed">
                      Un agent intelligent nourri aux meilleures références pour guider vos choix de lecture et de formation.
                    </p>
                  </div>

                  <div className="p-5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#FAF3E8] text-[#C58A3E] flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#1A1715] mb-1">
                      Ouvrages 100% Originaux
                    </h4>
                    <p className="text-xs text-[#78716C] leading-relaxed">
                      Authenticité garantie auprès des éditeurs officiels. Zéro contrefaçon, reçu fourni.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* About / Heritage Section */}
            <section id="apropos" className="py-12 sm:py-16 border-b border-[#E8E2D9]">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <span className="text-xs uppercase tracking-widest text-[#A66B24] font-semibold block mb-2">
                  La Vision de L'Avis des Livres
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1715] mb-4">
                  « Le livre est l'arme la plus noble pour l'émancipation intellectuelle et économique de notre continent. »
                </h2>
                <p className="text-sm text-[#57534E] leading-relaxed mb-6">
                  Chez <strong>L'AVIS DES LIVRES</strong>, nous croyons qu'une véritable recommandation littéraire transforme un parcours de vie. En combinant l'intelligence artificielle pour orienter vos choix, la commande automatisée par WhatsApp Business et une logistique rodée au Cameroun, nous rendons l'accès au savoir fluide, moderne et agréable.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1A1715]">
                  <span>L'AVIS DES LIVRES Cameroun</span>
                  <span>·</span>
                  <span>Akwa Douala & Bastos Yaoundé</span>
                </div>
              </div>
            </section>
          </main>

          {/* Footer */}
          <Footer
            settings={settings}
            onNavigateSection={handleNavigateSection}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />

          {/* Floating Action Cluster on Bottom-Right */}
          <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
            {/* 1. Video Animator Floating Trigger */}
            <button
              onClick={() => setIsAnimatorOpen(true)}
              className="bg-white hover:bg-[#FAF8F5] text-[#1A1715] border border-[#E8E2D9] hover:border-[#C58A3E] p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group"
              title="Studio d'Animation Vidéo IA"
            >
              <Film className="w-5 h-5 text-[#C58A3E]" />
              <span className="hidden sm:inline text-xs font-bold text-[#1A1715] pr-1">
                Studio Vidéo
              </span>
            </button>

            {/* 2. Gemini AI Chatbot Floating Trigger */}
            <button
              onClick={() => setIsChatbotOpen(true)}
              className="bg-[#1A1715] hover:bg-[#C58A3E] text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group"
              title="Discuter avec le Conseiller Littéraire IA"
            >
              <Bot className="w-5 h-5 text-[#C58A3E] group-hover:text-white transition-colors" />
              <span className="hidden sm:inline text-xs font-bold pr-1">
                Conseiller IA
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>

            {/* 3. WhatsApp Direct Contact */}
            <a
              href={advisorWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group"
              title="Contacter un libraire sur WhatsApp"
            >
              <MessageCircle className="w-5 h-5 fill-white text-white" />
              <span className="hidden sm:inline text-xs font-bold pr-1">
                WhatsApp
              </span>
            </a>
          </div>

          {/* Floating Mobile Sticky Cart Bar if cart has items */}
          {cart.length > 0 && !isCartOpen && (
            <div className="fixed bottom-0 inset-x-0 z-30 sm:hidden bg-[#1A1715] text-white p-3 border-t border-black flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#C58A3E]" />
                <span className="text-xs font-medium">
                  {cart.reduce((s, i) => s + i.quantity, 0)} livre(s)
                </span>
                <span className="text-xs font-mono font-bold text-[#C58A3E]">
                  · {cart.reduce((s, i) => s + i.book.price * i.quantity, 0).toLocaleString()} FCFA
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(true)}
                className="px-3.5 py-1.5 bg-[#C58A3E] hover:bg-[#A66B24] text-white text-xs font-bold rounded-md"
              >
                Voir Panier
              </button>
            </div>
          )}

          {/* Modals & Drawers */}
          <BookDetailModal
            book={selectedBook}
            allBooks={books}
            settings={settings}
            onClose={() => setSelectedBook(null)}
            onAddToCart={handleAddToCart}
            onSelectBook={setSelectedBook}
          />

          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            deliveryZones={DELIVERY_ZONES}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            promoCodes={promoCodes}
            appliedPromo={appliedPromo}
            onApplyPromo={handleApplyPromo}
            onRemovePromo={handleRemovePromo}
            onProceedToCheckout={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
            settings={settings}
          />

          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            cartItems={cart}
            selectedZone={selectedZone}
            appliedPromo={appliedPromo}
            settings={settings}
            onOrderCreated={handleOrderCreated}
          />

          <OrderConfirmationModal
            order={completedOrder}
            settings={settings}
            onClose={() => setCompletedOrder(null)}
          />

          {/* New AI Modals */}
          <GeminiChatbot
            isOpen={isChatbotOpen}
            onClose={() => setIsChatbotOpen(false)}
            books={books}
            onSelectBook={setSelectedBook}
            onAddToCart={(b) => handleAddToCart(b, 1)}
          />

          <BookVideoAnimator
            isOpen={isAnimatorOpen}
            onClose={() => setIsAnimatorOpen(false)}
            books={books}
          />
        </>
      )}
    </div>
  );
}
