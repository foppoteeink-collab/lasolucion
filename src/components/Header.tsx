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
  SlidersHorizontal,
  Eye,
  EyeOff
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
import { getArchetypeDisplayName } from '../data/archetypes';

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

  const activeHelixColor = isKaiPulsing ? kaiPulseColor : '#00f0ff';

  return (
    <header className="w-full max-w-6xl mx-auto pointer-events-auto">
      {/* COCKPIT CYBERPUNK FLOTANTE UNIFICADO */}
      <div className="w-full rounded-2xl sm:rounded-3xl bg-[#030816]/85 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] relative overflow-hidden transition-all duration-300">
        
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />
        
        {/* Filo de luz superior especular dinámico */}
        <div 
          className="absolute top-0 inset-x-0 h-px pointer-events-none" 
          style={{ background: 'linear-gradient(90deg, transparent, rgba(var(--aura-glow-rgb, 0, 240, 255), 0.4), transparent)' }}
        />

        {/* ============================================================== */}
        {/* FILA 1: LOGO, MINI-HUD Y RECURSOS MAESTROS                     */}
        {/* ============================================================== */}
        <div className="px-2.5 sm:px-5 py-1.5 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3 relative z-10 border-b border-white/[0.05]">
          
          {/* BLOQUE IZQUIERDO: Logo Principal Kinético */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Hélice cuántica: Visible en desktop/tablet únicamente cuando hay sesión activa o foco */}
            {isKaiPulsing && (
              <div className="hidden sm:flex relative group items-center justify-center p-1">
                <AnimatePresence>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full"
                    style={{ border: `1.5px solid ${kaiPulseColor}` }}
                  />
                </AnimatePresence>

                <div 
                  className="absolute inset-0 blur-md rounded-full transition-colors duration-1000" 
                  style={{ backgroundColor: `${activeHelixColor}40`, opacity: 0.7 }}
                />
                <div className="relative z-10 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
                  {/* @ts-ignore */}
                  <l-helix size="28" speed="2.5" color={activeHelixColor}></l-helix>
                </div>
              </div>
            )}

            {/* Logotipo Principal */}
            <MainLogo
              size="md"
              onClick={() => { soundFX.playClick(); onGoToCover(); }}
            />
          </div>

          {/* BLOQUE CENTRAL: Calibradores EXP & HP (Desktop / Pantallas medianas) */}
          <div 
            onClick={() => { soundFX.playClick(); onOpenProfile?.(); }}
            className="hidden lg:flex items-center gap-3.5 flex-1 max-w-sm mx-auto px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/10 cursor-pointer hover:border-cyan-500/30 transition-all group"
            title={`EXP: ${stats.currentXp}/${stats.requiredXp} | HP: ${stats.hp || 100}/${stats.maxHp || 100} - Clic para ver perfil`}
          >
            {/* Barra EXP Sincronizada con la Personalización del Usuario */}
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold leading-none">
                <span className="tracking-wider transition-colors" style={{ color: 'var(--aura-color-1, #00f0ff)' }}>EXP</span>
                <span className="font-mono tabular-nums transition-colors" style={{ color: 'var(--aura-color-1, #00f0ff)' }}>{stats.currentXp}/{stats.requiredXp}</span>
              </div>
              <div 
                className="h-2 bg-black/90 rounded-full border p-[0.5px] overflow-hidden transition-colors"
                style={{ borderColor: 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.35)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${xpPercent}%`,
                    background: 'linear-gradient(90deg, var(--aura-color-1, #00f0ff) 0%, var(--aura-color-2, #8a2be2) 100%)',
                    boxShadow: '0 0 8px rgba(var(--aura-glow-rgb, 0, 240, 255), 0.7)'
                  }}
                />
              </div>
            </div>

            {/* Barra HP */}
            <div data-tour="hp-bar" className="flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold leading-none">
                <span className="text-rose-400 tracking-wider">HP</span>
                <span className="text-rose-300 font-mono tabular-nums">{stats.hp || 100}/{stats.maxHp || 100}</span>
              </div>
              <div className="h-2 bg-black/90 rounded-full border border-rose-500/30 p-[0.5px] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Racha Activa Flame */}
            <div 
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-card border border-amber-500/40 text-amber-300 text-xs font-mono font-bold tracking-wider shrink-0 tabular-nums"
              title={`Racha Activa: ${stats.streakDays || 0} Días continuos`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/50" />
              <span><AnimatedNumber value={stats.streakDays} />d</span>
            </div>
          </div>

          {/* BLOQUE DERECHO: Recursos y Gadgets Tácticos (Compacto y ultra-resistente en Mobile) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">

            {/* Monedas Micro-chip */}
            <div 
              className="flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-black/50 border border-yellow-500/40 text-yellow-300 text-xs md:text-sm font-mono font-bold tracking-wider shadow-[0_0_12px_rgba(234,179,8,0.18)] shrink-0"
              title={`${stats.coins || 0} Monedas acumuladas`}
            >
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.7)]" />
              <span className="tabular-nums"><AnimatedNumber value={stats.coins} /></span>
            </div>

            {/* Recompensa Diaria Cuántica */}
            <button
              onClick={() => { soundFX.playClick(); onOpenDailyRewards(); }}
              title="Recompensa Cuántica Diaria"
              className={`relative flex items-center justify-center min-w-[36px] min-h-[36px] sm:w-9 sm:h-9 rounded-lg sm:rounded-xl border transition-all cursor-pointer active:scale-95 shrink-0 ${
                hasUnclaimedDailyReward
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse shadow-[0_0_16px_rgba(245,158,11,0.6)]'
                  : 'bg-black/40 text-cyan-200 border-white/10 hover:border-cyan-400 hover:bg-cyan-950/40'
              }`}
            >
              <Gift className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {hasUnclaimedDailyReward && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-black shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-ping" />
              )}
            </button>

            {/* Cápsula Unificada de Utilidades Tácticas: Sonido + Conexión */}
            <div className="flex items-center gap-1 p-0.5 bg-black/50 rounded-lg sm:rounded-xl border border-white/15 shrink-0">
              {/* Silenciador de sonido */}
              <button
                onClick={toggleSound}
                className="flex items-center justify-center min-w-[36px] min-h-[36px] sm:w-9 sm:h-9 rounded-md sm:rounded-lg text-slate-200 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                title={soundEnabled ? 'Sonido Activado' : 'Sonido Silenciado'}
                aria-label={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-rose-300" />
                )}
              </button>

              {/* Separador sutil */}
              <div className="w-px h-4 bg-white/15" />

              {/* Auth Google */}
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center min-w-[36px] min-h-[36px] sm:w-9 sm:h-9 rounded-md sm:rounded-lg text-red-300 hover:text-red-200 hover:bg-red-950/40 transition-all cursor-pointer active:scale-95"
                  title="Desconectar Terminal de Google"
                  aria-label="Cerrar sesión de Google"
                >
                  <LogOut className="w-4 h-4 text-red-300" />
                </button>
              ) : (
                <button
                  onClick={() => { soundFX.playClick(); signInWithGoogle(); }}
                  className="flex items-center justify-center min-w-[36px] min-h-[36px] sm:w-9 sm:h-9 rounded-md sm:rounded-lg text-cyan-300 hover:text-white hover:bg-cyan-950/40 transition-all cursor-pointer active:scale-95"
                  title="Conectar con Google"
                  aria-label="Iniciar sesión con Google"
                >
                  <LogIn className="w-4 h-4 text-cyan-300" />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* FILA 2: COMANDO PERSONAL VIP (HERO IDENTITY & HUNTER STATUS)   */}
        {/* ============================================================== */}
        {(() => {
          const cleanFullName = stats.fullName?.trim() && stats.fullName.trim().toLowerCase() !== 'cazador' ? stats.fullName.trim() : '';
          const cleanUsername = stats.username?.trim() && stats.username.trim().toLowerCase() !== 'cazador' && stats.username.trim() !== 'CazadorDelSistema' ? stats.username.trim() : '';
          const rawName = cleanFullName || cleanUsername || user?.displayName?.trim() || 'Usuario';
          const heroName = (rawName.split(' ')[0] || rawName).toUpperCase();
          const archetypeTitle = getArchetypeDisplayName(stats.characterClass);

          return (
            <div className="px-2.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#030712] via-[#050f24] to-[#030712] relative z-10 border-b border-white/[0.06]">
              {/* Contenedor Principal: Avatar + Saludo VIP + Racha */}
              <div className="flex items-center justify-between gap-2.5">
                {/* Bloque Izquierdo: Avatar Arquetípico + Saludo Personalizado Prominente */}
                <button
                  onClick={() => { soundFX.playClick(); onOpenProfile?.(); }}
                  className="flex items-center gap-2.5 sm:gap-3.5 group flex-1 min-w-0 cursor-pointer text-left focus:outline-none"
                  title={`Perfil de ${rawName} - Nivel ${stats.level} (${displayRankTitle})`}
                >
                  {/* Avatar con aura de prestigio */}
                  <div 
                    className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-b from-cyan-950/60 to-black/80 border flex items-center justify-center group-hover:scale-105 transition-all overflow-hidden shrink-0 shadow-lg"
                    style={{
                      borderColor: 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.5)',
                      boxShadow: '0 0 14px rgba(var(--aura-glow-rgb, 0, 240, 255), 0.25)'
                    }}
                  >
                    <ArchetypeGlyph
                      archetypeNameOrId={stats.characterClass || 'heroe'}
                      size={22}
                      className="border-none bg-transparent p-0 shadow-none"
                      glow={false}
                    />
                  </div>

                  {/* Estatus Táctico */}
                  <div className="flex flex-col min-w-0 flex-1 justify-center">

                    {/* Subtítulo Unificado: Nivel, Ascensión, Rango y Racha */}
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-300 font-medium truncate">
                      <span className="text-cyan-300 font-mono font-bold shrink-0">NV. {stats.level}</span>
                      {(stats.ascensionTier || 0) > 0 && (
                        <span
                          className="text-amber-300 font-mono font-bold shrink-0"
                          title={`Ascensión Rango ${stats.ascensionTier} (+${(stats.ascensionTier || 0) * 5}% Eficiencia Global)`}
                        >
                          {'★'.repeat(Math.min(stats.ascensionTier || 0, 5))}
                        </span>
                      )}
                      <span className="text-slate-500" aria-hidden="true">•</span>
                      <span className="text-slate-200 truncate group-hover:text-white transition-colors">{displayRankTitle}</span>
                      <span className="hidden md:inline-flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <span className="text-slate-600">•</span>
                        <span>{archetypeTitle}</span>
                      </span>
                    </div>
                  </div>
                </button>

                {/* Bloque Derecho: Racha y Escudos Tácticos */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div 
                    className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-300 text-xs font-anton tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.25)] shrink-0"
                    title={`Racha Activa: ${stats.streakDays || 0} Días continuos`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/60" />
                    <span><AnimatedNumber value={stats.streakDays} /></span>
                    <span className="text-[9px] font-mono text-amber-400/80 ml-0.5">DÍAS</span>
                  </div>

                  {stats.streakShields !== undefined && stats.streakShields > 0 && (
                    <div
                      className="hidden xs:flex items-center gap-1 px-1.5 py-1 rounded-xl bg-cyan-950/40 border border-cyan-400/60 text-cyan-300 text-[10px] font-anton tracking-wider shrink-0"
                      title={`Escudos Cuánticos: ${stats.streakShields}`}
                    >
                      <Shield className="w-3 h-3 text-cyan-400 fill-cyan-400/30" />
                      <span>{stats.streakShields}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Micro-calibradores de EXP y HP (Elegantes y legibles en Mobile) */}
              <div 
                onClick={() => { soundFX.playClick(); onOpenProfile?.(); }}
                className="flex lg:hidden items-center gap-3 w-full cursor-pointer group mt-2 pt-1.5 border-t border-white/[0.06]"
                title={`EXP: ${stats.currentXp}/${stats.requiredXp} (${Math.round(xpPercent)}%) | HP: ${stats.hp || 100}/${stats.maxHp || 100} - Clic para ver perfil`}
              >
                {/* EXP Micro-gauge */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 shrink-0">EXP</span>
                  <div className="flex-1 h-2 bg-black/80 rounded-full border border-cyan-500/30 p-[0.5px] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 shadow-[0_0_6px_rgba(0,240,255,0.7)]"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                  <span className="text-[10.5px] font-mono tabular-nums text-cyan-300 shrink-0">{Math.round(xpPercent)}%</span>
                </div>

                {/* HP Micro-gauge */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-rose-400 shrink-0">HP</span>
                  <div className="flex-1 h-2 bg-black/80 rounded-full border border-rose-500/30 p-[0.5px] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-rose-600 to-red-400 shadow-[0_0_6px_rgba(244,63,94,0.7)]"
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                  <span className="text-[10.5px] font-mono tabular-nums text-rose-300 shrink-0">{Math.round(hpPercent)}%</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Navegación principal delegada a SidebarHUD (Modo Barra) o KAI Orbital (Modo Nexus) */}
      </div>
    </header>
  );
};

export default Header;
