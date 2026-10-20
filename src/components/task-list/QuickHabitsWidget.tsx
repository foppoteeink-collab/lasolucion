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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TaskItem, CustomHabit, HabitEnergyType } from '../../types';
import { INITIAL_CUSTOM_HABITS } from '../../data/defaults';
import * as gameEngine from '../../engine/gameEngine';
import { useAppStore } from '../../store/useAppStore';
import { useTaskStore } from '../../store/useTaskStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { soundFX } from '../../utils/audio';
import { getHabitBaseId, computeHabitStreak } from '../../intelligence/masteryEngine';
import { getTodayDateString, addDaysToDateString } from '../../utils/date';
import { HABIT_ENERGY_DETAILS, detectHabitEnergy } from '../../utils/habitEnergyDetector';

interface AuraTheme {
  border: string;
  activeBorder: string;
  bar: string;
  bgGlow: string;
  badge: string;
}

const AURA_THEMES: Record<HabitEnergyType, AuraTheme> = {
  purification: {
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    activeBorder: 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
    bar: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]',
    bgGlow: 'bg-cyan-950/40',
    badge: 'text-cyan-300 bg-cyan-950/80 border-cyan-500/50',
  },
  strength: {
    border: 'border-orange-500/30 hover:border-orange-400/60',
    activeBorder: 'border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.35)]',
    bar: 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]',
    bgGlow: 'bg-orange-950/40',
    badge: 'text-orange-300 bg-orange-950/80 border-orange-500/50',
  },
  mind: {
    border: 'border-purple-500/30 hover:border-purple-400/60',
    activeBorder: 'border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
    bar: 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]',
    bgGlow: 'bg-purple-950/40',
    badge: 'text-purple-300 bg-purple-950/80 border-purple-500/50',
  },
  discipline: {
    border: 'border-amber-400/30 hover:border-amber-300/60',
    activeBorder: 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]',
    bar: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    bgGlow: 'bg-amber-950/40',
    badge: 'text-amber-300 bg-amber-950/80 border-amber-400/50',
  },
  creativity: {
    border: 'border-pink-500/30 hover:border-pink-400/60',
    activeBorder: 'border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.35)]',
    bar: 'bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.8)]',
    bgGlow: 'bg-pink-950/40',
    badge: 'text-pink-300 bg-pink-950/80 border-pink-500/50',
  },
};

const EMOJI_KEYWORD_MAP: Record<string, string> = {
  Dumbbell: '🏋️',
  Droplets: '💧',
  Timer: '⏱️',
  BookOpen: '📖',
  Book: '📖',
  CheckSquare: '✅',
  Brain: '🧠',
  Target: '🎯',
  Heart: '❤️',
  Coffee: '☕',
  Sun: '☀️',
  Moon: '🌙',
  Smile: '😊',
  Footprints: '🏃',
  CigaretteOff: '🚭',
  Ban: '🚫',
  Activity: '⚡',
  Zap: '⚡',
  Flame: '🔥',
  Flower2: '🧘',
  Sparkles: '✨',
  Apple: '🥗',
};

/**
 * Renders the real emoji selected by the user, with fallback to keyword or aura energy.
 */
export const renderDisplayIcon = (rawIcon?: string, title: string = '', className: string = 'text-sm sm:text-base') => {
  const icon = (rawIcon || '').trim();
  if (icon) {
    if (EMOJI_KEYWORD_MAP[icon]) {
      return <span className={`${className} leading-none select-none shrink-0`}>{EMOJI_KEYWORD_MAP[icon]}</span>;
    }
    // If it's already an emoji or non-alphanumeric symbol
    if (!/^[a-zA-Z0-9_-]+$/.test(icon)) {
      return <span className={`${className} leading-none select-none shrink-0`}>{icon}</span>;
    }
  }

  const lowerTitle = (title || '').toLowerCase();
  if (lowerTitle.includes('agua') || lowerTitle.includes('hidrat')) return <span className={`${className} leading-none select-none shrink-0`}>💧</span>;
  if (lowerTitle.includes('gym') || lowerTitle.includes('entren') || lowerTitle.includes('ejercicio')) return <span className={`${className} leading-none select-none shrink-0`}>🏋️</span>;
  if (lowerTitle.includes('leer') || lowerTitle.includes('lectura') || lowerTitle.includes('estudio')) return <span className={`${className} leading-none select-none shrink-0`}>📖</span>;
  if (lowerTitle.includes('medita') || lowerTitle.includes('respir')) return <span className={`${className} leading-none select-none shrink-0`}>🧘</span>;
  if (lowerTitle.includes('comida') || lowerTitle.includes('saludable') || lowerTitle.includes('dieta')) return <span className={`${className} leading-none select-none shrink-0`}>🥗</span>;

  const energy = detectHabitEnergy(title, 'habito');
  const energyEmojis: Record<HabitEnergyType, string> = {
    purification: '💧',
    strength: '⚡',
    mind: '🧠',
    discipline: '🧘',
    creativity: '🎨',
  };
  return <span className={`${className} leading-none select-none shrink-0`}>{energyEmojis[energy] || '⚡'}</span>;
};

