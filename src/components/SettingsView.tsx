import React, { useState, useEffect } from 'react';
import { 
  Settings, Sparkles, Activity, ShieldAlert, ShieldCheck, Shield, LogOut, User, LogIn, 
  Cloud, CloudOff, Download, Upload, Database, Check, RefreshCw, 
  HardDrive, FileSpreadsheet, Cpu, CheckCircle2,
  Coins, Volume2, VolumeX, Target, Sun, Moon, Laptop, ArrowUpRight, CheckCheck,
  SlidersHorizontal, Smartphone, Share, PlusSquare, FlaskConical,
  Compass, Eye, Layout, Bell, BellOff, BellRing, Zap, Flame, Timer, Palette, ChevronLeft
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { GameSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import * as gameEngine from '../engine/gameEngine';
import { soundFX } from '../utils/audio';
import { exportUserData, exportJournalToCSV, exportScheduleToCSV, parseScheduleCSV } from '../utils/exportData';
import { safeSetItem } from '../utils/storage';
import { notificationService } from '../utils/notifications';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  scheduleAll,
  type NotificationSettings 
} from '../utils/notificationScheduler';
import { useTaskStore } from '../store/useTaskStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { getTodayDateString } from '../utils/date';
import { OracleModal } from './OracleModal';
import { ScenarioSimulatorPanel } from './ScenarioSimulatorPanel';
import { GoogleDriveSyncCard } from './GoogleDriveSyncCard';
import { restoreAppState } from '../services/googleDriveService';
import { KAI_OFFICIAL_SHAPES } from '../data/kaiShapes';
import { KaiVectorGraphics } from './KaiVectorGraphics';
import { 
  SUPPORTED_CURRENCIES, 
  getSavedCurrencySymbol, 
  setSavedCurrencySymbol, 
  getSavedSavingsTarget, 
  setSavedSavingsTarget 
} from '../utils/finance';
import { useUIStore } from '../store/useUIStore';
import { CloudSyncResult } from '../hooks/useCloudSync';
import { useMoxenChicle } from '../hooks/useMoxenChicle';
import { ChicleToggle } from './ChicleToggle';

interface SettingsViewProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onResetAccount?: () => void;
  cloudSync?: CloudSyncResult;
  onOpenKaiWorkshop?: () => void;
}

const EMPTY_TASK_LIST: any[] = [];

