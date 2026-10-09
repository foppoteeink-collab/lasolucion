import React, { useState } from 'react';
import { 
  Flame, 
  Coins, 
  Bell, 
  Settings, 
  Gift, 
  Shield, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Moon, 
  Cloud, 
  CloudOff, 
  LogIn, 
  RefreshCw,
  Sparkles,
  Zap,
  Activity,
  Upload,
  Download,
  CheckCircle2
} from 'lucide-react';
import { AppNotification } from '../types';
import { soundFX } from '../utils/audio';
import { SciFiLogo } from './SciFiLogo';
import { MainLogo } from './MainLogo';
import { useTimer } from '../context/TimerContext';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedNumber } from './AnimatedNumber';
import { useAuth } from '../context/AuthContext';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useUIStore } from '../store/useUIStore';
import { getRankForLevel } from '../data/defaults';
import { CloudSyncResult } from '../hooks/useCloudSync';
import { ArchetypeGlyph } from './ArchetypeGlyph';
import { getTodayDateString, getYesterdayDateString } from '../utils/date';

interface HeaderProps {
  onOpenProfile?: () => void;
  notifications: AppNotification[];
  onClearNotifications: () => void;
  hasUnclaimedDailyReward: boolean;
  onOpenDailyRewards: () => void;
  signOut?: () => void;
  onGoToCover: () => void;
  onGoToSettings?: () => void;
  onOpenNightlyReflection?: () => void;
  onRegisterWakeUp?: (dateStr?: string, customWakeTime?: string) => void;
  cloudSync?: CloudSyncResult;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  notifications,
  onClearNotifications,
  hasUnclaimedDailyReward,
  onOpenDailyRewards,
  signOut,
  onGoToCover,
  onGoToSettings,
  onOpenNightlyReflection,
  onRegisterWakeUp,
  cloudSync,
}) => {
  const { user, signInWithGoogle, signOut: authSignOut } = useAuth();
  
  const { stats } = usePlayerStore();
  const { themeMode, soundEnabled, toggleSound } = useUIStore();
  const { isPomodoroOpen, mode: timerMode, category: timerCategory } = useTimer();
  
  const handleSignOut = authSignOut;
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const [syncMenuToast, setSyncMenuToast] = useState<string | null>(null);
  const [isSyncBusy, setIsSyncBusy] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const currentRank = getRankForLevel(stats.level);
  const displayRankTitle = stats.rankTitle && (stats.level === 1 || stats.rankTitle !== 'Chispazo de Voluntad')
    ? (stats.rankTitle === 'Aventurero' ? currentRank.title : stats.rankTitle)
    : currentRank.title;

  const xpPercent = Math.min(100, Math.max(0, (stats.currentXp / stats.requiredXp) * 100));
  const hpPercent = Math.min(100, Math.max(0, ((stats.hp || 100) / (stats.maxHp || 100)) * 100));

  // ─── Sleep Status Logic ───────────────────────────────────────────────────
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();
  const sleepLogs = stats?.sleepLogs || {};
  // Find pending sleep: bedtime recorded but no wakeTime (today or yesterday)
  const pendingSleepDate =
    (sleepLogs[todayStr]?.bedtime && !sleepLogs[todayStr]?.wakeTime) ? todayStr
    : (sleepLogs[yesterdayStr]?.bedtime && !sleepLogs[yesterdayStr]?.wakeTime) ? yesterdayStr
    : null;
  const todaySleep = sleepLogs[todayStr];
  // States: 'pending' = bedtime set, no wakeTime | 'complete' = both set | 'none' = no data
  const sleepState: 'pending' | 'complete' | 'none' =
    pendingSleepDate ? 'pending'
    : (todaySleep?.bedtime && todaySleep?.wakeTime) ? 'complete'
    : 'none';

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'entrenamiento': return '#ef4444'; // Rojo (red-500)
      case 'limpieza': return '#10b981'; // Verde (emerald-500)
      case 'comida': return '#f59e0b'; // Naranja (amber-500)
      case 'estudio': return '#3b82f6'; // Azul (blue-500)
      case 'creativo': return '#d946ef'; // Fucsia (fuchsia-500)
      case 'trabajo': return '#6366f1'; // Indigo
      default: return '#00f0ff'; // Cyan por defecto
    }
  };

  // Determinar el color del aura de KAI
  let kaiPulseColor = '#00f0ff'; // Cyan base
  let isKaiPulsing = false;
  let pulseSpeed = 4;

  if (isPomodoroOpen) {
    isKaiPulsing = true;
    if (timerMode === 'work') {
      kaiPulseColor = getCategoryColor(timerCategory);
      pulseSpeed = 1.5; // Concentración intensa
    } else {
      kaiPulseColor = '#10b981'; // Verde suave (Descanso)
      pulseSpeed = 4;
    }
  }

  const [rainbowColor, setRainbowColor] = React.useState('#00f0ff');
  React.useEffect(() => {
    if (isKaiPulsing) return;
    
    const cycleColors = [
      '#ffffff',
      '#00f0ff',
      '#00f0ff',
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#00f0ff',
      '#ffffff',
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % cycleColors.length;
      setRainbowColor(cycleColors[i]);
    }, 1250); // 8 colors * 1.25s = 10s cycle
    
    return () => clearInterval(interval);
  }, [isKaiPulsing]);

  const activeHelixColor = isKaiPulsing ? kaiPulseColor : rainbowColor;

  return (
    <header className="sticky top-0 z-50 bg-[#010a12]/95 backdrop-blur-xl flex flex-col border-b border-cyan-500/30 shadow-[0_4px_30px_rgba(0,240,255,0.12)]">
      {/* ROW 1: BRANDING & UTILITIES */}
      <div className="px-3 sm:px-5 py-2 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* 1. App Logo (Acts as Home Button) */}
          <button
            onClick={() => { soundFX.playClick(); onGoToCover(); }}
            className="flex items-center gap-2 sm:gap-2.5 hover:opacity-90 transition-opacity shrink-0 group cursor-pointer"
            title="Ir al Núcleo Central"
          >
            <div className="relative group flex items-center justify-center p-1">
              {/* KAI Lottie Pulse Effect */}
              <AnimatePresence>
                {isKaiPulsing && (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full"
                      style={{ border: `1.5px solid ${kaiPulseColor}` }}
                    />
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.4, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeOut", delay: pulseSpeed / 3 }}
                      className="absolute inset-0 rounded-full"
                      style={{ border: `1px solid ${kaiPulseColor}` }}
                    />
                  </>
                )}
              </AnimatePresence>

              {/* Halo base reactivo */}
              <div 
                className="absolute inset-0 blur-md rounded-full transition-colors duration-1000" 
                style={{ backgroundColor: `${activeHelixColor}40`, opacity: isKaiPulsing ? 0.8 : 0.4 }}
              />
              <div className="relative z-10 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
                {/* @ts-ignore */}
                <l-helix size="28" speed="2.5" color={activeHelixColor}></l-helix>
              </div>
            </div>
            <div className="flex flex-col text-left justify-center pt-0.5">
              <MainLogo size="md" forceColor={isKaiPulsing ? kaiPulseColor : undefined} />
            </div>
          </button>

          {/* RIGHT: UTILITIES */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Daily Reward */}
            <button
              onClick={() => { soundFX.playClick(); onOpenDailyRewards(); }}
              title="Recompensa Cuántica Diaria"
              className={`relative p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
                hasUnclaimedDailyReward
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse shadow-[0_0_14px_rgba(245,158,11,0.5)]'
                  : 'bg-[#011420]/80 text-cyan-200 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/40'
              }`}
            >
              <Gift className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {hasUnclaimedDailyReward && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-black shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-ping" />
              )}
            </button>

            {/* Ritual Nocturno / Cierre de Jornada */}
            {onOpenNightlyReflection && (
              <button
                onClick={() => { soundFX.playClick(); onOpenNightlyReflection(); }}
                title="Cierre de Jornada / Reflexión Cuántica"
                className="p-1.5 sm:p-2 rounded-xl bg-[#011420]/80 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
              >
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                <span className="hidden lg:inline text-[10px] font-mono font-bold tracking-wider uppercase">Cierre</span>
              </button>
            )}

            {/* 🌙 Sleep Status Pill — always visible, 3 states */}
            <AnimatePresence mode="wait">
              {sleepState === 'pending' && (
                <motion.button
                  key="sleep-pending"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => { soundFX.playClick(); onRegisterWakeUp?.(); }}
                  title="Registrar hora de despertar"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/70 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400 transition-all cursor-pointer shadow-[0_0_12px_rgba(251,191,36,0.4)] animate-pulse"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                    ☀️ <span className="hidden sm:inline">Despertar</span>
                  </span>
                  <span className="hidden md:inline text-[9px] font-mono text-amber-400/80">
                    {pendingSleepDate && sleepLogs[pendingSleepDate]?.bedtime
                      ? `desde ${sleepLogs[pendingSleepDate].bedtime}`
                      : ''}
                  </span>
                </motion.button>
              )}
              {sleepState === 'complete' && (
                <motion.div
                  key="sleep-complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  title={`Sueño: ${todaySleep?.bedtime} → ${todaySleep?.wakeTime}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 cursor-default"
                >
                  <Moon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                    {todaySleep?.sleepDurationHours
                      ? `${todaySleep.sleepDurationHours}h ✓`
                      : '✓ Sueño'}
                  </span>
                </motion.div>
              )}
              {sleepState === 'none' && (
                <motion.div
                  key="sleep-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  title="Sin registro de sueño — Finaliza la jornada para comenzar"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-600/40 text-slate-500 cursor-default"
                >
                  <Moon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline text-[10px] font-mono tracking-wider">--:--</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Settings (Mobile Only) */}
            <button
              onClick={() => { if(onGoToSettings) { soundFX.playClick(); onGoToSettings(); } }}
              className="md:hidden p-1.5 rounded-xl bg-[#011420]/80 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all cursor-pointer"
              title="Ajustes"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  soundFX.playClick();
                  setShowNotifMenu(!showNotifMenu);
                }}
                className="relative p-1.5 sm:p-2 rounded-xl bg-[#011420]/80 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all cursor-pointer"
                title="Transmisiones y Notificaciones"
              >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-400 text-[8px] font-mono font-black text-black border border-[#010a12] shadow-[0_0_8px_rgba(0,240,255,0.9)] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-64 sm:w-80 rounded-2xl bg-[#010e17]/95 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_30px_rgba(0,240,255,0.25)] p-3.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                    <span className="text-xs font-anton tracking-wider text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      REGISTRO DE TRANSMISIONES
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearNotifications}
                        className="text-[10px] font-mono text-cyan-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-cyan-500/20 mt-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs font-mono text-zinc-400 text-center py-4">Frecuencias despejadas. Sin alertas.</p>
                    ) : (
                      notifications.filter(n => n && n.title).map((n) => (
                        <div key={n.id} className="py-2 text-xs">
                          <p className="font-bold text-slate-100">{n.title}</p>
                          <p className="text-zinc-300 text-[11px] mt-0.5">{n.message}</p>
                          <span className="text-[9px] font-mono text-cyan-400 mt-1 block">{n.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cloud Sync Direct Menu (Visible on Mobile, Tablet & Desktop) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setShowSyncMenu((prev) => !prev);
                  setShowNotifMenu(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-mono font-bold tracking-wider transition cursor-pointer ${
                  cloudSync?.syncStatus === 'saving' || isSyncBusy
                    ? 'bg-[#011420] border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : cloudSync?.syncStatus === 'offline'
                    ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                    : 'bg-[#011420]/90 hover:bg-cyan-950/50 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                }`}
                title="Sincronizar datos entre Tablet y Teléfono"
              >
                {cloudSync?.syncStatus === 'saving' || isSyncBusy ? (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
                <span className="hidden sm:inline truncate">SINCRONIZAR</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.9)] animate-pulse" />
              </button>

              {showSyncMenu && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#010e17]/98 backdrop-blur-xl border border-cyan-500/60 shadow-[0_0_30px_rgba(0,240,255,0.3)] p-3.5 z-50 space-y-2.5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                    <span className="text-xs font-anton tracking-wider text-white flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                      PUENTE TABLET ↔ TELÉFONO
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSyncMenu(false)}
                      className="text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    1️⃣ En la <strong>Tablet</strong> toca <strong>Subir datos</strong>.<br />
                    2️⃣ En el <strong>Teléfono</strong> toca <strong>Traer datos</strong>.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isSyncBusy}
                      onClick={async () => {
                        if (!cloudSync?.forceSyncNow) return;
                        setIsSyncBusy(true);
                        soundFX.playClick();
                        try {
                          const ok = await cloudSync.forceSyncNow();
                          const st = useTaskStore.getState();
                          const activeList = st.tasksByDate?.[st.currentViewDate] || [];
                          const hCount = (st.customHabits || []).length;
                          const tCount = activeList.length;
                          const cCount = activeList.filter(t => t.completed).length;
                          if (ok) {
                            soundFX.playSuccess();
                            setSyncMenuToast(`✓ Subido (${tCount} tareas, ${cCount} hechas, ${hCount} rutinas)`);
                          } else {
                            setSyncMenuToast('⚠️ Error al subir a la nube');
                          }
                        } finally {
                          setIsSyncBusy(false);
                        }
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-400/70 text-cyan-200 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir datos</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSyncBusy}
                      onClick={async () => {
                        if (!cloudSync?.pullFromCloudNow) return;
                        setIsSyncBusy(true);
                        soundFX.playClick();
                        try {
                          const ok = await cloudSync.pullFromCloudNow();
                          const st = useTaskStore.getState();
                          const activeList = st.tasksByDate?.[st.currentViewDate] || [];
                          const hCount = (st.customHabits || []).length;
                          const tCount = activeList.length;
                          const cCount = activeList.filter(t => t.completed).length;
                          if (ok) {
                            soundFX.playLevelUp();
                            setSyncMenuToast(`✓ Sincronizado (${tCount} tareas, ${cCount} hechas, ${hCount} rutinas)`);
                          } else {
                            setSyncMenuToast('⚠️ Error al descargar');
                          }
                        } finally {
                          setIsSyncBusy(false);
                        }
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-400/70 text-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Traer datos</span>
                    </button>
                  </div>

                  {syncMenuToast && (
                    <div className="p-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{syncMenuToast}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Utility Buttons (Hidden on Mobile < md) */}
            <div className="hidden md:flex items-center gap-1.5 ml-1">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className="p-1.5 sm:p-2 rounded-xl bg-[#011420]/80 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all cursor-pointer"
                title={soundEnabled ? 'Sonido Activado' : 'Sonido Silenciado'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              </button>
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="p-1.5 sm:p-2 rounded-xl bg-red-950/30 text-red-400 border border-red-500/40 hover:bg-red-950/50 transition-all cursor-pointer"
                  title="Desconectar Terminal de Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => { soundFX.playClick(); signInWithGoogle(); }}
                  className="p-1.5 sm:p-2 rounded-xl bg-[#011420]/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-950/50 transition-all cursor-pointer"
                  title="Conectar con Google"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: HUD PROGRESS & QUANTUM TELEMETRY */}
      <div className="px-3 sm:px-5 py-2 bg-[#010e17]/85 border-b border-cyan-500/30 shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Avatar & XP */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={() => { soundFX.playClick(); onOpenProfile?.(); }}
              className="relative group shrink-0 cursor-pointer"
              title={`Perfil - Nivel ${stats.level} (${displayRankTitle})`}
            >
              {/* Contenedor del Avatar sin emoji, usando glifo sagrado */}
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#011420] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform overflow-hidden relative">
                <ArchetypeGlyph
                  archetypeNameOrId={stats.characterClass || 'heroe'}
                  size={22}
                  className="border-none bg-transparent p-0 shadow-none"
                  glow={false}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#010e17] text-cyan-300 text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                NV.{stats.level}
              </div>
            </button>
            
            <div 
              onClick={() => { soundFX.playClick(); onOpenProfile?.(); }}
              className="flex flex-col justify-center min-w-0 cursor-pointer group/xp flex-1"
              title={`Nivel ${stats.level}: ${stats.currentXp} / ${stats.requiredXp} XP`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs sm:text-sm font-anton tracking-wider text-white truncate leading-tight">
                  {displayRankTitle}
                </span>
                <span className="hidden md:inline text-[9px] font-mono text-cyan-400/80 px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30">
                  {stats.characterClass || 'Guardián'}
                </span>
              </div>

              {/* Barra de XP Cuántica */}
              <div className="flex items-center gap-2 max-w-sm">
                <div className="flex-1 h-2 sm:h-2.5 bg-black/80 rounded-full border border-cyan-500/40 p-px overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-300 shrink-0">
                  {stats.currentXp}/{stats.requiredXp} <span className="hidden sm:inline">XP</span>
                </span>
              </div>

              {/* Barra de Vitalidad / HP */}
              <div className="flex items-center gap-2 max-w-sm mt-1">
                <div className="flex-1 h-2 sm:h-2.5 bg-black/80 rounded-full border border-red-500/40 p-px overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-red-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-red-300 shrink-0">
                  {stats.hp || 100}/{stats.maxHp || 100} <span className="hidden sm:inline">HP</span>
                </span>
              </div>
            </div>
          </div>

          {/* HUD TELEMETRÍA (Monedas, Racha, Escudo) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Streak Shield Indicator */}
            {stats.streakShields !== undefined && stats.streakShields > 0 && (
              <div
                className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#011420] border border-cyan-400 text-cyan-300 text-xs sm:text-sm font-anton tracking-wider shadow-[0_0_10px_rgba(0,240,255,0.25)]"
                title={`Escudos Cuánticos Activos: ${stats.streakShields}`}
              >
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 fill-cyan-400/30" />
                <span>{stats.streakShields}</span>
              </div>
            )}
            
            {/* Coins */}
            <div 
              className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#011420] border border-yellow-500/50 text-white text-xs sm:text-sm font-anton tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.2)]"
              title={`${stats.coins || 0} Monedas de Oro acumuladas`}
            >
              <Coins className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]" />
              <span><AnimatedNumber value={stats.coins} /></span>
            </div>

            {/* Streak */}
            <div 
              className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#011420] border border-amber-500/50 text-white text-xs sm:text-sm font-anton tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              title={`Racha Activa: ${stats.streakDays || 0} Días continuos`}
            >
              <Flame className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 fill-amber-400/50 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              <span><AnimatedNumber value={stats.streakDays} /></span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
