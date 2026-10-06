import React, { useState, useEffect } from 'react';
import { 
  Settings, Sparkles, Activity, ShieldAlert, LogOut, User, LogIn, 
  Cloud, CloudOff, Download, Upload, Database, Check, RefreshCw, 
  ShieldCheck, HardDrive, FileSpreadsheet, Cpu, CheckCircle2,
  Coins, Volume2, VolumeX, Target, Sun, Moon, Laptop, ArrowUpRight, CheckCheck,
  SlidersHorizontal, Smartphone, Share, PlusSquare, FlaskConical,
  Compass, Eye, Layout, Bell, BellOff, BellRing, Zap, Flame, Timer
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
import { 
  SUPPORTED_CURRENCIES, 
  getSavedCurrencySymbol, 
  setSavedCurrencySymbol, 
  getSavedSavingsTarget, 
  setSavedSavingsTarget 
} from '../utils/finance';
import { useUIStore } from '../store/useUIStore';
import { CloudSyncResult } from '../hooks/useCloudSync';

interface SettingsViewProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onResetAccount?: () => void;
  cloudSync?: CloudSyncResult;
}

type SettingsSubTab = 'general' | 'finances' | 'oracle' | 'simulator' | 'cloud' | 'backup' | 'danger';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAccount,
  cloudSync: propCloudSync,
}) => {
  const { user, signInWithGoogle, signOut } = useAuth();
  const pwa = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const game = gameEngine as any;
  const cloudSync = propCloudSync || game?.cloudSync;
  const { soundEnabled, toggleSound, themeMode, navigationMode, setNavigationMode } = useUIStore();
  
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('general');
  const [currentCurrency, setCurrentCurrency] = useState<string>(getSavedCurrencySymbol);
  const [savingsTarget, setSavingsTarget] = useState<number>(getSavedSavingsTarget);
  const [audioTesting, setAudioTesting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(notificationService.getPermission());
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [notifTestFeedback, setNotifTestFeedback] = useState<string | null>(null);
  const [currencyChangedToast, setCurrencyChangedToast] = useState<string | null>(null);

  const todayTasks = useTaskStore(s => s.tasksByDate[getTodayDateString()] || []);
  const streakDays = usePlayerStore(s => s.stats.streakDays);

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
      setNotifTestFeedback('❌ Primero activa los permisos de notificación');
      setTimeout(() => setNotifTestFeedback(null), 3000);
      return;
    }
    const ok = await notificationService.pushToOS(
      '🔔 La Solución - Notificaciones Activas',
      'Las notificaciones de La Solución están funcionando correctamente.',
      { tag: 'test-notif', renotify: true }
    );
    if (ok) {
      setNotifTestFeedback('✓ Notificación enviada al sistema operativo');
    } else {
      setNotifTestFeedback('⚠️ No se pudo enviar — verifica los permisos del dispositivo');
    }
    setTimeout(() => setNotifTestFeedback(null), 4000);
  };

  const handleSetTheme = (mode: 'auto' | 'dark' | 'light') => {
    soundFX.playClick();
    useUIStore.getState().setThemeMode(mode);
  };

  const handleForceSync = async () => {
    if (!cloudSync?.forceSyncNow) return;
    setIsForceSyncing(true);
    soundFX.playClick();
    try {
      await cloudSync.forceSyncNow();
    } finally {
      setTimeout(() => setIsForceSyncing(false), 600);
    }
  };

  const toggleSetting = (key: keyof GameSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key]
    });
  };

  const handleExportBackup = () => {
    try {
      soundFX.playClick();
      const exportPayload = exportUserData({
        stats: game?.stats,
        tasks: game?.tasks,
        reflections: game?.reflections,
        habitMastery: game?.habitMastery,
        customHabits: game?.customHabits,
        settings,
      });

      soundFX.playSuccess();
      setExportFeedback(`✓ Respaldo JSON generado exitosamente (${exportPayload.tasks.length} misiones)`);
      setTimeout(() => setExportFeedback(null), 4500);
    } catch (err) {
      console.error('Error al exportar:', err);
      alert('Error al generar la copia de seguridad.');
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
      alert('Error al exportar la bitácora.');
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
        Object.entries(parsed).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            safeSetItem(key, typeof val === 'string' ? val : JSON.stringify(val));
            importedKeys++;
          }
        });

        soundFX.playLevelUp();
        setImportStatus(`¡Copia restaurada con éxito! (${importedKeys} registros)`);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        alert('Formato de copia de seguridad inválido.');
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
      alert('Error al exportar el horario.');
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
        alert(`Error al importar horario: ${err.message || 'Formato inválido.'}`);
      }
    };
    reader.readAsText(file);
  };

  const tabsConfig = [
    { id: 'general' as SettingsSubTab, label: 'General', icon: SlidersHorizontal, color: 'text-cyan-400' },
    { id: 'finances' as SettingsSubTab, label: 'Tesorería', icon: Coins, color: 'text-amber-400' },
    { id: 'oracle' as SettingsSubTab, label: 'Oráculo IA', icon: Cpu, color: 'text-cyan-300' },
    { id: 'simulator' as SettingsSubTab, label: 'Simulador', icon: FlaskConical, color: 'text-fuchsia-400' },
    { id: 'cloud' as SettingsSubTab, label: 'Nube & Sesión', icon: Cloud, color: 'text-blue-400' },
    { id: 'backup' as SettingsSubTab, label: 'Datos & Backup', icon: Database, color: 'text-emerald-400' },
    { id: 'danger' as SettingsSubTab, label: 'Zona Crítica', icon: ShieldAlert, color: 'text-red-400' }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER & SUB-TABS NAVIGATION */}
      <div className="bg-[#00152b] rounded-2xl border border-slate-800 p-3 sm:p-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-3">
        <div className="flex items-center justify-between px-1 flex-wrap gap-2">
          <h2 className="text-white font-black text-lg flex items-center gap-2 uppercase tracking-wider">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Configuración del Sistema</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setActiveSubTab('simulator');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.3)] transition-all cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>SIMULADOR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setIsOracleOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>ORÁCULO IA</span>
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-400 bg-[#000e1f] px-2.5 py-1 rounded-lg border border-slate-800">
              PANEL TÁCTICO
            </span>
          </div>
        </div>

        {/* SUB-TABS NAV BAR */}
        <div className="flex items-center gap-1.5 p-1 bg-[#000d1c] rounded-xl border border-slate-800/80 overflow-x-auto no-scrollbar">
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? tab.id === 'danger'
                      ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                      : 'bg-[#00284d] text-white border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#001830]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
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
        {/* ===================== TAB 1: GENERAL & UI ===================== */}
        {activeSubTab === 'general' && (
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
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
                  <button 
                    onClick={toggleSound}
                    className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 cursor-pointer ${soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${soundEnabled ? 'left-6.5 translate-x-[24px]' : 'left-0.5'}`}></div>
                  </button>
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
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
                        className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border bg-[#001830] border-cyan-800/60 text-cyan-400 hover:bg-cyan-950 cursor-pointer"
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
                      <button
                        onClick={() => handleToggleNotifSetting('habitReminders')}
                        className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 cursor-pointer ${
                          notifSettings.habitReminders ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                          notifSettings.habitReminders ? 'left-5.5 translate-x-[22px]' : 'left-0.5'
                        }`} />
                      </button>
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
                      <button
                        onClick={() => handleToggleNotifSetting('morningBriefing')}
                        className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 cursor-pointer ${
                          notifSettings.morningBriefing ? 'bg-amber-500' : 'bg-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                          notifSettings.morningBriefing ? 'left-5.5 translate-x-[22px]' : 'left-0.5'
                        }`} />
                      </button>
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
                        <button
                          onClick={() => handleToggleNotifSetting('nightlyReflection')}
                          className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 cursor-pointer ${
                            notifSettings.nightlyReflection ? 'bg-indigo-500' : 'bg-slate-700'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                            notifSettings.nightlyReflection ? 'left-5.5 translate-x-[22px]' : 'left-0.5'
                          }`} />
                        </button>
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
                      <button
                        onClick={() => handleToggleNotifSetting('bossAlert')}
                        className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 cursor-pointer ${
                          notifSettings.bossAlert ? 'bg-red-500' : 'bg-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                          notifSettings.bossAlert ? 'left-5.5 translate-x-[22px]' : 'left-0.5'
                        }`} />
                      </button>
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
                      <button
                        onClick={() => handleToggleNotifSetting('streakAlert')}
                        className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 cursor-pointer ${
                          notifSettings.streakAlert ? 'bg-orange-500' : 'bg-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                          notifSettings.streakAlert ? 'left-5.5 translate-x-[22px]' : 'left-0.5'
                        }`} />
                      </button>
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
                      <button
                        onClick={() => handleToggleNotifSetting('pomodoroComplete')}
                        className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 cursor-pointer ${
                          notifSettings.pomodoroComplete ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                          notifSettings.pomodoroComplete ? 'left-5.5 translate-x-[22px]' : 'left-0.5'
                        }`} />
                      </button>
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      themeMode === 'dark' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Oscuro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetTheme('light')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      themeMode === 'light' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Claro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetTheme('auto')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
            </div>

            {/* MECÁNICAS RPG */}
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
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
                <button 
                  onClick={() => toggleSetting('enableDynamicQuests')}
                  className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 cursor-pointer ${settings.enableDynamicQuests ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${settings.enableDynamicQuests ? 'left-6.5 translate-x-[24px]' : 'left-0.5'}`}></div>
                </button>
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
                <button 
                  onClick={() => toggleSetting('enableCompanion')}
                  className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 cursor-pointer ${settings.enableCompanion ? 'bg-purple-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${settings.enableCompanion ? 'left-6.5 translate-x-[24px]' : 'left-0.5'}`}></div>
                </button>
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
                <button 
                  onClick={() => toggleSetting('strictMode')}
                  className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 cursor-pointer ${settings.strictMode ? 'bg-red-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${settings.strictMode ? 'left-6.5 translate-x-[24px]' : 'left-0.5'}`}></div>
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
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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

        {/* ===================== TAB: ORÁCULO IA ===================== */}
        {activeSubTab === 'oracle' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 font-mono">
                    <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                    Núcleo Central // Compilador Neural (IA)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Asistente de inteligencia artificial para diseño, balanceo y calibración de tu rutina y hábitos.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-700/60 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  GEMINI AI
                </span>
              </div>

              {/* TARJETA CYBERPUNK PRINCIPAL */}
              <div className="bg-gradient-to-br from-cyan-950/60 via-[#001b33] to-[#000e1f] border border-cyan-500/40 p-5 sm:p-6 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.15)] space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 shrink-0">
                    <Cpu className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Compilación & Asesoría Estratégica
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      El Oráculo analiza tus compromisos horarios, energía y metas personales para generar bloques y hábitos óptimos sin sobrecarga cognitiva.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#000f20]/80 border border-cyan-900/50 text-xs space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Diagnóstico
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Evalúa tus hábitos actuales y balance de maestría.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#000f20]/80 border border-cyan-900/50 text-xs space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" /> Calibración
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Ajusta horarios y frecuencias según tu semana real.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#000f20]/80 border border-cyan-900/50 text-xs space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Inyección
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Añade las nuevas rutinas directamente a tu juego.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setIsOracleOpen(true);
                  }}
                  className="w-full min-h-[46px] px-5 py-3 bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2.5 transition-all cursor-pointer font-mono"
                >
                  <Cpu className="w-4 h-4 text-black" />
                  <span>ABRIR NÚCLEO CENTRAL // ORÁCULO IA</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: SIMULADOR DE ESCENARIOS ===================== */}
        {activeSubTab === 'simulator' && (
          <div className="animate-fade-in">
            <ScenarioSimulatorPanel />
          </div>
        )}

        {/* ===================== TAB 3: CUENTA & NUBE ===================== */}
        {activeSubTab === 'cloud' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#00152b] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-5">
              {/* ESTADO HEADER */}
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

                {user ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={handleForceSync}
                      disabled={isForceSyncing}
                      className="flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-950/80 hover:bg-blue-900/80 border border-blue-500/50 text-cyan-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                      title="Forzar guardado inmediato"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isForceSyncing ? 'animate-spin' : ''}`} />
                      {isForceSyncing ? 'Guardando...' : 'Sincronizar'}
                    </button>
                    <button 
                      onClick={() => signOut()}
                      className="flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Salir
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => signInWithGoogle()}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    Acceder con Google
                  </button>
                )}
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

              {/* RESPALDO EN GOOGLE DRIVE / NUBE DE GMAIL */}
              <GoogleDriveSyncCard />

              {/* SECCIÓN PWA INSTALABLE */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
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
                      PWA Disponible
                    </span>
                  )}
                </div>

                <div className="bg-[#001020] border border-cyan-900/50 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-100">
                      Instala TaskQuest en tu teléfono, tablet o escritorio
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
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all cursor-pointer shrink-0"
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
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-900/80 hover:bg-blue-800 text-cyan-300 border border-cyan-500/40 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
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
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: DATOS & BACKUP ===================== */}
        {activeSubTab === 'backup' && (
          <div className="space-y-6 animate-fade-in">
            {/* FEEDBACK DE EXPORTACIÓN / IMPORTACIÓN */}
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

            {/* RESPALDO EN GOOGLE DRIVE / NUBE DE GMAIL */}
            <GoogleDriveSyncCard />

            {/* RESPALDO TOTAL LOCAL */}
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
                  className="min-h-[44px] px-4 py-2.5 bg-[#002244] hover:bg-[#003366] text-cyan-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl border border-cyan-700/60 hover:border-cyan-400 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Exportar (JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="min-h-[44px] px-4 py-2.5 bg-[#001f3f] hover:bg-[#002d5c] text-blue-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl border border-blue-700/60 hover:border-blue-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <span>Bitácora (CSV)</span>
                </button>

                <label className="min-h-[44px] px-4 py-2.5 bg-[#001830] hover:bg-[#002448] text-slate-300 hover:text-cyan-200 font-black text-xs uppercase tracking-wider rounded-xl border border-slate-700 hover:border-cyan-600 flex items-center justify-center gap-2 transition-all cursor-pointer text-center">
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

            {/* PLANTILLAS DE HORARIOS */}
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
                  className="min-h-[44px] px-4 py-2.5 bg-[#002211] hover:bg-[#00331a] text-emerald-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl border border-emerald-700/60 hover:border-emerald-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Bajar Horarios (CSV)</span>
                </button>

                <label className="min-h-[44px] px-4 py-2.5 bg-[#001810] hover:bg-[#002418] text-emerald-100/80 hover:text-emerald-200 font-black text-xs uppercase tracking-wider rounded-xl border border-slate-700 hover:border-emerald-600 flex items-center justify-center gap-2 transition-all cursor-pointer text-center">
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

            {/* NÚCLEO CENTRAL / ORÁCULO IA */}
            <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-[#03070d] border border-cyan-500/30 p-5 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.1)] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-cyan-300 uppercase tracking-widest flex items-center gap-2 font-mono">
                  <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                  Núcleo Central // Compilador Neural (IA)
                </h4>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/60">
                  ORÁCULO
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Transfiere al Núcleo Central tus parámetros de tiempo y compromisos semanales para generar y calibrar subrutinas de hábitos con asistencia de IA.
              </p>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setIsOracleOpen(true);
                }}
                className="w-full min-h-[44px] px-4 py-2.5 bg-cyan-600/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl border border-cyan-500/40 hover:border-cyan-400 flex items-center justify-center gap-2 transition-all cursor-pointer font-mono"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Conectar con Núcleo Central</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: ZONA CRÍTICA ===================== */}
        {activeSubTab === 'danger' && (
          <div className="space-y-6 animate-fade-in">
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
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border cursor-pointer ${
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
      </div>

      <OracleModal 
        isOpen={isOracleOpen}
        onClose={() => setIsOracleOpen(false)}
      />
    </div>
  );
};