type SettingsSubTab = 'preferences' | 'gameplay' | 'finances' | 'data' | 'simulator';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAccount,
  cloudSync: propCloudSync,
  onOpenKaiWorkshop,
}) => {
  const chicleContainerRef = useMoxenChicle<HTMLDivElement>();
  const { user, signInWithGoogle, signOut } = useAuth();
  const pwa = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const game = gameEngine as any;
  const cloudSync = propCloudSync || game?.cloudSync;
  const { soundEnabled, toggleSound, themeMode, navigationMode, setNavigationMode, zenMode, toggleZenMode } = useUIStore();
  
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('preferences');
  const [currentCurrency, setCurrentCurrency] = useState<string>(getSavedCurrencySymbol);
  const [savingsTarget, setSavingsTarget] = useState<number>(getSavedSavingsTarget);
  const [audioTesting, setAudioTesting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(notificationService.getPermission());
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [notifTestFeedback, setNotifTestFeedback] = useState<string | null>(null);
  const [currencyChangedToast, setCurrencyChangedToast] = useState<string | null>(null);

  const todayTasks = useTaskStore(s => s.tasksByDate[getTodayDateString()] ?? EMPTY_TASK_LIST);
  const stats = usePlayerStore(s => s.stats);
  const streakDays = stats.streakDays;

  const [confirmReset, setConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [isForceSyncing, setIsForceSyncing] = useState(false);

  // Open simulator subtab event listener
  useEffect(() => {
    const handleOpenSim = () => setActiveSubTab('simulator');
    window.addEventListener('taskquest:open-simulator-tab', handleOpenSim);
    return () => window.removeEventListener('taskquest:open-simulator-tab', handleOpenSim);
  }, []);

  // Sync state with currency changes if changed elsewhere
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail) setCurrentCurrency(e.detail);
    };
    window.addEventListener('taskquest:currency-change', handler);
    return () => window.removeEventListener('taskquest:currency-change', handler);
  }, []);

  const handleSelectCurrency = (sym: string, name: string) => {
    soundFX.playClick();
    setCurrentCurrency(sym);
    setSavedCurrencySymbol(sym);
    setCurrencyChangedToast(`Divisa global configurada en ${sym} (${name})`);
    setTimeout(() => setCurrencyChangedToast(null), 3500);
  };

  const handleSelectSavingsTarget = (target: number) => {
    soundFX.playClick();
    setSavingsTarget(target);
    setSavedSavingsTarget(target);
  };

  const handleTestAudio = () => {
    setAudioTesting(true);
    soundFX.playLevelUp();
    setTimeout(() => setAudioTesting(false), 900);
  };

  const handleRequestNotifications = async () => {
    soundFX.playClick();
    const granted = await notificationService.requestPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      notificationService.triggerNotification('¡Notificaciones Activadas!', 'La Solución te recordará tus hábitos y misiones importantes.', '🔔');
      // Re-programar ahora que tenemos permisos
      scheduleAll({ tasks: todayTasks, streakDays });
    }
  };

  const handleToggleNotifSetting = (key: keyof NotificationSettings, value?: boolean | number) => {
    soundFX.playClick();
    const updated = {
      ...notifSettings,
      [key]: value !== undefined ? value : !notifSettings[key as keyof NotificationSettings],
    };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
    // Re-programar con la nueva configuración
    if (notificationPermission === 'granted') {
      scheduleAll({ tasks: todayTasks, streakDays });
    }
  };

  const handleTestNotification = async () => {
    soundFX.playClick();
    if (notificationPermission !== 'granted') {
      notificationService.sendTestNotification();
      setNotifTestFeedback('⚠️ Notificación en pantalla emitida. Para recibir notificaciones del sistema operativo, activa los permisos.');
      setTimeout(() => setNotifTestFeedback(null), 4000);
      return;
    }
    notificationService.sendTestNotification();
    setNotifTestFeedback('✓ Notificación de prueba enviada (Sistema Operativo y Alerta en Pantalla)');
    setTimeout(() => setNotifTestFeedback(null), 4000);
  };

  const handleSetTheme = (mode: 'auto' | 'dark' | 'light') => {
    soundFX.playClick();
    useUIStore.getState().setThemeMode(mode);
  };

  const [isPullingCloud, setIsPullingCloud] = useState(false);
  const [cloudActionToast, setCloudActionToast] = useState<string | null>(null);

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
        const completedCount = activeList.filter(t => t.completed).length;
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
        const completedCount = activeList.filter(t => t.completed).length;
        soundFX.playLevelUp();
        setCloudActionToast(
          `✓ ¡Sincronización completada! Se cargaron ${todayCount} tareas (${completedCount} ya realizadas) y ${habitsCount} rutinas en tu agenda.`
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

  const toggleSetting = (key: keyof GameSettings) => {
    soundFX.playClick();
    onUpdateSettings({
      ...settings,
      [key]: !settings[key]
    });
  };

  const handleExportBackup = () => {
    try {
      soundFX.playClick();
      const exportPayload = exportUserData({
        stats: game?.stats || usePlayerStore.getState().stats,
        tasks: game?.tasks,
        allTasksByDate: game?.tasksByDate || useTaskStore.getState().tasksByDate,
        reflections: game?.reflections,
        habitMastery: game?.habitMastery,
        customHabits: game?.customHabits,
        settings,
      });

      soundFX.playSuccess();
      const totalTaskCount = exportPayload.allTasksByDate
        ? Object.values(exportPayload.allTasksByDate).reduce((acc, list) => acc + (list?.length || 0), 0)
        : exportPayload.tasks.length;
      setExportFeedback(`✓ Respaldo JSON generado exitosamente (${totalTaskCount} misiones totales)`);
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
      exportJournalToCSV(game?.tasks || [], game?.reflections || {});
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

        // 1. If rawLocalStorage snapshot is present, restore raw keys first
        if (parsed.rawLocalStorage && typeof parsed.rawLocalStorage === 'object') {
          Object.entries(parsed.rawLocalStorage).forEach(([key, val]) => {
            if (val !== undefined && val !== null) {
              safeSetItem(key, typeof val === 'string' ? val : JSON.stringify(val));
              importedKeys++;
            }
          });
        }

        // 2. Restore any top-level key/value entries
        Object.entries(parsed).forEach(([key, val]) => {
          if (key !== 'rawLocalStorage' && val !== undefined && val !== null) {
            safeSetItem(key, typeof val === 'string' ? val : JSON.stringify(val));
            importedKeys++;
          }
        });

        // 3. Inject directly into live Zustand stores in memory
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
      exportScheduleToCSV(game?.customHabits || []);
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
          const isValid = parsed.every(h => h.id && h.title && h.category && h.frequencyType);
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

  const tabsConfig = [
    { id: 'preferences' as SettingsSubTab, label: 'Preferencias', icon: SlidersHorizontal, color: 'text-cyan-400' },
    { id: 'gameplay' as SettingsSubTab, label: 'Juego & KAI', icon: Sparkles, color: 'text-purple-400' },
    { id: 'finances' as SettingsSubTab, label: 'Tesorería', icon: Coins, color: 'text-amber-400' },
    { id: 'data' as SettingsSubTab, label: 'Nube & Datos', icon: Database, color: 'text-emerald-400' }
  ];

  return (
    <div ref={chicleContainerRef} className="space-y-6 pb-20">
      {/* HEADER & SUB-TABS NAVIGATION */}
      <div className="bg-[#00152b] rounded-2xl border border-cyan-500/20 p-3 sm:p-4 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-white font-black text-base sm:text-lg flex items-center gap-2 uppercase tracking-wider">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Configuración del Sistema</span>
          </h2>
          {activeSubTab === 'simulator' && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setActiveSubTab('gameplay');
              }}
              className="chicle-btn flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-500/50 text-fuchsia-300 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Volver a Configuración</span>
            </button>
          )}
        </div>

        {/* SUB-TABS NAV BAR: Clean 4-segment responsive control */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-[#000d1c] rounded-xl border border-slate-800/80">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setActiveSubTab(tab.id);
                }}
                className={`chicle-btn flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00284d] text-white border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#001830]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-300' : tab.color}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* NOTIFICACIÓN REACTIVA GLOBAL */}
      {currencyChangedToast && (
        <div className="max-w-3xl mx-auto bg-emerald-950/90 border border-emerald-400 p-3.5 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-fade-in text-white text-xs">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{currencyChangedToast}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-300">REACTIVO GLOBAL</span>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL POR SUB-PESTAÑA */}
      <div className="max-w-3xl mx-auto">
        {/* ===================== TAB 1: PREFERENCIAS & UI ===================== */}
        {activeSubTab === 'preferences' && (
          <div className="space-y-6 animate-fade-in">
            {/* ATMÓSFERA Y ENTORNO */}
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-5">
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Atmósfera & Interfaz
              </h3>

              {/* SONIDO */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                    Efectos Sonoros Sintéticos
                  </h4>
                  <p className="text-xs text-slate-400">
                    Audio Web Audio API para completado de misiones, subidas de nivel y feedback táctico.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleTestAudio}
                    disabled={!soundEnabled}
                    className={`chicle-btn px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                      !soundEnabled
                        ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-500'
                        : audioTesting
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                        : 'bg-[#002244] border-cyan-800 text-cyan-300 hover:bg-cyan-900/60 hover:text-white cursor-pointer'
                    }`}
                    title="Probar sonido"
                  >
                    {audioTesting ? 'Sonando...' : 'Probar'}
                  </button>
                  <ChicleToggle
                    checked={soundEnabled}
                    onChange={() => toggleSound()}
                    color="cyan"
                    size="md"
                    ariaLabel="Alternar efectos sonoros"
                  />
                </div>
              </div>

              {/* ═══ CENTRO DE NOTIFICACIONES KAI ═══ */}
              <div className="pt-4 border-t border-slate-800/80 space-y-4">
                {/* Cabecera con estado y botón de permiso */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                      <BellRing className="w-4 h-4 text-emerald-400" /> Centro de Notificaciones — La Solución
                    </h4>
                    <p className="text-xs text-slate-400">
                      Recordatorios inteligentes basados en tu horario y estado del juego.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Indicador de estado */}
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-lg border ${
                      notificationPermission === 'granted'
                        ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/50'
                        : notificationPermission === 'denied'
                        ? 'text-red-400 border-red-500/40 bg-red-950/50'
                        : 'text-amber-400 border-amber-500/40 bg-amber-950/50'
                    }`}>
                      {notificationPermission === 'granted' ? '● Activas' : notificationPermission === 'denied' ? '✕ Bloqueadas' : '○ Pendiente'}
                    </span>
                    {/* Botón activar permisos */}
                    {notificationPermission !== 'granted' && (
                      <button
                        type="button"
                        onClick={handleRequestNotifications}
                        disabled={!notificationService.isSupported()}
                        className={`chicle-btn px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                          !notificationService.isSupported()
                            ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-500'
                            : 'bg-emerald-950 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60 hover:text-white cursor-pointer shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                        }`}
                      >
                        <Bell className="w-3 h-3 inline mr-1" /> Activar Permisos
                      </button>
                    )}
                    {/* Botón probar notificación */}
                    {notificationPermission === 'granted' && (
                      <button
                        type="button"
                        onClick={handleTestNotification}
                        className="chicle-btn px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border bg-[#001830] border-cyan-800/60 text-cyan-400 hover:bg-cyan-950 cursor-pointer"
                      >
                        <BellRing className="w-3 h-3 inline mr-1" /> Probar
                      </button>
                    )}
                  </div>
                </div>

                {/* Feedback de prueba */}
                {notifTestFeedback && (
                  <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2 animate-fade-in">
                    {notifTestFeedback}
                  </div>
                )}

                {/* Aviso si no hay soporte */}
                {!notificationService.isSupported() && (
                  <div className="text-xs text-amber-400 bg-amber-950/30 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
                    <BellOff className="w-3.5 h-3.5 shrink-0" />
                    Tu navegador no soporta notificaciones push. Instala la app como PWA para activarlas.
                  </div>
                )}

                {/* Toggles individuales — solo si hay permisos */}
                {notificationPermission === 'granted' && (
                  <div className="space-y-2 bg-[#000d1c] rounded-xl p-3 border border-slate-800/60">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tipos de Recordatorio</p>

                    {/* Hábitos por timeBlock */}
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Timer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Recordatorios por hora</p>
                          <p className="text-[10px] text-slate-500">Avisa 2 min antes de cada tarea con timeBlock</p>
                        </div>
                      </div>
                      <ChicleToggle
                        checked={!!notifSettings.habitReminders}
                        onChange={() => handleToggleNotifSetting('habitReminders')}
                        color="cyan"
                        size="sm"
                        ariaLabel="Alternar recordatorios por hora"
                      />
                    </div>

                    {/* Briefing matutino */}
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Briefing matutino</p>
                          <p className="text-[10px] text-slate-500">Resumen 15 min antes de tu primera tarea del día</p>
                        </div>
                      </div>
                      <ChicleToggle
                        checked={!!notifSettings.morningBriefing}
                        onChange={() => handleToggleNotifSetting('morningBriefing')}
                        color="amber"
                        size="sm"
                        ariaLabel="Alternar briefing matutino"
                      />
                    </div>

                    {/* Reflexión nocturna */}
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Reflexión nocturna</p>
                          <p className="text-[10px] text-slate-500">Recordatorio para cerrar el día</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {notifSettings.nightlyReflection && (
                          <select
                            value={notifSettings.nightlyHour}
                            onChange={e => handleToggleNotifSetting('nightlyHour', parseInt(e.target.value))}
                            className="bg-[#000f20] border border-slate-700 text-indigo-300 text-[10px] font-mono rounded-lg px-2 py-1 cursor-pointer"
                          >
                            {[19, 20, 21, 22, 23].map(h => (
                              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                            ))}
                          </select>
                        )}
                        <ChicleToggle
                          checked={!!notifSettings.nightlyReflection}
                          onChange={() => handleToggleNotifSetting('nightlyReflection')}
                          color="indigo"
                          size="sm"
                          ariaLabel="Alternar reflexión nocturna"
                        />
                      </div>
                    </div>

                    {/* Alerta de Boss */}
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Alerta de Boss</p>
                          <p className="text-[10px] text-slate-500">Avisa a las 20:00 si el Boss del día sigue vivo</p>
                        </div>
                      </div>
                      <ChicleToggle
                        checked={!!notifSettings.bossAlert}
                        onChange={() => handleToggleNotifSetting('bossAlert')}
                        color="red"
                        size="sm"
                        ariaLabel="Alternar alerta de Boss"
                      />
                    </div>

                    {/* Racha en peligro */}
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Racha en peligro</p>
                          <p className="text-[10px] text-slate-500">Alerta si llevas horas sin completar ninguna misión</p>
                        </div>
                      </div>
                      <ChicleToggle
                        checked={!!notifSettings.streakAlert}
                        onChange={() => handleToggleNotifSetting('streakAlert')}
                        color="amber"
                        size="sm"
                        ariaLabel="Alternar alerta de racha en peligro"
                      />
                    </div>

                    {/* Pomodoro completado */}
                    <div className="flex items-center justify-between gap-3 py-2">
                      <div className="flex items-center gap-2">
                        <Timer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Pomodoro completado</p>
                          <p className="text-[10px] text-slate-500">Notificación al finalizar cada sesión de foco</p>
                        </div>
                      </div>
                      <ChicleToggle
                        checked={!!notifSettings.pomodoroComplete}
                        onChange={() => handleToggleNotifSetting('pomodoroComplete')}
                        color="emerald"
                        size="sm"
                        ariaLabel="Alternar alerta de pomodoro completado"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* TEMA VISUAL */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                    <Sun className="w-4 h-4 text-amber-400" /> Tema de la Pantalla
                  </h4>
                  <p className="text-xs text-slate-400">
                    Paleta de contraste visual y modo de color para la interfaz.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#000f20] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleSetTheme('dark')}
                    className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      themeMode === 'dark' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Oscuro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetTheme('light')}
                    className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      themeMode === 'light' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Claro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetTheme('auto')}
                    className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      themeMode === 'auto' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Auto</span>
                  </button>
                </div>
              </div>

              {/* MODO DE NAVEGACIÓN HUD (KAI NEXUS VS CLÁSICO) */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                    <Compass className="w-4 h-4 text-cyan-400" /> Modo de Navegación HUD
                  </h4>
                  <p className="text-xs text-slate-400">
                    Elige si navegar con KAI en pantalla completa inmersiva o con la barra inferior clásica.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#000f20] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setNavigationMode('nexus');
                    }}
                    className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      navigationMode === 'nexus'
                        ? 'bg-cyan-500 text-black font-black shadow-[0_0_14px_rgba(0,240,255,0.6)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="KAI Nexus: Pantalla completa sin barra inferior"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>KAI Nexus (Inmersivo)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setNavigationMode('classic');
                    }}
                    className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      navigationMode === 'classic'
                        ? 'bg-cyan-600 text-white font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Clásico: Barra de navegación inferior siempre visible"
                  >
                    <Layout className="w-3.5 h-3.5" />
                    <span>Clásico (Con Barra)</span>
                  </button>
                </div>
              </div>

              {/* Modo Zen / Rendimiento Limpio */}
              <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-800/80">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-emerald-400" /> Modo Zen (Ultra Enfoque & Batería)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Desactiva orbes de energía pesados y partículas continuas para una interfaz sobria, sin distracciones y con mínimo consumo de GPU en móvil.
                  </p>
                </div>
                <ChicleToggle
                  checked={zenMode}
                  onChange={() => {
                    soundFX.playClick();
                    toggleZenMode();
                  }}
                  color="emerald"
                  size="md"
                  ariaLabel="Alternar Modo Zen"
                  title={zenMode ? 'Modo Zen activado' : 'Modo Zen desactivado'}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: JUEGO & KAI ===================== */}
        {activeSubTab === 'gameplay' && (
          <div className="space-y-6 animate-fade-in">
            {/* MECÁNICAS RPG */}
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-purple-500/30 space-y-4 shadow-[0_0_20px_rgba(168,85,247,0.08)]">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Mecánicas RPG & Gamificación
              </h3>

              {/* Misiones Dinámicas */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-800/80">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-cyan-400"/> Generador de Misiones Dinámicas
                  </h4>
                  <p className="text-xs text-slate-400">
                    Detecta déficits de hábitos y propone misiones secundarias limitadas de bonificación de XP.
                  </p>
                </div>
                <ChicleToggle
                  checked={!!settings.enableDynamicQuests}
                  onChange={() => toggleSetting('enableDynamicQuests')}
                  color="cyan"
                  size="md"
                  ariaLabel="Alternar Generador de Misiones Dinámicas"
                />
              </div>

              {/* Familiar RPG */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-800/80">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-purple-400"/> Compañero / Familiar RPG
                  </h4>
                  <p className="text-xs text-slate-400">
                    Muestra un Familiar visual que evoluciona basándose en tu atributo dominante de maestría.
                  </p>
                </div>
                <ChicleToggle
                  checked={!!settings.enableCompanion}
                  onChange={() => toggleSetting('enableCompanion')}
                  color="purple"
                  size="md"
                  ariaLabel="Alternar Compañero / Familiar RPG"
                />
              </div>

              {/* Modo Estricto */}
              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4 text-red-400"/> Modo Estricto (Castigo de Maestría)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Si fallas un hábito, las penalizaciones de racha y XP son más severas.
                  </p>
                </div>
                <ChicleToggle
                  checked={!!settings.strictMode}
                  onChange={() => toggleSetting('strictMode')}
                  color="red"
                  size="md"
                  ariaLabel="Alternar Modo Estricto"
                />
              </div>
            </div>

            {/* COMPAÑERO CUÁNTICO KAI: SELECCIÓN Y FORJA */}
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-cyan-500/35 space-y-4 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">
                    Compañero Holográfico KAI
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  {stats.kaiShape === 'custom' ? 'Forja IA Activa' : '6 Formas Día 0'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-cyan-950/40 border border-cyan-400/40 p-1 flex items-center justify-center shrink-0">
                    <KaiVectorGraphics
                      shapeId={stats.kaiShape || 'prism'}
                      activeColor="#00f0ff"
                      customForm={stats.kaiCustomForm}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Figura Equipada:</span>
                    <strong className="text-sm font-anton text-white tracking-wide uppercase">
                      {stats.kaiShape === 'custom' ? (stats.kaiCustomForm?.name || 'Forja Neural IA') : (KAI_OFFICIAL_SHAPES.find(s => s.id === stats.kaiShape)?.name || 'El Prisma')}
                    </strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {stats.kaiShape === 'custom' ? 'Compañero vectorizado con IA multimodal' : 'Geometría oficial desbloqueada'}
                    </span>
                  </div>
                </div>

                {onOpenKaiWorkshop && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      onOpenKaiWorkshop();
                    }}
                    className="chicle-btn px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.3)] flex items-center gap-1.5 shrink-0"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Taller de KAI</span>
                  </button>
                )}
              </div>
            </div>

            {/* PROTOCOLO DE INDUCCIÓN Y GUÍA TÁCTICA DE KAI */}
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-cyan-500/35 space-y-4 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">
                    Manual y Guía Táctica de KAI
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  6 Módulos
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Repasa en cualquier momento la inducción guiada paso a paso sobre Energía Vital (HP), la Ley 21/66 en tus Orbes, la creación de misiones en Bloques Maestros, el Modo Foco y la Tienda.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    useUIStore.getState().openTacticalGuide(1);
                  }}
                  className="chicle-btn px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.3)] flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Repasar Guía Táctica</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    usePlayerStore.getState().resetTutorialGuides();
                    notificationService.triggerNotification(
                      'Avisos Restablecidos 🔄',
                      'Los avisos contextuales de KAI volverán a mostrarse cuando explores la app.',
                      '🔄'
                    );
                  }}
                  className="chicle-btn px-3.5 py-2 rounded-xl bg-surface-card hover:bg-white/10 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Restablecer Avisos</span>
                </button>
              </div>
            </div>

            {/* LABORATORIO & HERRAMIENTAS TÁCTICAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Simulador */}
              <div className="bg-[#00152b] p-5 rounded-2xl border border-fuchsia-500/40 space-y-3 shadow-[0_0_15px_rgba(217,70,239,0.1)] flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-fuchsia-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-fuchsia-400" /> Simulador Táctico
                    </span>
                    <span className="text-[10px] font-mono text-fuchsia-300 bg-fuchsia-950/70 border border-fuchsia-500/40 px-2 py-0.5 rounded-full">
                      Sandbox
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Experimenta proyecciones de nivel, evolución de rachas y batallas sin alterar tus datos reales de juego.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setActiveSubTab('simulator');
                  }}
                  className="chicle-btn w-full py-2.5 px-4 bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-500/60 text-fuchsia-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Abrir Simulador</span>
                </button>
              </div>

              {/* Oráculo IA */}
              <div className="bg-[#00152b] p-5 rounded-2xl border border-cyan-500/40 space-y-3 shadow-[0_0_15px_rgba(0,240,255,0.1)] flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" /> Oráculo IA
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                      Gemini
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Asistente neural inteligente para balancear tus bloques maestros, sugerir hábitos y optimizar tu rutina.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setIsOracleOpen(true);
                  }}
                  className="chicle-btn w-full py-2.5 px-4 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Consultar Oráculo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: TESORERÍA ===================== */}
        {activeSubTab === 'finances' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-6">
              {/* HEADER DE TESORERÍA */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" /> Parámetros de Finanzas & Tesorería
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configura la divisa base para registros diarios, balances y análisis temporal.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-950 border border-emerald-600/50 text-emerald-300 font-mono font-black text-xs">
                  {currentCurrency} Activo
                </span>
              </div>

              {/* SELECTOR COMPACTO DE MONEDA */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                  Divisa Principal del Sistema
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUPPORTED_CURRENCIES.map((c) => {
                    const isSelected = currentCurrency === c.symbol;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelectCurrency(c.symbol, c.name)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-[0_0_12px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400'
                            : 'bg-[#002244] border-cyan-800/60 text-slate-300 hover:border-cyan-400 hover:text-white hover:bg-[#002d5a]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-mono font-black text-amber-300">{c.symbol}</span>
                            <span className="text-xs font-black uppercase text-cyan-300">{c.code}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[120px]">{c.name}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* META DE AHORRO */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-cyan-400" /> Objetivo Sugerido de Tasa de Ahorro
                    </h4>
                    <p className="text-xs text-slate-400">
                      Porcentaje de referencia sobre tus ingresos para medir tu superávit en Estadísticas.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-400 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-700/60 self-start sm:self-auto">
                    {savingsTarget}% sugerido
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {[10, 15, 20, 30, 40, 50].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleSelectSavingsTarget(rate)}
                      className={`chicle-btn px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        savingsTarget === rate
                          ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : 'bg-[#002244] border border-cyan-800/60 text-slate-300 hover:text-white hover:border-cyan-500'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* INTEGRACIÓN MISIONES */}
              <div className="p-3.5 rounded-xl bg-[#001020] border border-cyan-900/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-700/40 text-emerald-400 shrink-0 mt-0.5">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">Acreditación Automática desde Misiones</div>
                  <p className="text-slate-400 leading-relaxed">
                    Al completar misiones con recompensa en efectivo en la pestaña <strong className="text-cyan-300">Misiones</strong>, el monto se agrega de forma automática como ingreso al balance diario de tesorería.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: NUBE & DATOS ===================== */}
        {activeSubTab === 'data' && (
          <div className="space-y-6 animate-fade-in">
            {/* FEEDBACK REACTIVO DE DATOS */}
            {exportFeedback && (
              <div className="p-3.5 bg-cyan-950/90 border border-cyan-500/80 text-cyan-300 rounded-xl text-xs font-black flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{exportFeedback}</span>
              </div>
            )}

            {importStatus && (
              <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 rounded-xl text-xs font-black flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}

            {/* 1. PUENTE DIRECTO TABLET ↔ TELÉFONO */}
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-cyan-500/40 space-y-4 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">
                    Puente Directo Tablet ↔ Teléfono
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/60">
                  SINCRONIZACIÓN RÁPIDA
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                1️⃣ En tu <strong>Tablet</strong> toca &quot;Subir datos&quot; · 2️⃣ En tu <strong>Teléfono</strong> toca &quot;Traer datos&quot; para sincronizar tus misiones y rutinas al instante entre dispositivos.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleForceSync}
                  disabled={isForceSyncing || isPullingCloud}
                  className="chicle-btn min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/70 text-cyan-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Upload className={`w-4 h-4 ${isForceSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isForceSyncing ? 'Subiendo datos...' : 'Subir datos a la nube'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePullFromCloud}
                  disabled={isPullingCloud || isForceSyncing}
                  className="chicle-btn min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-400/70 text-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Download className={`w-4 h-4 ${isPullingCloud ? 'animate-bounce' : ''}`} />
                  <span>{isPullingCloud ? 'Cargando datos...' : 'Traer datos a este equipo'}</span>
                </button>
              </div>

              {cloudActionToast && (
                <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{cloudActionToast}</span>
                </div>
              )}
            </div>

            {/* 2. ESTADO DE FIRESTORE & USUARIO */}
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400" /> Sincronización en la Nube (Firestore)
                </h3>
                {user && (
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                    cloudSync?.syncStatus === 'synced'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                      : cloudSync?.syncStatus === 'saving'
                      ? 'bg-blue-950/80 text-cyan-400 border border-cyan-500/40'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      cloudSync?.syncStatus === 'synced' ? 'bg-emerald-400 animate-pulse' :
                      cloudSync?.syncStatus === 'saving' ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'
                    }`} />
                    {cloudSync?.syncStatus === 'synced' ? 'En Línea & Sincronizado' :
                     cloudSync?.syncStatus === 'saving' ? 'Guardando en la Nube...' : 'Guardado Local'}
                  </span>
                )}
              </div>

              {/* INFO DE USUARIO */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#001c38]/50 p-4 rounded-xl border border-blue-950">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#002244] border border-blue-900/50 flex items-center justify-center shrink-0">
                    {user ? (
                      user.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-2xl object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-cyan-400" />
                      )
                    ) : (
                      <CloudOff className="w-6 h-6 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">
                      {user ? (user.displayName || user.email) : 'Modo Local (Sin autenticar)'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {user 
                        ? `Conectado a Firestore: ${user.email}` 
                        : 'Tu partida se almacena temporalmente en la memoria del navegador.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {user ? (
                    <button 
                      onClick={() => signOut()}
                      className="chicle-btn flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Salir</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => signInWithGoogle()}
                      className="chicle-btn flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Conectar Google</span>
                    </button>
                  )}
                </div>
              </div>

              {/* RESUMEN CONCISO DE PROTECCIÓN */}
              <div className="p-3.5 rounded-xl bg-[#001224] border border-blue-900/40 text-xs text-slate-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Protección en tiempo real: Nivel, XP, Misiones, Hábitos, Bitácora y Tesorería.</span>
                </div>
                {user && cloudSync?.lastSyncTime && (
                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    Última sinc: {cloudSync.lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            {/* 3. RESPALDO LOCAL JSON & CSV */}
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#002244] border border-cyan-700/60 text-cyan-300 shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Copia de Seguridad de Partida (JSON & CSV)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Exporta tus estadísticas, tareas y bitácora en archivo plano para resguardar tu información fuera de la aplicación.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="chicle-btn min-h-[44px] px-4 py-2.5 bg-[#002244] hover:bg-[#003366] text-cyan-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl border border-cyan-700/60 hover:border-cyan-400 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Exportar (JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="chicle-btn min-h-[44px] px-4 py-2.5 bg-[#001f3f] hover:bg-[#002d5c] text-blue-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl border border-blue-700/60 hover:border-blue-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <span>Bitácora (CSV)</span>
                </button>

                <label className="chicle-btn min-h-[44px] px-4 py-2.5 bg-[#001830] hover:bg-[#002448] text-slate-300 hover:text-cyan-200 font-black text-xs uppercase tracking-wider rounded-xl border border-slate-700 hover:border-cyan-600 flex items-center justify-center gap-2 transition-all cursor-pointer text-center">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Restaurar (JSON)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 4. PLANTILLAS DE HORARIOS */}
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-700/60 text-emerald-400 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Plantillas de Horarios y Hábitos (Excel / CSV)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Descarga tu plantilla, edita en Excel marcando 'X' en los días correspondientes y vuelve a subirla.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleExportSchedule}
                  className="chicle-btn min-h-[44px] px-4 py-2.5 bg-[#002211] hover:bg-[#00331a] text-emerald-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl border border-emerald-700/60 hover:border-emerald-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Bajar Horarios (CSV)</span>
                </button>

                <label className="chicle-btn min-h-[44px] px-4 py-2.5 bg-[#001810] hover:bg-[#002418] text-emerald-100/80 hover:text-emerald-200 font-black text-xs uppercase tracking-wider rounded-xl border border-slate-700 hover:border-emerald-600 flex items-center justify-center gap-2 transition-all cursor-pointer text-center">
                  <Upload className="w-4 h-4 text-emerald-500/70" />
                  <span>Subir Horarios (CSV)</span>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleImportSchedule}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 5. GOOGLE DRIVE SYNC CARD */}
            <GoogleDriveSyncCard />

            {/* 6. APLICACIÓN INSTALABLE PWA */}
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                    Aplicación Instalable PWA (Offline Ready)
                  </h4>
                </div>
                {pwa.isInstalled ? (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    App Instalada
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                    Instalable en Móvil
                  </span>
                )}
              </div>

              <div className="bg-[#001020] border border-cyan-900/50 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-100">
                    Instala La Solución en tu teléfono, tablet o escritorio
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Carga instantánea, funcionamiento sin conexión a internet y acceso directo desde tu pantalla de inicio.
                  </p>
                </div>

                {pwa.isInstalled ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Ejecutando como App Nativa</span>
                  </div>
                ) : pwa.isInstallable ? (
                  <button
                    onClick={async () => {
                      soundFX.playClick();
                      const ok = await pwa.install();
                      if (ok) soundFX.playLevelUp();
                    }}
                    className="chicle-btn flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Instalar Ahora
                  </button>
                ) : pwa.isIOS ? (
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      setShowIOSInstructions(!showIOSInstructions);
                    }}
                    className="chicle-btn flex items-center justify-center gap-2 px-4 py-2 bg-blue-900/80 hover:bg-blue-800 text-cyan-300 border border-cyan-500/40 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    <Share className="w-3.5 h-3.5" />
                    Instrucciones iOS
                  </button>
                ) : (
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                    Usa el menú del navegador → "Agregar a pantalla de inicio"
                  </div>
                )}
              </div>

              {showIOSInstructions && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-xs text-slate-300 space-y-2.5 animate-in fade-in">
                  <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" /> Pasos para instalar en Safari iOS:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                    <li>Toca el botón <strong className="text-white">Compartir</strong> <Share className="w-3.5 h-3.5 inline text-cyan-400" /> en la barra inferior de Safari.</li>
                    <li>Desplázate hacia abajo y presiona <strong className="text-white">"Agregar a inicio"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-cyan-400" />.</li>
                    <li>Presiona <strong className="text-cyan-300">"Agregar"</strong> en la esquina superior derecha.</li>
                  </ol>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-300">Caché & Actualizaciones en Vivo</p>
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
                  className="chicle-btn flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/80 hover:border-cyan-400 text-[11px] font-mono text-cyan-300 transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Vaciar Caché y Forzar Actualización
                </button>
              </div>
            </div>

            {/* 7. ZONA CRÍTICA */}
            <div className="bg-[#1a0505] p-6 rounded-2xl border border-red-900/60 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-red-950/80 border border-red-700 text-red-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-red-400 uppercase tracking-wider">
                    Reinicio Total de Partida
                  </h4>
                  <p className="text-xs text-red-300/80 mt-1 leading-relaxed">
                    Esta acción restablece todo tu progreso, nivel, XP acumulada, monedas, hábitos y bitácora tanto en este dispositivo como en Firestore. La cuenta volverá al estado inicial de Nivel 1.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-red-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-[11px] text-red-400/60 font-mono">
                  Confirmación de seguridad activa (Protección de doble clic).
                </p>

                <button 
                  onClick={() => {
                    if (!confirmReset) {
                      setConfirmReset(true);
                      setTimeout(() => setConfirmReset(false), 5000);
                    } else if (onResetAccount) {
                      onResetAccount();
                    }
                  }}
                  className={`chicle-btn px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border cursor-pointer ${
                    confirmReset 
                      ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                      : 'bg-red-950/60 text-red-400 hover:text-white hover:bg-red-700 border-red-800'
                  }`}
                >
                  {confirmReset ? '¿ESTÁS SEGURO? CLIC DE NUEVO' : 'Reiniciar Cuenta'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: SIMULADOR DE ESCENARIOS ===================== */}
        {activeSubTab === 'simulator' && (
          <div className="animate-fade-in space-y-4">
            <ScenarioSimulatorPanel />
          </div>
        )}
      </div>

      <OracleModal 
        isOpen={isOracleOpen}
        onClose={() => setIsOracleOpen(false)}
      />
    </div>
  );
};
