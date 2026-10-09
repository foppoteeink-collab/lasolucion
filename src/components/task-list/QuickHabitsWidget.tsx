import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Edit3,
  Trash2,
  Trophy,
  Award,
  Flame,
  X,
  Check,
  Sparkles,
  ShieldCheck,
  Lock,
  RotateCcw,
  Dumbbell,
  Droplets,
  Timer,
  BookOpen,
  CheckSquare,
  Brain,
  Target,
  Heart,
  Coffee,
  Sun,
  Moon,
  Smile,
  Footprints,
  CigaretteOff,
  Activity,
  Book,
  Flower2,
  Ban,
  Apple,
  ShieldAlert,
} from 'lucide-react';
import { TaskItem, CustomHabit } from '../../types';
import { INITIAL_CUSTOM_HABITS } from '../../data/defaults';
import * as gameEngine from '../../engine/gameEngine';
import { useAppStore } from '../../store/useAppStore';
import { useTaskStore } from '../../store/useTaskStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { soundFX } from '../../utils/audio';
import { getHabitBaseId, computeHabitStreak } from '../../intelligence/masteryEngine';
import { getTodayDateString } from '../../utils/date';

/**
 * Robust cybernetic habit icon renderer:
 * Maps icon names, emojis or title keywords strictly to high-tech vector Lucide icons.
 * Never outputs literal emoji text or raw strings.
 */
export const renderHabitIcon = (rawIcon?: string, title: string = '', sizeClass: string = 'w-5 h-5') => {
  const icon = (rawIcon || '').trim();
  const lowerTitle = (title || '').toLowerCase();

  // 1. Direct Lucide Icon string names
  switch (icon) {
    case 'Dumbbell':
      return <Dumbbell className={`${sizeClass} shrink-0 text-cyan-400`} />;
    case 'Droplets':
      return <Droplets className={`${sizeClass} shrink-0 text-cyan-400`} />;
    case 'Timer':
      return <Timer className={`${sizeClass} shrink-0 text-cyan-400`} />;
    case 'BookOpen':
    case 'Book':
      return <BookOpen className={`${sizeClass} shrink-0 text-yellow-400`} />;
    case 'CheckSquare':
      return <CheckSquare className={`${sizeClass} shrink-0 text-cyan-400`} />;
    case 'Brain':
      return <Brain className={`${sizeClass} shrink-0 text-fuchsia-400`} />;
    case 'Target':
      return <Target className={`${sizeClass} shrink-0 text-amber-400`} />;
    case 'Heart':
      return <Heart className={`${sizeClass} shrink-0 text-rose-400`} />;
    case 'Coffee':
      return <Coffee className={`${sizeClass} shrink-0 text-amber-400`} />;
    case 'Sun':
      return <Sun className={`${sizeClass} shrink-0 text-amber-400`} />;
    case 'Moon':
      return <Moon className={`${sizeClass} shrink-0 text-indigo-400`} />;
    case 'Smile':
      return <Smile className={`${sizeClass} shrink-0 text-emerald-400`} />;
    case 'Footprints':
      return <Footprints className={`${sizeClass} shrink-0 text-cyan-400`} />;
    case 'CigaretteOff':
      return <CigaretteOff className={`${sizeClass} shrink-0 text-rose-400`} />;
    case 'Ban':
      return <Ban className={`${sizeClass} shrink-0 text-amber-400`} />;
    case 'Activity':
      return <Activity className={`${sizeClass} shrink-0 text-cyan-400`} />;
    case 'Zap':
      return <Zap className={`${sizeClass} shrink-0 text-amber-400`} />;
    case 'Flame':
      return <Flame className={`${sizeClass} shrink-0 text-amber-400`} />;
    case 'Flower2':
      return <Flower2 className={`${sizeClass} shrink-0 text-purple-400`} />;
    case 'Sparkles':
      return <Sparkles className={`${sizeClass} shrink-0 text-cyan-300`} />;
    case 'Apple':
      return <Apple className={`${sizeClass} shrink-0 text-emerald-400`} />;
  }

  // 2. Keyword & emoji translation into high-tech vector icons
  if (lowerTitle.includes('agua') || lowerTitle.includes('hidrat') || icon === '💧' || icon === '🌊') {
    return <Droplets className={`${sizeClass} shrink-0 text-cyan-400`} />;
  }
  if (lowerTitle.includes('diente') || lowerTitle.includes('cepill') || lowerTitle.includes('higiene') || icon === '🪥') {
    return <Sparkles className={`${sizeClass} shrink-0 text-cyan-300`} />;
  }
  if (lowerTitle.includes('ejercicio') || lowerTitle.includes('entren') || lowerTitle.includes('gym') || lowerTitle.includes('físic') || icon === '🏋️') {
    return <Dumbbell className={`${sizeClass} shrink-0 text-cyan-400`} />;
  }
  if (lowerTitle.includes('lectura') || lowerTitle.includes('leer') || lowerTitle.includes('libro') || icon === '📚') {
    return <BookOpen className={`${sizeClass} shrink-0 text-yellow-400`} />;
  }
  if (lowerTitle.includes('medita') || lowerTitle.includes('respir') || lowerTitle.includes('zen') || lowerTitle.includes('mindful') || icon === '🧘') {
    return <Flower2 className={`${sizeClass} shrink-0 text-purple-400`} />;
  }
  if (lowerTitle.includes('mente') || lowerTitle.includes('enfoque') || lowerTitle.includes('cerebro') || lowerTitle.includes('autocontrol') || icon === '🧠') {
    return <Brain className={`${sizeClass} shrink-0 text-fuchsia-400`} />;
  }
  if (lowerTitle.includes('fumar') || lowerTitle.includes('tabaco') || lowerTitle.includes('vape') || icon === '🚭') {
    return <CigaretteOff className={`${sizeClass} shrink-0 text-rose-400`} />;
  }
  if (lowerTitle.includes('licor') || lowerTitle.includes('alcohol') || lowerTitle.includes('cerveza') || icon === '🍺') {
    return <Ban className={`${sizeClass} shrink-0 text-amber-400`} />;
  }
  if (lowerTitle.includes('tiempo') || lowerTitle.includes('timer') || lowerTitle.includes('pomodoro') || icon === '⏱️') {
    return <Timer className={`${sizeClass} shrink-0 text-cyan-400`} />;
  }
  if (lowerTitle.includes('cierre') || lowerTitle.includes('auditor') || lowerTitle.includes('check') || icon === '✅') {
    return <CheckSquare className={`${sizeClass} shrink-0 text-cyan-400`} />;
  }
  if (lowerTitle.includes('dormir') || lowerTitle.includes('sueño') || lowerTitle.includes('descanso') || icon === '🌙') {
    return <Moon className={`${sizeClass} shrink-0 text-indigo-400`} />;
  }
  if (lowerTitle.includes('sol') || lowerTitle.includes('mañana') || icon === '☀️') {
    return <Sun className={`${sizeClass} shrink-0 text-amber-400`} />;
  }

  return <Zap className={`${sizeClass} shrink-0 text-cyan-400`} />;
};

