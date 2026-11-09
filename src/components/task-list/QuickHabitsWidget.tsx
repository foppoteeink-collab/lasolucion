import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  SlidersHorizontal,
} from 'lucide-react';
import { TaskItem, CustomHabit, HabitEnergyType } from '../../types';
import { INITIAL_CUSTOM_HABITS } from '../../data/defaults';
import * as gameEngine from '../../engine/gameEngine';
import { useAppStore } from '../../store/useAppStore';
import { useTaskStore } from '../../store/useTaskStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { soundFX } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { getHabitBaseId, computeHabitStreak } from '../../intelligence/masteryEngine';
import { getTodayDateString, addDaysToDateString } from '../../utils/date';
import { HABIT_ENERGY_DETAILS, detectHabitEnergy } from '../../utils/habitEnergyDetector';
import { useSystemPalette } from '../../utils/systemPalette';
import { deduplicateTasksForDay, reconcileHabitCounterTask } from '../../utils/taskDeduplication';
import { Icon } from '../common/Icon';

interface AuraTheme {
  border: string;
  activeBorder: string;
  bar: string;
  bgGlow: string;
  badge: string;
  strokeColor: string;
}

const AURA_THEMES: Record<HabitEnergyType, AuraTheme> = {
  purification: {
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    activeBorder: 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
    bar: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]',
    bgGlow: 'bg-cyan-950/40',
    badge: 'text-cyan-300 bg-cyan-950/80 border-cyan-500/50',
    strokeColor: '#00f0ff',
  },
  strength: {
    border: 'border-orange-500/30 hover:border-orange-400/60',
    activeBorder: 'border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.35)]',
    bar: 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]',
    bgGlow: 'bg-orange-950/40',
    badge: 'text-orange-300 bg-orange-950/80 border-orange-500/50',
    strokeColor: '#f97316',
  },
  mind: {
    border: 'border-purple-500/30 hover:border-purple-400/60',
    activeBorder: 'border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
    bar: 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]',
    bgGlow: 'bg-purple-950/40',
    badge: 'text-purple-300 bg-purple-950/80 border-purple-500/50',
    strokeColor: '#c084fc',
  },
  discipline: {
    border: 'border-amber-400/30 hover:border-amber-300/60',
    activeBorder: 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]',
    bar: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    bgGlow: 'bg-amber-950/40',
    badge: 'text-amber-300 bg-amber-950/80 border-amber-400/50',
    strokeColor: '#fbbf24',
  },
  creativity: {
    border: 'border-pink-500/30 hover:border-pink-400/60',
    activeBorder: 'border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.35)]',
    bar: 'bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.8)]',
    bgGlow: 'bg-pink-950/40',
    badge: 'text-pink-300 bg-pink-950/80 border-pink-500/50',
    strokeColor: '#f472b6',
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
 * Generates an intelligent ultra-concise label for the Instagram-story habit circles.
 * Strips common prefixes ("Tomar 8 vasos de ", "Tomar ", "Ir al ", "Hacer ", "Lavarse los ", etc.)
 */
export const getShortHabitLabel = (title: string, icon?: string): string => {
  let cleaned = cleanHabitTitle(title, icon);
  if (!cleaned) return '';

  const lower = cleaned.toLowerCase();

  // Specific common cases
  if (lower.includes('agua') || lower.includes('hidrat')) return 'Agua';
  if (lower.includes('foco') || lower.includes('ininterrumpido') || lower.includes('deep work')) return 'Foco';
  if (lower.includes('cierre') || lower.includes('auditor') || lower.includes('revisión') || lower.includes('revision')) return 'Cierre';
  if (lower.includes('diente') || lower.includes('cepill')) return 'Dientes';
  if (lower.includes('gym') || lower.includes('entren') || lower.includes('físic') || lower.includes('ejercicio')) return 'Gimnasio';
  if (lower.includes('leer') || lower.includes('lectura') || lower.includes('libro')) return 'Lectura';
  if (lower.includes('medit') || lower.includes('respir') || lower.includes('zen')) return 'Meditar';
  if (lower.includes('comida') || lower.includes('saludable') || lower.includes('dieta') || lower.includes('nutric')) return 'Nutrición';
  if (lower.includes('dibuj') || lower.includes('pint') || lower.includes('arte')) return 'Dibujar';
  if (lower.includes('estudi') || lower.includes('repas')) return 'Estudio';
  if (lower.includes('dormir') || lower.includes('sueño') || lower.includes('descans')) return 'Descanso';
  if (lower.includes('caminar') || lower.includes('pasos')) return 'Caminar';
  if (lower.includes('fumar') || lower.includes('tabaco')) return 'No fumar';

  // Strip common verb/action prefixes
  const prefixes = [
    /^tomar\s+\d+\s+vasos\s+de\s+/i,
    /^tomar\s+\d+\s+litros\s+de\s+/i,
    /^tomar\s+agua\s+/i,
    /^tomar\s+/i,
    /^beber\s+/i,
    /^hacer\s+/i,
    /^ir\s+al\s+/i,
    /^ir\s+a\s+/i,
    /^lavarse\s+los\s+/i,
    /^lavar\s+los\s+/i,
    /^lavar\s+/i,
    /^practicar\s+/i,
    /^realizar\s+/i,
    /^leer\s+/i,
  ];

  for (const prefix of prefixes) {
    if (prefix.test(cleaned)) {
      cleaned = cleaned.replace(prefix, '').trim();
      break;
    }
  }

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  const finalLabel = cleaned || title;
  return finalLabel.length > 12 ? finalLabel.slice(0, 11).trim() + '…' : finalLabel;
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
  const restDays = usePlayerStore(s => s.stats.restDays);
  const isRestDay = Boolean(currentDate && restDays?.[currentDate]);
  const [selectedHabitForProtocol, setSelectedHabitForProtocol] = useState<TaskItem | null>(null);
  const [activatedNotice, setActivatedNotice] = useState<string | null>(null);
  const [completedShockwaveId, setCompletedShockwaveId] = useState<string | null>(null);
  const systemPalette = useSystemPalette();
  const opticMode = useUIStore((s) => s.opticMode);
  const isEink = opticMode === 'eink';
  const togglingOrbsRef = React.useRef<Set<string>>(new Set());

  // Strictly select dedicated quick/discipline habits for 21/66 day tracking,
  // reconcile any stripped counter metadata from customHabits, and merge duplicates cleanly
  const quickHabits = React.useMemo(() => {
    const rawList = tasks.filter((t) => {
      if (!t || !t.title) return false;
      // Excluir explícitamente recordatorios semanales / rutinas de agenda sin seguimiento 21/66d
      if (t.isTracked2166 === false && t.isQuickHabit === false) return false;
      if (
        t.isQuickHabit ||
        t.isTracked2166 ||
        (t.category === 'habito' && t.isTracked2166 !== false) ||
        (String(t.id || '').includes('habit-') && t.isTracked2166 !== false && t.isQuickHabit !== false) ||
        (t.isHabit && (t.targetCount || 0) > 1 && t.isTracked2166 !== false)
      ) {
        return true;
      }
      if (t.timeBlock) return false;
      const lower = (t.title || '').toLowerCase();
      return lower.includes('agua') || lower.includes('dientes');
    });

    const reconciled = rawList.map((t) => reconcileHabitCounterTask(t, customHabits));
    return deduplicateTasksForDay(reconciled, currentDate);
  }, [tasks, customHabits, currentDate]);

  // Auto-heal habit tasks whose counter metadata (targetCount/unit) or premature 1/1 completion drifted from customHabits
  React.useEffect(() => {
    const targetDate = currentDate || useTaskStore.getState().currentViewDate || getTodayDateString();
    const todayStr = getTodayDateString();
    const reconciliationLimit = addDaysToDateString(todayStr, -2);
    if (!targetDate || targetDate < reconciliationLimit || isDayFinalized) return;
    if (!tasks || tasks.length === 0 || !customHabits || customHabits.length === 0) return;

    const store = useTaskStore.getState();
    for (const t of tasks) {
      if (!t || !t.id || !t.title) continue;
      const isHabitCandidate = Boolean(
        t.isQuickHabit ||
        t.isTracked2166 ||
        t.category === 'habito' ||
        String(t.id).includes('habit-') ||
        (t.isHabit && (t.targetCount || 0) > 1) ||
        (!t.timeBlock && ((t.title || '').toLowerCase().includes('agua') || (t.title || '').toLowerCase().includes('dientes')))
      );
      if (!isHabitCandidate) continue;

      const reconciled = reconcileHabitCounterTask(t, customHabits);
      if (reconciled !== t) {
        store.updateTask(targetDate, t.id, {
          isHabit: reconciled.isHabit,
          targetCount: reconciled.targetCount,
          unit: reconciled.unit,
          completed: reconciled.completed,
          completedAt: reconciled.completedAt,
        });
      }
    }
  }, [tasks, customHabits, currentDate, isDayFinalized]);

  // Hydrate custom habits into active day if quickHabits list for today is empty
  React.useEffect(() => {
    if (tasks.length === 0 && customHabits.length > 0) {
      gameEngine.injectHabitsToExistingDays(customHabits);
    }
  }, []); // Run only on mount

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

  // Manual Decrement helper (-1) for today
  const handleDecrementHabit = (qh: TaskItem) => {
    soundFX.playClick();
    const current = qh.currentCount || 0;
    if (current <= 0 && !qh.completed) return;
    const newCount = Math.max(0, current - 1);
    const target = qh.targetCount || 1;
    const wasCompleted = qh.completed || current >= target;
    const isNowCompleted = newCount >= target;
    const date = currentDate || useTaskStore.getState().currentViewDate || getTodayDateString();

    useTaskStore.getState().updateTask(date, qh.id, {
      currentCount: newCount,
      completed: isNowCompleted,
      completedAt: isNowCompleted ? qh.completedAt : undefined,
      ...(qh.targetCount !== undefined ? { targetCount: qh.targetCount } : {}),
      ...(qh.unit ? { unit: qh.unit } : {}),
      ...(qh.isHabit !== undefined ? { isHabit: qh.isHabit } : {}),
    });

    if (wasCompleted && !isNowCompleted) {
      const xpReward = qh.awardedXp || qh.xpReward || 0;
      const coinReward = qh.awardedCoins || qh.coinReward || 0;
      if (xpReward > 0 || coinReward > 0) {
        usePlayerStore.getState().setStats((prev) => ({
          ...prev,
          currentXp: Math.max(0, prev.currentXp - xpReward),
          totalXpEarned: Math.max(0, prev.totalXpEarned - xpReward),
          coins: Math.max(0, prev.coins - coinReward),
        }));
      }
    }

    setSelectedHabitForProtocol(prev => prev ? {
      ...prev,
      currentCount: newCount,
      completed: isNowCompleted
    } : null);

    if (typeof window !== 'undefined') {
      setTimeout(() => {
        (window as any).__triggerCloudSyncNow?.();
      }, 150);
    }
  };

  // Manual Reset to 0 helper for today
  const handleResetHabitToday = (qh: TaskItem, e: React.MouseEvent) => {
    soundFX.playClick();
    gameEngine.handleResetHabit(qh.id, e);
    setSelectedHabitForProtocol(prev => prev ? {
      ...prev,
      currentCount: 0,
      completed: false
    } : null);
  };

  const completedHabitsCount = quickHabits.filter(
    (qh) => qh.completed || (qh.currentCount || 0) >= (qh.targetCount || 1)
  ).length;

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const toggleCollapsed = () => {
    soundFX.playClick();
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('taskquest_habits_collapsed', String(next));
    } catch {
      // ignore
    }
  };

  return (
    <div className="scifi-glass-panel rounded-2xl p-2 sm:p-3 space-y-1 border border-cyan-500/30 shadow-[0_2px_15px_rgba(0,0,0,0.45)] relative overflow-hidden font-sans text-white">
      {/* Grano esmerilado táctil */}
      <span className="vi-grano opacity-5" aria-hidden="true" />
      {/* Header with Title and Ratio Summary (Clean, Sin solapamiento en mobile) */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-0.5 flex-nowrap">
        {/* Lado Izquierdo: Título y Guía */}
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <div className="p-1 rounded-md bg-[#04020e] border border-cyan-500/60 text-cyan-400 shrink-0">
            <Zap className="w-3 h-3 fill-cyan-400" />
          </div>
          <h3 className="text-xs font-bold font-anton text-cyan-300 uppercase tracking-wider whitespace-nowrap">
            Hábitos
          </h3>
          <span className="hidden sm:inline-block text-[10px] font-mono text-cyan-400/60 tabular-nums">
            (21/66)
          </span>
        </div>

        {/* Lado Derecho: Botón Gestionar + Contador + Chevron */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {onOpenHabitManager && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onOpenHabitManager();
              }}
              className="text-[10px] sm:text-[11px] font-mono font-bold text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900/90 px-1.5 sm:px-2 py-0.5 rounded-md border border-cyan-500/40 hover:border-cyan-400 flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.2)] active:scale-95 whitespace-nowrap"
              title="Gestionar, editar o eliminar hábitos y rutinas"
            >
              <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
              <span>Gestionar</span>
            </button>
          )}

          {quickHabits.length > 0 && (
            <div className="text-[10px] sm:text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/60 px-1.5 sm:px-2 py-0.5 rounded-md border border-cyan-500/30 whitespace-nowrap tabular-nums">
              <span>{completedHabitsCount}/{quickHabits.length}</span>
              <span className="hidden sm:inline ml-1">{completedHabitsCount === 1 ? 'Listo' : 'Listos'}</span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'Desplegar orbes de hábitos' : 'Colapsar orbes de hábitos'}
            aria-label={isCollapsed ? 'Desplegar hábitos' : 'Colapsar hábitos'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-cyan-300" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {activatedNotice && (
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

          {isRestDay && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className="text-base">🌿</span>
              <div className="min-w-0 flex-1 leading-tight">
                <span className="font-bold text-white block">Día de Descanso Activo</span>
                <span className="text-[11px] text-emerald-400">Tus hábitos y avance (Ley 21/66) están blindados hoy sin penalización.</span>
              </div>
            </div>
          )}

          {/* Fila Horizontal de Orbes Circulares (Estilo Historias de Instagram - Fine-Line 48px con Moxen Constancia) */}
          <div className="flex items-start gap-3 overflow-x-auto no-scrollbar pt-3.5 pb-1.5 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {quickHabits.map((qh, idx) => {
          const current = qh.currentCount || 0;
          const target = qh.targetCount || 1;
          const isCounterHabit = target > 1;
          const isFinished = qh.completed || current >= target;
          const displayCurrent = isFinished && current === 0 ? target : current;
          const rawRatio = target > 0 ? displayCurrent / target : 0;
          const progressRatio = isFinished ? 1 : Math.min(1, Math.max(0, rawRatio));
          const progressPct = Math.round(progressRatio * 100);
          const hasProgress = progressRatio > 0;

          // Dynamic consecutive days streak computed from history
          const baseId = getHabitBaseId(qh);
          const mastery = habitMastery?.[baseId] || habitMastery?.[qh.id];
          const { currentStreak } = computeHabitStreak(
            qh,
            tasksByDate,
            currentDate,
            mastery
          );
          const streakGoal = qh.targetStreak ? String(qh.targetStreak) : (currentStreak >= 21 ? '66' : '21');

          // Degradados cinéticos de Moxen Constancia derivados del Personalizador de Fondo y Color (Aura del Sistema)
          const paletteSteps = [
            { start: systemPalette.c1, end: systemPalette.c2, glow: systemPalette.glow },
            { start: systemPalette.c2, end: systemPalette.c3, glow: systemPalette.glowSecondary },
            { start: systemPalette.c3, end: systemPalette.c4, glow: systemPalette.glow },
            { start: systemPalette.c4, end: systemPalette.c1, glow: systemPalette.glowSecondary },
          ];
          const step = paletteSteps[idx % paletteSteps.length];
          const startColor = step.start;
          const endColor = step.end;
          const glowFilterColor = step.glow;
          const safeGradId = `moxen-grad-${(qh.id || String(idx)).replace(/[^a-zA-Z0-9_-]/g, '')}`;

          // SVG Ring calculation: exact circumference for r=21
          const ringRadius = 21;
          const ringCircumference = 2 * Math.PI * ringRadius;
          const angle = -Math.PI / 2 + progressRatio * 2 * Math.PI;
          const hx = 24 + ringRadius * Math.cos(angle);
          const hy = 24 + ringRadius * Math.sin(angle);
          const hasHead = progressPct > 3 && progressPct < 100;
          const strokeDashoffset = ringCircumference * (1 - progressRatio);

          const todayStr = getTodayDateString();
          const reconciliationLimit = addDaysToDateString(todayStr, -2);
          const isStrictlyLockedPast = Boolean(currentDate && currentDate < reconciliationLimit);
          const isDayEnded = (Boolean(isDayFinalized) || Boolean(currentDate && currentDate < todayStr)) && isStrictlyLockedPast;
          const isLocked = isDayEnded && !isFinished;
          const isFutureDay = Boolean(currentDate && currentDate > todayStr);

          const shortLabel = getShortHabitLabel(qh.title, qh.quickIcon);

          return (
            <div
              key={qh.id ? `qh-orb-${qh.id}-${idx}` : `qh-orb-${idx}`}
              className="flex flex-col items-center w-[62px] shrink-0 select-none group"
            >
              {/* Círculo Principal de 48x48 con Anillo SVG Moxen Constancia y Núcleo Vidrio Obsidian */}
              <motion.div
                {...(idx === 0 ? { 'data-tour': 'habit-orb' } : {})}
                whileHover={{ scale: 1.05 }}
                animate={{
                  boxShadow: isEink
                    ? 'none'
                    : isFinished
                      ? [
                          `0 0 8px ${glowFilterColor}, inset 0 0 4px ${glowFilterColor}`,
                          `0 0 16px ${glowFilterColor}, inset 0 0 8px ${glowFilterColor}`,
                        ]
                      : hasProgress
                        ? `0 0 10px ${glowFilterColor}`
                        : '0 0 0px rgba(0, 0, 0, 0)',
                }}
                transition={{
                  boxShadow: isFinished && !isEink
                    ? {
                        repeat: Infinity,
                        repeatType: "reverse",
                        duration: 1.8,
                        ease: "easeInOut",
                      }
                    : { duration: 0.25 },
                }}
                onClick={(e) => {
                  if (isLocked) return;

                  if (isFutureDay) {
                    soundFX.playClick();
                    useUIStore.getState().addFloatingEffect({
                      x: e.clientX,
                      y: e.clientY - 20,
                      text: '⏳ Día futuro: modo planificación',
                      type: 'coins',
                    });
                    return;
                  }

                  // Guard Anti Double-Tap (< 350ms) por habitId individual
                  if (togglingOrbsRef.current.has(qh.id)) {
                    return;
                  }
                  togglingOrbsRef.current.add(qh.id);
                  setTimeout(() => {
                    togglingOrbsRef.current.delete(qh.id);
                  }, 350);

                  // 1. Protección Anti-Reinicio Accidental para hábitos con contador (target > 1)
                  if (isCounterHabit && isFinished) {
                    soundFX.playClick();
                    return;
                  }

                  const nextCount = isCounterHabit ? current + 1 : (isFinished ? 0 : 1);
                  if (!isFinished && nextCount >= target) {
                    setCompletedShockwaveId(qh.id);
                    triggerHaptic([30, 45]);
                    setTimeout(() => setCompletedShockwaveId(null), 700);
                  } else {
                    triggerHaptic(20);
                  }

                  onIncrementHabit(qh.id, e);
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isFinished}
                aria-label={`${qh.title}: ${displayCurrent} de ${target} completado. Racha de ${currentStreak} días.`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
                className={`w-12 h-12 rounded-full relative flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isLocked ? 'cursor-not-allowed opacity-60' : ''
                }`}
                title={
                  isLocked
                    ? 'Bloqueado por fin de jornada'
                    : isCounterHabit
                    ? isFinished
                      ? `${qh.title} (${displayCurrent}/${target}) - ¡Meta cumplida hoy!`
                      : `${qh.title} (${displayCurrent}/${target}) - Toca para sumar +1`
                    : isFinished
                    ? `${qh.title} - Completado hoy (Toca para desmarcar)`
                    : `${qh.title} - Toca para completar`
                }
              >
                {/* Shockwave de Celebración Moxen al completar */}
                {completedShockwaveId === qh.id && (
                  <div
                    className="absolute inset-[-4px] rounded-full border-2 pointer-events-none animate-moxen-shockwave z-30"
                    style={{
                      borderColor: isEink ? '#ffffff' : startColor,
                    }}
                  />
                )}

                {/* Micro-Llama Superior de Racha posicionada en el borde exterior */}
                {currentStreak > 0 && (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Racha: ${currentStreak} días para ${qh.title}. Toca para configurar protocolo.`}
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.playClick();
                      setSelectedHabitForProtocol(qh);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        e.preventDefault();
                        soundFX.playClick();
                        setSelectedHabitForProtocol(qh);
                      }
                    }}
                    className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#050914]/95 border border-amber-500/80 px-2 py-0.5 rounded-full flex items-center gap-0.5 z-20 shadow-[0_0_8px_rgba(245,158,11,0.35)] cursor-pointer hover:scale-105 active:scale-95 transition-transform ring-1 ring-[#070510]"
                    title={`Racha: ${currentStreak} días (Meta: ${streakGoal}d) - Toca para ver detalles`}
                  >
                    <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0 pointer-events-none" />
                    <span className="text-[10.5px] font-mono font-bold text-amber-300 leading-none pointer-events-none">{currentStreak}</span>
                  </div>
                )}

                {/* Anillo Circular SVG Moxen Constancia (48x48, r=21, degradado cónico dinámico sin override) */}
                <svg className="w-12 h-12 absolute inset-0 -rotate-90 pointer-events-none overflow-visible" viewBox="0 0 48 48">
                  <defs>
                    <linearGradient id={safeGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={startColor} />
                      <stop offset="100%" stopColor={endColor} />
                    </linearGradient>
                  </defs>

                  {/* Track de fondo sutil independiente de .text-cyan-* */}
                  <circle
                    cx="24"
                    cy="24"
                    r={ringRadius}
                    stroke={isEink ? 'rgba(255, 255, 255, 0.25)' : 'rgba(148, 163, 184, 0.22)'}
                    strokeWidth="2.5"
                    fill="none"
                  />

                  {/* Trazo activo de progreso: solo visible cuando progressRatio > 0 */}
                  {progressRatio > 0 && (
                    <circle
                      cx="24"
                      cy="24"
                      r={ringRadius}
                      stroke={isEink ? '#ffffff' : `url(#${safeGradId})`}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                      style={{
                        strokeDasharray: ringCircumference,
                        strokeDashoffset,
                        filter: isEink ? 'none' : `drop-shadow(0 0 4px ${glowFilterColor})`,
                        transition: 'stroke-dashoffset 260ms cubic-bezier(0.22, 1, 0.36, 1), stroke 180ms ease',
                      }}
                    />
                  )}

                  {/* Cabeza redondeada con brillo especular de Moxen Constancia */}
                  {hasHead && (
                    <>
                      <circle cx={hx} cy={hy} r="2.2" fill={isEink ? '#ffffff' : endColor} />
                      {!isEink && (
                        <circle cx={hx - 0.4} cy={hy - 0.4} r="0.8" fill="rgba(255, 255, 255, 0.75)" />
                      )}
                    </>
                  )}

                  {/* Punto de cierre superior con brillo al completar */}
                  {isFinished && (
                    <>
                      <circle cx="24" cy="3" r="2.2" fill={isEink ? '#ffffff' : startColor} />
                      {!isEink && (
                        <circle cx="23.6" cy="2.6" r="0.8" fill="rgba(255, 255, 255, 0.85)" />
                      )}
                    </>
                  )}
                </svg>

                {/* Núcleo Central del Círculo (Vidrio Obsidian 3D con nivel de llenado interior visible) */}
                <div
                  className="w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all duration-300 relative z-[2] select-none overflow-hidden"
                  style={
                    isEink
                      ? {
                          border: `1.5px solid ${hasProgress ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'}`,
                          background: '#050914',
                        }
                      : isFinished
                        ? {
                            border: `1.5px solid ${startColor}`,
                            background: `radial-gradient(circle at 50% 30%, color-mix(in srgb, ${startColor} 22%, #08040f) 0%, #030107 100%)`,
                            boxShadow: `0 0 12px ${glowFilterColor}, inset 0 1px 2px rgba(255, 255, 255, 0.2)`,
                          }
                        : {
                            border: hasProgress
                              ? `1px solid ${startColor}`
                              : '1px solid rgba(148, 163, 184, 0.22)',
                            background: 'linear-gradient(to bottom, #0b1428, #040712)',
                            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 2px 8px rgba(0, 0, 0, 0.6)',
                          }
                  }
                >
                  {/* Relleno líquido ascendente visible directamente dentro del icono */}
                  {progressRatio > 0 && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 pointer-events-none z-[1]"
                      style={{
                        height: `${progressPct}%`,
                        transition: 'height 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                        background: isEink
                          ? 'rgba(255, 255, 255, 0.26)'
                          : `linear-gradient(180deg, ${endColor} 0%, ${startColor} 100%)`,
                        opacity: isEink ? 1 : isFinished ? 0.5 : 0.42,
                      }}
                    >
                      {!isFinished && (
                        <div
                          className="w-full h-[1.5px]"
                          style={{
                            backgroundColor: isEink ? '#ffffff' : startColor,
                            boxShadow: isEink ? 'none' : `0 0 6px ${startColor}`,
                          }}
                        />
                      )}
                    </div>
                  )}

                  <span className="relative z-[2] w-5 h-5 flex items-center justify-center text-base text-white select-none leading-none filter drop-shadow-sm">
                    {qh.quickIcon ? (
                      <Icon name={qh.quickIcon} className="w-4 h-4 flex items-center justify-center leading-none" />
                    ) : (
                      renderHabitIcon(undefined, qh.title, 'w-4 h-4 text-white')
                    )}
                  </span>
                </div>

                {/* Borde exterior reactivo al progreso */}
                <div
                  className="absolute inset-[-3px] rounded-full border pointer-events-none transition-all duration-300"
                  style={{
                    borderColor: isEink
                      ? hasProgress
                        ? '#ffffff'
                        : 'rgba(255, 255, 255, 0.25)'
                      : isFinished
                        ? startColor
                        : hasProgress
                          ? `color-mix(in srgb, ${startColor} 45%, transparent)`
                          : 'rgba(255, 255, 255, 0.08)',
                    boxShadow:
                      !isEink && isFinished
                        ? `0 0 12px ${glowFilterColor}`
                        : !isEink && hasProgress
                          ? `0 0 6px ${glowFilterColor}`
                          : 'none',
                  }}
                />

                {/* Badge Inferior Táctico de Progreso (siempre visible en hábitos con contador) */}
                <div
                  className={`absolute -bottom-1.5 -right-1.5 rounded-full font-mono font-bold leading-none flex items-center justify-center gap-0.5 shadow-md z-20 ring-1 ring-[#070510] transition-all duration-200 ${
                    isEink && isFinished ? 'border-2' : 'border'
                  } ${
                    isCounterHabit
                      ? 'px-1.5 py-[2px]'
                      : isFinished
                        ? 'px-1.5 py-[2px]'
                        : 'p-1'
                  }`}
                  style={
                    isEink
                      ? {
                          backgroundColor: '#050914',
                          borderColor: '#ffffff',
                          color: '#ffffff',
                        }
                      : isFinished
                        ? {
                            backgroundColor: 'rgba(5, 9, 20, 0.96)',
                            borderColor: startColor,
                            color: startColor,
                            boxShadow: `0 0 10px ${glowFilterColor}`,
                          }
                        : isCounterHabit
                          ? {
                              backgroundColor: 'rgba(5, 9, 20, 0.96)',
                              borderColor: hasProgress ? startColor : 'rgba(148, 163, 184, 0.5)',
                              color: hasProgress ? startColor : '#e2e8f0',
                              boxShadow: hasProgress ? `0 0 8px ${glowFilterColor}` : 'none',
                            }
                          : {
                              backgroundColor: 'rgba(6, 10, 20, 0.95)',
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                              color: '#94a3b8',
                            }
                  }
                >
                  {isCounterHabit ? (
                    <>
                      <span className="tabular-nums font-mono text-[10.5px] font-bold tracking-tight leading-none">
                        {displayCurrent}
                        <span className="opacity-70 mx-[1px]">/</span>
                        {target}
                      </span>
                      {isFinished && (
                        <Check className="w-2.5 h-2.5 stroke-[3] shrink-0" />
                      )}
                    </>
                  ) : isFinished ? (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  ) : (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: isEink ? '#ffffff' : endColor,
                        boxShadow: isEink ? 'none' : `0 0 2px ${endColor}`,
                      }}
                    />
                  )}
                </div>
              </motion.div>

              {/* Etiqueta Corta Inferior: Dispara el contador del hábito (+1) */}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked) return;
                  if (isFutureDay) {
                    soundFX.playClick();
                    useUIStore.getState().addFloatingEffect({
                      x: e.clientX,
                      y: e.clientY - 20,
                      text: '⏳ Día futuro: modo planificación',
                      type: 'coins',
                    });
                    return;
                  }
                  if (togglingOrbsRef.current.has(qh.id)) return;
                  togglingOrbsRef.current.add(qh.id);
                  setTimeout(() => {
                    togglingOrbsRef.current.delete(qh.id);
                  }, 350);

                  if (isCounterHabit && isFinished) {
                    soundFX.playClick();
                    return;
                  }

                  const nextCount = isCounterHabit ? current + 1 : (isFinished ? 0 : 1);
                  if (!isFinished && nextCount >= target) {
                    setCompletedShockwaveId(qh.id);
                    triggerHaptic([30, 45]);
                    setTimeout(() => setCompletedShockwaveId(null), 700);
                  } else {
                    triggerHaptic(20);
                  }

                  onIncrementHabit(qh.id, e);
                }}
                className="text-[11px] text-slate-200 hover:text-cyan-300 active:scale-95 font-medium max-w-[60px] truncate text-center mt-2 transition-all block cursor-pointer select-none leading-tight"
                title={
                  isCounterHabit
                    ? `${qh.title} (${displayCurrent}/${target}) - Toca para sumar +1`
                    : `${qh.title} - Toca para completar`
                }
              >
                {shortLabel}
              </span>
            </div>
          );
        })}

        {/* Círculo Final: (+) Nuevo Hábito Integrado en la Misma Fila (48x48) */}
        <div className="flex flex-col items-center w-[62px] shrink-0 select-none group">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onOpenAddModal(true);
            }}
            className="w-12 h-12 rounded-full border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-white/[0.02] hover:bg-cyan-950/40 flex items-center justify-center transition-all cursor-pointer group active:scale-95 shadow-[0_0_8px_rgba(0,240,255,0.1)]"
            title="Crear un nuevo hábito (Ley 21/66)"
          >
            <Icon name="plus" className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-[10px] text-slate-400 group-hover:text-cyan-200 font-medium text-center mt-2 select-none leading-tight">
            Nuevo
          </span>
        </div>
      </div>
        </>
      )}

      {/* PROTOCOLO LEY 21/66 & AURAS DE KAI MODAL (ENFOCADO EN EL HÁBITO SELECCIONADO) */}
      {selectedHabitForProtocol && (() => {
        const qh = quickHabits.find(h => h.id === selectedHabitForProtocol.id) || selectedHabitForProtocol;
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
                {/* Control Manual para Hoy (Ajuste rápido -1 y Reiniciar) */}
                <div className="p-3 rounded-xl bg-surface-card border border-cyan-500/30 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 block">Progreso de hoy</span>
                    <div className="text-xs font-mono text-cyan-300 flex items-center gap-1.5 mt-0.5">
                      <span>
                        {qh.currentCount || 0} / {qh.targetCount || 1} {qh.unit || 'veces'}
                      </span>
                      {(qh.completed || (qh.currentCount || 0) >= (qh.targetCount || 1)) && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                          style={
                            isEink
                              ? {
                                  color: '#ffffff',
                                  borderColor: '#ffffff',
                                  backgroundColor: '#050914',
                                }
                              : {
                                  color: systemPalette.c1,
                                  borderColor: systemPalette.glow,
                                  backgroundColor: 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.15)',
                                }
                          }
                        >
                          ✓ Completado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDecrementHabit(qh)}
                      disabled={(qh.currentCount || 0) <= 0 && !qh.completed}
                      className="min-h-[36px] min-w-[36px] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 text-slate-200 text-xs font-mono font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 flex items-center justify-center"
                      title="Restar 1 al contador de hoy"
                    >
                      -1
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleResetHabitToday(qh, e)}
                      disabled={(qh.currentCount || 0) === 0 && !qh.completed}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                      title="Reiniciar contador a 0 para hoy"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reiniciar</span>
                    </button>
                  </div>
                </div>

                {/* 21 Días — Sinóptico de Neuroplasticidad */}
                <div className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                  has21 
                    ? 'bg-purple-950/40 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-black/40 border-white/10'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>Meta 21 Días · {energyDetail.auraName21}</span>
                    </span>
                    <span className="font-mono font-bold text-purple-200">
                      {streak}/21d ({p21}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-black/60 rounded-full border border-purple-900/60 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        has21 ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-purple-600/70'
                      }`}
                      style={{ width: `${p21}%` }}
                    />
                  </div>

                  <div className="text-[11px] font-mono flex items-center justify-between">
                    <span className={has21 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {has21 ? '✓ Aura desbloqueada para KAI' : `${Math.max(0, 21 - streak)} días restantes para fijar el hábito`}
                    </span>
                  </div>
                </div>

                {/* 66 Días — Sinóptico de Maestría */}
                <div className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                  has66 
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-black/40 border-white/10'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Meta 66 Días · {energyDetail.masterForm66}</span>
                    </span>
                    <span className="font-mono font-bold text-amber-200">
                      {streak}/66d ({p66}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-black/60 rounded-full border border-amber-900/60 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        has66 ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-amber-600/70'
                      }`}
                      style={{ width: `${p66}%` }}
                    />
                  </div>

                  <div className="text-[11px] font-mono flex items-center justify-between">
                    <span className={has66 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {has66 ? '★ Automatización total & Forma Maestra' : `${Math.max(0, 66 - streak)} días restantes para automatizar`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-cyan-900/60 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5 flex-wrap">
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
                    <span>Configurar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedHabitForProtocol;
                      setSelectedHabitForProtocol(null);
                      if (target) onDeleteTask(target.id);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 hover:border-red-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    title="Eliminar este hábito permanentemente"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Eliminar</span>
                  </button>
                </div>

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