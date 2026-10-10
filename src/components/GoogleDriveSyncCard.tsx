import React, { useState, useEffect } from 'react';
import { 
  Cloud, HardDrive, CheckCircle2, RefreshCw, AlertTriangle, 
  Download, Upload, ShieldCheck, Check, AlertCircle, Sparkles, LogIn
} from 'lucide-react';
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

export const GoogleDriveSyncCard: React.FC = () => {
  const { user, accessToken, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [driveFile, setDriveFile] = useState<DriveFileInfo | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Dialog confirmation states (mandatory per Workspace skill)
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [pendingDownloadData, setPendingDownloadData] = useState<any | null>(null);

  // Check if a backup file exists in Drive when user is authenticated with token
  const checkDriveBackup = async (token?: string) => {
    const activeToken = token || accessToken;
    if (!activeToken) return;

    try {
      setIsLoading(true);
      const file = await findDriveBackupFile(activeToken);
      setDriveFile(file);
      setHasChecked(true);
    } catch (err: any) {
      console.warn('Error checking Drive backup:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && accessToken && !hasChecked) {
      checkDriveBackup(accessToken);
    }
  }, [user, accessToken]);

  // Handler for uploading current app state to Google Drive
  const executeUpload = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Por favor, inicia sesión con Google para acceder a tu Drive.' });
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage(null);
      soundFX.playClick();

      const currentState = gatherCurrentAppState();
      const updatedFile = await uploadBackupToDrive(accessToken, currentState, driveFile?.id);

      setDriveFile(updatedFile);
      setShowUploadConfirm(false);
      soundFX.playLevelUp();
      setStatusMessage({
        type: 'success',
        text: `¡Copia guardada con éxito en tu Google Drive! (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      });
    } catch (err: any) {
      console.error('Drive upload failed:', err);
      soundFX.playGlitch();
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al guardar en Google Drive.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for preparing restore: downloads and checks data before user confirms
  const handlePrepareDownload = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Por favor, inicia sesión con Google para acceder a tu Drive.' });
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage(null);
      soundFX.playClick();

      let targetFileId = driveFile?.id;
      if (!targetFileId) {
        const file = await findDriveBackupFile(accessToken);
        if (!file) {
          setStatusMessage({
            type: 'info',
            text: 'Aún no existe una copia de seguridad en tu Google Drive. Guarda una primero para respaldar tus datos.',
          });
          setIsLoading(false);
          return;
        }
        targetFileId = file.id;
        setDriveFile(file);
      }

      const backupData = await downloadBackupFromDrive(accessToken, targetFileId);
      setPendingDownloadData(backupData);
      setShowDownloadConfirm(true);
    } catch (err: any) {
      console.error('Drive download failed:', err);
      soundFX.playGlitch();
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al descargar la copia desde Google Drive.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for confirming restoration of app state
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
              Respalda y carga tu partida, misiones, hábitos y balances en el almacenamiento de tu cuenta de Google.
            </p>
          </div>
        </div>

        {user && (
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Conectado a Gmail
          </span>
        )}
      </div>

      {/* Account status info */}
      {!user ? (
        <div className="bg-[#001c38]/60 p-5 rounded-xl border border-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-amber-400" /> Conecta tu cuenta de Gmail / Google
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Inicia sesión con tu cuenta de Google para habilitar el guardado y carga automática en tu Google Drive personal con tu permiso.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              soundFX.playClick();
              const res = await signInWithGoogle();
              if (res?.accessToken) {
                checkDriveBackup(res.accessToken);
              }
            }}
            className="flex items-center justify-center gap-2.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all cursor-pointer shrink-0"
          >
            <LogIn className="w-4 h-4" />
            <span>Acceder con Google</span>
          </button>
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
              ) : null}

              <button
                type="button"
                onClick={() => checkDriveBackup()}
                disabled={isLoading}
                title="Comprobar archivo en Drive"
                className="p-2 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-cyan-300 border border-blue-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowUploadConfirm(true)}
              disabled={isLoading}
              className="min-h-[46px] px-4 py-3 bg-[#002850] hover:bg-[#003870] text-cyan-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl border border-cyan-600/50 hover:border-cyan-400 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Guardar en Google Drive</span>
            </button>

            <button
              type="button"
              onClick={handlePrepareDownload}
              disabled={isLoading}
              className="min-h-[46px] px-4 py-3 bg-[#002244] hover:bg-[#003060] text-blue-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl border border-blue-600/50 hover:border-blue-400 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Cargar desde Google Drive</span>
            </button>
          </div>
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
              Esta acción guardará un archivo de respaldo (<code className="text-cyan-300 font-mono">la_solucion_cloud_backup.json</code>) en tu Google Drive personal con tu progreso actual, tareas, hábitos y balance.
              {driveFile && (
                <span className="block mt-2 text-amber-300 font-semibold">
                  ⚠️ Se actualizará la copia existente con fecha del {new Date(driveFile.modifiedTime).toLocaleDateString()}.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeUpload}
                disabled={isLoading}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
              >
                {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirmar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDownload}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
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
