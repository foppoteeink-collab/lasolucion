import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskItem, TaskCategory } from '../types';
import { 
  ShieldAlert, 
  Zap, 
  Skull, 
  Trophy, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  ShieldCheck,
  Swords,
  Flame,
  Award
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { getTodayDateString } from '../utils/date';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';
import { KAICompanion } from './KAICompanion';
import { KAI_MULTIVERSE_STYLES } from '../data/kaiShapes';

export interface BossInfo {
  name: string;
  title: string;
  avatar: string;
  maxHp: number;
  weaknessCategory: TaskCategory;
  weaknessLabel: string;
  quote: string;
  defeatQuote: string;
  bonusRewardXp: number;
  bonusRewardCoins: number;
}

export const WEEKLY_RAID_BOSS: BossInfo = {
  name: 'Devorador de Procrastinación',
  title: 'Titán de la Inercia Semanal (1,000 HP)',
  avatar: '🐉',
  maxHp: 1000,
  weaknessCategory: 'trabajo',
  weaknessLabel: 'Dominio y Hábito Constante',
  quote: '"Tu voluntad semanal flaquea con cada día perdido en la sombra..."',
  defeatQuote: '¡EL TITÁN SEMANAL HA SIDO DESTRUIDO! ¡VICTORIA ABSOLUTA!',
  bonusRewardXp: 150,
  bonusRewardCoins: 60,
};

// Bosses per day of week (0: Domingo, 1: Lunes, etc.)
export const DAILY_BOSSES: BossInfo[] = [
  {
    name: 'Inercia Biológica',
    title: 'Resistencia al Arranque Dominical',
    avatar: '🧬',
    maxHp: 100,
    weaknessCategory: 'habito',
    weaknessLabel: 'Activación de Rutinas',
    quote: '"El cuerpo busca el mínimo esfuerzo. Permanecer en reposo es eficiente..."',
    defeatQuote: 'Inercia superada. Momentum establecido.',
    bonusRewardXp: 18,
    bonusRewardCoins: 6,
  },
  {
    name: 'Fricción Cognitiva',
    title: 'Rechazo a Tareas Complejas',
    avatar: '🧠',
    maxHp: 100,
    weaknessCategory: 'clientes',
    weaknessLabel: 'Ejecución y Proactividad',
    quote: '"La carga mental es alta. Evadir tareas complejas conserva energía..."',
    defeatQuote: 'Fricción vencida. Flujo de trabajo optimizado.',
    bonusRewardXp: 20,
    bonusRewardCoins: 8,
  },
  {
    name: 'Atrofia Estructural',
    title: 'Degradación por Sedentarismo',
    avatar: '🦴',
    maxHp: 100,
    weaknessCategory: 'entrenamiento',
    weaknessLabel: 'Protocolos de Resistencia',
    quote: '"Sin estímulo físico, la estructura se debilita progresivamente..."',
    defeatQuote: 'Atrofia revertida. Estructura muscular estimulada.',
    bonusRewardXp: 22,
    bonusRewardCoins: 8,
  },
  {
    name: 'Entropía Ambiental',
    title: 'Desorden del Entorno',
    avatar: '🌪️',
    maxHp: 100,
    weaknessCategory: 'limpieza',
    weaknessLabel: 'Organización Espacial',
    quote: '"Todo sistema tiende al caos sin intervención de energía externa..."',
    defeatQuote: 'Entropía neutralizada. Orden restaurado.',
    bonusRewardXp: 20,
    bonusRewardCoins: 7,
  },
  {
    name: 'Estancamiento Sináptico',
    title: 'Bloqueo de Resolución',
    avatar: '⚡',
    maxHp: 100,
    weaknessCategory: 'creativo',
    weaknessLabel: 'Estimulación Analítica',
    quote: '"Rutas neuronales saturadas. Imposible generar nuevas conexiones..."',
    defeatQuote: 'Nuevas rutas establecidas. Resolución creativa activa.',
    bonusRewardXp: 22,
    bonusRewardCoins: 8,
  },
  {
    name: 'Dispersión de Foco',
    title: 'Déficit de Atención Inducido',
    avatar: '👁️',
    maxHp: 100,
    weaknessCategory: 'pomodoro',
    weaknessLabel: 'Aislamiento y Foco Profundo',
    quote: '"Múltiples estímulos detectados. Fragmentando atención en 3, 2, 1..."',
    defeatQuote: 'Dispersión eliminada. Foco absoluto calibrado.',
    bonusRewardXp: 24,
    bonusRewardCoins: 10,
  },
  {
    name: 'Toxicidad Metabólica',
    title: 'Ingesta de Bajo Rendimiento',
    avatar: '🩸',
    maxHp: 100,
    weaknessCategory: 'comida',
    weaknessLabel: 'Nutrición de Alto Rendimiento',
    quote: '"Niveles de azúcar fluctuantes. Niebla mental inminente..."',
    defeatQuote: 'Metabolismo estabilizado. Energía constante asegurada.',
    bonusRewardXp: 20,
    bonusRewardCoins: 7,
  },
  {
    name: 'Ciber-Sobrecarga',
    title: 'Inundación de Estímulos y Notificaciones',
    avatar: '📱',
    maxHp: 100,
    weaknessCategory: 'pomodoro',
    weaknessLabel: 'Desconexión Digital & Foco',
    quote: '"Pings incesantes. Tu atención se disuelve en micro-dopaminas..."',
    defeatQuote: 'Sobrecarga apagada. Modo enfoque imperturbable activado.',
    bonusRewardXp: 25,
    bonusRewardCoins: 9,
  },
  {
    name: 'Vórtice de Duda',
    title: 'Parálisis por Análisis',
    avatar: '🌀',
    maxHp: 100,
    weaknessCategory: 'creativo',
    weaknessLabel: 'Acción Imperfecta Inmediata',
    quote: '"Planear infinitamente es más seguro que actuar y fallar..."',
    defeatQuote: 'Vórtice quebrado. La ejecución reemplaza la especulación.',
    bonusRewardXp: 24,
    bonusRewardCoins: 8,
  },
  {
    name: 'Devorador de Sueño',
    title: 'Privación de Descanso Reparador',
    avatar: '🦇',
    maxHp: 100,
    weaknessCategory: 'habito',
    weaknessLabel: 'Higiene de Sueño y Ritmo',
    quote: '"Solo un video más... el mañana puede esperar en la fatiga..."',
    defeatQuote: 'Vampiro repelido. Ritmo circadiano protegido.',
    bonusRewardXp: 22,
    bonusRewardCoins: 8,
  },
  {
    name: 'Monolito de Apatía',
    title: 'Erosión de Motivación Intrínseca',
    avatar: '🗿',
    maxHp: 100,
    weaknessCategory: 'habito',
    weaknessLabel: 'Compromiso con el Propósito',
    quote: '"¿Para qué esforzarse si el resultado final no cambiará el universo?..."',
    defeatQuote: 'Monolito pulverizado. Voluntad renovada con fuego.',
    bonusRewardXp: 26,
    bonusRewardCoins: 10,
  },
];

export const getBossForDate = (dateStr: string): BossInfo => {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_BOSSES.length;
  return DAILY_BOSSES[index];
};

interface DailyBossWidgetProps {
  tasks: TaskItem[];
  hasClaimedToday: boolean;
  onClaimBossBounty: (xp: number, coins: number) => void;
  currentDate?: string;
}

export const DailyBossWidget: React.FC<DailyBossWidgetProps> = ({
  tasks,
  hasClaimedToday,
  onClaimBossBounty,
  currentDate,
}) => {
  const copy = useNarrativeCopy();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [bossMode, setBossMode] = useState<'daily' | 'weekly'>('daily');
  const activeDate = currentDate || getTodayDateString();
  const dailyBoss = getBossForDate(activeDate);
  const boss = bossMode === 'daily' ? dailyBoss : WEEKLY_RAID_BOSS;

  // Estado del Jugador y KAI
  const stats = usePlayerStore((s) => s.stats);
  const kaiCustomForm = stats.kaiCustomForm;
  const kaiShape = stats.kaiShape || 'prism';
  const kaiName = kaiCustomForm?.name || 'KAI Guardián';
  const kaiArtStyle = kaiCustomForm?.artStyle;
  const styleDef = kaiArtStyle ? KAI_MULTIVERSE_STYLES.find((s) => s.id === kaiArtStyle) : null;

  // Cálculo de HP
  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter((t) => t.completed).length;

  const completedWeaknessCount = tasks.filter(
    (t) =>
      t.completed &&
      (t.category === boss.weaknessCategory ||
        ((boss.weaknessCategory === 'creativo' || boss.weaknessCategory === 'pomodoro') &&
          (t.category === 'creativo' || t.category === 'estudio')))
  ).length;

  let currentHp = 100;
  if (bossMode === 'daily') {
    const rawDamage = (completedTasks / totalTasks) * 100 + completedWeaknessCount * 4;
    currentHp = Math.max(0, Math.min(100, Math.round(100 - rawDamage)));
  } else {
    const weeklyDamage = completedTasks * 40 + completedWeaknessCount * 60;
    currentHp = Math.max(0, Math.min(100, Math.round(100 - weeklyDamage / 10)));
  }

  const isDefeated = currentHp === 0;

  // Estado de Ataque Reactivo de KAI
  const prevCompletedCountRef = useRef<number>(completedTasks);
  const [attackEffect, setAttackEffect] = useState<{
    id: number;
    damage: number;
    isCrit: boolean;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (completedTasks > prevCompletedCountRef.current) {
      const diff = completedTasks - prevCompletedCountRef.current;
      const isCrit = completedWeaknessCount > 0;
      const damageAmount = Math.min(100, Math.round(diff * (isCrit ? 30 : 20)));

      setAttackEffect({
        id: Date.now(),
        damage: damageAmount,
        isCrit,
        label: isCrit ? '⚡ ¡GOLPE CRÍTICO!' : '💥 ¡IMPACTO KAI!',
      });

      try {
        if (isCrit) {
          soundFX.playFanfare();
          triggerHaptic([30, 50, 40]);
        } else {
          soundFX.playAttackHit();
          triggerHaptic([20, 30]);
        }
      } catch (err) {
        // audio fallback
      }

      if (currentHp === 0) {
        try {
          soundFX.playBossDefeated();
        } catch (_) {}
      }

      const timer = setTimeout(() => {
        setAttackEffect(null);
      }, 1500);

      prevCompletedCountRef.current = completedTasks;
      return () => clearTimeout(timer);
    } else {
      prevCompletedCountRef.current = completedTasks;
    }
  }, [completedTasks, completedWeaknessCount, currentHp]);

  // Medidor de Entropía
  const nowHour = new Date().getHours();
  const timeFactor = Math.min(1, nowHour / 21);
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const totalCount = tasks.length || 1;
  const pendingPercentage = pendingCount / totalCount;

  let systemEntropy = pendingCount === 0 ? 0 : Math.round(pendingPercentage * 60 + timeFactor * 40);
  systemEntropy = Math.max(0, Math.min(100, systemEntropy));

  useEffect(() => {
    if (systemEntropy === 100) {
      const today = getTodayDateString();
      const storageKey = `entropy_boss_triggered_${today}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, 'true');
        try {
          soundFX.playDamageSound();
          usePlayerStore.getState().triggerSurpriseBoss({
            archetypeName: 'Reto de Cierre del Día 🎯',
            buffName: 'Tareas pendientes de la jornada',
            buffDescription:
              'Se acerca el final del día y aún tienes tareas por completar. ¡Avanza con tus objetivos para cerrar con éxito tu jornada y mantener tu racha!',
          });
        } catch (e) {
          console.error('Failed to trigger entropy boss:', e);
        }
      }
    }
  }, [systemEntropy]);

  return (
    <div
      className={`scifi-glass-panel rounded-2xl transition-all font-sans tracking-wide relative overflow-hidden text-white ${
        isDefeated
          ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.35)]'
          : attackEffect
          ? 'border-fuchsia-500 shadow-[0_0_30px_rgba(217,70,239,0.4)]'
          : 'border-orange-500/60 shadow-[0_0_25px_rgba(249,115,22,0.25)]'
      }`}
    >
      {/* Grano esmerilado táctil */}
      <span className="vi-grano opacity-5 pointer-events-none" aria-hidden="true" />

      {/* Luz ambiental sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/10 via-transparent to-purple-900/10 pointer-events-none" />

      <div className="p-3 sm:p-4 relative z-10 space-y-2.5">
        
        {/* 1. Barra Superior: Entropía + Modo de Jefe + Minimizar */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          {/* Entropía / Alerta del Sistema */}
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 font-bold text-slate-300">
              <AlertTriangle
                className={`w-3.5 h-3.5 ${
                  systemEntropy >= 80 ? 'text-red-500 animate-pulse' : 'text-[#d6f421]'
                }`}
              />
              <span className="hidden xs:inline">{copy.bossEntropyLabel}:</span>
            </span>
            <span
              className={`font-black font-mono tabular-nums ${
                systemEntropy === 100
                  ? 'text-red-500 animate-bounce'
                  : systemEntropy >= 75
                  ? 'text-rose-400'
                  : systemEntropy >= 40
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {systemEntropy}% {systemEntropy === 100 ? '🚨 SOBRECARGA' : systemEntropy >= 80 ? '⚡ CRÍTICO' : '✓ ESTABLE'}
            </span>
          </div>

          {/* Selector de Modo & Botón Minimizar */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                triggerHaptic(15);
                setBossMode(bossMode === 'daily' ? 'weekly' : 'daily');
              }}
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition-all cursor-pointer ${
                bossMode === 'weekly'
                  ? 'bg-[#9600ff] text-white border-[#9600ff] shadow-[0_0_8px_rgba(150,0,255,0.5)]'
                  : 'bg-[#03000a] text-cyan-300 border-white/20 hover:border-cyan-400'
              }`}
            >
              {bossMode === 'daily' ? 'Jefe Diario' : 'Raid Semanal'}
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                triggerHaptic(15);
                setIsCollapsed(!isCollapsed);
              }}
              aria-label={isCollapsed ? 'Expandir arena de combate' : 'Minimizar arena'}
              className="p-1 rounded-lg bg-black/60 border border-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 2. MODO COLAPSADO: Tira Táctica de 1 Línea */}
        {isCollapsed ? (
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <div className="flex items-center gap-2 min-w-0">
              {/* Mini KAI */}
              <div className="w-7 h-7 rounded-lg bg-black/70 border border-cyan-400/50 flex items-center justify-center shrink-0 p-0.5">
                <KAICompanion customForm={kaiCustomForm} shapeId={kaiShape} size={24} interactive={false} />
              </div>

              <span className="text-[10px] font-mono font-bold text-fuchsia-400 shrink-0">VS</span>

              {/* Mini Boss */}
              <div className="w-7 h-7 rounded-lg bg-black/70 border border-purple-500/50 flex items-center justify-center text-sm shrink-0">
                {isDefeated ? '💠' : boss.avatar}
              </div>

              <span className="text-xs font-bold text-white truncate">
                {boss.name}
              </span>
            </div>

            {/* Barra y HP */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-20 sm:w-28 h-2 bg-black rounded-full border border-white/20 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDefeated ? 'bg-slate-700 w-0' : 'bg-gradient-to-r from-orange-500 to-[#d6f421]'
                  }`}
                  style={{ width: `${currentHp}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold tabular-nums text-amber-300">
                {isDefeated ? 'DERROTADO' : `${currentHp}%`}
              </span>
            </div>
          </div>
        ) : (
          /* 3. MODO EXPANDIDO: ARENA DE COMBATE COMPLETA */
          <div className="space-y-3">
            {/* Arena Central: KAI vs Campo de Choque vs Boss */}
            <div className="relative p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2 overflow-hidden">
              
              {/* Lado Izquierdo: TU KAI */}
              <motion.div
                animate={
                  attackEffect
                    ? { x: [0, 18, 0], scale: [1, 1.2, 1], rotate: [0, -4, 0] }
                    : isDefeated
                    ? { y: [0, -5, 0], scale: [1, 1.04, 1] }
                    : { y: [0, -2.5, 0] }
                }
                transition={
                  attackEffect
                    ? { duration: 0.45, ease: 'easeOut' }
                    : isDefeated
                    ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
                }
                className="flex flex-col items-center shrink-0 z-10"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/80 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center p-1 relative">
                  <div className="absolute inset-0 bg-radial from-cyan-500/20 via-transparent to-transparent pointer-events-none rounded-2xl" />
                  <KAICompanion
                    customForm={kaiCustomForm}
                    shapeId={kaiShape}
                    size={52}
                    auraState={attackEffect ? 'focus_trance' : isDefeated ? 'victory' : 'normal'}
                    interactive={false}
                  />
                </div>
                <span className="text-[10px] font-bold text-white block truncate max-w-[85px] mt-1 text-center">
                  {kaiName}
                </span>
                <span className="text-[8px] font-mono text-cyan-300 bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-500/40 uppercase whitespace-nowrap">
                  {styleDef?.icon || '⚡'} {styleDef?.name.split('/')[0].trim() || 'KAI'}
                </span>
              </motion.div>

              {/* Centro: Campo de Choque, Proyectil y Diálogo */}
              <div className="flex-1 px-1.5 flex flex-col items-center justify-center relative min-w-[80px]">
                
                {/* Rayo de Ataque de KAI */}
                <AnimatePresence>
                  {attackEffect && (
                    <motion.div
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-300 rounded-full shadow-[0_0_20px_rgba(217,70,239,0.9)] z-20 pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                {/* Chip Flotante de Daño */}
                <AnimatePresence>
                  {attackEffect && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.7 }}
                      animate={{ opacity: 1, y: -10, scale: 1.15 }}
                      exit={{ opacity: 0, y: -25, scale: 0.8 }}
                      transition={{ duration: 0.45 }}
                      className="absolute -top-3 z-30 pointer-events-none"
                    >
                      <div
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black font-mono shadow-lg flex items-center gap-1 whitespace-nowrap ${
                          attackEffect.isCrit
                            ? 'bg-amber-400 text-black border-2 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-bounce'
                            : 'bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white border border-white/50 shadow-[0_0_12px_rgba(217,70,239,0.6)]'
                        }`}
                      >
                        <span>{attackEffect.label}</span>
                        <span className="tabular-nums">-{attackEffect.damage}%</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Insignia VS Central */}
                <div className="flex items-center gap-1 text-[10px] font-mono text-fuchsia-400 font-black">
                  <Swords className="w-3.5 h-3.5" />
                  <span>VS</span>
                </div>

                {/* Frase Reactiva de KAI */}
                <div className="mt-1 text-center max-w-[170px]">
                  <p className="text-[10px] italic text-slate-300 leading-tight line-clamp-2">
                    "{isDefeated
                      ? '¡Inercia derrotada, Cazador!'
                      : attackEffect
                      ? '¡Golpe certero a sus defensas!'
                      : kaiCustomForm?.personalityQuote || '¡Avanza con tus tareas! Yo quebraré su escudo.'}"
                  </p>
                </div>
              </div>

              {/* Lado Derecho: EL JEFE (BOSS) */}
              <motion.div
                animate={
                  attackEffect
                    ? {
                        x: [0, -10, 10, -6, 0],
                        filter: ['brightness(1)', 'brightness(2) contrast(1.5)', 'brightness(1)'],
                      }
                    : isDefeated
                    ? { scale: [1, 0.92, 1], opacity: 0.7 }
                    : { y: [0, 2.5, 0] }
                }
                transition={
                  attackEffect
                    ? { duration: 0.4 }
                    : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                }
                className="flex flex-col items-center shrink-0 z-10"
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl border transition-all ${
                    isDefeated
                      ? 'bg-slate-900/80 border-slate-700 text-slate-500'
                      : attackEffect
                      ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.7)]'
                      : 'bg-[#03000a] border-purple-500/60 shadow-[0_0_15px_rgba(150,0,255,0.4)]'
                  }`}
                >
                  {isDefeated ? '💠' : boss.avatar}
                </div>
                <span className="text-[10px] font-bold text-white block truncate max-w-[85px] mt-1 text-center">
                  {boss.name}
                </span>
                <span
                  className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded border uppercase tabular-nums ${
                    isDefeated
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : currentHp <= 30
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500 animate-pulse'
                      : 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                  }`}
                >
                  {isDefeated ? 'CAÍDO' : `${currentHp}% HP`}
                </span>
              </motion.div>
            </div>

            {/* Barra de Salud del Boss */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1 text-[#fb5607] font-bold">
                  <Skull className="w-3.5 h-3.5" />
                  <span>SALUD DEL JEFE:</span>
                </span>
                <span className="font-mono text-white tabular-nums font-bold">
                  {currentHp}% {isDefeated && `💠 (${copy.bossDefeatedBadge})`}
                </span>
              </div>

              <div
                role="progressbar"
                aria-label={`Salud restante del jefe ${boss.name}`}
                aria-valuenow={currentHp}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${currentHp}% de fuerza`}
                className="w-full h-3 bg-black rounded-full border border-orange-500/40 p-0.5 overflow-hidden"
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isDefeated
                      ? 'bg-slate-700 w-0'
                      : currentHp <= 30
                      ? 'bg-gradient-to-r from-red-600 to-[#fb5607] animate-pulse shadow-[0_0_10px_rgba(251,86,7,0.8)]'
                      : 'bg-gradient-to-r from-[#fb5607] via-orange-500 to-[#d6f421] shadow-[0_0_10px_rgba(251,86,7,0.7)]'
                  }`}
                  style={{ width: `${currentHp}%` }}
                />
              </div>
            </div>

            {/* Vulnerabilidad & Recompensa */}
            <div className="pt-2 border-t border-dashed border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
              {/* Debilidad Táctica */}
              <div className="flex items-center gap-1.5 text-white">
                <Zap className="w-3.5 h-3.5 text-[#d6f421] fill-[#d6f421]" />
                <span className="text-slate-300">Vulnerable a:</span>
                <span className="text-[#d6f421] bg-black/60 px-2 py-0.5 rounded border border-[#d6f421]/40 text-[10px] font-mono">
                  {boss.weaknessLabel} (1.5x daño)
                </span>
              </div>

              {/* Botín Prometido */}
              <div className="flex items-center gap-1.5 text-white">
                <Trophy className="w-3.5 h-3.5 text-[#d6f421]" />
                <span className="text-slate-300">Botín:</span>
                <span className="text-white bg-black/60 px-2 py-0.5 rounded border border-white/20 font-mono text-[10px] tabular-nums">
                  +{boss.bonusRewardXp} XP • +{boss.bonusRewardCoins} 💠
                </span>
              </div>

              {/* Botón de Reclamar al Derrotar */}
              {isDefeated && !hasClaimedToday && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFX.playLevelUp();
                    triggerHaptic([30, 50, 40]);
                    onClaimBossBounty(boss.bonusRewardXp, boss.bonusRewardCoins);
                  }}
                  className="w-full mt-1.5 py-2.5 bg-gradient-to-r from-[#d6f421] via-yellow-400 to-amber-400 text-black rounded-xl font-black tracking-wider uppercase text-xs transition-all shadow-[0_0_20px_rgba(214,244,33,0.5)] cursor-pointer hover:opacity-95 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Trophy className="w-4 h-4 fill-black" />
                  <span>¡Victoria! Reclamar Botín (+{boss.bonusRewardXp} XP • +{boss.bonusRewardCoins} 💠)</span>
                </button>
              )}

              {isDefeated && hasClaimedToday && (
                <div className="w-full mt-1.5 py-1.5 bg-emerald-950/60 border border-emerald-400/50 text-emerald-300 rounded-xl font-mono text-xs text-center font-bold flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>✓ Botín de Cazador Asegurado Hoy</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
