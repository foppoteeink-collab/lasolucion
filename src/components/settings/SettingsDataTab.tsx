import React, { useState } from 'react';
import { 
  Cloud, 
  CloudOff, 
  Upload, 
  Download, 
  User, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  HardDrive, 
  FileSpreadsheet, 
  Smartphone, 
  CheckCircle2, 
  Share, 
  PlusSquare, 
  RefreshCw, 
  Key, 
  ShieldAlert, 
  Check 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTaskStore } from '../../store/useTaskStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { CloudSyncResult } from '../../hooks/useCloudSync';
import { GoogleDriveSyncCard } from '../GoogleDriveSyncCard';
import { soundFX } from '../../utils/audio';
import { exportUserData, exportJournalToCSV, exportScheduleToCSV, parseScheduleCSV } from '../../utils/exportData';
import { safeSetItem } from '../../utils/storage';
import { restoreAppState } from '../../services/googleDriveService';
import { AUTH_SECURITY_MICROCOPY } from '../../data/narrativeCopy';
import { GameSettings } from '../../types';

interface SettingsDataTabProps {
  settings: GameSettings;
  cloudSync?: CloudSyncResult;
  onResetAccount?: () => void;
  pwaBuildInfo: {
    localRev: string;
    serverRev: string | null;
    checking: boolean;
  };
}

