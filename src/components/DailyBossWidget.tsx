import React, { useState, useEffect } from 'react';
import { TaskItem, TaskCategory } from '../types';
import { ShieldAlert, Zap, Skull, Trophy, Sparkles, ChevronDown, ChevronUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { soundFX } from '../utils/audio';
import { getTodayDateString } from '../utils/date';

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
    weaknessCategory: 'voluntad' as any,
    weaknessLabel: 'Compromiso con el Propósito',
    quote: '"¿Para qué esforzarse si el resultado final no cambiará el universo?..."',
    defeatQuote: 'Monolito pulverizado. Voluntad renovada con fuego.',
    bonusRewardXp: 26,
    bonusRewardCoins: 10,
  },
];

// Selecciona UN SOLO JEFE ALEATORIO por día (determinado por la fecha para consistencia diaria)
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [bossMode, setBossMode] = useState<'daily' | 'weekly'>('daily');
  const activeDate = currentDate || getTodayDateString();
  const dailyBoss = getBossForDate(activeDate);
  const boss = bossMode === 'daily' ? dailyBoss : WEEKLY_RAID_BOSS;

  // Calculate Boss HP based on task completion
  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter((t) => t.completed).length;

  // Weakness bonus damage calculation
  const completedWeaknessCount = tasks.filter((t) => t.completed && (t.category === boss.weaknessCategory || ((boss.weaknessCategory === 'creativo' || boss.weaknessCategory === 'pomodoro') && (t.category === 'creativo' || t.category === 'estudio')))).length;
  
  // Normal tasks do baseline damage, weakness tasks do 1.5x damage
  let currentHp = 100;
  if (bossMode === 'daily') {
    const rawDamage = (completedTasks / totalTasks) * 100 + (completedWeaknessCount * 4);
    currentHp = Math.max(0, Math.min(100, Math.round(100 - rawDamage)));
  } else {
    // Weekly raid boss calculation
    const weeklyDamage = (completedTasks * 40) + (completedWeaknessCount * 60);
    currentHp = Math.max(0, Math.min(100, Math.round(100 - (weeklyDamage / 10))));
  }
  
  const isDefeated = currentHp === 0;

  // -------------------------------------------------------------
  // PILAR B: MEDIDOR DE ENTROPÍA DETERMINISTA (Alineado con Opción 3)
  // -------------------------------------------------------------
  const nowHour = new Date().getHours();
  // Time factor scales from 0 to 1 as the day progresses (maxing at 9:00 PM)
  const timeFactor = Math.min(1, nowHour / 21);
  const pendingCount = tasks.filter(t => !t.completed).length;
  const totalCount = tasks.length || 1;
  const pendingPercentage = pendingCount / totalCount;

  // If completed all tasks, entropy is completely resolved (0%)
  // Otherwise, it is 60% based on pending tasks and 40% based on the time of day progression
  let systemEntropy = pendingCount === 0 ? 0 : Math.round((pendingPercentage * 60) + (timeFactor * 40));
  systemEntropy = Math.max(0, Math.min(100, systemEntropy));

  // Trigger system boss fight at 100% Entropy exactly once per day
  useEffect(() => {
    if (systemEntropy === 100) {
      const today = getTodayDateString();
      const storageKey = `entropy_boss_triggered_${today}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, 'true');
        try {
          soundFX.playDamageSound();
          usePlayerStore.getState().triggerSurpriseBoss({
            archetypeName: 'NÉMESIS DE ENTROPÍA CRÍTICA 👾',
            buffName: 'SOBRECARGA DEL SISTEMA AL 100%',
            buffDescription: 'La inercia acumulada de tus misiones sin completar y el paso de las horas del día real han sobrecargado el Quantum OS. ¡Despeja tu agenda para estabilizar el sistema y evitar daños vitales!'
          });
        } catch (e) {
          console.error('Failed to trigger entropy boss:', e);
        }
      }
    }
  }, [systemEntropy]);

  return (
    <div className={`scifi-glass-panel rounded-2xl transition-all font-sans tracking-wide relative overflow-hidden text-white ${
      isDefeated
        ? 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.35)]'
        : 'border-orange-500/60 shadow-[0_0_25px_rgba(249,115,22,0.25)]'
    }`}>
      
      {/* Background sketch glow effect */}
      <div className="absolute -right-6 -bottom-6 text-7xl opacity-20 pointer-events-none select-none">
        {boss.avatar}
      </div>

      <div className="p-3.5 sm:p-4">
        
        {/* Entropy of the System Indicator */}
        <div className="mb-3 pb-2.5 border-b border-dashed border-[#9600ff]/30">
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <AlertTriangle className={`w-3.5 h-3.5 ${systemEntropy >= 80 ? 'text-red-500 animate-pulse' : 'text-[#d6f421]'}`} />
              <span>ENTROPÍA DIARIA</span>
            </span>
            <span className={`font-black font-mono ${
              systemEntropy === 100 
                ? 'text-red-500 animate-bounce' 
                : systemEntropy >= 75 
                ? 'text-rose-400' 
                : systemEntropy >= 40 
                ? 'text-amber-400' 
                : 'text-emerald-400'
            }`}>
              {systemEntropy}% {systemEntropy === 100 ? '🚨 SOBRECARGA' : systemEntropy >= 80 ? '⚡ CRÍTICO' : '✓ ESTABLE'}
            </span>
          </div>

          <div className="w-full h-2 bg-black rounded-full border border-[#9600ff]/30 p-0.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                systemEntropy === 100
                  ? 'bg-gradient-to-r from-red-600 to-[#fb5607] animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                  : systemEntropy >= 75
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                  : 'bg-gradient-to-r from-emerald-500 to-amber-400'
              }`}
              style={{ width: `${systemEntropy}%` }}
            />
          </div>
        </div>
        
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#03000a] border border-[#9600ff] flex items-center justify-center text-lg sm:text-xl shadow-[0_0_8px_rgba(150,0,255,0.4)]">
              {isDefeated ? '💠' : boss.avatar}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setBossMode(bossMode === 'daily' ? 'weekly' : 'daily')}
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                    bossMode === 'weekly'
                      ? 'bg-[#9600ff] text-white border-[#9600ff] shadow-[0_0_8px_rgba(150,0,255,0.5)]'
                      : 'bg-[#03000a] text-[#d6f421] border-[#9600ff]/60 hover:border-[#d6f421]'
                  }`}
                >
                  {bossMode === 'daily' ? 'Raid Semanal' : 'Jefe Diario'}
                </button>
                <span className={`text-[10px] font-anton uppercase px-1.5 py-0.2 rounded border ${
                  isDefeated
                    ? 'bg-[#d6f421] text-black border-[#d6f421]'
                    : 'bg-[#fb5607] text-white border-[#fb5607]'
                }`}>
                  {isDefeated ? 'NEUTRALIZADO' : 'ACTIVO'}
                </span>
                <span className="text-xs sm:text-sm font-anton tracking-wide text-white">
                  {boss.name}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 rounded-xl bg-[#03000a] border border-[#9600ff]/60 text-white hover:bg-[#9600ff]/30 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expandir' : 'Minimizar'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Boss HP Bar */}
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center justify-between text-xs font-anton">
            <span className="flex items-center gap-1 text-[#fb5607]">
              <Skull className="w-3.5 h-3.5" />
              <span>FUERZA:</span>
            </span>
            <span className="font-mono text-white">
              {currentHp}% {isDefeated && '💠 (NEUTRALIZADO)'}
            </span>
          </div>

          <div className="w-full h-3 bg-black rounded-full border border-[#fb5607]/60 p-0.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isDefeated
                  ? 'bg-slate-700 w-0'
                  : currentHp <= 30
                  ? 'bg-gradient-to-r from-red-600 to-[#fb5607] animate-pulse shadow-[0_0_8px_rgba(251,86,7,0.8)]'
                  : 'bg-gradient-to-r from-[#fb5607] via-orange-500 to-[#d6f421] shadow-[0_0_8px_rgba(251,86,7,0.7)]'
              }`}
              style={{ width: `${currentHp}%` }}
            />
          </div>
        </div>

        {/* Expanded Info */}
        {!isCollapsed && (
          <div className="mt-2 pt-2 border-t border-dashed border-[#9600ff]/40 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
            <div className="flex items-center gap-1 text-white">
              <Zap className="w-3 h-3 text-[#d6f421] fill-[#d6f421]" />
              <span>Contramedida:</span>
              <span className="text-[#d6f421] bg-[#03000a] px-1.5 py-0.2 rounded border border-[#9600ff]/60">
                {boss.weaknessLabel}
              </span>
            </div>

            <div className="flex items-center gap-1 text-white">
              <Trophy className="w-3 h-3 text-[#d6f421]" />
              <span>Optimización:</span>
              <span className="text-white bg-[#03000a] px-1.5 py-0.2 rounded border border-[#9600ff]/60 font-mono">
                +{boss.bonusRewardXp} XP • +{boss.bonusRewardCoins} 💠
              </span>
            </div>
            
            {isDefeated && !hasClaimedToday && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  soundFX.playLevelUp();
                  onClaimBossBounty(boss.bonusRewardXp, boss.bonusRewardCoins);
                }}
                className="w-full mt-2 py-2 bg-[#d6f421] text-black border border-[#d6f421] rounded-lg font-anton tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(214,244,33,0.5)] cursor-pointer hover:bg-yellow-300"
              >
                Reclamar Botín
              </button>
            )}
            
            {isDefeated && hasClaimedToday && (
              <div className="w-full mt-2 py-1.5 bg-[#03000a] border border-[#d6f421]/40 text-[#d6f421] rounded-lg font-anton tracking-widest uppercase text-center shadow-inner">
                ✓ Botín Asegurado
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
