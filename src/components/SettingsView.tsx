import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Settings, Sparkles, Activity, ShieldAlert, ShieldCheck, Shield, LogOut, User, LogIn, 
  Cloud, CloudOff, Download, Upload, Database, Check, RefreshCw, 
  HardDrive, FileSpreadsheet, Cpu, CheckCircle2, Key,
  Coins, Volume2, VolumeX, Target, Sun, Moon, ArrowUpRight, CheckCheck,
  SlidersHorizontal, Smartphone, Share, PlusSquare, FlaskConical,
  Compass, Eye, Layout, Bell, BellOff, BellRing, Zap, Flame, Timer, Palette, ChevronLeft, Wallet, Type, Lock, Hand, Clock,
  ArrowLeft, ArrowRight
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
import { getTodayDateString, getGlobalDayStartHour } from '../utils/date';
import { formatHourToHuman } from '../utils/timeUtils';
const OracleModal = lazy(() => import('./OracleModal').then(m => ({ default: m.OracleModal })));
const ScenarioSimulatorPanel = lazy(() => import('./ScenarioSimulatorPanel').then(m => ({ default: m.ScenarioSimulatorPanel })));
import { GoogleDriveSyncCard } from './GoogleDriveSyncCard';
import { restoreAppState } from '../services/googleDriveService';
import { KAI_OFFICIAL_SHAPES } from '../data/kaiShapes';
import { KAI_VOICE_TONE_CONFIG, KaiVoiceTone } from '../data/kaiVoiceMatrix';
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
import { MoxenMalla } from './moxen/MoxenMalla';
import { MoxenEclipseToggle } from './moxen/MoxenEclipseToggle';
import { QuantumCubeLoader } from './QuantumCubeLoader';

interface SettingsViewProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onResetAccount?: () => void;
  cloudSync?: CloudSyncResult;
  onOpenKaiWorkshop?: () => void;
  onOpenOnboarding?: () => void;
}

const EMPTY_TASK_LIST: any[] = [];

