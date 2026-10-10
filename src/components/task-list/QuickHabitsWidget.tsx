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
import { HABIT_ENERGY_DETAILS, detectHabitEnergy } from '../../utils/habitEnergyDetector';

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
  const [selectedHabitForProtocol, setSelectedHabitForProtocol] = useState<TaskItem | null>(null);
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
              <span>Hábitos (Protocolo Ley 21/66)</span>
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
            title="Crear un nuevo hábito con Protocolo Ley 21/66 y Auras para Kai"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>+ Hábito</span>
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
            No tienes hábitos activos aún. Toca "+ Hábito" para registrar tu primer hábito con Protocolo Ley 21/66.
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

                  {/* Micro Streak Flame Badge — Toca para ver Protocolo Ley 21/66 y Auras para Kai */}
                  {currentStreak > 0 && !isLocked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFX.playClick();
                        setSelectedHabitForProtocol(qh);
                      }}
                      className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/70 hover:bg-amber-900/90 px-1 py-0.5 rounded border border-amber-500/50 hover:border-amber-400 flex items-center gap-0.5 shrink-0 cursor-pointer transition-all active:scale-95"
                      title={`Ver progreso de Protocolo Ley 21/66 y Auras de Kai para "${qh.title}"`}
                    >
                      <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400/30" />
                      <span>{currentStreak}d</span>
                    </button>
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

      {/* PROTOCOLO LEY 21/66 & AURAS DE KAI MODAL (ENFOCADO EN EL HÁBITO SELECCIONADO) */}
      {selectedHabitForProtocol && (() => {
        const qh = selectedHabitForProtocol;
        const baseId = getHabitBaseId(qh);
        const mastery = habitMastery?.[baseId] || habitMastery?.[qh.id];
        const { currentStreak: streak } = computeHabitStreak(
          qh,
          tasksByDate,
          currentDate,
          mastery
        );
        const energyKey = (qh.habitEnergyType as any) || detectHabitEnergy(qh.title, qh.category as any);
        const energyDetail = HABIT_ENERGY_DETAILS[energyKey] || HABIT_ENERGY_DETAILS.discipline;

        const p21 = Math.min(100, Math.round((streak / 21) * 100));
        const p66 = Math.min(100, Math.round((streak / 66) * 100));
        const has21 = streak >= 21 || mastery?.isMaltzReached;
        const has66 = streak >= 66 || mastery?.isMastered;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
            onClick={() => setSelectedHabitForProtocol(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-[#001426] border border-cyan-500/50 p-5 sm:p-6 shadow-[0_0_40px_rgba(0,240,255,0.25)] text-white max-h-[90vh] flex flex-col overflow-hidden font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-cyan-900/60 pb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/60 flex items-center justify-center shrink-0">
                    {renderHabitIcon(qh.quickIcon, qh.title, 'w-6 h-6')}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span>{qh.title}</span>
                    </h3>
                    <p className="text-xs text-cyan-300 font-mono flex items-center gap-1.5 mt-0.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
                      <span>Racha actual: <strong className="text-white">{streak} días</strong></span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedHabitForProtocol(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-cyan-800">
                {/* Science Note */}
                <div className="p-3 rounded-xl bg-[#000a14] border border-white/10 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Protocolo Ley 21/66 (Neuroplasticidad)
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Mantén tu racha diaria en este hábito para ganar y desbloquear el Aura y la Forma Maestra para Kai.
                  </p>
                </div>

                {/* 21 Days — Aura for Kai */}
                <div className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                  has21 
                    ? 'bg-purple-950/40 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-black/40 border-white/10'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>Meta 21 Días: ${energyDetail.auraName21}</span>
                    </span>
                    <span className="font-mono font-bold text-purple-200">
                      ${streak}/21d (${p21}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    ${energyDetail.auraDesc21}
                  </p>

                  <div className="w-full h-2 bg-black/60 rounded-full border border-purple-900/60 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        has21 ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-purple-600/70'
                      }`}
                      style={{ width: `${p21}%` }}
                    />
                  </div>

                  <div className="text-[11px] font-mono flex items-center justify-between">
                    <span className={has21 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {has21 ? '✓ ¡Aura desbloqueada para Kai!' : `Faltan ${Math.max(0, 21 - streak)} días para desbloquear el aura`}
                    </span>
                  </div>
                </div>

                {/* 66 Days — Master Form */}
                <div className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                  has66 
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-black/40 border-white/10'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Meta 66 Días: ${energyDetail.masterForm66}</span>
                    </span>
                    <span className="font-mono font-bold text-amber-200">
                      ${streak}/66d (${p66}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    ${energyDetail.masterDesc66}
                  </p>

                  <div className="w-full h-2 bg-black/60 rounded-full border border-amber-900/60 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        has66 ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-amber-600/70'
                      }`}
                      style={{ width: `${p66}%` }}
                    />
                  </div>

                  <div className="text-[11px] font-mono flex items-center justify-between">
                    <span className={has66 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {has66 ? '★ ¡Automatización total & Forma Maestra!' : `Faltan ${Math.max(0, 66 - streak)} días para la maestría`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-cyan-900/60 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedHabitForProtocol;
                    setSelectedHabitForProtocol(null);
                    onOpenEditModal(target);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/60 hover:border-cyan-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Configurar Hábito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedHabitForProtocol(null)}
                  className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};