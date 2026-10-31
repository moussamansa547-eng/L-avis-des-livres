# Librairie Mansa — Boutique E-Commerce Intelligente & Livres (Cameroun, FCFA, WhatsApp & Excel)

Plateforme e-commerce professionnelle pour la vente de livres au Cameroun (Douala, Yaoundé et régions), inspirée de Shopify, dotée d'une commande optimisée sur WhatsApp Business, d'un checkout adapté aux réalités locales (Orange Money, MTN MoMo, Paiement à la livraison en FCFA), d'un moteur d'exportation/synchronisation Excel à 5 feuilles, et d'un tableau de bord administrateur complet.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Choix confirmés par l'utilisateur :**
> - **Secteur de vente** : Livres (littérature africaine et mondiale, business & entrepreneuriat, développement personnel, ouvrages scolaires et universitaires, essais & culture).
> - **Zone géographique & Devise** : Cameroun (villes clés : Douala, Yaoundé, Bafoussam, Garoua, etc.) avec tarification en **Francs CFA (XAF / FCFA)**.
> - **Modes de paiement prioritaires** : Mobile Money (**MTN Mobile Money & Orange Money**) ainsi que le **Paiement à la livraison (Cash on Delivery)**.
> - **Parcours d'achat hybride** : Checkout direct sur le site ET option instantanée « Commander sur WhatsApp » avec message complet prérempli.
> - **Gestion des données** : Base de données locale réactive avec persistance, couplée au moteur de synchronisation et d'exportation Excel structuré en 5 feuilles (Clients, Commandes, Produits, Marketing, Statistiques).

---

## 1. Overview & Core Concept

- **Produit & Vision** : Une librairie en ligne de prestige, moderne, épurée et ultra-rapide, valorisant les grands auteurs, penseurs et formateurs, offrant aux lecteurs camerounais une expérience d'achat sans friction.
- **Clientèle cible** : Passionnés de lecture, étudiants, cadres, entrepreneurs et parents d'élèves à Douala, Yaoundé et dans toutes les régions du Cameroun.
- **Proposition de valeur** : Découvrir des ouvrages rares ou populaires, feuilleter des extraits et caractéristiques détaillées (ISBN, pages, éditeur), commander en 2 clics sur mobile via WhatsApp ou payer par Mobile Money avec confirmation instantanée.

---

## 2. User Experience & Visual Direction

### Direction Artistique & Typographie
- **Aesthetic Direction** : *Éditorial littéraire contemporain et chaleureux*. Papier vergé naturel, ivoire doux, nuances ébène profondes et accents terre d'Afrique / ocre doré.
- **Palette de couleurs (Règle 60-30-10)** :
  - **60% Toile neutre** : Fond ivoire doux et lin clair (`#FAF8F5` / `#F3EFEA`), apportant le confort de lecture d'une véritable page de livre.
  - **30% Surfaces structurelles** : Cartes blanc cassé pur (`#FFFFFF`), typographie encre de Chine (`#1A1715` / `#2D2825`), bordures très fines papier (`#E8E2D9`).
  - **10% Accents de conversion** : Ocre doré précieux (`#C58A3E` / `#A66B24`) et vert succès WhatsApp officiel (`#25D366`), réservés aux boutons d'action clés (Achat, WhatsApp, validation).
- **Typographie** :
  - *Titres & Identité* : Police Serif éditoriale prestigieuse (`Playfair Display` ou `Merriweather`) pour les titres d'ouvrages, auteurs et citations.
  - *Corps de texte & Navigation* : Police sans-serif géométrique lisible (`Plus Jakarta Sans` ou `Outfit`) pour les descriptions, filtres et menus.
  - *Chiffres & Prix* : Chiffres tabulaires alignés (`font-mono tabular-nums`) pour les prix en FCFA et les stocks.
- **Expérience Mobile-First** :
  - Barre d'achat flottante compacte sur mobile ($\le 15\%$ de l'écran) pour ajouter au panier ou commander via WhatsApp d'un simple pouce.
  - Navigation par onglets tactiles clairs : Accueil, Catalogue, Panier, et Accès Dashboard.

---

## 3. Architecture & Functional Modules

