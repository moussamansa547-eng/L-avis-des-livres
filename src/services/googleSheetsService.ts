import { ExcelDatabaseExport } from './excelService';
import { getAccessToken } from './googleAuthService';

export interface GoogleSpreadsheetSummary {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export interface SyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  sheetsUpdated: string[];
  syncedAt: string;
}

/**
 * Searches the user's Google Drive for an existing "L'AVIS DES LIVRES" spreadsheet
 * or any relevant e-commerce spreadsheets.
 */
export async function findExistingStoreSpreadsheet(): Promise<GoogleSpreadsheetSummary | null> {
  const token = await getAccessToken();
  if (!token) throw new Error('Authentification Google requise');

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=10&fields=files(id,name,webViewLink,modifiedTime)`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Erreur lors de la recherche Google Drive');
  }

  const data = await res.json();
  const files: GoogleSpreadsheetSummary[] = data.files || [];
  
  // Find match with store name
  const match = files.find((f) => f.name.toLowerCase().includes("l'avis des livres") || f.name.toLowerCase().includes("lavis des livres"));
  return match || null;
}

/**
 * Lists all user spreadsheets on Google Drive for easy selection
 */
export async function listUserSpreadsheets(): Promise<GoogleSpreadsheetSummary[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Authentification Google requise');

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=15&fields=files(id,name,webViewLink,modifiedTime)`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Erreur lors de la récupération des fichiers');
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Creates a brand-new Google Spreadsheet with the 5 required tabs and stylized headers:
 * CLIENTS, COMMANDES, PRODUITS, MARKETING, STATISTIQUES.
 */
export async function createStoreSpreadsheet(title = "L'AVIS DES LIVRES - Base Commerciale & ERP"): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('Authentification Google requise');

  const payload = {
    properties: {
      title,
    },
    sheets: [
      { properties: { title: 'CLIENTS', tabColor: { red: 0.16, green: 0.5, blue: 0.72 } } },
      { properties: { title: 'COMMANDES', tabColor: { red: 0.85, green: 0.45, blue: 0.1 } } },
      { properties: { title: 'PRODUITS', tabColor: { red: 0.2, green: 0.65, blue: 0.35 } } },
      { properties: { title: 'MARKETING', tabColor: { red: 0.6, green: 0.2, blue: 0.7 } } },
      { properties: { title: 'STATISTIQUES', tabColor: { red: 0.9, green: 0.7, blue: 0.1 } } },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Erreur lors de la création du Google Sheet');
  }

  const data = await res.json();
  return data.spreadsheetId;
}

/**
 * Synchronizes the complete store database (5 sheets) into the Google Spreadsheet.
 */
export async function syncDatabaseToGoogleSheet(
  spreadsheetId: string,
  database: ExcelDatabaseExport
): Promise<SyncResult> {
  const token = await getAccessToken();
  if (!token) throw new Error('Authentification Google requise');

  // Verify sheet existence and metadata
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Feuille Google Sheets introuvable ou inaccessible');
  }

  const metaData = await metaRes.json();
  const existingSheetTitles: string[] = (metaData.sheets || []).map((s: any) => s.properties.title);

  // If any sheet is missing, add it via batchUpdate
  const missingSheets = ['CLIENTS', 'COMMANDES', 'PRODUITS', 'MARKETING', 'STATISTIQUES'].filter(
    (name) => !existingSheetTitles.includes(name)
  );

  if (missingSheets.length > 0) {
    const addSheetRequests = missingSheets.map((title) => ({
      addSheet: { properties: { title } },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: addSheetRequests }),
    });
  }

  // Prepare batch values payload
  const valueRanges = [
    {
      range: 'CLIENTS!A1:Z500',
      values: [database.sheets.clients.headers, ...database.sheets.clients.rows],
    },
    {
      range: 'COMMANDES!A1:Z500',
      values: [database.sheets.commandes.headers, ...database.sheets.commandes.rows],
    },
    {
      range: 'PRODUITS!A1:Z500',
      values: [database.sheets.produits.headers, ...database.sheets.produits.rows],
    },
    {
      range: 'MARKETING!A1:Z500',
      values: [database.sheets.marketing.headers, ...database.sheets.marketing.rows],
    },
    {
      range: 'STATISTIQUES!A1:Z500',
      values: [database.sheets.statistiques.headers, ...database.sheets.statistiques.rows],
    },
  ];

  // Clear existing ranges first for clean overwrite
  for (const sheetName of ['CLIENTS', 'COMMANDES', 'PRODUITS', 'MARKETING', 'STATISTIQUES']) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z500:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  // Update batch values
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueRanges,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Erreur lors de la mise à jour des données Google Sheets');
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title: "L'AVIS DES LIVRES - Base Commerciale & ERP",
    sheetsUpdated: ['CLIENTS', 'COMMANDES', 'PRODUITS', 'MARKETING', 'STATISTIQUES'],
    syncedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

/**
 * Appends a single newly confirmed order directly into the COMMANDES sheet in Google Sheets!
 */
export async function appendOrderToGoogleSheet(
  spreadsheetId: string,
  orderRow: (string | number)[]
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/COMMANDES!A:J:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [orderRow],
        }),
      }
    );
    return res.ok;
  } catch (e) {
    console.warn('Could not auto-append order to Google Sheets:', e);
    return false;
  }
}