export const SettingsDataTab: React.FC<SettingsDataTabProps> = ({
  settings,
  cloudSync,
  onResetAccount,
  pwaBuildInfo,
}) => {
  const { user, signInWithGoogle, signOut } = useAuth();
  const pwa = usePWAInstall();

  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [isForceSyncing, setIsForceSyncing] = useState(false);
  const [isPullingCloud, setIsPullingCloud] = useState(false);
  const [cloudActionToast, setCloudActionToast] = useState<string | null>(null);

  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('lasolucion_gemini_api_key')) || '';
  });
  const [apiKeyToast, setApiKeyToast] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSaveApiKey = () => {
    soundFX.playClick();
    if (geminiApiKey.trim()) {
      localStorage.setItem('lasolucion_gemini_api_key', geminiApiKey.trim());
      setApiKeyToast('Clave de Gemini guardada de forma segura en este navegador.');
    } else {
      localStorage.removeItem('lasolucion_gemini_api_key');
      setApiKeyToast('Clave eliminada. El sistema utilizará Firebase AI / heurísticas locales.');
    }
    setTimeout(() => setApiKeyToast(null), 3500);
  };

  const handleForceSync = async () => {
    if (!cloudSync?.forceSyncNow) return;
    setIsForceSyncing(true);
    soundFX.playClick();
    try {
      const ok = await cloudSync.forceSyncNow();
      if (ok) {
        const st = useTaskStore.getState();
        const activeList = st.tasksByDate?.[st.currentViewDate] || [];
        const habitsCount = (st.customHabits || []).length;
        const todayCount = activeList.length;
        const completedCount = activeList.filter((t) => t.completed).length;
        const taskWord = todayCount === 1 ? 'tarea' : 'tareas';
        const doneWord = completedCount === 1 ? 'completada' : 'completadas';
        const habitWord = habitsCount === 1 ? 'hábito listo' : 'hábitos listos';
        soundFX.playSuccess();
        setCloudActionToast(
          `✓ Subido a la nube con éxito (${todayCount} ${taskWord}, ${completedCount} ${doneWord}, ${habitsCount} ${habitWord} para tu otro equipo).`
        );
        setTimeout(() => setCloudActionToast(null), 6000);
      } else {
        setCloudActionToast('⚠️ No se pudo conectar con la nube. Verifica tu conexión a internet.');
        setTimeout(() => setCloudActionToast(null), 5000);
      }
    } finally {
      setTimeout(() => setIsForceSyncing(false), 600);
    }
  };

  const handlePullFromCloud = async () => {
    if (!cloudSync?.pullFromCloudNow) return;
    setIsPullingCloud(true);
    soundFX.playClick();
    try {
      const ok = await cloudSync.pullFromCloudNow();
      if (ok) {
        const st = useTaskStore.getState();
        const activeList = st.tasksByDate?.[st.currentViewDate] || [];
        const habitsCount = (st.customHabits || []).length;
        const todayCount = activeList.length;
        const completedCount = activeList.filter((t) => t.completed).length;
        const taskWord = todayCount === 1 ? 'tarea' : 'tareas';
        const doneWord = completedCount === 1 ? 'ya realizada' : 'ya realizadas';
        const habitWord = habitsCount === 1 ? 'hábito' : 'hábitos';
        soundFX.playLevelUp();
        setCloudActionToast(
          `✓ ¡Sincronización completada! Se cargaron ${todayCount} ${taskWord} (${completedCount} ${doneWord}) y ${habitsCount} ${habitWord} en tu agenda.`
        );
        setTimeout(() => setCloudActionToast(null), 6000);
      } else {
        setCloudActionToast('⚠️ No se encontraron datos en la nube o falló la conexión.');
        setTimeout(() => setCloudActionToast(null), 5000);
      }
    } finally {
      setTimeout(() => setIsPullingCloud(false), 600);
    }
  };

  const handleExportBackup = () => {
    try {
      soundFX.playClick();
      const exportPayload = exportUserData({
        stats: usePlayerStore.getState().stats,
        tasks: [],
        allTasksByDate: useTaskStore.getState().tasksByDate,
        reflections: {},
        habitMastery: {},
        customHabits: useTaskStore.getState().customHabits,
        settings,
      });

      soundFX.playSuccess();
      const totalTaskCount = exportPayload.allTasksByDate
        ? Object.values(exportPayload.allTasksByDate).reduce((acc, list) => acc + (list?.length || 0), 0)
        : exportPayload.tasks.length;
      setExportFeedback(`✓ Copia de seguridad generada con éxito (${totalTaskCount} tareas totales)`);
      setTimeout(() => setExportFeedback(null), 4500);
    } catch (err) {
      console.error('Error al exportar:', err);
      setExportFeedback('⚠️ Error al generar la copia de seguridad.');
      setTimeout(() => setExportFeedback(null), 4500);
    }
  };

  const handleExportCSV = () => {
    try {
      soundFX.playClick();
      exportJournalToCSV([], {});
      soundFX.playSuccess();
      setExportFeedback(`✓ Bitácora exportada a formato CSV`);
      setTimeout(() => setExportFeedback(null), 4500);
    } catch (err) {
      console.error('Error al exportar CSV:', err);
      setExportFeedback('⚠️ Error al exportar la bitácora.');
      setTimeout(() => setExportFeedback(null), 4500);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Archivo inválido');
        }

        let importedKeys = 0;

        if (parsed.rawLocalStorage && typeof parsed.rawLocalStorage === 'object') {
          Object.entries(parsed.rawLocalStorage).forEach(([key, val]) => {
            if (val !== undefined && val !== null) {
              safeSetItem(key, typeof val === 'string' ? val : JSON.stringify(val));
              importedKeys++;
            }
          });
        }

        Object.entries(parsed).forEach(([key, val]) => {
          if (key !== 'rawLocalStorage' && val !== undefined && val !== null) {
            safeSetItem(key, typeof val === 'string' ? val : JSON.stringify(val));
            importedKeys++;
          }
        });

        restoreAppState(parsed);

        soundFX.playLevelUp();
        setImportStatus(`¡Copia restaurada con éxito! (${importedKeys} registros)`);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        console.error('Error al importar:', err);
        setImportStatus('⚠️ Formato de copia de seguridad inválido.');
        setTimeout(() => setImportStatus(null), 4500);
      }
    };
    reader.readAsText(file);
  };

  const handleExportSchedule = () => {
    try {
      soundFX.playClick();
      exportScheduleToCSV(useTaskStore.getState().customHabits || []);
      soundFX.playSuccess();
      setExportFeedback(`✓ Horarios y Rutinas exportados a formato CSV`);
      setTimeout(() => setExportFeedback(null), 4500);
    } catch (err) {
      console.error('Error al exportar horario:', err);
      setExportFeedback('⚠️ Error al exportar el horario.');
      setTimeout(() => setExportFeedback(null), 4500);
    }
  };

  const handleImportSchedule = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        let parsed;

        if (file.name.endsWith('.json')) {
          parsed = JSON.parse(content);
          if (!Array.isArray(parsed)) {
            throw new Error('El archivo debe ser un arreglo JSON de rutinas.');
          }
          const isValid = parsed.every((h) => h.id && h.title && h.category && h.frequencyType);
          if (!isValid) {
            throw new Error('Faltan campos requeridos en el JSON.');
          }
        } else if (file.name.endsWith('.csv')) {
          parsed = parseScheduleCSV(content);
        } else {
          throw new Error('Formato de archivo no soportado. Debe ser .csv o .json');
        }

        if (parsed.length > 0) {
          useTaskStore.getState().setCustomHabits(parsed);
          soundFX.playLevelUp();
          setImportStatus(`¡Horario modificado con éxito! (${parsed.length} rutinas)`);
        } else {
          throw new Error('No se encontraron rutinas válidas en el archivo.');
        }
      } catch (err: any) {
        setImportStatus(`⚠️ Error al importar horario: ${err.message || 'Formato inválido.'}`);
        setTimeout(() => setImportStatus(null), 4500);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {exportFeedback && (
        <div className="p-3.5 aura-bg-soft border aura-border-primary rounded-xl text-xs font-black flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 aura-text-primary shrink-0" />
          <span>{exportFeedback}</span>
        </div>
      )}

      {importStatus && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/60 text-emerald-300 rounded-xl text-xs font-black flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* 1. PUENTE DIRECTO TABLET ↔ TELÉFONO */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 relative z-10">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 aura-text-primary shrink-0" />
            <h3 className="text-xs font-anton text-white uppercase tracking-wider">
              Puente Directo Tablet ↔ Teléfono
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold aura-bg-soft px-2.5 py-0.5 rounded-full border aura-border-subtle">
            SINCRONIZACIÓN RÁPIDA
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed relative z-10">
          Sube tus datos desde un dispositivo y descárgalos en el otro para sincronizar tu progreso al instante.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 relative z-10">
          <button
            type="button"
            onClick={handleForceSync}
            disabled={isForceSyncing || isPullingCloud}
            className="chicle-btn min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 aura-bg-soft hover:brightness-110 border aura-border-subtle rounded-xl text-xs font-anton uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload className={`w-4 h-4 ${isForceSyncing ? 'animate-bounce' : ''}`} />
            <span>{isForceSyncing ? 'Subiendo datos...' : 'Subir datos a la nube'}</span>
          </button>
          <button
            type="button"
            onClick={handlePullFromCloud}
            disabled={isPullingCloud || isForceSyncing}
            className="chicle-btn min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/60 text-emerald-200 rounded-xl text-xs font-anton uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isPullingCloud ? 'animate-bounce' : ''}`} />
            <span>{isPullingCloud ? 'Cargando datos...' : 'Traer datos a este equipo'}</span>
          </button>
        </div>

        {cloudActionToast && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in relative z-10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cloudActionToast}</span>
          </div>
        )}
      </div>

      {/* 2. ESTADO DE FIRESTORE & USUARIO */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-5">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <h3 className="text-sm font-anton text-white uppercase tracking-wider flex items-center gap-2">
            <Cloud className="w-4 h-4 aura-text-primary" /> Sincronización en la Nube
          </h3>
          {user && (
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${
                cloudSync?.syncStatus === 'synced'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                  : cloudSync?.syncStatus === 'saving'
                  ? 'aura-bg-soft aura-border-subtle'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  cloudSync?.syncStatus === 'synced'
                    ? 'bg-emerald-400 animate-pulse'
                    : cloudSync?.syncStatus === 'saving'
                    ? 'aura-bg-primary animate-ping'
                    : 'bg-amber-400'
                }`}
              />
              {cloudSync?.syncStatus === 'synced'
                ? 'En Línea & Sincronizado'
                : cloudSync?.syncStatus === 'saving'
                ? 'Guardando en la Nube...'
                : 'Guardado Local'}
            </span>
          )}
        </div>

        {/* INFO DE USUARIO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#040814]/80 p-4 rounded-2xl border border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/15 flex items-center justify-center shrink-0">
              {user ? (
                user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-2xl object-cover" />
                ) : (
                  <User className="w-6 h-6 aura-text-primary" />
                )
              ) : (
                <CloudOff className="w-6 h-6 text-amber-400" />
              )}
            </div>
            <div>
              <p className="text-base font-anton uppercase tracking-wider text-white">
                {user ? user.displayName || user.email : 'Modo Local (Sin autenticar)'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {user
                  ? `Conectado a la nube: ${user.email}`
                  : '100% gratis · Sin tarjeta de crédito. Tu información se guarda localmente en tu dispositivo.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="chicle-btn flex items-center justify-center gap-1.5 px-4 py-2 bg-white/[0.05] hover:bg-white/10 text-slate-200 rounded-xl text-xs font-anton uppercase tracking-wider border border-white/15 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="chicle-btn aura-btn-gradient optic-active-card flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-anton uppercase tracking-wider transition-all cursor-pointer font-bold"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Conectar Google</span>
              </button>
            )}
          </div>
        </div>

        {/* RESUMEN DE PROTECCIÓN */}
        <div className="p-3.5 rounded-2xl bg-[#040814]/80 border border-white/10 text-xs text-slate-300 space-y-2 relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Protección en tiempo real: Nivel, XP, Tareas, Hábitos, Bitácora y Finanzas.</span>
            </div>
            {user && cloudSync?.lastSyncTime && (
              <span className="text-[11px] font-mono tabular-nums text-slate-400 whitespace-nowrap">
                Última sinc: {cloudSync.lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <p className="text-[10.5px] font-mono text-emerald-300/90 border-t border-white/10 pt-2 leading-snug">
            {AUTH_SECURITY_MICROCOPY}
          </p>
        </div>
      </div>

      {/* 3. RESPALDO LOCAL JSON & CSV */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
        <div className="flex items-start gap-3 relative z-10">
          <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/15 aura-text-primary shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-anton uppercase tracking-wider text-white">Copia de Seguridad de Partida</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Exporta tus estadísticas, tareas y bitácora en archivo seguro para resguardar tu información fuera de la aplicación.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 relative z-10">
          <button
            type="button"
            onClick={handleExportBackup}
            className="chicle-btn min-h-[44px] px-4 py-2.5 bg-white/[0.04] hover:bg-white/10 aura-text-soft hover:text-white font-anton text-xs uppercase tracking-wider rounded-xl border border-white/15 hover:aura-border-primary flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 aura-text-primary" />
            <span>Descargar Copia</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="chicle-btn min-h-[44px] px-4 py-2.5 bg-white/[0.04] hover:bg-white/10 text-blue-300 hover:text-white font-anton text-xs uppercase tracking-wider rounded-xl border border-white/15 hover:border-blue-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            <span>Exportar Bitácora</span>
          </button>

          <label className="chicle-btn min-h-[44px] px-4 py-2.5 bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white font-anton text-xs uppercase tracking-wider rounded-xl border border-white/15 hover:border-white/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-center">
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Restaurar Copia</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      {/* 4. PLANTILLAS DE HORARIOS */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
        <div className="flex items-start gap-3 relative z-10">
          <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-anton uppercase tracking-wider text-white">Plantillas de Horarios y Hábitos (Excel / CSV)</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Descarga tu plantilla, edita en Excel marcando 'X' en los días correspondientes y vuelve a subirla.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 relative z-10">
          <button
            type="button"
            onClick={handleExportSchedule}
            className="chicle-btn min-h-[44px] px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-white font-anton text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Bajar Horarios (CSV)</span>
          </button>

          <label className="chicle-btn min-h-[44px] px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 hover:text-white font-anton text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-center">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Subir Horarios (CSV)</span>
            <input type="file" accept=".csv,.json" onChange={handleImportSchedule} className="hidden" />
          </label>
        </div>
      </div>

      {/* 5. GOOGLE DRIVE SYNC CARD */}
      <GoogleDriveSyncCard />

      {/* 6. APLICACIÓN INSTALABLE PWA */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 aura-text-primary" />
            <h4 className="text-xs font-anton text-white uppercase tracking-wider">
              Aplicación Instalable PWA (Offline Ready)
            </h4>
          </div>
          {pwa.isInstalled ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              App Instalada
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full aura-bg-soft border aura-border-subtle">
              Instalable en Móvil
            </span>
          )}
        </div>

        <div className="bg-[#040814]/80 border border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-100">
              Instala La Solución en tu teléfono, tablet o escritorio
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Carga instantánea, funcionamiento sin conexión a internet y acceso directo desde tu pantalla de inicio.
            </p>
          </div>

          {pwa.isInstalled ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ejecutando como App Nativa</span>
            </div>
          ) : pwa.isInstallable ? (
            <button
              type="button"
              onClick={async () => {
                soundFX.playClick();
                const ok = await pwa.install();
                if (ok) soundFX.playLevelUp();
              }}
              className="chicle-btn aura-btn-gradient optic-active-card flex items-center justify-center gap-2 px-4 py-2 font-anton text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              Instalar Ahora
            </button>
          ) : pwa.isIOS ? (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setShowIOSInstructions(!showIOSInstructions);
              }}
              className="chicle-btn flex items-center justify-center gap-2 px-4 py-2 aura-bg-soft hover:brightness-110 border aura-border-subtle text-xs font-anton uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0"
            >
              <Share className="w-3.5 h-3.5" />
              Instrucciones iOS
            </button>
          ) : (
            <div className="text-[11px] font-mono text-slate-400 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
              Usa el menú del navegador → "Agregar a pantalla de inicio"
            </div>
          )}
        </div>

        {showIOSInstructions && (
          <div className="p-4 rounded-2xl bg-[#040814]/80 border aura-border-subtle text-xs text-slate-300 space-y-2.5 animate-in fade-in relative z-10">
            <p className="font-bold aura-text-soft flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> Pasos para instalar en Safari iOS:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
              <li>Toca el botón <strong className="text-white">Compartir</strong> <Share className="w-3.5 h-3.5 inline aura-text-primary" /> en la barra inferior de Safari.</li>
              <li>Desplázate hacia abajo y presiona <strong className="text-white">"Agregar a inicio"</strong> <PlusSquare className="w-3.5 h-3.5 inline aura-text-primary" />.</li>
              <li>Presiona <strong className="aura-text-soft">"Agregar"</strong> en la esquina superior derecha.</li>
            </ol>
          </div>
        )}

        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-anton uppercase tracking-wider text-slate-300">Caché & Actualizaciones en Vivo</p>
              {pwaBuildInfo.checking ? (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 border border-white/10">
                  Verificando versión...
                </span>
              ) : !pwaBuildInfo.serverRev || pwaBuildInfo.serverRev === pwaBuildInfo.localRev ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  Última actualización activa
                </span>
              ) : (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40">
                  Nueva versión disponible
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Build activo: <span className="aura-text-soft">{pwaBuildInfo.localRev}</span>
            </p>
            <p className="text-[10px] text-slate-500">Si no ves los cambios más recientes o la app muestra una versión vieja en tu equipo.</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              soundFX.playClick();
              if ((window as any).purgeAppCacheAndReload) {
                await (window as any).purgeAppCacheAndReload();
              } else {
                window.location.reload();
              }
            }}
            className="chicle-btn flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/15 hover:aura-border-primary text-[11px] font-anton uppercase tracking-wider aura-text-soft transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Vaciar Caché y Actualizar
          </button>
        </div>
      </div>

      {/* 7. CREDENCIALES DE IA (GEMINI) */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
        <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 aura-text-primary" />
            <h3 className="text-xs font-anton text-white uppercase tracking-wider">
              Clave de Inteligencia Artificial (Gemini API)
            </h3>
          </div>
          <span className="text-[10px] font-mono aura-bg-soft px-2 py-0.5 rounded-full border aura-border-subtle font-bold">
            LOCAL & PRIVADA
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed relative z-10">
          Si deseas usar tu propia cuota directa de Google Gemini en el Oráculo y Diagnóstico Neural, ingresa tu clave API. Esta clave permanece <strong>exclusivamente en tu navegador</strong> y nunca se expone en bundles públicos.
        </p>

        <div className="space-y-3 pt-1 relative z-10">
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="AIzaSy... (Opcional)"
              className="w-full bg-[#040814]/80 border border-white/15 focus:border-[var(--aura-color-1,#00f0ff)] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none font-mono transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono aura-text-primary hover:text-white cursor-pointer"
            >
              {showApiKey ? 'Ocultar' : 'Ver'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-slate-400 font-mono">
              {geminiApiKey ? '● Clave personalizada activa' : '○ Usando Firebase AI Logic / Modo Offline Inteligente'}
            </span>
            <div className="flex gap-2">
              {geminiApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setGeminiApiKey('');
                    localStorage.removeItem('lasolucion_gemini_api_key');
                    setApiKeyToast('Clave eliminada con éxito.');
                    setTimeout(() => setApiKeyToast(null), 3000);
                  }}
                  className="chicle-btn px-3 py-1.5 rounded-xl text-xs font-anton uppercase text-slate-300 hover:text-rose-400 bg-white/[0.04] border border-white/10 cursor-pointer"
                >
                  Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="chicle-btn aura-btn-gradient optic-active-card px-4 py-1.5 rounded-xl text-xs font-anton uppercase tracking-wider transition-all cursor-pointer"
              >
                Guardar Clave
              </button>
            </div>
          </div>

          {apiKeyToast && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{apiKeyToast}</span>
            </div>
          )}
        </div>
      </div>

      {/* 8. ZONA CRÍTICA */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-6 border border-rose-500/35 shadow-[0_8px_30px_rgba(244,63,94,0.12)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-500/55 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="flex items-start gap-3 relative z-10">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-anton text-rose-400 uppercase tracking-wider">
              Reinicio Total de Partida
            </h4>
            <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
              Restablece tu progreso local y en la nube al Nivel 1 inicial. Acción irreversible.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <p className="text-[11px] text-rose-300/70 font-mono">
            Confirmación de seguridad activa (Protección de doble clic).
          </p>

          <button
            type="button"
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                setTimeout(() => setConfirmReset(false), 5000);
              } else if (onResetAccount) {
                onResetAccount();
              }
            }}
            className={`chicle-btn px-5 py-2.5 rounded-xl text-xs font-anton uppercase tracking-wider transition-all border cursor-pointer ${
              confirmReset
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)] optic-active-card'
                : 'bg-rose-500/15 text-rose-300 hover:text-white hover:bg-rose-600 border-rose-500/50'
            }`}
          >
            {confirmReset ? '¿ESTÁS SEGURO? CLIC DE NUEVO' : 'Reiniciar Cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
};
