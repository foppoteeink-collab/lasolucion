import React from 'react';
import { 
  Flame, 
  Coins, 
  Gift, 
  Shield, 
  Volume2, 
  VolumeX, 
  LogOut, 
  LogIn,
  Swords,
  BookOpen,
  ShoppingBag,
  FlaskConical,
  SlidersHorizontal
} from 'lucide-react';
import { AppNotification } from '../types';
import { soundFX } from '../utils/audio';
import { MainLogo } from './MainLogo';
import { useTimer } from '../context/TimerContext';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedNumber } from './AnimatedNumber';
import { useAuth } from '../context/AuthContext';
import { usePlayerStore } from '../store/usePlayerStore';
import { useUIStore } from '../store/useUIStore';
import { getRankForLevel, getCategoryColor } from '../data/defaults';
import { CloudSyncResult } from '../hooks/useCloudSync';
import { ArchetypeGlyph } from './ArchetypeGlyph';
import { getArchetypeTitle } from '../data/archetypes';

interface HeaderProps {
  onOpenProfile?: () => void;
  onOpenKaiWorkshop?: () => void;
  notifications?: AppNotification[];
  onClearNotifications?: () => void;
  hasUnclaimedDailyReward: boolean;
  onOpenDailyRewards: () => void;
  signOut?: () => void;
  onGoToCover: () => void;
  onGoToSettings?: () => void;
  onOpenNightlyReflection?: () => void;
  onRegisterWakeUp?: (dateStr?: string, customWakeTime?: string) => void;
  cloudSync?: CloudSyncResult;
  activeTab?: string;
  onTabChange?: (tab: 'dashboard' | 'journal' | 'shop' | 'skills' | 'stats' | 'settings') => void;
}

