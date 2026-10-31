import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  LogOut,
  FolderOpen,
  PlusCircle,
  ShieldCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
} from '../services/googleAuthService';
import {
  createStoreSpreadsheet,
  syncDatabaseToGoogleSheet,
  listUserSpreadsheets,
  findExistingStoreSpreadsheet,
  GoogleSpreadsheetSummary,
  SyncResult,
} from '../services/googleSheetsService';
import { ExcelDatabaseExport } from '../services/excelService';

interface GoogleSheetsSyncProps {
  database: ExcelDatabaseExport;
  onSyncCompleted?: (result: SyncResult) => void;
}

export const GoogleSheetsSync: React.FC<GoogleSheetsSyncProps> = ({
  database,
  onSyncCompleted,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Spreadsheet state
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('lavis_sheets_id') || null;
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    const id = localStorage.getItem('lavis_sheets_id');
    return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Drive files picker
  const [driveFiles, setDriveFiles] = useState<GoogleSpreadsheetSummary[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);

  // Confirmation dialog state for destructive/updating actions (MANDATORY per skill)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {},
  });

  // Logs
  const [logs, setLogs] = useState<string[]>([
    `[Prêt] Connecteur officiel Google Sheets API v4 & Google Drive API v3 initialisé.`,
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('fr-FR');
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 8)]);
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setHasToken(!!token);
        addLog(`Session Google active : ${user.displayName || user.email}`);
      },
      () => {
        setCurrentUser(null);
        setHasToken(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      setCurrentUser(res.user);
      setHasToken(true);
      addLog(`Connexion réussie avec Google : ${res.user.email}`);

      // Auto-detect existing store spreadsheet if not already set
      if (!spreadsheetId) {
        try {
          const existing = await findExistingStoreSpreadsheet();
          if (existing) {
            setSpreadsheetId(existing.id);
            setSpreadsheetUrl(existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}/edit`);
            localStorage.setItem('lavis_sheets_id', existing.id);
            addLog(`Feuille existante détectée sur Drive : "${existing.name}"`);
          }
        } catch {
          // non-blocking
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Erreur lors de la connexion Google');
      addLog(`Erreur de connexion : ${err?.message || 'Inconnue'}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setHasToken(false);
    addLog(`Déconnexion effectuée. Jeton d'accès mémoire libéré.`);
  };

  const handleLoadDriveFiles = async () => {
    setIsLoadingDriveFiles(true);
    try {
      const files = await listUserSpreadsheets();
      setDriveFiles(files);
      setShowDrivePicker(true);
      addLog(`${files.length} feuille(s) Google Sheets trouvée(s) sur votre Google Drive.`);
    } catch (e: any) {
      setSyncError(e.message);
      addLog(`Erreur liste Drive : ${e.message}`);
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  // Request user confirmation before modifying Google Sheets data (mandatory per skill)
  const promptCreateSpreadsheet = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Créer une nouvelle feuille Google Sheets 'L'AVIS DES LIVRES' ?",
      description:
        "Cette action va créer une nouvelle feuille de calcul dans votre Google Drive avec 5 onglets pré-configurés (CLIENTS, COMMANDES, PRODUITS, MARKETING, STATISTIQUES) et y injecter l'ensemble de votre base de données commerciale.",
      action: async () => {
        setIsSyncing(true);
        setSyncError(null);
        try {
          addLog("Création de la feuille de calcul sur Google Drive...");
          const newId = await createStoreSpreadsheet();
          setSpreadsheetId(newId);
          const url = `https://docs.google.com/spreadsheets/d/${newId}/edit`;
          setSpreadsheetUrl(url);
          localStorage.setItem('lavis_sheets_id', newId);
          addLog(`Nouvelle feuille créée avec succès ! ID: ${newId}`);

          addLog("Synchronisation initiale des 5 onglets en cours...");
          const result = await syncDatabaseToGoogleSheet(newId, database);
          setSyncSuccess(result);
          onSyncCompleted?.(result);
          addLog("Données synchronisées avec succès sur Google Sheets !");
        } catch (e: any) {
          setSyncError(e.message);
          addLog(`Erreur : ${e.message}`);
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  const promptSyncSpreadsheet = () => {
    if (!spreadsheetId) return;
    setConfirmDialog({
      isOpen: true,
      title: "Mettre à jour vos données sur Google Sheets ?",
      description:
        "Êtes-vous sûr de vouloir synchroniser les 5 onglets ('CLIENTS', 'COMMANDES', 'PRODUITS', 'MARKETING', 'STATISTIQUES') ? Les données existantes dans cette feuille seront actualisées avec les commandes et clients récents de la boutique.",
      action: async () => {
        setIsSyncing(true);
        setSyncError(null);
        try {
          addLog(`Synchronisation vers la feuille Google Sheets (${spreadsheetId})...`);
          const result = await syncDatabaseToGoogleSheet(spreadsheetId, database);
          setSyncSuccess(result);
          onSyncCompleted?.(result);
          addLog(`Synchronisation réussie à ${result.syncedAt} (5 onglets mis à jour).`);
        } catch (e: any) {
          setSyncError(e.message);
          addLog(`Erreur de synchronisation : ${e.message}`);
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  const selectExistingFile = (file: GoogleSpreadsheetSummary) => {
    setSpreadsheetId(file.id);
    const url = file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`;
    setSpreadsheetUrl(url);
    localStorage.setItem('lavis_sheets_id', file.id);
    setShowDrivePicker(false);
    addLog(`Feuille sélectionnée : "${file.name}"`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#107C41]/10 via-[#107C41]/5 to-transparent border border-[#107C41]/20 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#107C41] text-white flex items-center justify-center shadow-md shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif text-lg font-bold text-[#1A1715]">
                Intégration Google Sheets & Drive
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                API Officielle v4
              </span>
            </div>
            <p className="text-xs text-[#57534E] mt-0.5">
              Synchronisez automatiquement vos clients, commandes, stocks et KPIs en direct sur Google Sheets
            </p>
          </div>
        </div>

        {/* Google Authentication Section */}
        <div>
          {!hasToken ? (
            <button
              onClick={handleGoogleLogin}
              disabled={isAuthenticating}
              className="gsi-material-button shadow-xs"
              title="Connectez votre compte Google pour synchroniser Google Sheets"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-medium">
                  {isAuthenticating ? 'Connexion en cours...' : 'Se connecter avec Google'}
                </span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-[#E8E2D9] rounded-lg px-3 py-1.5 shadow-2xs">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || ''}
                  className="w-7 h-7 rounded-full border border-emerald-500"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser?.email?.[0].toUpperCase()}
                </div>
              )}
              <div className="text-left text-xs">
                <div className="font-semibold text-[#1A1715] flex items-center gap-1">
                  <span>{currentUser?.displayName || currentUser?.email?.split('@')[0]}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-[10px] text-[#78716C] block truncate max-w-[140px]">
                  {currentUser?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 text-[#78716C] hover:text-red-600 p-1 rounded transition-colors"
                title="Déconnexion de Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {authError && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* Synchronisation Panel */}
      {hasToken ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Controls */}
          <div className="lg:col-span-8 bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs space-y-5">
            <div>
              <h4 className="font-serif text-base font-bold text-[#1A1715]">
                Feuille de Calcul Connectée
              </h4>
              <p className="text-xs text-[#78716C]">
                Gérez la destination de vos exports automatiques et mettez à jour les 5 onglets en un clic
              </p>
            </div>

            {/* Current spreadsheet status */}
            <div className="p-4 bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg">
              {spreadsheetId ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Classeur Google Sheets actif</span>
                      </div>
                      <div className="text-sm font-bold text-[#1A1715] mt-1 font-mono">
                        L'AVIS DES LIVRES - Base Commerciale & ERP
                      </div>
                      <div className="text-[11px] text-[#78716C] font-mono mt-0.5">
                        ID: {spreadsheetId}
                      </div>
                    </div>

                    {spreadsheetUrl && (
                      <a
                        href={spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#107C41] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ouvrir dans Google Sheets ↗</span>
                      </a>
                    )}
                  </div>

                  {/* Actions for current spreadsheet */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E8E2D9]">
                    <button
                      onClick={promptSyncSpreadsheet}
                      disabled={isSyncing}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#107C41] hover:bg-[#0c6334] rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Synchronisation en cours...' : 'Mettre à jour les 5 onglets'}</span>
                    </button>

                    <button
                      onClick={handleLoadDriveFiles}
                      disabled={isLoadingDriveFiles}
                      className="px-3 py-2 text-xs font-semibold text-[#57534E] hover:text-[#1A1715] bg-white border border-[#D8D0C5] rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Changer de feuille</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm text-[#1A1715]">
                      Aucune feuille Google Sheets associée pour l'instant
                    </h5>
                    <p className="text-xs text-[#78716C] max-w-md mx-auto mt-1">
                      Créez automatiquement un nouveau document Google Sheets ou sélectionnez un document existant sur votre Google Drive.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={promptCreateSpreadsheet}
                      disabled={isSyncing}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#107C41] hover:bg-[#0c6334] rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Créer la feuille "L'AVIS DES LIVRES"</span>
                    </button>

                    <button
                      onClick={handleLoadDriveFiles}
                      disabled={isLoadingDriveFiles}
                      className="px-3.5 py-2 text-xs font-semibold text-[#57534E] hover:text-[#1A1715] bg-white border border-[#D8D0C5] rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Sélectionner sur Drive</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sync Success Banner */}
            {syncSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 flex-1">
                  <div className="font-bold">Synchronisation réussie à {syncSuccess.syncedAt} !</div>
                  <div className="mt-1">
                    5 onglets synchronisés : {syncSuccess.sheetsUpdated.join(', ')}.
                  </div>
                  <a
                    href={syncSuccess.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline text-emerald-700 hover:text-emerald-950 mt-1 inline-block"
                  >
                    Consulter la feuille mise à jour sur Google Sheets ↗
                  </a>
                </div>
              </div>
            )}

            {syncError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-900">
                  <div className="font-bold">Erreur de synchronisation Google Sheets :</div>
                  <div>{syncError}</div>
                </div>
              </div>
            )}

            {/* 5 Sheets Architecture details */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
              {[
                { name: '1. CLIENTS', desc: `${database.sheets.clients.rows.length} fiches`, color: 'border-l-sky-500' },
                { name: '2. COMMANDES', desc: `${database.sheets.commandes.rows.length} commandes`, color: 'border-l-amber-500' },
                { name: '3. PRODUITS', desc: `${database.sheets.produits.rows.length} titres`, color: 'border-l-emerald-500' },
                { name: '4. MARKETING', desc: 'Campagnes & Meta', color: 'border-l-purple-500' },
                { name: '5. STATISTIQUES', desc: 'KPIs & Croissance', color: 'border-l-rose-500' },
              ].map((s, idx) => (
                <div
                  key={idx}
                  className={`bg-[#FAF8F5] border border-[#E8E2D9] border-l-4 ${s.color} rounded p-2 text-xs`}
                >
                  <div className="font-bold text-[#1A1715] truncate">{s.name}</div>
                  <div className="text-[11px] text-[#78716C]">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Drive & API Status Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#1A1715] text-[#D8D0C5] rounded-xl p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Google API v4 Console
                </span>
                <span className="text-[10px] text-white/50">En direct</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pt-1">
                {logs.map((log, idx) => (
                  <div key={idx} className="text-[11px] leading-relaxed break-all">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 text-xs text-[#57534E] space-y-2">
              <h5 className="font-semibold text-[#1A1715] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Sécurité & Confidentialité</span>
              </h5>
              <p className="text-[11px] leading-relaxed">
                Les jetons d'accès Google sont stockés strictement <strong>en mémoire vive</strong> de votre session et ne sont jamais enregistrés sur des supports persistants non sécurisés.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E2D9] rounded-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#107C41] mx-auto flex items-center justify-center">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="font-serif text-lg font-bold text-[#1A1715]">
              Connectez votre compte Google Workspace
            </h4>
            <p className="text-xs text-[#78716C] mt-1.5 leading-relaxed">
              Pour synchroniser votre boutique directement avec Google Sheets, autorisez l'accès à vos fichiers Google Drive en cliquant sur le bouton officiel ci-dessous.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleGoogleLogin}
              disabled={isAuthenticating}
              className="gsi-material-button shadow-xs"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-medium">
                  {isAuthenticating ? 'Connexion en cours...' : 'Se connecter avec Google'}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Drive File Picker Modal */}
      {showDrivePicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8E2D9] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <h4 className="font-serif text-base font-bold text-[#1A1715] flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-emerald-600" />
                <span>Sélectionner une feuille sur votre Google Drive</span>
              </h4>
              <button
                onClick={() => setShowDrivePicker(false)}
                className="text-[#78716C] hover:text-[#1A1715] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-[#F3EFEA]">
              {driveFiles.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#78716C]">
                  Aucun fichier Google Sheets trouvé.
                </div>
              ) : (
                driveFiles.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => selectExistingFile(f)}
                    className="w-full text-left py-3 px-2 hover:bg-[#FAF8F5] rounded-lg transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#1A1715] group-hover:text-emerald-700">
                        {f.name}
                      </div>
                      <div className="text-[11px] text-[#78716C] font-mono">ID: {f.id}</div>
                    </div>
                    <span className="text-xs text-emerald-600 opacity-0 group-hover:opacity-100 font-semibold">
                      Choisir →
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDrivePicker(false)}
                className="px-4 py-2 text-xs font-semibold text-[#57534E] hover:text-[#1A1715] bg-[#FAF8F5] rounded-lg border border-[#D8D0C5]"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Modal for Destructive/Mutating operations */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E2D9] space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#1A1715]">
                  {confirmDialog.title}
                </h4>
                <p className="text-xs text-[#57534E] mt-1.5 leading-relaxed">
                  {confirmDialog.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E2D9]">
              <button
                onClick={() =>
                  setConfirmDialog({ isOpen: false, title: '', description: '', action: async () => {} })
                }
                className="px-4 py-2 text-xs font-semibold text-[#57534E] hover:text-[#1A1715] bg-[#FAF8F5] rounded-lg border border-[#D8D0C5] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  const act = confirmDialog.action;
                  setConfirmDialog({ isOpen: false, title: '', description: '', action: async () => {} });
                  await act();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#107C41] hover:bg-[#0c6334] rounded-lg transition-colors shadow-xs"
              >
                Confirmer la synchronisation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
