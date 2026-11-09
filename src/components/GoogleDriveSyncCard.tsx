import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, HardDrive, CheckCircle2, RefreshCw, AlertTriangle, 
  Download, Upload, Check, AlertCircle, Sparkles, LogIn, KeyRound
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
    <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-blue-900/60 space-y-5 shadow-lg relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-blue-950/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#002244] border border-blue-600/40 text-cyan-300">
            <HardDrive className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              Nube de Google / Gmail (Google Drive)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Respaldo voluntario y seguro en el almacenamiento de tu cuenta personal de Google.
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              {driveAccessToken ? 'Drive Vinculado' : 'Google Auth OK'}
            </span>
          </div>
        )}
      </div>

      {/* Account status info */}
      {!user ? (
        <div className="bg-[#001c38]/60 p-5 rounded-xl border border-blue-950 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-white flex items-center gap-2">
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
              className="chicle-btn flex items-center justify-center gap-2.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all cursor-pointer shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>Acceder con Google</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* User & file status banner */}
          <div className="bg-[#001c38]/70 p-4 rounded-xl border border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold shrink-0">
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
                  <span className="text-[10px] text-slate-400 font-mono block">
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
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-900/50 hover:bg-blue-800 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <KeyRound className="w-3 h-3 text-cyan-400" />
                  Autorizar Drive
                </button>
              ) : null}

              {driveAccessToken && (
                <button
                  type="button"
                  onClick={() => checkDriveBackup()}
                  disabled={isLoading}
                  title="Comprobar archivo en Drive"
                  className="chicle-btn p-2 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-cyan-300 border border-blue-800 transition-colors cursor-pointer disabled:opacity-50"
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
              className="chicle-btn min-h-[46px] px-4 py-3 bg-[#002850] hover:bg-[#003870] text-cyan-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl border border-cyan-600/50 hover:border-cyan-400 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Guardar en Google Drive</span>
            </button>

            <button
              type="button"
              onClick={handlePrepareDownload}
              disabled={isLoading}
              className="chicle-btn min-h-[46px] px-4 py-3 bg-[#002244] hover:bg-[#003060] text-blue-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl border border-blue-600/50 hover:border-blue-400 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Cargar desde Google Drive</span>
            </button>
          </div>

          {/* Active Cloud Sync Progress with Moxen Rayas */}
          {isLoading && (
            <div className="p-4 rounded-xl bg-black/80 border border-cyan-500/50 shadow-[0_0_20px_rgba(0,240,255,0.15)] animate-fade-in space-y-2 mt-3">
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
              ? 'bg-emerald-950/90 border border-emerald-500/80 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/90 border border-rose-500/80 text-rose-300'
              : 'bg-blue-950/90 border border-blue-500/80 text-cyan-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* CONFIRMATION DIALOG: UPLOAD TO DRIVE */}
      {showUploadConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#001830] border border-cyan-500/60 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                <Upload className="w-5 h-5 text-cyan-400" />
              </div>
              <h4 className="text-base font-black text-white">¿Guardar copia en Google Drive?</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Se creará o actualizará el archivo de respaldo seguro en tu Google Drive personal con tu progreso, misiones y hábitos.
              {driveFile && (
                <span className="block mt-1 text-amber-300 font-semibold text-[11px]">
                  ⚠️ Sobrescribirá la copia del {new Date(driveFile.modifiedTime).toLocaleDateString()}.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadConfirm(false)}
                className="chicle-btn px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeUpload}
                disabled={isLoading}
                className="chicle-btn px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
              >
                {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirmar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Reassurance Footer */}
      <div className="pt-2 border-t border-white/10 text-[10.5px] font-mono text-emerald-300/90 text-center sm:text-left leading-snug">
        {AUTH_SECURITY_MICROCOPY}
      </div>

      {/* CONFIRMATION DIALOG: DOWNLOAD/RESTORE FROM DRIVE */}
      {showDownloadConfirm && pendingDownloadData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#001830] border border-amber-500/60 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-500/50 text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="text-base font-black text-white">¿Cargar partida desde Google Drive?</h4>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Se aplicarán los datos guardados en la nube de tu Google Drive. Esto sincronizará:
              </p>
              <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 font-mono">
                <li>Nivel {pendingDownloadData.stats?.level || 1} • {pendingDownloadData.stats?.rankTitle || 'Aventurero'}</li>
                <li>Monedas: {pendingDownloadData.stats?.coins || 0} • XP: {pendingDownloadData.stats?.xp || 0}</li>
                <li>Hábitos: {pendingDownloadData.customHabits?.length || 0} registrados</li>
                <li>Fecha del respaldo: {pendingDownloadData.exportedAt ? new Date(pendingDownloadData.exportedAt).toLocaleString() : 'N/A'}</li>
              </ul>
              <p className="text-amber-300 font-semibold pt-1">
                ¿Deseas reemplazar el estado actual por los datos descargados de tu nube?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDownloadConfirm(false);
                  setPendingDownloadData(null);
                }}
                className="chicle-btn px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDownload}
                className="chicle-btn px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Sí, Cargar Datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