interface QuickHabitsWidgetProps {
  tasks: TaskItem[];
  onIncrementHabit: (taskId: string, e: React.MouseEvent) => void;
  onOpenAddModal: (isQuick: boolean) => void;
  onOpenEditModal: (task: TaskItem) => void;
  onOpenHabitManager?: () => void;
  onDeleteTask: (taskId: string) => void;
  currentDate?: string;
  isDayFinalized?: boolean;
}

// Preset recommended 21 & 66 day habits (clean of emojis)
const PRESET_2166_HABITS: Omit<CustomHabit, 'id'>[] = [
  {
    title: 'Higiene & Cepillado Bucal',
    category: 'habito',
    description: 'Higiene bucal tras cada comida principal (3 veces al día).',
    xpReward: 5,
    coinReward: 2,
    frequencyType: 'daily',
    targetCount: 3,
    unit: 'veces',
    isQuickHabit: true,
    quickIcon: 'Sparkles',
  },
  {
    title: 'Hidratación Cuántica (2L)',
    category: 'habito',
    description: 'Hidratación constante a lo largo del día (8 vasos).',
    xpReward: 8,
    coinReward: 3,
    frequencyType: 'daily',
    targetCount: 8,
    unit: 'vasos',
    isQuickHabit: true,
    quickIcon: 'Droplets',
  },
  {
    title: 'Acondicionamiento Físico',
    category: 'entrenamiento',
    description: '45 minutos de entrenamiento o movimiento físico.',
    xpReward: 20,
    coinReward: 8,
    frequencyType: 'daily',
    targetCount: 1,
    unit: 'sesión',
    isQuickHabit: true,
    quickIcon: 'Dumbbell',
  },
  {
    title: 'Vida Limpia / Cero Tabaco',
    category: 'habito',
    description: 'Día limpio sin consumo de tabaco o vapeo.',
    xpReward: 25,
    coinReward: 10,
    frequencyType: 'daily',
    targetCount: 1,
    unit: 'día',
    isQuickHabit: true,
    quickIcon: 'CigaretteOff',
  },
  {
    title: 'Claridad Mental / Cero Alcohol',
    category: 'habito',
    description: 'Día libre de alcohol para máxima recuperación neurológica.',
    xpReward: 25,
    coinReward: 10,
    frequencyType: 'daily',
    targetCount: 1,
    unit: 'día',
    isQuickHabit: true,
    quickIcon: 'Ban',
  },
  {
    title: 'Autocontrol & Enfoque Profundo',
    category: 'habito',
    description: 'Dominio de impulsos y mente limpia sin distracciones.',
    xpReward: 25,
    coinReward: 10,
    frequencyType: 'daily',
    targetCount: 1,
    unit: 'día',
    isQuickHabit: true,
    quickIcon: 'Brain',
  },
  {
    title: 'Lectura Diaria (10 Páginas)',
    category: 'estudio',
    description: 'Lectura activa de libros de crecimiento personal o técnico.',
    xpReward: 15,
    coinReward: 5,
    frequencyType: 'daily',
    targetCount: 1,
    unit: 'sesión',
    isQuickHabit: true,
    quickIcon: 'BookOpen',
  },
  {
    title: 'Meditación & Respiración',
    category: 'habito',
    description: '10 minutos de respiración diafragmática y mindfulness.',
    xpReward: 15,
    coinReward: 5,
    frequencyType: 'daily',
    targetCount: 1,
    unit: 'sesión',
    isQuickHabit: true,
    quickIcon: 'Flower2',
  },
];