type SettingsSubTab = 'preferences' | 'atmosphere' | 'gameplay' | 'finances' | 'data' | 'simulator';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAccount,
  cloudSync: propCloudSync,
  onOpenKaiWorkshop,
  onOpenOnboarding,
}) => {
  const chicleContainerRef = useMoxenChicle<HTMLDivElement>();
  const { user, signInWithGoogle, signOut } = useAuth();
  const pwa = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [pwaBuildInfo, setPwaBuildInfo] = useState<{
    localRev: string;
    serverRev: string | null;
    checking: boolean;
  }>(() => ({
    localRev: (typeof window !== 'undefined' && (window as any).__APP_BUILD_REV__) || localStorage.getItem('app_build_rev') || 'rev-local',
    serverRev: null,
    checking: true,
  }));

  useEffect(() => {
    let mounted = true;
    const verifyBuildRev = async () => {
      try {
        const res = await fetch('/api/build-rev?_cb=' + Date.now(), {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
        if (res.ok && mounted) {
          const data = await res.json();
          setPwaBuildInfo((prev) => ({
            ...prev,
            serverRev: data?.rev || prev.localRev,
            checking: false,
          }));
          return;
        }
      } catch {}
      if (mounted) {
        setPwaBuildInfo((prev) => ({ ...prev, checking: false }));
      }
    };
    verifyBuildRev();
    return () => {
      mounted = false;
    };
  }, []);
  const game = gameEngine as any;
  const cloudSync = propCloudSync || game?.cloudSync;
  const { 
    soundEnabled, toggleSound, opticMode, setOpticMode, 
    navigationMode, setNavigationMode, 
    zenMode, toggleZenMode, 
    timeFormat, setTimeFormat, 
    systemAura, setSystemAura, triggerTransition,
    zenFont, setZenFont,
    handDominance, setHandDominance,
    glowIntensity, setGlowIntensity,
    setModalState
  } = useUIStore();
  
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('preferences');
  const [currentCurrency, setCurrentCurrency] = useState<string>(getSavedCurrencySymbol);
  const [savingsTarget, setSavingsTarget] = useState<number>(getSavedSavingsTarget);
  const [audioTesting, setAudioTesting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(notificationService.getPermission());
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [notifTestFeedback, setNotifTestFeedback] = useState<string | null>(null);
  const [currencyChangedToast, setCurrencyChangedToast] = useState<string | null>(null);
  const [textDensityCompact, setTextDensityCompact] = useState<boolean>(() => {
    return localStorage.getItem('taskquest_text_density') === 'compact';
  });

  const handleToggleTextDensity = () => {
    soundFX.playClick();
    const next = !textDensityCompact;
    setTextDensityCompact(next);
    localStorage.setItem('taskquest_text_density', next ? 'compact' : 'normal');
    if (next) {
      document.documentElement.classList.add('text-density-compact');
    } else {
      document.documentElement.classList.remove('text-density-compact');
    }
  };

  useEffect(() => {
    if (textDensityCompact) {
      document.documentElement.classList.add('text-density-compact');
    } else {
      document.documentElement.classList.remove('text-density-compact');
    }
  }, [textDensityCompact]);

  const todayTasks = useTaskStore(s => s.tasksByDate[getTodayDateString()] ?? EMPTY_TASK_LIST);
  const stats = usePlayerStore(s => s.stats);
  const streakDays = stats.streakDays;

  const [confirmReset, setConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [isForceSyncing, setIsForceSyncing] = useState(false);
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
    { id: 'preferences' as SettingsSubTab, label: 'Sistema & Audio', icon: Volume2, color: 'text-cyan-400' },
    { id: 'atmosphere' as SettingsSubTab, label: 'Apariencia & Visión', icon: Palette, color: 'text-cyan-400' },
    { id: 'gameplay' as SettingsSubTab, label: 'Juego & KAI', icon: Sparkles, color: 'text-purple-400' },
    { id: 'finances' as SettingsSubTab, label: 'Tesorería', icon: Coins, color: 'text-amber-400' },
    { id: 'data' as SettingsSubTab, label: 'Nube & Datos', icon: Database, color: 'text-emerald-400' }
  ];

  return (
    <div ref={chicleContainerRef} className="space-y-6 pb-36 sm:pb-32">
      {/* HEADER & SUB-TABS NAVIGATION */}
      <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-2xl border border-white/10 p-3 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] relative overflow-hidden space-y-3">
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />
        
        {/* Filo de luz superior especular */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between px-1 relative z-10">
          <h2 className="text-white font-anton text-base sm:text-lg flex items-center gap-2 uppercase tracking-wider">
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
              className="chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-500/50 text-fuchsia-300 transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Volver a Configuración</span>
            </button>
          )}
        </div>

        {/* SUB-TABS NAV BAR: Moxen Chip Menu Group (mf-8-menu-chip-group) */}
        <div
          className="mf-8-menu-chip-group mf-chip-group relative z-10 justify-start sm:justify-center"
          role="listbox"
          aria-label="Secciones de configuración"
        >
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  soundFX.playClick();
                  setActiveSubTab(tab.id);
                }}
                className={`mf-8-menu-chip-group__chip mf-chip ${
                  isActive ? 'mf-8-menu-chip-group__chip--active mf-chip--active' : ''
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-black' : tab.color}`} />
                <span>{tab.label}</span>
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
            {/* AUDIO & FEEDBACK TÁCTICO */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-5">
              {/* Micrograno táctil Moxen Vidrio */}
              <span className="vi-grano opacity-5" aria-hidden="true" />

              <h3 className="text-xs font-anton text-cyan-400 uppercase tracking-wider flex items-center gap-2 relative z-10">
                <Volume2 className="w-4 h-4" /> Audio & Efectos del Sistema
              </h3>

              {/* SONIDO */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                    Efectos Sonoros Sintéticos
                  </h4>
                  <p className="text-xs text-slate-400">
                    Efectos sonoros tácticos y feedback auditivo al completar misiones.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleTestAudio}
                    disabled={!soundEnabled}
                    className={`chicle-btn px-3.5 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all border active:scale-95 ${
                      !soundEnabled
                        ? 'opacity-40 cursor-not-allowed border-white/10 text-slate-500'
                        : audioTesting
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                        : 'bg-white/[0.05] border-white/15 text-cyan-300 hover:bg-white/10 hover:text-white cursor-pointer'
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
              <div className="pt-4 border-t border-white/10 space-y-4">
                {/* Cabecera con estado y botón de permiso */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
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
                        className={`chicle-btn px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all border active:scale-95 ${
                          !notificationService.isSupported()
                            ? 'opacity-40 cursor-not-allowed border-white/10 text-slate-500'
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
                        className="chicle-btn px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all border bg-white/[0.05] border-white/15 text-cyan-300 hover:bg-white/10 cursor-pointer active:scale-95"
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
                  <div className="space-y-2 bg-black/40 rounded-2xl p-3 border border-white/10">
                    <p className="text-[10px] font-anton text-slate-400 uppercase tracking-widest mb-3">Tipos de Recordatorio</p>

                    {/* Hábitos por timeBlock */}
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <Timer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Recordatorios por hora</p>
                          <p className="text-[10px] text-slate-400">Avisa 2 min antes de cada tarea con horario</p>
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
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Briefing matutino</p>
                          <p className="text-[10px] text-slate-400">Resumen 15 min antes de tu primera tarea del día</p>
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
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Reflexión nocturna</p>
                          <p className="text-[10px] text-slate-400">Recordatorio para cerrar el día</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {notifSettings.nightlyReflection && (
                          <select
                            value={notifSettings.nightlyHour}
                            onChange={e => handleToggleNotifSetting('nightlyHour', parseInt(e.target.value))}
                            className="bg-[#010810] border border-white/15 text-indigo-300 text-[10px] font-mono rounded-xl px-2 py-1 cursor-pointer focus:outline-none focus:border-indigo-400"
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
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Alerta de Boss</p>
                          <p className="text-[10px] text-slate-400">Avisa a las 20:00 si el Boss del día sigue vivo</p>
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
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Racha en peligro</p>
                          <p className="text-[10px] text-slate-400">Alerta si llevas horas sin completar ninguna misión</p>
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
                          <p className="text-[10px] text-slate-400">Notificación al finalizar cada sesión de foco</p>
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

              {/* RITMO DE JORNADA Y CORTE DIARIO PERSONALIZADO */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-cyan-400" /> Ritmo de Jornada y Ciclo Diario
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    Hora de inicio de tus 24h de actividades ({formatHourToHuman(stats.dayStartHour !== undefined ? stats.dayStartHour : getGlobalDayStartHour())}). Mantiene tus tareas unidas sin dividirse en turnos nocturnos, vespertinos o diurnos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setModalState('isDayRhythmOpen', true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-[0_0_12px_rgba(0,240,255,0.15)] active:scale-95"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Calibrar Horario</span>
                </button>
              </div>

              {/* FORMATO DE HORA EN AGENDA (12H AM/PM VS 24H MILITAR) */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
                    <Timer className="w-4 h-4 text-cyan-400" /> Formato de Hora en Agenda
                  </h4>
                  <p className="text-xs text-slate-400">
                    Elige cómo visualizar la columna de horarios de tus tareas (12h con AM/PM o 24h).
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setTimeFormat('12h');
                    }}
                    className={`chicle-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                      timeFormat === '12h'
                        ? 'bg-cyan-400 text-black font-bold shadow-[0_0_14px_rgba(0,240,255,0.6)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>12 Horas (AM/PM)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setTimeFormat('24h');
                    }}
                    className={`chicle-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                      timeFormat === '24h'
                        ? 'bg-cyan-400 text-black font-bold shadow-[0_0_14px_rgba(0,240,255,0.6)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>24 Horas (14:00)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: APARIENCIA & VISIÓN (SISTEMA ÓPTICO & ATMÓSFERA) ===================== */}
        {activeSubTab === 'atmosphere' && (
          <div className="space-y-4 animate-fade-in">


            {/* HERO CARD COMPACTA: SISTEMA ÓPTICO TÁCTICO & CONTROL ECLIPSE MOXEN */}
            <div className="w-full rounded-2xl bg-[#030816]/85 backdrop-blur-xl p-4 sm:p-5 border border-white/10 shadow-[0_8px_25px_rgba(0,0,0,0.35)] relative overflow-hidden space-y-3">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              
              {/* CABECERA INTEGRADA: Título + Interruptor Eclipse alineados horizontalmente */}
              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Sistema Óptico
                  </div>
                  <h3 className="text-sm sm:text-base font-anton uppercase tracking-wide text-white truncate">
                    MODO DE VISIÓN
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    Fase activa:{' '}
                    <span className="text-cyan-300 font-bold uppercase">
                      {opticMode === 'aurora' && '🌌 Aurora Neón'}
                      {opticMode === 'noir' && '🌑 Noir Oscuro'}
                      {opticMode === 'eink' && '☀️ Noir Claro'}
                      {opticMode === 'cobalt' && '🎯 Cobalto Azul'}
                    </span>
                  </p>
                </div>

                {/* INTERRUPTOR KINÉTICO DEL ECLIPSE COMPACTO */}
                <div className="flex items-center gap-2 bg-black/50 p-1.5 sm:p-2 rounded-xl border border-white/10 shrink-0">
                  <MoxenEclipseToggle
                    opticMode={opticMode}
                    onSelectMode={(mode) => {
                      setOpticMode(mode);
                    }}
                    size="md"
                  />
                </div>
              </div>

              {/* SELECTOR DE 4 MODOS EN BARRA DE PÍLDORAS COMPACTA Y SIMÉTRICA */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 relative z-10">
                {/* MODO 1: AURORA NEÓN */}
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setOpticMode('aurora');
                  }}
                  className={`chicle-btn h-10 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    opticMode === 'aurora'
                      ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.35)] ring-1 ring-cyan-400 font-bold optic-active-card'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-anton tracking-wider uppercase">Aurora</span>
                </button>

                {/* MODO 2: NOIR OSCURO (B&W MANGA) */}
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setOpticMode('noir');
                  }}
                  className={`chicle-btn h-10 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    opticMode === 'noir'
                      ? 'bg-white/20 border-white text-white shadow-[0_0_12px_rgba(255,255,255,0.25)] ring-1 ring-white font-bold optic-active-card'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-anton tracking-wider uppercase">Noir Oscuro</span>
                </button>

                {/* MODO 3: NOIR CLARO (MANGA B&W TINTA PURA SOBRE PAPEL BLANCO) */}
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setOpticMode('eink');
                  }}
                  className={`chicle-btn h-10 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    opticMode === 'eink'
                      ? 'bg-white border-white text-black shadow-[0_0_12px_rgba(255,255,255,0.4)] ring-1 ring-white font-bold optic-active-card'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-anton tracking-wider uppercase">Noir Claro</span>
                </button>

                {/* MODO 4: COBALTO AZUL (ENFOQUE & DETERMINACIÓN) */}
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setOpticMode('cobalt');
                  }}
                  className={`chicle-btn h-10 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    opticMode === 'cobalt'
                      ? 'bg-blue-600/30 border-blue-400 text-blue-100 shadow-[0_0_12px_rgba(96,165,250,0.35)] ring-1 ring-blue-400 font-bold optic-active-card'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Target className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                  <span className="text-xs font-anton tracking-wider uppercase">Cobalto</span>
                </button>
              </div>
            </div>

            {/* PERSONALIZADOR DE FONDO & COLOR */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-4">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest mb-1 transition-colors" style={{ color: 'var(--aura-color-1, #00f0ff)' }}>
                  <Palette className="w-4 h-4" /> Personalizador Visual
                </div>
                <h3 className="text-base sm:text-lg font-anton uppercase tracking-wide text-white">
                  Personalizador de Fondo & Color
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ajusta los tonos y nodos de color de tu fondo.
                </p>
              </div>

              {opticMode !== 'aurora' ? (
                <div className="relative z-10 p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <span className="text-xs font-anton tracking-wider uppercase text-slate-300 block">
                        Fondo Bloqueado en {opticMode === 'eink' ? 'Noir Claro' : opticMode === 'noir' ? 'Noir Oscuro' : 'Cobalto'}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        El fondo dinámico a color solo está activo en modo Aurora Neón.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setOpticMode('aurora');
                    }}
                    className="chicle-btn px-3 py-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-anton uppercase tracking-wider shrink-0 cursor-pointer"
                  >
                    Activar Aurora
                  </button>
                </div>
              ) : (
                <div className="relative z-10">
                  <MoxenMalla
                    activeSystemAuraName={systemAura?.name}
                    onApplyToSystem={(aura) => {
                      setSystemAura(aura);
                    }}
                    onResetSystem={() => {
                      setSystemAura(null);
                    }}
                  />
                </div>
              )}
            </div>

            {/* ILUMINACIÓN, HUD, TIPOGRAFÍA & RENDIMIENTO VISUAL */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-5">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
                <h3 className="text-xs font-anton text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Iluminación, HUD & Tipografía
                </h3>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-700/60 font-bold uppercase">
                  Ajustes Visuales
                </span>
              </div>

              {/* CALIBRACIÓN DE RESPLANDOR NEÓN (CONTROL DE BLOOM) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Resplandor Neón (Control de Bloom)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Regula la emisión luminosa de halos y sombras para confort visual en sesiones nocturnas.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setGlowIntensity('off');
                    }}
                    className={`chicle-btn px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                      glowIntensity === 'off'
                        ? 'bg-white text-black font-bold shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Apagado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setGlowIntensity('tactical');
                    }}
                    className={`chicle-btn px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                      glowIntensity === 'tactical'
                        ? 'bg-cyan-400 text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.5)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Táctico (50%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setGlowIntensity('neon');
                    }}
                    className={`chicle-btn px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                      glowIntensity === 'neon'
                        ? 'bg-cyan-300 text-black font-bold shadow-[0_0_18px_rgba(0,240,255,0.9)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Neón Puro</span>
                  </button>
                </div>
              </div>

              {/* MODO DE NAVEGACIÓN HUD (KAI NEXUS VS BARRA LATERAL) */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
                    <Compass className="w-4 h-4 text-cyan-400" /> Modo de Navegación HUD
                  </h4>
                  <p className="text-xs text-slate-400">
                    Elige entre el orbe flotante de KAI con menú orbital o la Barra Lateral expandible con KAI integrado en su cabecera.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setNavigationMode('nexus');
                    }}
                    className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                      navigationMode === 'nexus'
                        ? 'bg-cyan-400 text-black font-bold shadow-[0_0_14px_rgba(0,240,255,0.6)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="KAI Nexus: Orbe flotante con menú orbital"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>KAI Nexus (Flotante)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setNavigationMode('classic');
                    }}
                    className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                      navigationMode === 'classic'
                        ? 'bg-cyan-400 text-black font-bold shadow-[0_0_14px_rgba(0,240,255,0.6)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Barra Lateral: Menú expandible con KAI en la cabecera"
                  >
                    <Layout className="w-3.5 h-3.5" />
                    <span>Barra Lateral (KAI Menú)</span>
                  </button>
                </div>
              </div>

              {/* POSICIÓN / LADO DE LA BARRA & NAVEGACIÓN HUD (IZQUIERDA O DERECHA) */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
                    <Hand className="w-4 h-4 text-cyan-400" /> Posición de Navegación & Barra (Izquierda / Derecha)
                  </h4>
                  <p className="text-xs text-slate-400">
                    {navigationMode === 'classic'
                      ? 'Mueve la Barra Lateral al lado izquierdo o derecho de la pantalla según tu ergonomía y preferencia.'
                      : 'Posiciona el orbe flotante de KAI en el arco izquierdo o derecho según tu mano preferida.'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setHandDominance('left');
                    }}
                    className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                      handDominance === 'left'
                        ? 'bg-cyan-400 text-black font-bold shadow-[0_0_14px_rgba(0,240,255,0.6)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Mover barra lateral y controles a la izquierda (Zurda)"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Izquierda (Zurda)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setHandDominance('right');
                    }}
                    className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                      handDominance === 'right'
                        ? 'bg-cyan-400 text-black font-bold shadow-[0_0_14px_rgba(0,240,255,0.6)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Mover barra lateral y controles a la derecha (Diestra)"
                  >
                    <span>Derecha (Diestra)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* DENSIDAD TIPOGRÁFICA / LECTURA COMPACTA */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4 relative z-10">
                <div>
                  <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
                    <Type className="w-4 h-4 text-cyan-400" /> Densidad de Texto Compacta
                  </h4>
                  <p className="text-xs text-slate-400">
                    Reduce el tamaño de las fuentes y minimiza párrafos para una lectura rápida sin saturar la pantalla.
                  </p>
                </div>
                <ChicleToggle
                  checked={textDensityCompact}
                  onChange={handleToggleTextDensity}
                  color="cyan"
                  size="md"
                  ariaLabel="Alternar Densidad de Texto Compacta"
                  title={textDensityCompact ? 'Lectura compacta activa' : 'Lectura normal'}
                />
              </div>

              {/* MODO ZEN / RENDIMIENTO LIMPIO */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4 relative z-10">
                <div>
                  <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-emerald-400" /> Modo Zen (Ultra Enfoque & Batería)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Desactiva orbes y partículas continuas para máxima fluidez y ahorro de batería en móvil.
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

            {/* VISTA PREVIA DEL NÚCLEO CUÁNTICO DE CARGA (SINCRONIZADO EN TIEMPO REAL) */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-4">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest mb-1">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Núcleo Cuántico de Carga
                  </div>
                  <h3 className="text-base sm:text-lg font-anton uppercase tracking-wide text-white">
                    Sincronización de Animación de Carga
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tus 5 cristales cuánticos reflejan en tiempo real el color de tu atmósfera activa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    triggerTransition(1800);
                  }}
                  className="chicle-btn px-4 py-2 rounded-xl border border-cyan-400/50 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-anton uppercase tracking-wider shrink-0 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.25)] flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Probar Transición Pantalla Completa</span>
                </button>
              </div>

              <div className="relative z-10 py-5 rounded-2xl bg-black/50 border border-white/10 flex flex-col items-center justify-center">
                <QuantumCubeLoader size="md" speed="slow" showLabel={true} label="NÚCLEO SINCRONIZADO CON ESTA APARIENCIA" />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: JUEGO & KAI ===================== */}
        {activeSubTab === 'gameplay' && (
          <div className="space-y-6 animate-fade-in">
            {/* GUÍA DE BIENVENIDA & INDUCCIÓN DE KAI */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-950/40 via-[#030816]/90 to-blue-950/30 backdrop-blur-xl p-5 sm:p-6 border border-cyan-500/30 shadow-[0_12px_35px_rgba(0,0,0,0.4),0_0_20px_rgba(0,240,255,0.1)] relative overflow-hidden space-y-3">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Inducción y Bienvenida
                  </div>
                  <h3 className="text-sm sm:text-base font-anton uppercase tracking-wide text-white">
                    Guía de Bienvenida KAI
                  </h3>
                  <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                    Recalibra tu nombre, tu ritmo de jornada (24h), tu arquetipo de energía y tu propósito principal en cualquier momento sin perder tu nivel ni progreso.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    if (onOpenOnboarding) {
                      onOpenOnboarding();
                    } else {
                      window.dispatchEvent(new CustomEvent('lasolucion:open-onboarding'));
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-2 active:scale-95 shrink-0 self-start sm:self-auto font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Abrir Guía KAI</span>
                </button>
              </div>
            </div>

            {/* PERSONALIDAD & VOZ DE KAI */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-4">
              <span className="vi-grano opacity-5" aria-hidden="true" />

              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-xs font-anton text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Personalidad de KAI (Copiloto)
                </h3>
                <span className="text-[11px] font-mono text-slate-400">8-12 palabras por aviso</span>
              </div>

              <p className="text-xs text-slate-300 relative z-10">
                Elige cómo se comunica KAI contigo. Mensajes breves, directos y adaptados a tu estilo de crecimiento personal.
              </p>

              {/* Selector de Tonos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative z-10">
                {(Object.entries(KAI_VOICE_TONE_CONFIG) as [KaiVoiceTone, typeof KAI_VOICE_TONE_CONFIG[KaiVoiceTone]][]).map(([toneKey, config]) => {
                  const isSelected = (stats.kaiVoiceTone || 'coach') === toneKey;
                  return (
                    <button
                      key={toneKey}
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        usePlayerStore.getState().setKaiVoiceTone(toneKey);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-400/80 shadow-[0_0_16px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400/50'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-anton tracking-wider uppercase text-white font-bold">
                          {config.label}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {config.description}
                      </p>
                      <div className="pt-2 border-t border-white/[0.08] text-[10.5px] italic text-cyan-300/90 font-mono">
                        "{config.preview}"
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MECÁNICAS RPG */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-4">
              <span className="vi-grano opacity-5" aria-hidden="true" />

              <h3 className="text-xs font-anton text-purple-400 uppercase tracking-wider flex items-center gap-2 relative z-10">
                <Sparkles className="w-4 h-4" /> Mecánicas RPG & Gamificación
              </h3>

              {/* Tareas Dinámicas */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.08] relative z-10">
                <div>
                  <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-cyan-400"/> Generador de Tareas Dinámicas
                  </h4>
                  <p className="text-xs text-slate-400">
                    Detecta déficits de hábitos y propone tareas secundarias limitadas de bonificación de XP.
                  </p>
                </div>
                <ChicleToggle
                  checked={!!settings.enableDynamicQuests}
                  onChange={() => toggleSetting('enableDynamicQuests')}
                  color="cyan"
                  size="md"
                  ariaLabel="Alternar Generador de Tareas Dinámicas"
                />
              </div>

              {/* Familiar RPG */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.08] relative z-10">
                <div>
                  <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
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
              <div className="flex items-center justify-between gap-4 py-2 relative z-10">
                <div>
                  <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
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
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-4">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-anton text-cyan-400 uppercase tracking-wider">
                    Compañero Holográfico KAI
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  {stats.kaiShape === 'custom' ? 'Forja IA Activa' : '6 Formas Día 0'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-black/40 border border-white/10 relative z-10">
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
                    <strong className="text-sm font-anton text-white tracking-wider uppercase">
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
                    className="chicle-btn px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.4)] flex items-center gap-1.5 shrink-0 active:scale-95"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Taller de KAI</span>
                  </button>
                )}
              </div>
            </div>

            {/* PROTOCOLO DE INDUCCIÓN Y GUÍA TÁCTICA DE KAI */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-4">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-anton text-cyan-400 uppercase tracking-wider">
                    Bienvenida y Tutorial Guiado de KAI
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  5 Pasos
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed relative z-10">
                Repasa cómo funciona la app, dónde están las pestañas, cómo crear y marcar tareas y cómo aprovechar la Inteligencia Artificial de KAI.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    useUIStore.getState().openTacticalGuide(1);
                  }}
                  className="chicle-btn px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.4)] flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Repasar Tutorial de KAI</span>
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
                  className="chicle-btn px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white font-anton uppercase text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Restablecer Avisos</span>
                </button>
              </div>
            </div>

            {/* LABORATORIO & HERRAMIENTAS TÁCTICAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Simulador */}
              <div className="w-full rounded-2xl bg-[#020712]/90 border border-white/10 p-5 space-y-3 shadow-lg flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-anton text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-fuchsia-400" /> Simulador Táctico
                    </span>
                    <span className="text-[10px] font-mono text-fuchsia-300 bg-fuchsia-950/70 border border-fuchsia-500/40 px-2 py-0.5 rounded-full uppercase">
                      Modo Prueba
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
                  className="chicle-btn w-full py-2.5 px-4 bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-500/60 text-fuchsia-200 rounded-xl text-xs font-anton uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Abrir Simulador</span>
                </button>
              </div>

              {/* Oráculo IA */}
              <div className="w-full rounded-2xl bg-[#020712]/90 border border-white/10 p-5 space-y-3 shadow-lg flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-anton text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" /> Oráculo IA
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded-full uppercase">
                      KAI
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
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-6">
              <span className="vi-grano opacity-5" aria-hidden="true" />

              {/* HEADER DE TESORERÍA */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                <div>
                  <h3 className="text-sm font-anton uppercase tracking-wider text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" /> Finanzas & Tesorería
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configura la divisa base para registros diarios, balances y análisis temporal.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono font-black text-xs">
                  {currentCurrency} Activo
                </span>
              </div>

              {/* TOGGLE MODULAR: TESORERÍA EN MISIONES */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/10 relative z-10">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-anton tracking-wider text-white uppercase flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    Módulo de Tesorería en Misiones
                  </div>
                  <p className="text-xs text-slate-400">
                    Muestra el balance rápido en Misiones. Desactívalo para una vista 100% enfocada solo en tareas.
                  </p>
                </div>
                <ChicleToggle
                  checked={settings.enableFinanceModule ?? true}
                  onChange={(val) => {
                    soundFX.playClick();
                    onUpdateSettings({ ...settings, enableFinanceModule: val });
                  }}
                  color="emerald"
                  size="md"
                  ariaLabel="Alternar Módulo de Tesorería en Misiones"
                />
              </div>

              {/* SELECTOR COMPACTO DE MONEDA */}
              <div className="relative z-10">
                <label className="block text-xs font-anton text-slate-300 uppercase tracking-wider mb-2">
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
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-[0_0_12px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400'
                            : 'bg-white/[0.04] border-white/10 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-mono font-black text-amber-300">{c.symbol}</span>
                            <span className="text-xs font-anton tracking-wider uppercase text-cyan-300">{c.code}</span>
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
              <div className="pt-4 border-t border-white/10 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-xs font-anton text-slate-300 uppercase tracking-wider flex items-center gap-2">
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
                      className={`chicle-btn px-3.5 py-1.5 rounded-xl text-xs font-anton tracking-wider transition-all cursor-pointer ${
                        savingsTarget === rate
                          ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : 'bg-white/[0.05] border border-white/15 text-slate-300 hover:text-white hover:border-white/30'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* INTEGRACIÓN MISIONES */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-start gap-3 relative z-10">
                <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-700/40 text-emerald-400 shrink-0 mt-0.5">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-anton tracking-wider uppercase text-white">Acreditación Automática desde Tareas</div>
                  <p className="text-slate-400 leading-relaxed">
                    Las recompensas de tareas completadas se suman automáticamente al balance de tesorería.
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
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-4">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />
                  <h3 className="text-xs font-anton text-white uppercase tracking-wider">
                    Puente Directo Tablet ↔ Teléfono
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-700/60">
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
                  className="chicle-btn min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/70 text-cyan-200 rounded-xl text-xs font-anton uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-sm active:scale-95"
                >
                  <Upload className={`w-4 h-4 ${isForceSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isForceSyncing ? 'Subiendo datos...' : 'Subir datos a la nube'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePullFromCloud}
                  disabled={isPullingCloud || isForceSyncing}
                  className="chicle-btn min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400/70 text-emerald-200 rounded-xl text-xs font-anton uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-sm active:scale-95"
                >
                  <Download className={`w-4 h-4 ${isPullingCloud ? 'animate-bounce' : ''}`} />
                  <span>{isPullingCloud ? 'Cargando datos...' : 'Traer datos a este equipo'}</span>
                </button>
              </div>

              {cloudActionToast && (
                <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in relative z-10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{cloudActionToast}</span>
                </div>
              )}
            </div>

            {/* 2. ESTADO DE FIRESTORE & USUARIO */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-5">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                <h3 className="text-sm font-anton text-white uppercase tracking-wider flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400" /> Sincronización en la Nube
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/10 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/15 flex items-center justify-center shrink-0">
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
                    <p className="text-base font-anton uppercase tracking-wider text-white">
                      {user ? (user.displayName || user.email) : 'Modo Local (Sin autenticar)'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {user 
                        ? `Conectado a la nube: ${user.email}` 
                        : 'Tu partida se almacena temporalmente en la memoria del navegador.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {user ? (
                    <button 
                      onClick={() => signOut()}
                      className="chicle-btn flex items-center justify-center gap-1.5 px-4 py-2 bg-white/[0.05] hover:bg-white/10 text-slate-200 rounded-xl text-xs font-anton uppercase tracking-wider border border-white/15 transition-colors cursor-pointer active:scale-95"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Salir</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => signInWithGoogle()}
                      className="chicle-btn flex items-center justify-center gap-1.5 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl text-xs font-anton uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.4)] active:scale-95 font-bold"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Conectar Google</span>
                    </button>
                  )}
                </div>
              </div>

              {/* RESUMEN CONCISO DE PROTECCIÓN */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-300 flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Protección en tiempo real: Nivel, XP, Tareas, Hábitos, Bitácora y Tesorería.</span>
                </div>
                {user && cloudSync?.lastSyncTime && (
                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    Última sinc: {cloudSync.lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            {/* 3. RESPALDO LOCAL JSON & CSV */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-4">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="flex items-start gap-3 relative z-10">
                <div className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/15 text-cyan-300 shrink-0">
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
                  className="chicle-btn min-h-[44px] px-4 py-2.5 bg-white/[0.05] hover:bg-white/10 text-cyan-300 hover:text-white font-anton text-xs uppercase tracking-wider rounded-xl border border-white/15 hover:border-cyan-400 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Descargar Copia</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="chicle-btn min-h-[44px] px-4 py-2.5 bg-white/[0.05] hover:bg-white/10 text-blue-300 hover:text-white font-anton text-xs uppercase tracking-wider rounded-xl border border-white/15 hover:border-blue-400 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <span>Exportar Bitácora</span>
                </button>

                <label className="chicle-btn min-h-[44px] px-4 py-2.5 bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white font-anton text-xs uppercase tracking-wider rounded-xl border border-white/15 hover:border-white/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-center active:scale-95">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Restaurar Copia</span>
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
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-4">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="flex items-start gap-3 relative z-10">
                <div className="p-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shrink-0">
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
                  className="chicle-btn min-h-[44px] px-4 py-2.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white font-anton text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Bajar Horarios (CSV)</span>
                </button>

                <label className="chicle-btn min-h-[44px] px-4 py-2.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 hover:text-white font-anton text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-center active:scale-95">
                  <Upload className="w-4 h-4 text-emerald-400" />
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
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-4">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-anton text-white uppercase tracking-wider">
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

              <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
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
                    className="chicle-btn flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-anton text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all cursor-pointer shrink-0 active:scale-95"
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
                    className="chicle-btn flex items-center justify-center gap-2 px-4 py-2 bg-blue-900/80 hover:bg-blue-800 text-cyan-300 border border-cyan-500/40 text-xs font-anton uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
                  >
                    <Share className="w-3.5 h-3.5" />
                    Instrucciones iOS
                  </button>
                ) : (
                  <div className="text-[11px] font-mono text-slate-400 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
                    Usa el menú del navegador → "Agregar a pantalla de inicio"
                  </div>
                )}
              </div>

              {showIOSInstructions && (
                <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/40 text-xs text-slate-300 space-y-2.5 animate-in fade-in relative z-10">
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

              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-anton uppercase tracking-wider text-slate-300">Caché & Actualizaciones en Vivo</p>
                    {pwaBuildInfo.checking ? (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/10">
                        Verificando versión...
                      </span>
                    ) : !pwaBuildInfo.serverRev || pwaBuildInfo.serverRev === pwaBuildInfo.localRev ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        Última actualización activa
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40">
                        Nueva versión disponible
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Build activo: <span className="text-cyan-300">{pwaBuildInfo.localRev}</span>
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
                  className="chicle-btn flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/15 hover:border-cyan-400 text-[11px] font-anton uppercase tracking-wider text-cyan-300 transition-colors cursor-pointer shrink-0 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Vaciar Caché y Actualizar
                </button>
              </div>
            </div>

            {/* 6. CREDENCIALES DE IA (GEMINI) */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-xl p-5 sm:p-6 border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden space-y-4">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-anton text-white uppercase tracking-wider">
                    Clave de Inteligencia Artificial (Gemini API)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-700/60 font-bold">
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
                    className="w-full bg-[#010810] border border-white/15 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    {showApiKey ? 'Ocultar' : 'Ver'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-500 font-mono">
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
                        className="px-3 py-1.5 rounded-xl text-xs font-anton uppercase text-slate-400 hover:text-red-400 bg-white/[0.05] border border-white/10 active:scale-95"
                      >
                        Limpiar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveApiKey}
                      className="px-4 py-1.5 rounded-xl text-xs font-anton uppercase tracking-wider bg-cyan-400 hover:bg-cyan-300 text-black transition-all shadow-[0_0_10px_rgba(0,240,255,0.4)] active:scale-95"
                    >
                      Guardar Clave
                    </button>
                  </div>
                </div>

                {apiKeyToast && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{apiKeyToast}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 7. ZONA CRÍTICA */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#140205]/90 backdrop-blur-xl p-6 border border-red-500/30 shadow-[0_12px_35px_rgba(239,68,68,0.1),inset_0_1px_0_rgba(255,255,255,0.06)] relative overflow-hidden space-y-4">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="flex items-start gap-3 relative z-10">
                <div className="p-3 rounded-2xl bg-red-950/80 border border-red-700/60 text-red-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-anton text-red-400 uppercase tracking-wider">
                    Reinicio Total de Partida
                  </h4>
                  <p className="text-xs text-red-300/80 mt-1 leading-relaxed">
                    Restablece tu progreso local y en la nube al Nivel 1 inicial. Acción irreversible.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-red-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
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
                  className={`chicle-btn px-5 py-2.5 rounded-xl text-xs font-anton uppercase tracking-wider transition-all border cursor-pointer active:scale-95 ${
                    confirmReset 
                      ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                      : 'bg-red-950/60 text-red-400 hover:text-white hover:bg-red-700 border-red-800/80'
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
            <Suspense fallback={
              <div className="p-8 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Cargando simulador táctico...
              </div>
            }>
              <ScenarioSimulatorPanel />
            </Suspense>
          </div>
        )}
      </div>

      {isOracleOpen && (
        <Suspense fallback={null}>
          <OracleModal 
            isOpen={isOracleOpen}
            onClose={() => setIsOracleOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};