const NAV_TABS = [
  { id: 'stats', label: 'Perfil', icon: Shield },
  { id: 'dashboard', label: 'Tareas', icon: Swords },
  { id: 'journal', label: 'Bitácora', icon: BookOpen },
  { id: 'shop', label: 'Tienda', icon: ShoppingBag },
  { id: 'skills', label: 'Lab', icon: FlaskConical },
  { id: 'settings', label: 'Ajustes', icon: SlidersHorizontal },
] as const;

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  hasUnclaimedDailyReward,
  onOpenDailyRewards,
  onGoToCover,
  activeTab,
  onTabChange,
}) => {
  const { user, signInWithGoogle, signOut: authSignOut } = useAuth();
  const { stats } = usePlayerStore();
  const { soundEnabled, toggleSound } = useUIStore();
  const { isPomodoroOpen, mode: timerMode, category: timerCategory } = useTimer();

  const handleSignOut = authSignOut;
  const currentRank = getRankForLevel(stats.level);
  const displayRankTitle = currentRank.title;

  const xpPercent = Math.min(100, Math.max(0, (stats.currentXp / stats.requiredXp) * 100));
  const hpPercent = Math.min(100, Math.max(0, ((stats.hp || 100) / (stats.maxHp || 100)) * 100));

  // Aura de KAI sincronizada con categoría activa
  let kaiPulseColor = '#00f0ff';
  let isKaiPulsing = false;
  let pulseSpeed = 4;

  if (isPomodoroOpen) {
    isKaiPulsing = true;
    if (timerMode === 'work') {
      kaiPulseColor = getCategoryColor(timerCategory);
      pulseSpeed = 1.5;
    } else {
      kaiPulseColor = '#10b981';
      pulseSpeed = 4;
    }
  }

  const [rainbowColor, setRainbowColor] = React.useState('#00f0ff');
  React.useEffect(() => {
    if (isKaiPulsing) return;
    
    const cycleColors = [
      '#00f0ff',
      '#00f0ff',
      '#10e29d',
      '#10e29d',
      '#00f0ff',
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % cycleColors.length;
      setRainbowColor(cycleColors[i]);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isKaiPulsing]);

  const activeHelixColor = isKaiPulsing ? kaiPulseColor : rainbowColor;

  return (
    <header className="w-full max-w-6xl mx-auto pointer-events-auto">
      {/* COCKPIT CYBERPUNK FLOTANTE UNIFICADO */}
      <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] relative overflow-hidden transition-all duration-300">
        
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />
        
        {/* Filo de luz superior especular */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

        {/* ============================================================== */}
        {/* FILA 1: LOGO, MINI-HUD Y RECURSOS MAESTROS                     */}
        {/* ============================================================== */}
        <div className="px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-3 relative z-10 border-b border-white/[0.05]">
          
          {/* BLOQUE IZQUIERDO: Logo Principal Kinético */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Hélice cuántica: Visible en desktop/tablet */}
            <div className="hidden sm:flex relative group items-center justify-center p-1">
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

              <div 
                className="absolute inset-0 blur-md rounded-full transition-colors duration-1000" 
                style={{ backgroundColor: `${activeHelixColor}40`, opacity: isKaiPulsing ? 0.8 : 0.4 }}
              />
              <div className="relative z-10 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
                {/* @ts-ignore */}
                <l-helix size="28" speed="2.5" color={activeHelixColor}></l-helix>
              </div>
            </div>

            {/* Logotipo Principal */}
            <MainLogo
              size="md"
              onClick={() => { soundFX.playClick(); onGoToCover(); }}
            />
          </div>

          {/* BLOQUE CENTRAL: Calibradores EXP & HP (Desktop / Pantallas medianas) */}
          <div 
            onClick={() => { soundFX.playClick(); onOpenProfile?.(); }}
            className="hidden lg:flex items-center gap-3.5 flex-1 max-w-sm mx-auto px-3 py-1 rounded-xl bg-black/40 border border-white/5 cursor-pointer hover:border-cyan-500/30 transition-all group"
            title={`EXP: ${stats.currentXp}/${stats.requiredXp} | HP: ${stats.hp || 100}/${stats.maxHp || 100} - Clic para ver perfil`}
          >
            {/* Barra EXP */}
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[9px] font-mono font-bold leading-none">
                <span className="text-cyan-400 tracking-wider">EXP</span>
                <span className="text-cyan-300 font-mono">{stats.currentXp}/{stats.requiredXp}</span>
              </div>
              <div className="h-1.5 bg-black/90 rounded-full border border-cyan-500/30 p-[0.5px] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,240,255,0.7)]"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            {/* Barra HP */}
            <div data-tour="hp-bar" className="flex-1 flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[9px] font-mono font-bold leading-none">
                <span className="text-rose-400 tracking-wider">HP</span>
                <span className="text-rose-300 font-mono">{stats.hp || 100}/{stats.maxHp || 100}</span>
              </div>
              <div className="h-1.5 bg-black/90 rounded-full border border-rose-500/30 p-[0.5px] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Racha Activa Flame */}
            <div 
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-surface-card border border-amber-500/40 text-amber-300 text-xs font-anton tracking-wider shrink-0"
              title={`Racha Activa: ${stats.streakDays || 0} Días continuos`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/50" />
              <span><AnimatedNumber value={stats.streakDays} /></span>
            </div>
          </div>

          {/* BLOQUE DERECHO: Recursos (Monedas, Recompensa, Sonido, Auth) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Monedas Micro-chip */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl bg-surface-card border border-yellow-500/40 text-yellow-300 text-xs sm:text-sm font-anton tracking-wider shadow-[0_0_12px_rgba(234,179,8,0.18)]"
              title={`${stats.coins || 0} Monedas acumuladas`}
            >
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.7)]" />
              <span><AnimatedNumber value={stats.coins} /></span>
            </div>

            {/* Recompensa Diaria Cuántica */}
            <button
              onClick={() => { soundFX.playClick(); onOpenDailyRewards(); }}
              title="Recompensa Cuántica Diaria"
              className={`relative p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                hasUnclaimedDailyReward
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse shadow-[0_0_16px_rgba(245,158,11,0.6)]'
                  : 'bg-surface-card text-cyan-200 border-white/10 hover:border-cyan-400 hover:bg-cyan-950/40'
              }`}
            >
              <Gift className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {hasUnclaimedDailyReward && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-black shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-ping" />
              )}
            </button>

            {/* Silenciador de sonido */}
            <button
              onClick={toggleSound}
              className="hidden sm:flex p-2 rounded-xl bg-surface-card text-cyan-300 border border-white/10 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all cursor-pointer active:scale-95"
              title={soundEnabled ? 'Sonido Activado' : 'Sonido Silenciado'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>

            {/* Auth Google */}
            {user ? (
              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl bg-red-950/30 text-red-400 border border-red-500/30 hover:bg-red-950/50 transition-all cursor-pointer active:scale-95"
                title="Desconectar Terminal de Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => { soundFX.playClick(); signInWithGoogle(); }}
                className="p-2 rounded-xl bg-surface-card text-cyan-300 border border-cyan-500/40 hover:bg-cyan-950/50 transition-all cursor-pointer active:scale-95"
                title="Conectar con Google"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* ============================================================== */}
        {/* FILA 2: IDENTIDAD DEL CAZADOR (SUB-BARRA RESPONSIVE)           */}
        {/* ============================================================== */}
        <div className="px-3 sm:px-5 py-1.5 bg-[#010912]/70 relative z-10 flex items-center justify-between gap-2.5 sm:gap-4 border-b border-white/[0.04]">
          {/* Identidad de Cazador: Micro-Avatar + Nivel + Rango */}
          <button
            onClick={() => { soundFX.playClick(); onOpenProfile?.(); }}
            className="flex items-center gap-2 group shrink-0 cursor-pointer text-left focus:outline-none"
            title={`Perfil Táctico - Nivel ${stats.level} (${displayRankTitle})`}
          >
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface-card border border-cyan-400/60 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.25)] group-hover:scale-105 transition-transform overflow-hidden">
              <ArchetypeGlyph
                archetypeNameOrId={stats.characterClass || 'heroe'}
                size={18}
                className="border-none bg-transparent p-0 shadow-none"
                glow={false}
              />
              <span className="absolute -bottom-0.5 -right-0.5 bg-black text-cyan-300 text-[8px] font-mono font-black px-1 rounded border border-cyan-400/70">
                {stats.level}
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[11px] sm:text-xs font-anton tracking-wider text-slate-100 truncate group-hover:text-cyan-300 transition-colors leading-none">
                {displayRankTitle}
              </span>
              <span className="text-[9px] font-mono text-cyan-400/70 truncate leading-tight mt-0.5">
                {getArchetypeTitle(stats.characterClass, stats.genderPreference)}
              </span>
            </div>
          </button>

          {/* Calibradores Cuánticos en Mobile / Pantallas medianas */}
          <div 
            onClick={() => { soundFX.playClick(); onOpenProfile?.(); }}
            className="flex lg:hidden items-center gap-2 sm:gap-3 flex-1 max-w-xs cursor-pointer group"
            title={`EXP: ${stats.currentXp}/${stats.requiredXp} | HP: ${stats.hp || 100}/${stats.maxHp || 100}`}
          >
            {/* Barra EXP */}
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[8px] font-mono font-bold leading-none">
                <span className="text-cyan-400">EXP</span>
                <span className="text-cyan-300">{stats.currentXp}/{stats.requiredXp}</span>
              </div>
              <div className="h-1.5 bg-black/90 rounded-full border border-cyan-500/30 p-[0.5px] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 rounded-full transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            {/* Barra HP */}
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[8px] font-mono font-bold leading-none">
                <span className="text-rose-400">HP</span>
                <span className="text-rose-300">{stats.hp || 100}/{stats.maxHp || 100}</span>
              </div>
              <div className="h-1.5 bg-black/90 rounded-full border border-rose-500/30 p-[0.5px] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-400 rounded-full transition-all duration-500"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Racha Activa y Escudo Cuántico */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div 
              className="flex lg:hidden items-center gap-1 px-1.5 py-0.5 rounded-lg bg-surface-card border border-amber-500/40 text-amber-300 text-[11px] font-anton tracking-wider shadow-[0_0_8px_rgba(245,158,11,0.2)] shrink-0"
              title={`Racha Activa: ${stats.streakDays || 0} Días continuos`}
            >
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400/50" />
              <span><AnimatedNumber value={stats.streakDays} /></span>
            </div>

            {stats.streakShields !== undefined && stats.streakShields > 0 && (
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-surface-card border border-cyan-400/60 text-cyan-300 text-[10px] font-anton tracking-wider shrink-0"
                title={`Escudos Cuánticos: ${stats.streakShields}`}
              >
                <Shield className="w-3 h-3 text-cyan-400 fill-cyan-400/30" />
                <span>{stats.streakShields}</span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* FILA 3: NAVEGACIÓN TÁCTICA INTEGRADA (DESKTOP & TABLET)        */}
        {/* ============================================================== */}
        {onTabChange && (
          <div className="hidden sm:flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 bg-black/30 relative z-10">
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    onTabChange(tab.id as any);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-anton text-xs sm:text-sm whitespace-nowrap cursor-pointer tracking-wider uppercase active:scale-95 ${
                    isActive
                      ? 'bg-cyan-400 text-black shadow-[0_0_14px_rgba(0,240,255,0.65)] font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;
