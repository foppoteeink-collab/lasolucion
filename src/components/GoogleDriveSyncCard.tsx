import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Cloud, HardDrive, CheckCircle2, RefreshCw, AlertTriangle, 
  Download, Upload, Check, AlertCircle, Sparkles, LogIn, KeyRound, X
} from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, createGoogleDriveProvider } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { soundFX } from '../utils/audio';
import { 
  findDriveBackupFile, 
  downloadBackupFromDrive, 
  uploadBackupToDrive, 
  gatherCurrentAppState, 
  restoreAppState, 
  DriveFileInfo 
} from '../services/googleDriveService';
import { MoxenRayas } from './moxen/MoxenRayas';
import { AUTH_SECURITY_MICROCOPY } from '../data/narrativeCopy';

export const GoogleDriveSyncCard: React.FC = () => {
  const { user, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncOperation, setSyncOperation] = useState<'upload' | 'download' | null>(null);
  const [driveFile, setDriveFile] = useState<DriveFileInfo | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Dialog confirmation states
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [pendingDownloadData, setPendingDownloadData] = useState<any | null>(null);

  const isAnyModalOpen = showUploadConfirm || (showDownloadConfirm && Boolean(pendingDownloadData));

  // Manage body class and Escape key when confirmation modals are open
  useEffect(() => {
    if (!isAnyModalOpen) return;

    document.body.classList.add('modal-open-hide-floating');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showUploadConfirm) {
          setShowUploadConfirm(false);
        }
        if (showDownloadConfirm) {
          setShowDownloadConfirm(false);
          setPendingDownloadData(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnyModalOpen, showUploadConfirm, showDownloadConfirm]);

  /**
   * P0: Autorización Incremental Bajo Demanda (OAuth Scope Isolation)
   * Solicita el scope https://www.googleapis.com/auth/drive.file exclusivamente
   * cuando el tester decide conscientemente respaldar o restaurar desde su Google Drive.
   */
  const requestDriveAuthorization = useCallback(async (): Promise<string | null> => {
    if (!auth) return null;
    try {
      setIsLoading(true);
      setStatusMessage(null);
      const driveProvider = createGoogleDriveProvider();
      const result = await signInWithPopup(auth, driveProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;

      if (token) {
        setDriveAccessToken(token);
        return token;
      }
      throw new Error('No se recibió token de acceso para Google Drive.');
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setStatusMessage({ type: 'info', text: 'Autorización de Google Drive cancelada.' });
      } else {
        console.error('[GoogleDriveSync] Incremental Auth Error:', err);
        setStatusMessage({
          type: 'error',
          text: err?.message || 'Error al autorizar acceso a Google Drive.',
        });
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Comprueba la existencia del archivo de copia en Drive si ya existe token autorizado
  const checkDriveBackup = useCallback(async (tokenToUse?: string) => {
    const token = tokenToUse || driveAccessToken;
    if (!token) return;

    try {
      setIsLoading(true);
      const file = await findDriveBackupFile(token);
      setDriveFile(file);
      setHasChecked(true);
    } catch (err: any) {
      console.warn('[GoogleDriveSync] Check backup warning:', err);
      if (err?.message?.includes('401') || err?.message?.includes('expirada')) {
        setDriveAccessToken(null);
        setStatusMessage({
          type: 'info',
          text: 'Sesión de Drive caducada. Reautoriza para comprobar el archivo.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [driveAccessToken]);

  useEffect(() => {
    if (user && driveAccessToken && !hasChecked) {
      checkDriveBackup(driveAccessToken);
    }
  }, [user, driveAccessToken, hasChecked, checkDriveBackup]);

  // Manejador para iniciar el flujo de guardado garantizando token válido
  const handleInitiateUpload = async () => {
    soundFX.playClick();
    let token = driveAccessToken;
    if (!token) {
      token = await requestDriveAuthorization();
      if (!token) return;
      await checkDriveBackup(token);
    }
    setShowUploadConfirm(true);
  };

  // Ejecuta la subida efectiva del estado de la aplicación
  const executeUpload = async () => {
    let token = driveAccessToken;
    if (!token) {
      token = await requestDriveAuthorization();
      if (!token) return;
    }

    try {
      setIsLoading(true);
      setSyncOperation('upload');
      setSyncProgress(0.25);
      setStatusMessage(null);
      soundFX.playClick();

      const currentState = gatherCurrentAppState();
      setSyncProgress(0.65);
      const updatedFile = await uploadBackupToDrive(token, currentState, driveFile?.id);

      setSyncProgress(1);
      setDriveFile(updatedFile);
      setShowUploadConfirm(false);
      soundFX.playLevelUp();
      setStatusMessage({
        type: 'success',
        text: `¡Copia guardada con éxito en Google Drive! (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      });
    } catch (err: any) {
      console.error('Drive upload failed:', err);
      soundFX.playGlitch();
      if (err?.message?.includes('401')) {
        setDriveAccessToken(null);
      }
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al guardar en Google Drive.',
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setSyncOperation(null);
        setSyncProgress(0);
      }, 700);
    }
  };

  // Manejador para preparar la descarga garantizando token de Drive
  const handlePrepareDownload = async () => {
    soundFX.playClick();
    let token = driveAccessToken;
    if (!token) {
      token = await requestDriveAuthorization();
      if (!token) return;
    }

    try {
      setIsLoading(true);
      setSyncOperation('download');
      setSyncProgress(0.2);
      setStatusMessage(null);

      let targetFileId = driveFile?.id;
      if (!targetFileId) {
        const file = await findDriveBackupFile(token);
        if (!file) {
          setStatusMessage({
            type: 'info',
            text: 'Aún no existe una copia de seguridad en tu Google Drive. Guarda una primero para respaldar tus datos.',
          });
          setIsLoading(false);
          setSyncOperation(null);
          return;
        }
        targetFileId = file.id;
        setDriveFile(file);
      }

      setSyncProgress(0.6);
      const backupData = await downloadBackupFromDrive(token, targetFileId);
      setSyncProgress(1);
      setPendingDownloadData(backupData);
      setShowDownloadConfirm(true);
    } catch (err: any) {
      console.error('Drive download failed:', err);
      soundFX.playGlitch();
      if (err?.message?.includes('401')) {
        setDriveAccessToken(null);
      }
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al descargar la copia desde Google Drive.',
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setSyncOperation(null);
        setSyncProgress(0);
      }, 700);
    }
  };

  // Confirma y aplica la restauración de estado
  const executeDownload = () => {
    if (!pendingDownloadData) return;

    try {
      soundFX.playClick();
      restoreAppState(pendingDownloadData);
      setShowDownloadConfirm(false);
      setPendingDownloadData(null);
      soundFX.playLevelUp();
      setStatusMessage({
        type: 'success',
        text: '¡Partida y datos restaurados exitosamente desde tu Google Drive!',
      });
    } catch (err: any) {
      soundFX.playGlitch();
      setStatusMessage({
        type: 'error',
        text: 'Ocurrió un problema al aplicar los datos recuperados.',
      });
    }
  };

  return (
    <div className="relative isolate bg-[#040a1a]/[0.94] p-5 sm:p-6 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden">
      <span className="vi-grano opacity-5" aria-hidden="true" />
      <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl aura-bg-soft border aura-border-subtle aura-text-primary shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-anton uppercase tracking-wider text-white flex items-center gap-2">
                Nube de Google / Gmail (Google Drive)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Respaldo voluntario y seguro en el almacenamiento de tu cuenta personal de Google.
              </p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full aura-bg-soft aura-text-soft border aura-border-subtle flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full aura-bg-primary animate-pulse" />
                {driveAccessToken ? 'Drive Vinculado' : 'Google Auth OK'}
              </span>
            </div>
          )}
        </div>

        {/* Account status info */}
        {!user ? (
          <div className="bg-[#040814]/80 p-5 rounded-xl border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-anton uppercase tracking-wider text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-amber-400" /> Conecta tu cuenta de Gmail / Google
                </p>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  Sin tarjeta de crédito ni permisos invasivos: autentícate gratis para respaldar tu avance cuando lo necesites.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  soundFX.playClick();
                  await signInWithGoogle();
                }}
                className="chicle-btn aura-btn-gradient optic-active-card flex items-center justify-center gap-2.5 px-5 py-2.5 text-xs font-anton uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Acceder con Google</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User & file status banner */}
            <div className="bg-[#040814]/80 p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full aura-bg-soft border aura-border-subtle flex items-center justify-center aura-text-primary font-bold shrink-0">
                  {user.email?.charAt(0).toUpperCase() || 'G'}
                </div>
                <div>
                  <p className="font-bold text-white">{user.displayName || 'Usuario de Google'}</p>
                  <p className="text-slate-400 font-mono text-[11px]">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {driveFile ? (
                  <div className="text-right sm:text-right">
                    <span className="text-emerald-400 font-bold text-[11px] flex items-center sm:justify-end gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Respaldo en la nube activo
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono tabular-nums block">
                      Modificado: {new Date(driveFile.modifiedTime).toLocaleDateString()} {new Date(driveFile.modifiedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ) : hasChecked ? (
                  <span className="text-slate-400 text-[11px] italic">
                    Sin copia creada aún en Drive
                  </span>
                ) : !driveAccessToken ? (
                  <button
                    type="button"
                    onClick={requestDriveAuthorization}
                    disabled={isLoading}
                    className="chicle-btn px-3 py-1.5 text-[11px] font-bold rounded-xl aura-bg-soft hover:brightness-110 aura-text-soft border aura-border-subtle flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 aura-text-primary" />
                    Autorizar Drive
                  </button>
                ) : null}

                {driveAccessToken && (
                  <button
                    type="button"
                    onClick={() => checkDriveBackup()}
                    disabled={isLoading}
                    title="Comprobar archivo en Drive"
                    className="chicle-btn p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] aura-text-soft border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleInitiateUpload}
                disabled={isLoading}
                className="chicle-btn min-h-[46px] px-4 py-3 aura-bg-soft hover:brightness-110 aura-text-soft hover:text-white font-anton text-xs uppercase tracking-wider rounded-xl border aura-border-subtle flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Upload className="w-4 h-4 aura-text-primary" />
                <span>Guardar en Google Drive</span>
              </button>

              <button
                type="button"
                onClick={handlePrepareDownload}
                disabled={isLoading}
                className="chicle-btn min-h-[46px] px-4 py-3 bg-white/[0.04] hover:bg-white/[0.1] text-slate-200 hover:text-white font-anton text-xs uppercase tracking-wider rounded-xl border border-white/15 hover:aura-border-subtle flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4 aura-text-primary" />
                <span>Cargar desde Google Drive</span>
              </button>
            </div>

            {/* Active Cloud Sync Progress with Moxen Rayas */}
            {isLoading && (
              <div className="p-4 rounded-xl bg-[#030712]/90 border aura-border-subtle aura-glow-subtle animate-fade-in space-y-2 mt-3">
                <MoxenRayas
                  progress={syncProgress}
                  variant="hero"
                  theme="cyan"
                  mode="active"
                  title={syncOperation === 'upload' ? 'Sincronizando Respaldo con Google Drive' : 'Descargando Copia de Seguridad'}
                  subtitle="Cifrado cuántico y empaquetado de estado PWA"
                  totalUnits={driveFile?.size ? Number((Number(driveFile.size) / (1024 * 1024)).toFixed(1)) : 1.8}
                  unitLabel="MB"
                  showOdometer={true}
                  showTimeRemaining={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Feedback status message */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/75 border border-emerald-500/60 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/75 border border-rose-500/60 text-rose-300'
                : 'aura-bg-soft border aura-border-subtle aura-text-soft'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 aura-text-primary shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Security Reassurance Footer */}
        <div className="pt-2 border-t border-white/10 text-[10.5px] font-mono text-emerald-300/90 text-center sm:text-left leading-snug">
          {AUTH_SECURITY_MICROCOPY}
        </div>
      </div>

      {/* PORTAL CONFIRMATION DIALOG: UPLOAD TO DRIVE */}
      {showUploadConfirm && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[185] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setShowUploadConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="drive-upload-confirm-title"
            onClick={(e) => e.stopPropagation()}
            className="relative isolate bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl max-w-md w-full shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden"
          >
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            {/* Modal Header */}
            <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 bg-[#040814]/[0.96] border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl aura-bg-soft border aura-border-subtle aura-text-primary shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 id="drive-upload-confirm-title" className="text-base font-anton uppercase tracking-wider text-white truncate">
                  ¿Guardar copia en Google Drive?
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadConfirm(false)}
                aria-label="Cerrar"
                className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="relative z-10 p-5 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Se creará o actualizará el archivo de respaldo seguro en tu Google Drive personal con tu progreso, misiones y hábitos.
                {driveFile && (
                  <span className="block mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-[11px] font-mono tabular-nums">
                    ⚠️ Sobrescribirá la copia del {new Date(driveFile.modifiedTime).toLocaleDateString()}.
                  </span>
                )}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="relative z-10 flex items-center justify-end gap-2.5 px-5 py-4 bg-[#040814]/[0.96] border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowUploadConfirm(false)}
                className="chicle-btn px-4 py-2 bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeUpload}
                disabled={isLoading}
                className="chicle-btn aura-btn-gradient optic-active-card px-5 py-2 text-xs font-anton uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar y Guardar</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PORTAL CONFIRMATION DIALOG: DOWNLOAD/RESTORE FROM DRIVE */}
      {showDownloadConfirm && pendingDownloadData && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[185] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => {
            setShowDownloadConfirm(false);
            setPendingDownloadData(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="drive-download-confirm-title"
            onClick={(e) => e.stopPropagation()}
            className="relative isolate bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl max-w-md w-full shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden"
          >
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            {/* Modal Header */}
            <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 bg-[#040814]/[0.96] border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <h4 id="drive-download-confirm-title" className="text-base font-anton uppercase tracking-wider text-white truncate">
                  ¿Cargar partida desde Drive?
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDownloadConfirm(false);
                  setPendingDownloadData(null);
                }}
                aria-label="Cerrar"
                className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="relative z-10 p-5 text-xs text-slate-300 space-y-3">
              <p>
                Se aplicarán los datos guardados en la nube de tu Google Drive. Esto sincronizará:
              </p>
              <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1.5 font-mono tabular-nums bg-[#040814]/80 border border-white/10 rounded-xl p-3">
                <li>Nivel {pendingDownloadData.stats?.level || 1} • {pendingDownloadData.stats?.rankTitle || 'Aventurero'}</li>
                <li>Monedas: {pendingDownloadData.stats?.coins || 0} • XP: {pendingDownloadData.stats?.xp || 0}</li>
                <li>Hábitos: {pendingDownloadData.customHabits?.length || 0} registrados</li>
                <li>Fecha del respaldo: {pendingDownloadData.exportedAt ? new Date(pendingDownloadData.exportedAt).toLocaleString() : 'N/A'}</li>
              </ul>
              <p className="text-amber-300 font-semibold">
                ¿Deseas reemplazar el estado actual por los datos descargados de tu nube?
              </p>
            </div>

            {/* Modal Footer */}
            <div className="relative z-10 flex items-center justify-end gap-2.5 px-5 py-4 bg-[#040814]/[0.96] border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowDownloadConfirm(false);
                  setPendingDownloadData(null);
                }}
                className="chicle-btn px-4 py-2 bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDownload}
                className="chicle-btn optic-active-card px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-anton uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Sí, Cargar Datos
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