```
┌────────────────────────────────────────────────────────────────────────┐
│                          VITRINE CLIENT                                │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │ Hero & Top   │  │  Catalogue &  │  │ Fiche Livre │  │ Panier &   │  │
│  │ Livres Vedette│  │    Filtres    │  │  (Extraits) │  │  Checkout  │  │
│  └──────┬───────┘  └───────┬───────┘  └──────┬──────┘  └─────┬──────┘  │
└─────────┼──────────────────┼─────────────────┼───────────────┼─────────┘
          │                  │                 │               │
          ▼                  ▼                 ▼               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   MOTEUR COMMERCIAL & COMMANDES                        │
│  • Calculateur FCFA & Frais de livraison (Douala, Yaoundé, Régions)    │
│  • Générateur de liens de commande WhatsApp formatés                   │
│  • Validation Mobile Money (Orange Money, MTN MoMo, Paiement Livraison)│
└────────────────────────────────────────────────────────────────────────┘
          │                                            │
          ▼                                            ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│       DASHBOARD ADMINISTRATEUR      │  │     SYNCHRONISATION EXCEL     │
│  • Métriques ventes & CA en FCFA    │  │  Feuille 1 : CLIENTS          │
│  • Gestion des Livres & Stocks      │  │  Feuille 2 : COMMANDES        │
│  • Gestion des Commandes & Statuts  │  │  Feuille 3 : PRODUITS         │
│  • Répertoire Clients & Contacts WA │  │  Feuille 4 : MARKETING        │
│  • Codes promo & Simulateur Meta/SEO│  │  Feuille 5 : STATISTIQUES     │
└─────────────────────────────────────┘  │  (Visualiseur & Téléchargement)│
                                         └───────────────────────────────┘
```

### Modules détaillés :

1. **Header & Navigation (Top Bar Contract)** :
   - Zone 1 : Nom de marque (« MANSA LIVRES ») avec baseline éditoriale discrète.
   - Zone 2 : Liens directs (Nouveautés, Collections, Meilleures Ventes, Avantages).
   - Zone 3 : Recherche en temps réel, Sélecteur panier interactif avec compteur, Bouton d'accès au Dashboard Admin.

2. **Catalogue & Fiches Livres complètes** :
   - Catégories : Littérature & Romans, Entrepreneuriat & Finance, Développement Personnel, Scolaire & Concours, Culture & Histoire Africaine.
   - Fiche produit détaillée : Couverture de livre soignée, auteur, résumé percutant, table des matières / extrait, caractéristiques (pages, éditeur, format, ISBN), avis lecteurs vérifiés, stock en temps réel.
   - Deux boutons d'action : « Ajouter au panier » et « Commander directement sur WhatsApp ».

3. **Panier intelligent & Checkout camerounais** :
   - Gestion des quantités, application de coupons promotionnels (ex. `BIENVENUE10`).
   - Sélection de la ville et du mode de livraison : Douala (Express 24h), Yaoundé (Express 24h), Autres Régions Cameroun (48-72h), Retrait en point relais.
   - Choix du moyen de paiement : MTN Mobile Money, Orange Money, Paiement à la réception du colis.
   - Récapitulatif clair avant validation.

4. **Intégration WhatsApp Business** :
   - Génération dynamique de message commercial ultra-pro avec référence de commande, titres des livres, coordonnées complètes, adresse et moyen de règlement.
   - Bouton de contact direct « Discuter avec un libraire » pour toute question avant-vente.

5. **Moteur Excel à 5 Feuilles** :
   - Système de gestion de données structurées conforme au cahier des charges :
     - **Clients** : Identifiant, Nom, Téléphone, Email, Ville, Commandes, Dépenses.
     - **Commandes** : Référence, Client, Date, Titres, Quantités, Total FCFA, Paiement, Statut.
     - **Produits** : Réf, Titre, Auteur, Catégorie, Prix FCFA, Stock, Ventes.
     - **Marketing** : Source d'acquisition, Campagnes, Opt-ins.
     - **Statistiques** : Chiffre d'affaires cumulé, Panier moyen, Top livres.
   - Interface de visualisation interactive intégrée avec onglets de feuilles et export instantané en `.xlsx` / `.csv`.

6. **Tableau de Bord Administrateur** :
   - Statistiques complètes en direct (CA en FCFA, commandes, panier moyen, alertes de stock faible).
   - CRUD complet des produits (ajouter un nouveau livre, modifier prix et stock).
   - Traitement des commandes (Nouvelle, Confirmée, En préparation, Expédiée, Livrée, Annulée) avec bouton pour relancer le client directement sur WhatsApp.
   - Outils Marketing : Créateur de codes promo, aperçu du catalogue Meta Ads / Google SEO, et modèle de messages de relance WhatsApp.

---

## 4. Plan de réalisation & Vérification

1. **Assets & Imagerie** : Génération d'images haute définition réalistes pour les couvertures de livres et bannières thématiques (romans, entrepreneuriat, livres d'étude) via `generate_image`.
2. **Implémentation Core** :
   - Configuration Tailwind avec palette personnalisée ivoire/encre/or.
   - Base de données locale persistante (localStorage + state manager) pré-peuplée d'un catalogue camerounais riche et représentatif.
   - Composants : Storefront, Catalogue, PDP (Fiche livre), CartDrawer, CheckoutModal, WhatsAppFormatter, AdminDashboard, ExcelSyncViewer.
3. **Tests & Validation** : Compilation sans erreur (`compile_applet`), vérification de la fluidité responsive sur mobile et desktop, test des flux de commande et d'export Excel.
