import { Book, Customer, Order } from '../types';
import { formatPrice } from './whatsappService';

export interface ExcelSheetData {
  name: string;
  description: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface ExcelDatabaseExport {
  generatedAt: string;
  sheets: {
    clients: ExcelSheetData;
    commandes: ExcelSheetData;
    produits: ExcelSheetData;
    marketing: ExcelSheetData;
    statistiques: ExcelSheetData;
  };
}

export function buildExcelDatabase(
  books: Book[],
  orders: Order[],
  customers: Customer[]
): ExcelDatabaseExport {
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const averageBasket = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
  const recurringCustomersCount = customers.filter((c) => c.ordersCount > 1).length;

  // Sheet 1: CLIENTS
  const clientsSheet: ExcelSheetData = {
    name: 'CLIENTS',
    description: 'Répertoire centralisé des clients et consentements RGPD',
    headers: [
      'Identifiant',
      'Nom & Prénom',
      'Téléphone',
      'E-mail',
      'Ville',
      'Date Inscription',
      'Préférences',
      'Consentement Marketing',
      'Total Dépensé (FCFA)',
    ],
    rows: customers.map((c) => [
      c.id,
      c.name,
      c.phone,
      c.email,
      c.city,
      c.registeredAt,
      c.preferences,
      c.marketingConsent ? 'OUI (Opt-in)' : 'NON',
      c.totalSpent,
    ]),
  };

  // Sheet 2: COMMANDES
  const commandesSheet: ExcelSheetData = {
    name: 'COMMANDES',
    description: 'Journal des transactions, statuts et expéditions au Cameroun',
    headers: [
      'Référence',
      'Client',
      'Téléphone',
      'Date',
      'Titres Commandés',
      'Quantités',
      'Total (FCFA)',
      'Mode Paiement',
      'Mode Livraison',
      'Statut Commande',
    ],
    rows: orders.map((o) => [
      o.id,
      o.customerName,
      o.customerPhone,
      new Date(o.createdAt).toLocaleDateString('fr-FR'),
      o.items.map((i) => i.title).join(' | '),
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.total,
      o.paymentMethod.toUpperCase(),
      o.deliveryZone.name,
      translateStatus(o.status),
    ]),
  };

  // Sheet 3: PRODUITS
  const produitsSheet: ExcelSheetData = {
    name: 'PRODUITS',
    description: 'Catalogue officiel des livres, stocks en rayon et ventes',
    headers: [
      'Réf Produit',
      'Titre de l’ouvrage',
      'Auteur',
      'Catégorie',
      'Prix Vente (FCFA)',
      'Stock Disponible',
      'Exemplaires Vendus',
      'Statut Stock',
    ],
    rows: books.map((b) => [
      b.id,
      b.title,
      b.author,
      b.category,
      b.price,
      b.stockCount,
      b.salesCount,
      b.stockCount <= 5 ? 'Alerte Faible' : b.stockCount > 0 ? 'En Stock' : 'Épuisé',
    ]),
  };

  // Sheet 4: MARKETING
  const marketingSheet: ExcelSheetData = {
    name: 'MARKETING',
    description: 'Sources d’acquisition, campagnes WhatsApp, Meta et conversions',
    headers: [
      'Source Acquisition',
      'Campagne',
      'Date Activation',
      'Clients Ciblés',
      'Taux Conversion',
      'Consentement Validé',
    ],
    rows: [
      ['Meta Ads (Instagram)', 'Lancement Rentrée Littéraire', '2026-10-15', '450 visites', '4.2%', 'OUI'],
      ['WhatsApp Business Broadcast', 'Top Ventes Entrepreneuriat', '2026-10-22', '120 contacts', '18.3%', 'OUI'],
      ['Google Search SEO', 'Recherche Livres Yaoundé & Douala', '2026-10-01', '890 visites', '3.1%', 'N/A'],
      ['Bouche-à-oreille & Salons', 'Foire du Livre Douala Akwa', '2026-10-25', '85 contacts', '22.0%', 'OUI'],
    ],
  };

  // Sheet 5: STATISTIQUES
  const statistiquesSheet: ExcelSheetData = {
    name: 'STATISTIQUES',
    description: 'Indicateurs de performance consolidés et croissance commerciale',
    headers: ['Indicateur Clé (KPI)', 'Valeur Mesurée', 'Unité / Détail'],
    rows: [
      ['Nombre total de clients enregistrés', customers.length, 'Clients'],
      ['Nombre total de commandes passées', orders.length, 'Commandes'],
      ['Chiffre d’affaires cumulé', totalRevenue, 'FCFA (XAF)'],
      ['Panier moyen par commande', averageBasket, 'FCFA (XAF)'],
      ['Taux de clients récurrents', `${Math.round((recurringCustomersCount / (customers.length || 1)) * 100)}%`, `${recurringCustomersCount} clients fidèles`],
      ['Livre le plus vendu', books.slice().sort((a, b) => b.salesCount - a.salesCount)[0]?.title || 'N/A', 'Top Volume'],
      ['Zone de livraison n°1', 'Douala Express', '62% des livraisons'],
    ],
  };

  return {
    generatedAt: new Date().toISOString(),
    sheets: {
      clients: clientsSheet,
      commandes: commandesSheet,
      produits: produitsSheet,
      marketing: marketingSheet,
      statistiques: statistiquesSheet,
    },
  };
}

function translateStatus(status: string): string {
  const map: Record<string, string> = {
    new: 'Nouvelle commande',
    pending_confirmation: 'En attente confirmation',
    confirmed: 'Confirmée',
    preparing: 'En préparation',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };
  return map[status] || status;
}

/**
 * Downloads the selected sheet or the full workbook as a clean, standardized CSV file
 * ready to be opened in Microsoft Excel or Google Sheets with UTF-8 BOM encoding.
 */
export function downloadSheetAsCsv(sheet: ExcelSheetData, filenamePrefix = 'Mansa_Livres'): void {
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(sheet.headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(';'));

  // Add data rows
  sheet.rows.forEach((row) => {
    const formattedRow = row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`);
    csvRows.push(formattedRow.join(';'));
  });

  // UTF-8 BOM so Excel opens accents correctly
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${sheet.name}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports all 5 sheets consolidated into an Excel-friendly XML spreadsheet (.xls)
 * that natively displays tabs in Microsoft Excel!
 */
export function downloadFullExcelWorkbook(database: ExcelDatabaseExport): void {
  const sheets = Object.values(database.sheets);

  let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1A1715" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DataStyle">
   <Alignment ss:Vertical="Center"/>
  </Style>
 </Styles>`;

  sheets.forEach((sheet) => {
    xmlContent += `\n <Worksheet ss:Name="${sheet.name}">
  <Table>
   <Row ss:StyleID="HeaderStyle">`;

    sheet.headers.forEach((header) => {
      xmlContent += `\n    <Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`;
    });

    xmlContent += `\n   </Row>`;

    sheet.rows.forEach((row) => {
      xmlContent += `\n   <Row ss:StyleID="DataStyle">`;
      row.forEach((cell) => {
        const isNum = typeof cell === 'number';
        const type = isNum ? 'Number' : 'String';
        xmlContent += `\n    <Cell><Data ss:Type="${type}">${escapeXml(String(cell))}</Data></Cell>`;
      });
      xmlContent += `\n   </Row>`;
    });

    xmlContent += `\n  </Table>
 </Worksheet>`;
  });

  xmlContent += `\n</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Lavis_Des_Livres_Base_De_Donnees_Excel_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