export const QuickHabitsWidget: React.FC<QuickHabitsWidgetProps> = ({
  tasks,
  onIncrementHabit,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteTask,
  onOpenHabitManager,
  currentDate,
  isDayFinalized,
}) => {
  const habitMastery = useAppStore(s => s.habitMastery);
  const customHabits = useTaskStore(s => s.customHabits);
  const tasksByDate = useTaskStore(s => s.tasksByDate);
  const playerLevel = usePlayerStore(s => s.stats.level || 1);
  const [isMilestonesModalOpen, setIsMilestonesModalOpen] = useState(false);
  const [activatedNotice, setActivatedNotice] = useState<string | null>(null);

  // Strictly select dedicated quick/discipline habits for 21/66 day tracking, deduplicated by title and ID
  const quickHabits = React.useMemo(() => {
    const rawList = tasks.filter((t) => {
      if (!t || !t.title) return false;
      if (t.isQuickHabit || t.isTracked2166 || t.category === 'habito' || String(t.id || '').includes('habit-')) {
        return true;
      }
      if (t.timeBlock) return false;
      const lower = (t.title || '').toLowerCase();
      return lower.includes('agua') || lower.includes('dientes');
    });
    const seenTitles = new Set<string>();
    const seenIds = new Set<string>();
    return rawList.filter((t) => {
      const normTitle = (t.title || "").toLowerCase().trim();
      if (seenTitles.has(normTitle) || (t.id && seenIds.has(t.id))) return false;
      seenTitles.add(normTitle);
      if (t.id) seenIds.add(t.id);
      return true;
    });
  }, [tasks]);

  // Hydrate custom habits into active day if quickHabits list for today is empty
  React.useEffect(() => {
    if (quickHabits.length === 0 && customHabits.length > 0) {
      gameEngine.injectHabitsToExistingDays(customHabits);
    }
  }, [quickHabits.length, customHabits.length]);

  // Helper to activate a preset habit
  const handleActivatePreset = (preset: Omit<CustomHabit, 'id'>) => {
    soundFX.playClick();
    
    // Check if already in custom habits or active tasks
    const normTitle = (preset.title || "").toLowerCase().trim();
    const existing = customHabits.find(h => (h.title || "").toLowerCase().trim() === normTitle);
    
    if (!existing) {
      const newHabit: CustomHabit = {
        ...preset,
        isQuickHabit: true,
        id: `custom-habit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      };
      gameEngine.handleSaveHabits([...customHabits, newHabit]);
    }

    setActivatedNotice(`¡Hábito "${preset.title}" activado!`);
    setTimeout(() => setActivatedNotice(null), 3000);
  };

  return (
    <div className="scifi-glass-panel rounded-2xl p-3.5 sm:p-4 space-y-3 font-sans text-white">
      {/* Header with Title and Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/30 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#04020e] border border-cyan-500/60 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
            <Zap className="w-4 h-4 fill-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black font-anton text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Check Rápido de Hábitos</span>
              <span className="text-[10px] font-mono bg-cyan-950/90 px-2 py-0.5 rounded-md border border-cyan-500/60 text-cyan-200">
                {quickHabits.length}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onOpenAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/60 hover:border-cyan-400 text-xs font-black transition-all cursor-pointer min-h-[38px] active:scale-95 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            title="Crear un nuevo hábito de disciplina con contador"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>+ Hábito</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setIsMilestonesModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-950/80 via-amber-900/60 to-yellow-950/80 text-yellow-300 border border-yellow-500/60 hover:border-yellow-400 text-xs font-black transition-all cursor-pointer min-h-[38px] active:scale-95 shadow-[0_0_12px_rgba(234,179,8,0.25)]"
            title="Ver matriz de maestría neuroplástica (rachas 21 y 66 días)"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span>Maestría (21/66d)</span>
          </button>
        </div>
      </div>

      {activatedNotice && (
        <div className="p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-1 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>{activatedNotice}</span>
          </div>
          <button
            onClick={() => setActivatedNotice(null)}
            className="text-cyan-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ICON-ONLY Quick Habits Row: Ultra Compact, Clear Counters, Zero Text Overlap */}
      <div className="flex flex-wrap gap-2 items-center">
        {quickHabits.length === 0 ? (
          <div className="w-full text-center py-3 text-xs text-slate-500 dark:text-cyan-300/70 italic">
            No tienes hábitos de Check Rápido activos. Abre "Hitos 21 / 66d" para gestionarlos.
          </div>
        ) : (
          quickHabits.map((qh, idx) => {
            const current = qh.currentCount || 0;
            const target = qh.targetCount || 1;
            const isFinished = qh.completed || current >= target;

            // Dynamic consecutive days streak computed from history
            const baseId = getHabitBaseId(qh);
            const mastery = habitMastery?.[baseId] || habitMastery?.[qh.id];
            const { currentStreak, highestStreak } = computeHabitStreak(
              qh,
              tasksByDate,
              currentDate,
              mastery
            );
            const todayStr = getTodayDateString();
            const isDayEnded = Boolean(isDayFinalized) || Boolean(currentDate && currentDate < todayStr);
            const isLocked = isDayEnded && !isFinished;

            return (
              <div
                key={qh.id ? `qh-strip-${qh.id}-${idx}` : `qh-strip-${idx}`}
                className="relative group inline-flex items-center"
              >
                {/* ICON-ONLY Tap Button to Increment Habit */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isLocked) {
                      soundFX.playClick();
                      return;
                    }
                    onIncrementHabit(qh.id, e);
                  }}
                  disabled={isLocked}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all select-none border min-h-[40px] cursor-pointer active:scale-95 ${
                    isLocked
                      ? 'bg-rose-950/40 border-rose-900/50 text-rose-400 cursor-not-allowed opacity-75'
                      : isFinished
                      ? 'bg-cyan-950/60 border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      : 'bg-[#001830] hover:bg-[#002244] border-cyan-700/60 hover:border-cyan-400 text-white shadow-xs'
                  }`}
                  title={`${qh.title} (${current}/${target}) - Racha: ${currentStreak}d. ${
                    isLocked
                      ? 'Bloqueado por fin de jornada'
                      : isFinished
                      ? 'Completado hoy (Toca para sumar)'
                      : 'Toca para registrar (+1)'
                  }`}
                >
                  {/* Clean Visual Icon - NO text or letters */}
                  <div className="shrink-0 flex items-center justify-center w-6 h-6">
                    {renderHabitIcon(qh.quickIcon, qh.title, 'w-5 h-5')}
                  </div>

                  {/* Compact Numeric Counter Badge */}
                  <span
                    className={`text-[11px] font-mono font-black px-1.5 py-0.5 rounded-md shrink-0 border ${
                      isLocked
                        ? 'bg-rose-950/80 border-rose-800/80 text-rose-300'
                        : isFinished
                        ? 'bg-cyan-900/90 border-cyan-400 text-cyan-200'
                        : 'bg-black/70 border-cyan-700/60 text-cyan-300'
                    }`}
                  >
                    {current}/{target}
                  </span>

                  {/* Micro Streak Flame Badge */}
                  {currentStreak > 0 && !isLocked && (
                    <span
                      className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/70 px-1 py-0.5 rounded border border-amber-500/50 flex items-center gap-0.5 shrink-0"
                      title={`Racha de ${currentStreak} días`}
                    >
                      <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400/30" />
                      <span>{currentStreak}d</span>
                    </span>
                  )}

                  {/* Micro Lock icon if locked */}
                  {isLocked && (
                    <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                  )}

                  {/* Subtle Completed Check Indicator */}
                  {isFinished && !isLocked && (
                    <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0 stroke-[3]" />
                  )}
                </button>

                {/* Subtle Edit Button on hover (top-left) */}
                {!isLocked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditModal(qh);
                    }}
                    className="absolute -top-1.5 -left-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-950/95 hover:bg-cyan-900 border border-cyan-400 text-cyan-300 p-1 rounded-full shadow-md z-10 cursor-pointer"
                    title={`Editar hábito "${qh.title}" (formato 21 y 66 días)`}
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                  </button>
                )}

                {/* Subtle Reset Button (applies on hover when current > 0 to save space) */}
                {current > 0 && !isLocked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      gameEngine.handleResetHabit(qh.id, e);
                    }}
                    className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-950/95 hover:bg-amber-900 border border-amber-500 text-amber-300 p-1 rounded-full shadow-md z-10 cursor-pointer"
                    title={`Reiniciar contador de "${qh.title}" a 0`}
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 21 & 66 DAYS MILESTONE MODAL */}
      {isMilestonesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsMilestonesModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-[#001830] border border-cyan-400 p-4 sm:p-6 shadow-[0_0_35px_rgba(0,240,255,0.4)] text-white max-h-[88dvh] sm:max-h-[85vh] flex flex-col overflow-hidden font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-cyan-900/80 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 font-black shadow-[0_0_12px_rgba(234,179,8,0.5)]">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Maestría y Rachas: 21 & 66 Días</span>
                  </h3>
                  <p className="text-xs text-cyan-300/90 mt-0.5">
                    Consolidación neuroplástica y automatización de hábitos
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMilestonesModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-cyan-950/60 border border-transparent hover:border-cyan-700/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-5 scrollbar-thin scrollbar-thumb-cyan-700 scrollbar-track-transparent">
              {activatedNotice && (
                <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{activatedNotice}</span>
                </div>
              )}

              {/* Science Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#001020] border border-cyan-800/80 text-xs space-y-2">
                <div className="flex items-center gap-2 text-yellow-400 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>¿Por qué 21 y 66 Días?</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  • <strong className="text-cyan-300">21 Días (Regla de Maltz):</strong> Mínimo requerido para romper viejos patrones e instalar un nuevo circuito neuroquímico.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  • <strong className="text-amber-300">66 Días (Estudio de Phillippa Lally / Cialdini):</strong> Tiempo promedio en que un comportamiento se convierte en <strong className="text-white">automatización pura</strong> e inconsciente.
                </p>
              </div>

              {/* SECTION 1: Active Tracked Discipline Habits */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-xs font-black text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Tus Hábitos de Disciplina Activos</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setIsMilestonesModalOpen(false);
                      onOpenAddModal(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
                    title="Crear un hábito propio con seguimiento de 21 y 66 días"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Crear Hábito (21/66d)</span>
                  </button>
                </div>

                {quickHabits.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Aún no tienes hábitos de disciplina activados. Selecciona uno del catálogo inferior.
                  </p>
                ) : (
                  quickHabits.map((qh, idx) => {
                    const baseId = getHabitBaseId(qh);
                    const mastery = habitMastery?.[baseId] || habitMastery?.[qh.id];
                    const { currentStreak: streak, highestStreak } = computeHabitStreak(
                      qh,
                      tasksByDate,
                      currentDate,
                      mastery
                    );

                    const p21 = Math.min(100, Math.round((streak / 21) * 100));
                    const p66 = Math.min(100, Math.round((streak / 66) * 100));

                    const has21 = streak >= 21 || mastery?.isMaltzReached;
                    const has66 = streak >= 66 || mastery?.isMastered;

                    return (
                      <div
                        key={qh.id ? `qh-modal-${qh.id}-${idx}` : `qh-modal-${idx}`}
                        className="p-3.5 rounded-xl bg-[#002244] border border-cyan-700/60 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center shrink-0">
                              {renderHabitIcon(qh.quickIcon, qh.title, 'w-6 h-6')}
                            </div>
                            <div>
                              <h5 className="text-xs sm:text-sm font-black text-white">{qh.title}</h5>
                              <p className="text-[11px] text-slate-300">{qh.description || 'Hábito de disciplina diaria'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xs font-black text-amber-300">
                                <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                                <span>{streak} Días</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">racha actual</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Edit Habit Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  soundFX.playClick();
                                  setIsMilestonesModalOpen(false);
                                  onOpenEditModal(qh);
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/80 hover:border-cyan-400 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-95 shadow-sm"
                                title={`Editar hábito "${qh.title}" (metas, días y 21/66d)`}
                              >
                                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Editar</span>
                              </button>

                              {/* Delete Habit Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteTask(qh.id);
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-red-400 hover:text-red-200 bg-red-950/60 hover:bg-red-900/80 border border-red-700/80 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold active:scale-95 shadow-sm"
                                title={`Eliminar el hábito "${qh.title}"`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Borrar</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar 21 Days */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-cyan-300 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-cyan-400" /> Hito 21 Días (Formación):
                            </span>
                            <span className="font-mono text-cyan-200">
                              {streak}/21d ({p21}%) {has21 && '✓ ¡LOGRADO!'}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-black/60 rounded-full border border-cyan-800 p-0.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                has21 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]' : 'bg-cyan-600'
                              }`}
                              style={{ width: `${p21}%` }}
                            />
                          </div>
                        </div>

                        {/* Progress Bar 66 Days */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-amber-300 flex items-center gap-1">
                              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Hito 66 Días (Automatización):
                            </span>
                            <span className="font-mono text-amber-200">
                              {streak}/66d ({p66}%) {has66 && '★ ¡AUTOMATIZADO!'}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-black/60 rounded-full border border-amber-900 p-0.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                has66 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-amber-600'
                              }`}
                              style={{ width: `${p66}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* SECTION 2: Preset Habits Catalog */}
              <div className="space-y-3 pt-2 border-t border-cyan-900/80">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Catálogo de Hábitos Recomendados (21 / 66 Días)</span>
                </h4>
                <p className="text-[11px] text-slate-300">
                  Activa hábitos clave de superación y disciplina personal en tu Check Rápido:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRESET_2166_HABITS.map((preset, idx) => {
                    const isAlreadyActive = tasks.some(
                      (t) => (t.title || "").toLowerCase() === (preset.title || "").toLowerCase()
                    );

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#001428] border border-cyan-800/60 hover:border-cyan-500 transition-all flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
                            {renderHabitIcon(preset.quickIcon, preset.title, 'w-6 h-6')}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-white leading-snug">{preset.title}</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{preset.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-cyan-950">
                          <span className="text-[10px] font-mono text-cyan-300 font-bold">
                            Objetivo: {preset.targetCount} {preset.unit}/día
                          </span>

                          <button
                            type="button"
                            onClick={() => handleActivatePreset(preset)}
                            disabled={isAlreadyActive}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isAlreadyActive
                                ? 'bg-cyan-950 text-cyan-400/60 border border-cyan-800/40 cursor-default'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.4)] active:scale-95'
                            }`}
                          >
                            {isAlreadyActive ? (
                              <>
                                <Check className="w-3 h-3 text-cyan-400" />
                                <span>Activo</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>+ Activar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-cyan-900/80 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsMilestonesModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-black text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.4)]"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