/**
 * Strips duplicate trailing emojis from habit title matching the icon or general emojis.
 */
export const cleanHabitTitle = (title: string, icon?: string): string => {
  let cleaned = (title || '').trim();
  if (!cleaned) return '';

  const rawIcon = (icon || '').trim();
  if (rawIcon) {
    if (cleaned.endsWith(rawIcon)) {
      cleaned = cleaned.slice(0, -rawIcon.length).trim();
    }
    const mapped = EMOJI_KEYWORD_MAP[rawIcon];
    if (mapped && cleaned.endsWith(mapped)) {
      cleaned = cleaned.slice(0, -mapped.length).trim();
    }
  }

  // Remove any trailing unicode emoji characters
  cleaned = cleaned.replace(/[\s]*[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u, '').trim();
  return cleaned || title;
};

/**
 * Robust cybernetic habit icon renderer (backwards-compatible with OracleModal)
 */
export const renderHabitIcon = (rawIcon?: string, title: string = '', sizeClass: string = 'w-5 h-5') => {
  const icon = (rawIcon || '').trim();
  const lowerTitle = (title || '').toLowerCase();

  // If icon is an emoji, return it directly
  if (icon && !/^[a-zA-Z0-9_-]+$/.test(icon)) {
    return <span className="text-base select-none leading-none shrink-0">{icon}</span>;
  }

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

  // Persistent collapsible state (same pattern as DailyFinanceWidget)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('taskquest_quick_habits_collapsed');
      return saved === null ? false : saved === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundFX.playClick();
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('taskquest_quick_habits_collapsed', String(next));
      } catch {}
      return next;
    });
  };

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

  const completedHabitsCount = quickHabits.filter(
    (qh) => qh.completed || (qh.currentCount || 0) >= (qh.targetCount || 1)
  ).length;

  return (
    <div className={`scifi-glass-panel rounded-2xl transition-all duration-300 font-sans text-white ${
      isCollapsed ? 'p-3' : 'p-3 sm:p-3.5 space-y-2.5'
    }`}>
      {/* Header with Title, Preview when collapsed, and Action Buttons */}
      <div 
        onClick={toggleCollapse}
        className={`flex items-center justify-between gap-2 cursor-pointer transition-colors ${
          !isCollapsed ? 'border-b border-cyan-500/30 pb-2.5' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-[#04020e] border border-cyan-500/60 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)] shrink-0">
            <Zap className="w-4 h-4 fill-cyan-400" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold font-anton text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap truncate">
            <span>Hábitos (Ley 21/66)</span>
            <span className="text-[10px] font-mono bg-cyan-950/90 px-1.5 py-0.5 rounded-md border border-cyan-500/60 text-cyan-200 shrink-0">
              {quickHabits.length}
            </span>
          </h3>
        </div>

        {/* Preview de hábitos cuando está colapsado (Emoji chips + Ratio X/Y ✓) */}
        {isCollapsed && quickHabits.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 ml-auto mr-1 truncate">
            <div className="flex items-center gap-1 text-sm shrink-0">
              {quickHabits.slice(0, 4).map((h, i) => (
                <span key={i} className="select-none leading-none">
                  {renderDisplayIcon(h.quickIcon, h.title, 'text-xs')}
                </span>
              ))}
              {quickHabits.length > 4 && (
                <span className="text-[10px] text-gray-400 font-mono">+{quickHabits.length - 4}</span>
              )}
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold shrink-0 border ${
                completedHabitsCount === quickHabits.length
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                  : 'bg-black/60 text-cyan-300 border-white/10'
              }`}
            >
              {completedHabitsCount}/{quickHabits.length} ✓
            </span>
          </div>
        )}

        {/* Controles de la derecha: + Hábito y Flecha Colapso */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundFX.playClick();
              onOpenAddModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/60 hover:border-cyan-400 text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            title="Crear un nuevo hábito con Protocolo Ley 21/66 y Auras para Kai"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Hábito</span>
          </button>

          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 rounded-xl bg-black/40 hover:bg-cyan-950/60 border border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? 'Desplegar hábitos' : 'Colapsar hábitos'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>
      </div>

      {activatedNotice && !isCollapsed && (
        <div className="p-2 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-1 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
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

      {/* Chips Compactos de Hábitos en 1 Sola Fila (flex flex-wrap items-center gap-1.5) */}
      {!isCollapsed && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {quickHabits.length === 0 ? (
            <div className="w-full text-center py-3 text-xs text-slate-500 dark:text-cyan-300/70 italic bg-black/20 rounded-xl border border-white/5">
              No tienes hábitos activos aún. Toca "+ Hábito" para registrar tu primer hábito con Protocolo Ley 21/66.
            </div>
          ) : (
            quickHabits.map((qh, idx) => {
              const current = qh.currentCount || 0;
              const target = qh.targetCount || 1;
              const isCounterHabit = target > 1;
              const isFinished = qh.completed || current >= target;
              const progressPct = Math.min(100, Math.round((current / target) * 100));

              // Dynamic consecutive days streak computed from history
              const baseId = getHabitBaseId(qh);
              const mastery = habitMastery?.[baseId] || habitMastery?.[qh.id];
              const { currentStreak } = computeHabitStreak(
                qh,
                tasksByDate,
                currentDate,
                mastery
              );
              const streakGoal = currentStreak >= 21 ? '66' : '21';

              // Aura de Kai detection and theming
              const energyKey: HabitEnergyType = (qh.habitEnergyType as any) || detectHabitEnergy(qh.title, qh.category as any);
              const auraTheme = AURA_THEMES[energyKey] || AURA_THEMES.purification;

              const todayStr = getTodayDateString();
              const reconciliationLimit = addDaysToDateString(todayStr, -2);
              const isStrictlyLockedPast = Boolean(currentDate && currentDate < reconciliationLimit);
              const isDayEnded = (Boolean(isDayFinalized) || Boolean(currentDate && currentDate < todayStr)) && isStrictlyLockedPast;
              const isLocked = isDayEnded && !isFinished;

              const displayTitle = cleanHabitTitle(qh.title, qh.quickIcon);

              return (
                <div
                  key={qh.id ? `qh-chip-${qh.id}-${idx}` : `qh-chip-${idx}`}
                  className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all select-none overflow-hidden max-w-full ${
                    isLocked
                      ? 'bg-rose-950/20 border-rose-900/40 opacity-70 cursor-not-allowed'
                      : isFinished
                      ? `${auraTheme.bgGlow} ${auraTheme.activeBorder} bg-opacity-40`
                      : `bg-[#070b16]/95 ${auraTheme.border} hover:bg-[#0c1222]`
                  }`}
                >
                  {/* Lado Izquierdo: Emoji + Título Corto (Tocar abre el modal de Ley 21/66 / Edición) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.playClick();
                      setSelectedHabitForProtocol(qh);
                    }}
                    className="flex items-center gap-1.5 min-w-0 cursor-pointer text-left focus:outline-none"
                    title={`Ver racha de "${qh.title}" (${currentStreak}/${streakGoal}d) - Toca para configurar`}
                  >
                    <span className="text-sm select-none leading-none shrink-0">
                      {renderDisplayIcon(qh.quickIcon, qh.title, 'text-sm')}
                    </span>
                    <span
                      className={`text-xs font-semibold max-w-[85px] sm:max-w-[120px] truncate block hover:text-cyan-300 transition-colors ${
                        isFinished ? 'text-gray-300 line-through decoration-cyan-400/60' : 'text-white'
                      }`}
                    >
                      {displayTitle}
                    </span>
                  </button>

                  {/* Lado Derecho: Botón táctil de Progreso / Check */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isLocked) return;
                      onIncrementHabit(qh.id, e);
                    }}
                    className={`shrink-0 ml-0.5 cursor-pointer focus:outline-none active:scale-90 transition-transform ${
                      isLocked ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                    title={
                      isLocked
                        ? 'Bloqueado por fin de jornada'
                        : isCounterHabit
                        ? `Toca para sumar (+1) a "${qh.title}"`
                        : isFinished
                        ? `Completado hoy (Toca para deshacer)`
                        : `Marcar como completado`
                    }
                  >
                    {isCounterHabit ? (
                      <div
                        className={`h-6 px-1.5 rounded-lg border text-[11px] font-mono font-bold flex items-center gap-1 shrink-0 transition-all ${
                          isFinished
                            ? `${auraTheme.badge} border-emerald-400 font-black`
                            : 'bg-black/70 border-cyan-500/40 text-cyan-200 group-hover:border-cyan-300'
                        }`}
                      >
                        <span>{current}/{target}</span>
                        {isFinished ? (
                          <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                        ) : (
                          <span className="text-cyan-400 font-black leading-none">+</span>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                          isFinished
                            ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                            : 'bg-black/70 border-white/20 text-gray-400 group-hover:border-cyan-400 group-hover:text-cyan-300'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 ${isFinished ? 'text-emerald-400 stroke-[3]' : 'text-gray-400'}`} />
                      </div>
                    )}
                  </button>

                  {/* Micro-Barra de Progreso Absoluta Pegada al Borde Inferior (h-[2px]) */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/40 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${auraTheme.bar}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

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
                    {renderDisplayIcon(qh.quickIcon, qh.title, 'text-2xl')}
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