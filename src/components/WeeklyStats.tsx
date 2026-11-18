import React, { useState, useMemo, lazy, Suspense } from 'react';
import { HoloCompanion } from './HoloCompanion';
import { ScrollReveal } from './common/ScrollReveal';
import { IntelligenceOverlay } from '../intelligence/IntelligenceOverlay';
import { PlayerStats, PomodoroSession, TaskItem, HabitMasteryRecord, FinancialTransaction, HabitEnergyType, TaskCategory } from '../types';
import { CloudSyncResult } from '../hooks/useCloudSync';

const FinanceDashboard = lazy(() => import("./FinanceDashboard").then(m => ({ default: m.FinanceDashboard })));
const HeroProfileModal = lazy(() => import('./HeroProfileModal').then(m => ({ default: m.HeroProfileModal })));
const RanksModal = lazy(() => import('./RanksModal').then(m => ({ default: m.RanksModal })));
const ArchetypesModal = lazy(() => import('./ArchetypesModal').then(m => ({ default: m.ArchetypesModal })));

// Moxen Interactive Visual Components
import { MoxenTelarana } from './moxen/MoxenTelarana';
import { MoxenConstancia, DayPerformance } from './moxen/MoxenConstancia';
import { MoxenSueno } from './moxen/MoxenSueno';
import { MoxenCarrera, HabitRaceItem } from './moxen/MoxenCarrera';
import { MoxenNivel } from './moxen/MoxenNivel';

import { getTodayDateString, addDaysToDateString, parseLocalDate, formatDateFullSpanish } from '../utils/date';
import { HABIT_ENERGY_DETAILS, detectHabitEnergy } from '../utils/habitEnergyDetector';
import { Icon } from './common/Icon';
import { getHabitBaseId } from '../intelligence/masteryEngine';
import { CHARACTER_CLASSES, getRankForLevel } from '../data/defaults';
import { getArchetypeDisplayName } from '../data/archetypes';
import { soundFX } from '../utils/audio';
import { useTaskStore } from '../store/useTaskStore';
import { useSystemPalette } from '../utils/systemPalette';
import { TabHeader } from './common/TabHeader';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ReferenceLine
} from 'recharts';

export interface WeeklyStatsProps {
  expenses: FinancialTransaction[];
  setExpenses: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
  stats: PlayerStats;
  onUpdateStats?: (updater: PlayerStats | ((prev: PlayerStats) => PlayerStats)) => void;
  tasksByDate?: Record<string, TaskItem[]>;
  pomodoroSessions: PomodoroSession[];
  habitMastery?: Record<string, HabitMasteryRecord>;
  cloudSync?: CloudSyncResult;
  onOpenAwakening?: () => void;
  onOpenKaiWorkshop?: () => void;
  onOpenSkills?: () => void;
}

type TimeRange = 'semanal' | 'mensual' | 'anual';
type StatsSubTab = 'hero' | 'neuro' | 'energy' | 'finance';

const PIE_GRADIENTS = [
  { start: '#00f0ff', end: '#3b82f6' },
  { start: '#39ff14', end: '#10b981' },
  { start: '#d946ef', end: '#8b5cf6' },
  { start: '#f59e0b', end: '#ef4444' },
  { start: '#6366f1', end: '#a855f7' },
  { start: '#f43f5e', end: '#fb923c' },
  { start: '#14b8a6', end: '#0ea5e9' }
];

const AnimatedCounter = ({ value, duration = 1200, prefix = "", suffix = "" }: { value: number; duration?: number; prefix?: string; suffix?: string }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(value);
      return;
    }

    let frameId: number | null = null;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * value));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };
    frameId = window.requestAnimationFrame(step);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [value, duration]);

  return <>{prefix}{count.toLocaleString('es-CR')}{suffix}</>;
};

export const WeeklyStats: React.FC<WeeklyStatsProps> = ({
  stats,
  onUpdateStats,
  tasksByDate: propTasksByDate,
  pomodoroSessions,
  habitMastery = {},
  expenses,
  setExpenses,
  cloudSync,
  onOpenAwakening,
  onOpenKaiWorkshop,
  onOpenSkills
}) => {
  const storeTasksByDate = useTaskStore((s) => s.tasksByDate);
  const tasksByDate = propTasksByDate || storeTasksByDate;
  const palette = useSystemPalette();
  const [activeSubTab, setActiveSubTab] = useState<StatsSubTab>('hero');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRanksModalOpen, setIsRanksModalOpen] = useState(false);
  const [isArchetypesModalOpen, setIsArchetypesModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('semanal');
  const [isAnnualHeatmapOpen, setIsAnnualHeatmapOpen] = useState(false);

  // --- CHARACTER & RANK CALCULATION ---
  const selectedClassOption = CHARACTER_CLASSES.find(c => c.name === stats.characterClass) || CHARACTER_CLASSES[0];
  const activeRank = getRankForLevel(stats.level);
  const displayRankTitle = activeRank.title;

  // --- UNIFIED ATTRIBUTE MAPPING (Consistent across entire system) ---
  const getAttribute = (cat: string) => {
    const c = (cat || '').toLowerCase().trim();
    if (['entrenamiento', 'ejercicio', 'fuerza', 'deporte', 'cuerpo'].includes(c)) return 'Fuerza';
    if (['creativo', 'pomodoro', 'mente', 'foco'].includes(c)) return 'Mente';
    if (['estudio', 'lectura'].includes(c)) return 'Estudio';
    if (['comida', 'limpieza', 'descanso', 'recuperacion', 'salud', 'nutricion'].includes(c)) return 'Energía';
    return 'Disciplina';
  };

  // --- DYNAMIC ATTRIBUTES CALCULATION ---
  const attributesData = useMemo(() => {
    let f = stats.attributes?.fuerza || 0;
    let m = stats.attributes?.mente || 0;
    let e = stats.attributes?.energia || 0;
    let d = stats.attributes?.disciplina || 0;
    let s = stats.attributes?.estudio || 0;

    Object.values(tasksByDate).forEach(tasks => {
      (tasks as TaskItem[]).forEach(t => {
        if (t.completed) {
          const attr = getAttribute(t.category);
          if (attr === 'Fuerza') f += 0.5;
          if (attr === 'Mente') m += 0.5;
          if (attr === 'Energía') e += 0.5;
          if (attr === 'Disciplina') d += 0.5;
          if (attr === 'Estudio') s += 0.5;
        }
      });
    });

    return [
      { subject: 'Disciplina', level: Math.floor(d) },
      { subject: 'Fuerza', level: Math.floor(f) },
      { subject: 'Mente', level: Math.floor(m) },
      { subject: 'Energía', level: Math.floor(e) },
      { subject: 'Estudio', level: Math.floor(s) },
    ];
  }, [stats.attributes, tasksByDate]);

  // --- CALCULATE RECORDS ---
  const { maxDailyXp, maxPomodoro, maxHabitStreak, totalTasksDone } = useMemo(() => {
    let maxDailyXp = 0;
    let totalTasksDone = 0;

    (Object.values(tasksByDate) as TaskItem[][]).forEach(tasks => {
      let dayXp = 0;
      (tasks as TaskItem[]).forEach(t => {
        if (t.completed) {
          dayXp += (t.xpReward || 0);
          totalTasksDone++;
        }
      });
      if (dayXp > maxDailyXp) maxDailyXp = dayXp;
    });

    let maxPomodoro = 0;
    pomodoroSessions.forEach(p => {
      if (p.durationMinutes > maxPomodoro) maxPomodoro = p.durationMinutes;
    });

    let maxHabitStreak = 0;
    (Object.values(habitMastery) as HabitMasteryRecord[]).forEach(h => {
      if (h.highestStreak > maxHabitStreak) maxHabitStreak = h.highestStreak;
    });
    if (stats.streakDays > maxHabitStreak) maxHabitStreak = stats.streakDays;

    return { maxDailyXp, maxPomodoro, maxHabitStreak, totalTasksDone };
  }, [tasksByDate, pomodoroSessions, habitMastery, stats.streakDays]);

interface TrackedHabitRecord extends Partial<HabitMasteryRecord> {
  baseId: string;
  currentStreak: number;
  highestStreak: number;
  isMastered: boolean;
  habitEnergyType?: HabitEnergyType;
  category?: TaskCategory;
}

  // --- TRACKED HABITS (Strictly 21/66 Days System) ---
  const trackedHabits = useMemo(() => {
    const map = new Map<string, TrackedHabitRecord>();

    // 1. Gather all habits from habitMastery
    Object.entries(habitMastery || {}).forEach(([baseId, record]) => {
      map.set(baseId, { ...record, baseId, currentStreak: record.currentStreak ?? 0, highestStreak: record.highestStreak ?? 0, isMastered: Boolean(record.isMastered) });
    });

    // 2. Also check tasksByDate for any tracked 21/66 habit
    Object.values(tasksByDate || {}).forEach(tasks => {
      tasks.forEach(t => {
        if (t.isTracked2166 || t.isQuickHabit) {
          const baseId = getHabitBaseId(t);
          if (baseId && !map.has(baseId)) {
            map.set(baseId, {
              baseId,
              currentStreak: 0,
              highestStreak: 0,
              isMastered: false,
              habitEnergyType: t.habitEnergyType
            });
          }
        }
      });
    });

    return Array.from(map.values())
      .filter(h => {
        if (h.highestStreak > 0 || h.currentStreak > 0) return true;
        if (h.baseId === 'habit-water' || h.baseId === 'habit-teeth' || h.baseId.startsWith('habit-') || h.baseId.startsWith('preset-')) return true;
        for (const tasks of Object.values(tasksByDate) as TaskItem[][]) {
          const found = tasks.find(t => getHabitBaseId(t) === h.baseId);
          if (found) {
            return Boolean(found.isTracked2166 || found.isQuickHabit);
          }
        }
        return false;
      })
      .sort((a, b) => b.currentStreak - a.currentStreak);
  }, [habitMastery, tasksByDate]);

  // Memoized habit baseId -> Title map to eliminate O(Days * Tasks) search in every render/map
  const habitTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    map.set('habito-ejercicio-diario', 'Entrenamiento Diario');
    for (const tasks of Object.values(tasksByDate) as TaskItem[][]) {
      for (const t of tasks) {
        const bId = getHabitBaseId(t);
        if (bId && !map.has(bId) && t.title) {
          map.set(bId, t.title);
        }
      }
    }
    return map;
  }, [tasksByDate]);

  const getHabitRealTitle = (baseId: string) => {
    if (!baseId) return 'Hábito Desconocido';
    const found = habitTitleMap.get(baseId);
    if (found) return found;
    return baseId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // --- CHART DATA (With Corrected Annual Rollover Date Math) ---
  const chartData = useMemo(() => {
    const today = new Date();
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    if (timeRange === 'anual') {
      return Array.from({ length: 12 }).map((_, idx) => {
        const d = new Date(today);
        d.setDate(1); // FIX: Set date to 1 to prevent rollover bug on months with 28-30 days
        d.setMonth(d.getMonth() - (11 - idx));
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const dayLabel = `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;

        const monthSessions = pomodoroSessions.filter(s => s.date.startsWith(yearMonth));
        const focusMinutes = monthSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

        return {
          dateStr: yearMonth,
          dayLabel,
          focusMinutes,
          isToday: idx === 11
        };
      });
    }

    const daysCount = timeRange === 'semanal' ? 7 : 30;
    const todayStr = getTodayDateString();
    return Array.from({ length: daysCount }).map((_, idx) => {
      const offset = -(daysCount - 1 - idx);
      const dateStr = addDaysToDateString(todayStr, offset);
      const d = parseLocalDate(dateStr);

      let dayLabel = '';
      if (timeRange === 'semanal') {
        dayLabel = dayNames[d.getDay()];
      } else {
        dayLabel = `${d.getDate()} ${months[d.getMonth()]}`;
      }

      const daySessions = pomodoroSessions.filter((s) => s.date === dateStr);
      const focusMinutes = daySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

      return {
        dateStr,
        dayLabel,
        focusMinutes,
        isToday: idx === daysCount - 1
      };
    });
  }, [pomodoroSessions, timeRange]);

  const totalFocusMinutes = chartData.reduce((acc, d) => acc + d.focusMinutes, 0);

  // --- TIME AUDIT (Strictly Filtered by Current Period) ---
  const filteredTimeAudit = useMemo(() => {
    const todayStr = getTodayDateString();
    let relevantSessions: PomodoroSession[] = [];

    if (timeRange === 'semanal') {
      const start = addDaysToDateString(todayStr, -6);
      relevantSessions = pomodoroSessions.filter(p => p.date >= start && p.date <= todayStr);
    } else if (timeRange === 'mensual') {
      const start = addDaysToDateString(todayStr, -29);
      relevantSessions = pomodoroSessions.filter(p => p.date >= start && p.date <= todayStr);
    } else {
      const start = addDaysToDateString(todayStr, -364);
      relevantSessions = pomodoroSessions.filter(p => p.date >= start && p.date <= todayStr);
    }

    const audit: Record<string, number> = {};
    let totalMinutes = 0;
    relevantSessions.forEach(p => {
      const cat = p.category || 'otros';
      audit[cat] = (audit[cat] || 0) + p.durationMinutes;
      totalMinutes += p.durationMinutes;
    });

    return { audit, totalMinutes };
  }, [pomodoroSessions, timeRange]);

  // --- COMPLETED TASKS IN PERIOD ---
  const completedTasksInPeriod = useMemo(() => {
    const completed: TaskItem[] = [];
    chartData.forEach(item => {
      if (timeRange === 'anual') {
        Object.keys(tasksByDate).forEach(date => {
          if (date.startsWith(item.dateStr)) {
            tasksByDate[date].forEach(t => {
              if (t.completed) completed.push(t);
            });
          }
        });
      } else {
        const dayTasks = tasksByDate[item.dateStr] || [];
        dayTasks.forEach(t => {
          if (t.completed) completed.push(t);
        });
      }
    });
    return completed;
  }, [chartData, tasksByDate, timeRange]);

  const completedTasksCount = completedTasksInPeriod.length;

  // --- PIE CHART DATA ---
  const pieData = useMemo(() => {
    const counts = completedTasksInPeriod.reduce((acc, t) => {
      const cat = t.category.charAt(0).toUpperCase() + t.category.slice(1);
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }, [completedTasksInPeriod]);

  // --- NEUROPLASTICITY CHART DATA (21/66) ---
  const neuroChartData = useMemo(() => {
    return trackedHabits.map(habit => {
      const title = getHabitRealTitle(habit.baseId);
      const masteryRecord = habitMastery?.[habit.baseId] || { currentStreak: 0, highestStreak: 0, isMastered: false };
      const currentStreak = masteryRecord.currentStreak || habit.currentStreak || 0;
      const highestStreak = Math.max(masteryRecord.highestStreak || 0, habit.highestStreak || 0, currentStreak);
      const energyType = habit.habitEnergyType || detectHabitEnergy(title, habit.category);
      const energyDetail = HABIT_ENERGY_DETAILS[energyType] || HABIT_ENERGY_DETAILS.purification;

      return {
        id: habit.baseId,
        name: title.length > 14 ? title.slice(0, 12) + '…' : title,
        fullName: title,
        currentStreak,
        highestStreak,
        energyLabel: energyDetail.label,
        auraName21: energyDetail.auraName21,
        masterForm66: energyDetail.masterForm66,
        isMaltzReached: currentStreak >= 21,
        isMastered: currentStreak >= 66
      };
    });
  }, [trackedHabits, habitMastery]);

  // --- DYNAMIC PIE COLORS (Connected to System Aura Palette) ---
  const dynamicPieColors = useMemo(
    () => [
      palette.c1,
      palette.c2,
      palette.c3,
      PIE_GRADIENTS[3].start,
      PIE_GRADIENTS[4].start,
      PIE_GRADIENTS[5].start,
      PIE_GRADIENTS[6].start,
    ],
    [palette.c1, palette.c2, palette.c3]
  );

  // --- HABIT RACE DATA (For MoxenCarrera) ---
  const habitRaceData: HabitRaceItem[] = useMemo(() => {
    const stepsCount = 7;
    return trackedHabits.slice(0, 6).map((h, idx) => {
      const title = getHabitRealTitle(h.baseId);
      const current = h.currentStreak || 0;
      const streaksByPeriod = Array.from({ length: stepsCount }).map((_, pIdx) => {
        const factor = (pIdx + 1) / stepsCount;
        return Math.max(0, Math.round(current * factor));
      });

      const colors = [
        `linear-gradient(90deg, ${palette.c1}, ${palette.c2})`,
        'linear-gradient(90deg, #a855f7, #d946ef)',
        'linear-gradient(90deg, #f59e0b, #fbbf24)',
        'linear-gradient(90deg, #10b981, #14b8a6)',
        'linear-gradient(90deg, #ef4444, #f97316)',
        'linear-gradient(90deg, #ec4899, #f43f5e)'
      ];

      return {
        id: h.baseId,
        name: title,
        streaksByPeriod,
        color: colors[idx % colors.length]
      };
    });
  }, [trackedHabits, palette.c1, palette.c2]);

  // --- WEEK PERFORMANCE DAYS (For MoxenConstancia) ---
  const weekPerformanceDays: DayPerformance[] = useMemo(() => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const todayStr = getTodayDateString();

    return Array.from({ length: 7 }).map((_, idx) => {
      const offset = -(6 - idx);
      const dateStr = addDaysToDateString(todayStr, offset);
      const d = parseLocalDate(dateStr);

      const dayTasks = tasksByDate[dateStr] || [];
      const dayPomos = pomodoroSessions.filter(p => p.date === dateStr);
      const focusMinutes = dayPomos.reduce((acc, p) => acc + (p.durationMinutes || 0), 0);
      const tasksDone = dayTasks.filter(t => t.completed && !t.isHabit).length;
      const habitsDone = dayTasks.filter(t => (t.completed || (t.isHabit && (t.currentCount || 0) >= (t.targetCount || 1))) && (t.isTracked2166 || t.isHabit || t.isQuickHabit)).length;

      return {
        dayLabel: dayNames[d.getDay()],
        fullDate: dateStr,
        name: formatDateFullSpanish(dateStr).split(',')[0] || dayNames[d.getDay()],
        focusMinutes,
        tasksDone,
        habitsDone,
        isToday: dateStr === todayStr
      };
    });
  }, [tasksByDate, pomodoroSessions]);

  // --- PHASE PROGRESSION DATA ---
  const phaseProgressionData = useMemo(() => {
    if (!stats.phaseHistory) return [];

    const phases = Object.keys(stats.phaseHistory).map(Number).sort((a, b) => a - b);
    const phaseNames = [
      '',
      'Saliendo del Letargo',
      'La Batalla del Foco',
      'Construyendo el Impulso',
      'La Prueba de la Constancia',
      'Resistencia y Fortaleza',
      'Maestría del Hábito',
      'La Mente Indomable',
      'Rendimiento de Élite',
      'Autodominio Absoluto',
      'La Solución'
    ];

    return phases.map(phaseNum => {
      const dateStr = stats.phaseHistory![phaseNum];
      const date = new Date(dateStr);
      const displayDate = `${date.getDate()}/${date.getMonth() + 1}`;

      return {
        phase: `Fase ${phaseNum}`,
        name: phaseNames[phaseNum] || `Fase ${phaseNum}`,
        date: displayDate,
        level: phaseNum * 10
      };
    });
  }, [stats.phaseHistory]);

  // --- CUSTOM TOOLTIPS (Obsidian Glass + Dynamic Aura) ---
  const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-[#030712]/[0.97] border border-white/10 p-2.5 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.65)]"
          style={{ borderColor: palette.glow }}
        >
          <p className="text-slate-300 text-[10px] uppercase tracking-wider font-bold mb-1">{label}</p>
          <p className="text-white text-sm font-mono tabular-nums font-black flex items-center gap-1.5">
            <Icon name="timer" className="w-3.5 h-3.5 aura-text-primary" />
            {payload[0].value} min
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-[#030712]/[0.97] border border-white/10 p-2.5 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.65)] z-30"
          style={{ borderColor: palette.glow }}
        >
          <p className="aura-text-soft text-[10px] uppercase tracking-wider font-bold mb-1">{payload[0].name}</p>
          <p className="text-white text-sm font-mono tabular-nums font-black flex items-center gap-1.5">
            <Icon name="checkCircle" className="w-3.5 h-3.5 aura-text-primary" />
            {payload[0].value} tareas
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipNeuro = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="bg-[#030712]/[0.97] border border-white/10 p-3 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.7)] text-white text-xs max-w-xs space-y-1.5"
          style={{ borderColor: palette.glow }}
        >
          <p className="font-anton uppercase tracking-wider aura-text-soft text-sm flex items-center gap-1.5">
            <Icon name="brain" className="w-3.5 h-3.5 aura-text-primary" />
            {data.fullName}
          </p>
          <div className="flex items-center justify-between font-mono tabular-nums">
            <span className="text-slate-400">Racha Actual:</span>
            <span className="font-bold aura-text-primary">{data.currentStreak} días</span>
          </div>
          <div className="flex items-center justify-between font-mono tabular-nums">
            <span className="text-slate-400">Récord Máximo:</span>
            <span className="font-bold text-amber-300">{data.highestStreak} días</span>
          </div>
          <div className="pt-1 border-t border-white/10 text-[11px]">
            {data.isMastered ? (
              <p className="text-amber-300 font-bold flex items-center gap-1">
                <span>👑</span> ¡Maestría Cuántica Consolidada (66d+)!
              </p>
            ) : data.isMaltzReached ? (
              <p className="text-purple-300 font-bold flex items-center gap-1">
                <span>⚡</span> Hábito Formado (21d). Faltan {66 - data.currentStreak}d para Maestría.
              </p>
            ) : (
              <p className="aura-text-soft flex items-center gap-1">
                <span>🌱</span> Faltan {21 - data.currentStreak}d para la Barrera de Maltz.
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Modals */}
      <Suspense fallback={null}>
        <HeroProfileModal
          isOpen={isEditingProfile}
          onClose={() => setIsEditingProfile(false)}
          stats={stats}
          onUpdateStats={onUpdateStats}
          cloudSync={cloudSync}
          onOpenAwakening={onOpenAwakening}
          onOpenArchetypes={() => setIsArchetypesModalOpen(true)}
          onOpenKaiWorkshop={onOpenKaiWorkshop}
        />
      </Suspense>

      <Suspense fallback={null}>
        <RanksModal
          isOpen={isRanksModalOpen}
          onClose={() => setIsRanksModalOpen(false)}
          currentLevel={stats.level || 1}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ArchetypesModal
          isOpen={isArchetypesModalOpen}
          onClose={() => setIsArchetypesModalOpen(false)}
          currentArchetype={getArchetypeDisplayName(stats.characterClass)}
          onSelectArchetype={(arch) => {
            if (onUpdateStats) {
              onUpdateStats(prev => ({
                ...prev,
                characterClass: arch.name,
              }));
            }
          }}
        />
      </Suspense>

      {/* CANONICAL TAB HEADER */}
      <TabHeader
        title="Centro de Estadísticas"
        subtitle="Ficha de héroe, hábitos 21/66, energía, foco y tesorería"
        icon={<Icon name="activity" className="w-5 h-5" />}
        badge={
          <span className="text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-lg aura-bg-soft border aura-border-subtle aura-text-primary uppercase">
            Nv. {stats.level} • {displayRankTitle}
          </span>
        }
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4 MASTER SUB-TABS SELECTOR (MOXEN CHIP MENU GROUP)                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30 mb-4 mf-8-menu-chip-group mf-chip-group justify-start sm:justify-center bg-[#040a1a]/[0.95] backdrop-blur-md rounded-2xl p-1.5 border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        role="listbox"
        aria-label="Secciones de Perfil y Estadísticas"
      >
        <button
          type="button"
          role="option"
          aria-selected={activeSubTab === 'hero'}
          onClick={() => {
            soundFX.playClick();
            setActiveSubTab('hero');
          }}
          className={`chicle-btn mf-8-menu-chip-group__chip mf-chip flex-1 sm:flex-initial ${
            activeSubTab === 'hero' ? 'mf-8-menu-chip-group__chip--active mf-chip--active optic-active-card' : ''
          }`}
        >
          <Icon name="shield" className="w-3.5 h-3.5 shrink-0" />
          <span>Héroe</span>
        </button>

        <button
          type="button"
          role="option"
          aria-selected={activeSubTab === 'neuro'}
          onClick={() => {
            soundFX.playClick();
            setActiveSubTab('neuro');
          }}
          className={`chicle-btn mf-8-menu-chip-group__chip mf-chip flex-1 sm:flex-initial ${
            activeSubTab === 'neuro' ? 'mf-8-menu-chip-group__chip--active mf-chip--active optic-active-card' : ''
          }`}
        >
          <Icon name="brain" className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">Hábitos</span>
          <span className="hidden sm:inline">Hábitos 21/66</span>
          {trackedHabits.length > 0 && (
            <span className="mf-chip__badge font-mono tabular-nums">{trackedHabits.length}</span>
          )}
        </button>

        <button
          type="button"
          role="option"
          aria-selected={activeSubTab === 'energy'}
          onClick={() => {
            soundFX.playClick();
            setActiveSubTab('energy');
          }}
          className={`chicle-btn mf-8-menu-chip-group__chip mf-chip flex-1 sm:flex-initial ${
            activeSubTab === 'energy' ? 'mf-8-menu-chip-group__chip--active mf-chip--active optic-active-card' : ''
          }`}
        >
          <Icon name="zap" className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">Foco</span>
          <span className="hidden sm:inline">Energía & Foco</span>
        </button>

        <button
          type="button"
          role="option"
          aria-selected={activeSubTab === 'finance'}
          onClick={() => {
            soundFX.playClick();
            setActiveSubTab('finance');
          }}
          className={`chicle-btn mf-8-menu-chip-group__chip mf-chip flex-1 sm:flex-initial ${
            activeSubTab === 'finance' ? 'mf-8-menu-chip-group__chip--active mf-chip--active optic-active-card' : ''
          }`}
        >
          <Icon name="coins" className="w-3.5 h-3.5 shrink-0" />
          <span>Finanzas</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* PESTAÑA 1: [🛡️ HÉROE & LINAJE]                                   */}
      {/* ================================================================= */}
      {activeSubTab === 'hero' && (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          {/* Full Width Hero RPG Character Card */}
          <div className="relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 p-4 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden text-white">
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            {onUpdateStats && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setIsEditingProfile(true);
                }}
                className="chicle-btn absolute top-4 right-4 z-20 w-9 h-9 bg-white/[0.04] hover:bg-white/[0.1] rounded-xl border border-white/10 hover:aura-border-subtle aura-text-soft hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Editar tu Perfil"
              >
                <Icon name="edit" className="w-4 h-4" />
              </button>
            )}

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 pr-12">
                <h3 className="text-xs sm:text-sm font-anton uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Icon name="shield" className="w-4 h-4 aura-text-primary" />
                  Ficha de Héroe del Sistema
                </h3>
                <span className="text-xs font-anton px-2.5 py-0.5 rounded-lg aura-bg-primary optic-active-card uppercase font-mono tabular-nums">
                  Nivel {stats.level}
                </span>
              </div>

              {/* Avatar Showcase & Holo Companion */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#040814]/80 border-2 aura-border-primary flex items-center justify-center text-3xl sm:text-4xl aura-glow-subtle">
                      {stats.avatarIcon || '👤'}
                    </div>
                    <div className="absolute -bottom-1.5 -right-1 px-1.5 py-0.5 rounded-md bg-[#030712] text-amber-300 text-[10px] font-mono tabular-nums font-bold border border-amber-400/70 shadow-[0_0_8px_rgba(245,158,11,0.35)]">
                      Nv.{stats.level}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    {stats.username && (
                      <p className="aura-text-soft font-mono text-[10px] mb-0.5 tracking-wider truncate">
                        @{stats.username} {stats.fullName && <span className="text-slate-400 ml-1">| {stats.fullName}</span>}
                      </p>
                    )}
                    <h2 className="text-base sm:text-lg font-anton uppercase text-white tracking-wider truncate">
                      {getArchetypeDisplayName(stats.characterClass)}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="text-xs aura-text-soft font-bold flex items-center gap-1">
                        <Icon name="award" className="w-3.5 h-3.5 aura-text-primary" />
                        {displayRankTitle}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setIsRanksModalOpen(true);
                        }}
                        className="chicle-btn px-2.5 py-0.5 rounded-lg aura-bg-soft hover:brightness-110 border aura-border-subtle text-[10px] font-mono font-bold aura-text-soft hover:text-white transition-all cursor-pointer"
                      >
                        Ver 100 Rangos
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                        <Icon name="sparkles" className="w-3 h-3 text-amber-400" />
                        {selectedClassOption.statBonus}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setIsArchetypesModalOpen(true);
                        }}
                        className="chicle-btn px-2.5 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/15 hover:aura-border-subtle text-[10px] font-mono font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
                      >
                        Ver 12 Arquetipos
                      </button>
                    </div>

                    {/* Quick Badges */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-[11px] font-mono tabular-nums font-bold text-amber-300 bg-[#040814]/80 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
                        <Icon name="coins" className="w-3 h-3 text-amber-400" />
                        {stats.coins}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono tabular-nums font-bold text-amber-300 bg-[#040814]/80 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
                        <Icon name="flame" className="w-3 h-3 text-amber-400" />
                        {stats.streakDays}d
                      </span>
                    </div>
                  </div>
                </div>

                {/* Linked Holo Companion Display */}
                <div
                  onClick={() => {
                    soundFX.playClick();
                    if (onOpenKaiWorkshop) {
                      onOpenKaiWorkshop();
                    } else {
                      setIsArchetypesModalOpen(true);
                    }
                  }}
                  className="chicle-btn p-3 rounded-2xl bg-[#040814]/80 border border-white/10 hover:aura-border-subtle transition-all cursor-pointer flex items-center gap-3 shrink-0 group"
                  title="Haz clic para abrir el Taller Cuántico de KAI"
                >
                  <div className="shrink-0" data-preserve-optic="true">
                    <HoloCompanion archetype={stats.characterClass || 'Espíritu Heroico'} size="sm" showHUD={false} />
                  </div>
                  <div className="min-w-0 pr-2">
                    <div className="text-[9px] font-mono aura-text-soft uppercase tracking-wider font-bold">Compañero Guía</div>
                    <div className="text-xs font-anton text-white truncate group-hover:aura-text-primary transition-colors">
                      KAI • Nv. <span className="font-mono tabular-nums">{stats.level || 1}</span>
                    </div>
                    <div className="text-[10px] aura-text-soft flex items-center gap-1 mt-0.5">
                      <span className="aura-text-primary font-bold underline">Taller KAI 🎨</span>
                      <Icon name="sparkles" className="w-3 h-3 text-amber-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Details Row (Including previously omitted Profession & Mantra) */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {stats.profession && (
                  <span className="text-[10px] bg-[#040814]/80 aura-text-soft px-2.5 py-1 rounded-lg border border-white/10 font-mono flex items-center gap-1">
                    <Icon name="briefcase" className="w-3 h-3 aura-text-primary" /> {stats.profession}
                  </span>
                )}
                {stats.age && (
                  <span className="text-[10px] bg-[#040814]/80 text-slate-300 px-2.5 py-1 rounded-lg border border-white/10 font-mono tabular-nums">
                    Edad: {stats.age}
                  </span>
                )}
                {stats.mainGoal && (
                  <span className="text-[10px] bg-[#040814]/80 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/35 font-mono flex items-center gap-1">
                    <Icon name="target" className="w-3 h-3 text-amber-400" /> Meta: {stats.mainGoal}
                  </span>
                )}
              </div>

              {stats.mantra && (
                <div className="w-full mb-3 p-2.5 rounded-xl bg-[#040814]/80 border aura-border-subtle text-xs font-mono aura-text-soft italic flex items-center gap-2">
                  <Icon name="quote" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>"{stats.mantra}"</span>
                </div>
              )}

              {stats.bio && (
                <p className="text-slate-300 text-xs italic border-l-2 aura-border-primary pl-2.5 mb-4 leading-tight">
                  "{stats.bio}"
                </p>
              )}

              {/* MOXEN QUANTUM LEVEL XP BAR */}
              <div className="mt-3">
                <MoxenNivel
                  level={stats.level}
                  currentXp={stats.currentXp}
                  requiredXp={stats.requiredXp}
                  rankTitle={displayRankTitle}
                  onOpenRanks={() => setIsRanksModalOpen(true)}
                />
              </div>
            </div>
          </div>

          {/* MOXEN TELARAÑA: Pentagonal Power Matrix of RPG Attributes */}
          <MoxenTelarana
            attributes={attributesData}
            characterClass={getArchetypeDisplayName(stats.characterClass)}
            title="Matriz de Poder Pentagonal"
          />

          {/* Historical RPG Phase Journey (Cleanly re-anchored to Hero tab) */}
          {phaseProgressionData.length > 0 && (
            <div className="relative isolate p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 aura-text-primary text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest">
                    <Icon name="trendingUp" className="w-3.5 h-3.5 aura-text-primary" />
                    Tu Evolución
                  </div>
                  <h3 className="text-sm sm:text-lg font-anton uppercase tracking-wider text-white mt-0.5">
                    Diario de Fases del Sistema (1 a 10)
                  </h3>
                </div>
                <span className="self-start sm:self-auto text-[10px] font-mono tabular-nums aura-text-soft aura-bg-soft px-2.5 py-1 rounded-lg border aura-border-subtle">
                  Fase Actual: {activeRank.phase || 1}
                </span>
              </div>

              {/* Guide box */}
              <div className="p-2.5 rounded-xl bg-[#040814]/80 border border-white/10 text-[10px] sm:text-[11px] text-slate-300 font-mono mb-3 flex items-center gap-2 relative z-10">
                <Icon name="sparkles" className="w-4 h-4 aura-text-primary shrink-0" />
                <span className="leading-tight">
                  <strong className="text-white">Cronología:</strong> Registro histórico con la fecha exacta en la que alcanzaste cada una de las 10 fases.
                </span>
              </div>

              <div className="w-full h-[200px] sm:h-[220px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={phaseProgressionData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lineGradHero" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={palette.c1} />
                        <stop offset="100%" stopColor={palette.c2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="phase"
                      stroke="#ffffff"
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis domain={[0, 100]} hide />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div
                              className="bg-[#030712]/[0.97] border border-white/10 rounded-xl p-3 shadow-[0_12px_30px_rgba(0,0,0,0.65)]"
                              style={{ borderColor: palette.glow }}
                            >
                              <p className="font-bold aura-text-primary text-xs tracking-wider mb-1 uppercase">{data.phase}</p>
                              <p className="font-anton uppercase tracking-wider text-white text-sm mb-1">{data.name}</p>
                              <p className="text-slate-300 text-xs font-mono tabular-nums font-semibold">Alcanzado: {data.date}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="level"
                      stroke="url(#lineGradHero)"
                      strokeWidth={3}
                      dot={{ fill: '#030712', stroke: palette.c1, strokeWidth: 2, r: 5 }}
                      activeDot={{ fill: palette.c1, stroke: '#fff', strokeWidth: 2, r: 7 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Récords de Leyenda */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Icon name="trophy" className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-anton uppercase tracking-wider text-white">Tus Récords de Leyenda</h3>
            </div>

            <div className="relative isolate bg-[#040a1a]/[0.94] p-3.5 sm:p-4 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

              <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-[#040814]/80 border border-white/10">
                  <div className="p-2 sm:p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400 shrink-0"><Icon name="zap" className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Máximo XP / Día</p>
                    <p className="text-base sm:text-xl font-black font-mono tabular-nums text-amber-300 truncate">{maxDailyXp} <span className="text-[10px] text-amber-400/80">XP</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-[#040814]/80 border border-white/10">
                  <div className="p-2 sm:p-2.5 aura-bg-soft border aura-border-subtle rounded-xl aura-text-primary shrink-0"><Icon name="timer" className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Deep Work Máx.</p>
                    <p className="text-base sm:text-xl font-black font-mono tabular-nums aura-text-soft truncate">{maxPomodoro} <span className="text-[10px] text-slate-400 font-bold">MIN</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-[#040814]/80 border border-white/10">
                  <div className="p-2 sm:p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400 shrink-0"><Icon name="flame" className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Racha Récord</p>
                    <p className="text-base sm:text-xl font-black font-mono tabular-nums text-amber-400 truncate">{maxHabitStreak} <span className="text-[10px] text-amber-400/80 font-bold">DÍAS</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-[#040814]/80 border border-white/10">
                  <div className="p-2 sm:p-2.5 aura-bg-soft border aura-border-subtle rounded-xl aura-text-primary shrink-0"><Icon name="target" className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Tareas Totales</p>
                    <p className="text-base sm:text-xl font-black font-mono tabular-nums text-white truncate">{totalTasksDone} <span className="text-[10px] text-slate-400">TAR.</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PESTAÑA 2: [🧠 NEUROPLASTICIDAD 21/66]                            */}
      {/* ================================================================= */}
      {activeSubTab === 'neuro' && (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          {/* Neuroplasticity Scientific Overview Banner */}
          <div className="relative isolate p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden">
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon name="brain" className="w-5 h-5 aura-text-primary" />
                <h2 className="text-base font-anton uppercase tracking-wider text-white">
                  Ley 21 / 66 Días: Automatización de Hábitos
                </h2>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mb-4">
                Construye constancia en dos etapas clave para fijar cada hábito en tu rutina diaria.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 sm:p-3.5 rounded-xl bg-[#040814]/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Icon name="zap" className="w-3.5 h-3.5 text-purple-400" />
                      Fase 1: 1 a 21 Días
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-200 border border-purple-500/35">
                      Aura KAI
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    Supera la resistencia inicial y desbloquea el Aura Elemental de tu compañero KAI.
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-[#040814]/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Icon name="award" className="w-3.5 h-3.5 text-amber-400" />
                      Fase 2: 22 a 66 Días
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-500/35">
                      Forma Maestra
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    Automatiza el hábito en tu rutina y desbloquea la Forma Maestra de KAI.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MOXEN CARRERA: Live Habit Competition Race */}
          {habitRaceData.length > 0 && (
            <MoxenCarrera habits={habitRaceData} title="Carrera Cuántica de Hábitos (Evolución Temporal)" />
          )}

          {/* Dedicated 21/66 Neuroplasticity Progression Curve */}
          <div className="relative isolate p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden">
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 relative z-10">
              <div>
                <h3 className="text-sm sm:text-base font-anton text-white flex items-center gap-2 uppercase tracking-wider">
                  <Icon name="activity" className="w-4 h-4 aura-text-primary" />
                  Curva Cuántica de Neuroplasticidad
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparativa de rachas activas frente a la Barrera de Maltz (21d) y la Automatización de Lally (66d).
                </p>
              </div>

              <div className="flex items-center gap-3 text-[10px] sm:text-[11px] font-mono tabular-nums">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                  <span className="text-purple-300 font-bold">21d Maltz</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                  <span className="text-amber-300 font-bold">66d Maestría</span>
                </div>
              </div>
            </div>

            {/* Guide box */}
            <div className="p-2.5 rounded-xl bg-[#040814]/80 border border-white/10 text-[10px] sm:text-[11px] text-slate-300 font-mono mb-3 flex items-center gap-2 relative z-10">
              <Icon name="brain" className="w-4 h-4 aura-text-primary shrink-0" />
              <span className="leading-tight">
                <strong className="text-white">Curva de hábito:</strong> 21 días supera la resistencia inicial; 66 días automatiza la conducta.
              </span>
            </div>

            {neuroChartData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-dashed border-white/15 rounded-2xl bg-[#040814]/60 relative z-10">
                <Icon name="brain" className="w-10 h-10 aura-text-primary mx-auto mb-2 opacity-60" />
                <p className="text-sm font-bold text-white">No hay hábitos en seguimiento activo</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Crea tu primer hábito desde la pestaña de Tareas Diarias para ver tu curva de neuroplasticidad.
                </p>
              </div>
            ) : (
              <div className="w-full h-[260px] sm:h-[280px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={neuroChartData} margin={{ top: 25, right: 10, left: -20, bottom: 25 }}>
                    <defs>
                      <linearGradient id="streakGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={palette.c1} stopOpacity={1} />
                        <stop offset="100%" stopColor={palette.c2} stopOpacity={0.35} />
                      </linearGradient>
                      <linearGradient id="formedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c084fc" stopOpacity={1} />
                        <stop offset="100%" stopColor="#7e22ce" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="masteredGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fde047" stopOpacity={1} />
                        <stop offset="100%" stopColor="#ca8a04" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#ffffff"
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      interval={0}
                      dy={10}
                    />
                    <YAxis
                      stroke="#64748b"
                      domain={[0, (dataMax: number) => Math.max(80, Math.ceil((dataMax + 10) / 10) * 10)]}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <RechartsTooltip content={<CustomTooltipNeuro />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                    <ReferenceLine
                      y={21}
                      stroke="#c084fc"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{ position: 'insideTopLeft', value: '⚡ 21D MALTZ (FORMADO)', fill: '#c084fc', fontSize: 10, fontWeight: 900, dy: -12 }}
                    />
                    <ReferenceLine
                      y={66}
                      stroke="#facc15"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{ position: 'insideTopLeft', value: '👑 66D LALLY (MAESTRÍA)', fill: '#facc15', fontSize: 10, fontWeight: 900, dy: -12 }}
                    />
                    <Bar
                      dataKey="currentStreak"
                      name="Racha Actual"
                      radius={[8, 8, 0, 0]}
                      barSize={neuroChartData.length > 4 ? 22 : 30}
                      minPointSize={4}
                      animationDuration={1500}
                    >
                      {neuroChartData.map((entry, index) => {
                        const fillUrl = entry.currentStreak >= 66 ? "url(#masteredGrad)" : entry.currentStreak >= 21 ? "url(#formedGrad)" : "url(#streakGrad)";
                        return <Cell key={`neuro-cell-${index}`} fill={fillUrl} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Habit Mastery Showcase Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 aura-text-primary">
                <Icon name="award" className="w-5 h-5" />
                <h3 className="text-sm font-anton uppercase tracking-wider text-white">Vitrina de Hábitos Activos</h3>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                {trackedHabits.length} hábitos en seguimiento
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trackedHabits.map(habit => {
                const title = getHabitRealTitle(habit.baseId);
                const energyType = habit.habitEnergyType || detectHabitEnergy(title, habit.category);
                const energyDetail = HABIT_ENERGY_DETAILS[energyType] || HABIT_ENERGY_DETAILS.purification;
                const masteryRecord = habitMastery?.[habit.baseId] || { currentStreak: 0, highestStreak: 0, isMastered: false };
                const currentStreak = masteryRecord.currentStreak || habit.currentStreak || 0;

                const target = currentStreak >= 21 ? 66 : 21;
                const progress = Math.min((currentStreak / target) * 100, 100);
                const isMastered = currentStreak >= 66;
                const isFormed = currentStreak >= 21;

                return (
                  <div
                    key={habit.baseId}
                    className={`relative isolate p-4 rounded-2xl bg-[#040a1a]/[0.94] border shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col gap-3 transition-all hover:scale-[1.01] ${
                      isMastered
                        ? 'border-amber-400/50'
                        : isFormed
                        ? 'border-purple-400/50'
                        : 'border-white/10'
                    }`}
                  >
                    <span className="vi-grano opacity-5" aria-hidden="true" />
                    <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

                    <div className="flex items-start justify-between relative z-10 gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 text-xl relative ${
                          isMastered
                            ? 'bg-amber-500/15 border-amber-400/60 text-amber-300'
                            : isFormed
                            ? 'bg-purple-500/15 border-purple-400/60 text-purple-300'
                            : 'bg-[#040814]/80 border-white/10 text-slate-200'
                        }`}>
                          {energyDetail.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white line-clamp-1">{title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isMastered ? 'text-amber-300' : (isFormed ? 'text-purple-300' : 'aura-text-primary')}`}>
                              {isMastered ? '👑 66d Automatizado' : (isFormed ? '⚡ 21d Formado' : '🌱 En Construcción')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">• {energyDetail.label}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xl font-black text-white font-mono tabular-nums">{currentStreak} <span className="text-xs text-slate-400 font-sans font-bold">Días</span></p>
                      </div>
                    </div>

                    {/* Kai Rewards Status */}
                    <div className="relative z-10 p-2.5 rounded-xl bg-[#040814]/80 border border-white/10 space-y-1.5 text-xs font-mono tabular-nums">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                          <Icon name="sparkles" className="w-3 h-3 text-purple-400" /> Aura 21d Kai:
                        </span>
                        <span className={`font-bold text-[11px] ${isFormed ? 'text-purple-300' : 'text-slate-500'}`}>
                          {isFormed ? `✅ ${energyDetail.auraName21}` : `🔒 ${energyDetail.auraName21} (${Math.max(0, 21 - currentStreak)}d restantes)`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-1">
                        <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                          <Icon name="award" className="w-3 h-3 text-amber-400" /> Maestría 66d Kai:
                        </span>
                        <span className={`font-bold text-[11px] ${isMastered ? 'text-amber-300' : 'text-slate-500'}`}>
                          {isMastered ? `✅ ${energyDetail.masterForm66}` : `🔒 ${energyDetail.masterForm66} (${Math.max(0, 66 - currentStreak)}d restantes)`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative z-10 mt-1">
                      <div className="flex justify-between text-[10px] font-mono tabular-nums font-bold text-slate-400 mb-1">
                        <span>Progreso de Neuroplasticidad</span>
                        <span>{currentStreak} / {target} Días</span>
                      </div>
                      <div className="w-full h-2 bg-[#040814]/80 rounded-full overflow-hidden border border-white/10">
                        <div
                          className={`h-full relative transition-all duration-1000 ${isMastered ? 'bg-amber-400' : (isFormed ? 'bg-purple-400' : '')}`}
                          style={{
                            width: `${progress}%`,
                            ...(!isMastered && !isFormed ? { backgroundColor: palette.c1 } : {}),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PESTAÑA 3: [⚡ ENERGÍA & FOCO] (FUSIÓN FOCO + BIORRITMO)          */}
      {/* ================================================================= */}
      {activeSubTab === 'energy' && (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          {/* MOXEN CONSTANCIA: 3 Concentric Rings */}
          <MoxenConstancia
            days={weekPerformanceDays}
            focusGoal={60}
            tasksGoal={5}
            habitsGoal={3}
          />

          {/* Time Range Selector */}
          <div className="relative isolate flex flex-col sm:flex-row sm:items-center justify-between bg-[#040a1a]/[0.94] p-3.5 rounded-2xl border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)] gap-3 overflow-hidden">
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            <h2 className="relative z-10 aura-text-primary font-anton text-sm px-2 flex items-center gap-2 uppercase tracking-wider">
              <Icon name="trendingUp" className="w-4 h-4" /> Periodo Operativo de Foco
            </h2>
            <div
              className="relative z-10 mf-8-menu-chip-group mf-chip-group mf-chip-group--compact mf-chip-group--nowrap mx-auto sm:mx-0 w-full sm:w-auto justify-center"
              role="listbox"
              aria-label="Periodo operativo de foco"
            >
              <button
                type="button"
                role="option"
                aria-selected={timeRange === 'semanal'}
                onClick={() => {
                  soundFX.playClick();
                  setTimeRange('semanal');
                }}
                className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm flex-1 sm:flex-none ${
                  timeRange === 'semanal' ? 'mf-8-menu-chip-group__chip--active mf-chip--active optic-active-card' : ''
                }`}
              >
                <Icon name="calendar" className="w-3.5 h-3.5" />
                <span>Semanal</span>
              </button>
              <button
                type="button"
                role="option"
                aria-selected={timeRange === 'mensual'}
                onClick={() => {
                  soundFX.playClick();
                  setTimeRange('mensual');
                }}
                className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm flex-1 sm:flex-none ${
                  timeRange === 'mensual' ? 'mf-8-menu-chip-group__chip--active mf-chip--active optic-active-card' : ''
                }`}
              >
                <Icon name="calendarDays" className="w-3.5 h-3.5" />
                <span>Mensual</span>
              </button>
              <button
                type="button"
                role="option"
                aria-selected={timeRange === 'anual'}
                onClick={() => {
                  soundFX.playClick();
                  setTimeRange('anual');
                }}
                className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm flex-1 sm:flex-none ${
                  timeRange === 'anual' ? 'mf-8-menu-chip-group__chip--active mf-chip--active optic-active-card' : ''
                }`}
              >
                <Icon name="award" className="w-3.5 h-3.5" />
                <span>Anual</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics in Current Period */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative isolate p-4 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)] text-white overflow-hidden">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-slate-300 text-[11px] font-anton uppercase tracking-wider mb-1">
                  <Icon name="checkCircle" className="w-3.5 h-3.5 aura-text-primary" />
                  <span>Tareas</span>
                </div>
                <span className="text-3xl font-black aura-text-primary font-mono tabular-nums">
                  <AnimatedCounter value={completedTasksCount} />
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block font-semibold">EN ESTE PERIODO</span>
              </div>
            </div>

            <div className="relative isolate p-4 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)] text-white overflow-hidden">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-amber-300 text-[11px] font-anton uppercase tracking-wider mb-1">
                  <Icon name="flame" className="w-3.5 h-3.5 text-amber-400" />
                  <span>Racha</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-amber-400 font-mono tabular-nums">
                    <AnimatedCounter value={stats.streakDays} />
                  </span>
                  <span className="text-xs text-amber-400/90 font-bold uppercase">días</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block font-semibold">ACTIVIDAD CONTINUA</span>
              </div>
            </div>

            <div className="relative isolate p-4 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)] text-white overflow-hidden">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-slate-300 text-[11px] font-anton uppercase tracking-wider mb-1">
                  <Icon name="zap" className="w-3.5 h-3.5 aura-text-primary" />
                  <span>Nivel</span>
                </div>
                <span className="text-3xl font-black text-white font-mono tabular-nums">
                  Nv. <AnimatedCounter value={stats.level} />
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block font-semibold truncate">{displayRankTitle}</span>
              </div>
            </div>

            <div className="relative isolate p-4 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)] text-white overflow-hidden">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-slate-300 text-[11px] font-anton uppercase tracking-wider mb-1">
                  <Icon name="timer" className="w-3.5 h-3.5 aura-text-primary" />
                  <span>Minutos Foco</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black aura-text-soft font-mono tabular-nums">
                    <AnimatedCounter value={totalFocusMinutes} />
                  </span>
                  <span className="text-xs aura-text-soft font-bold uppercase">min</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block font-semibold">TOTAL EN PERIODO</span>
              </div>
            </div>
          </div>

          {/* Focus Flow BarChart */}
          <div className="relative isolate p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden">
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            <div className="flex items-center justify-between mb-3 relative z-10">
              <h3 className="text-sm sm:text-base font-anton text-white flex items-center gap-2 uppercase tracking-wider">
                <Icon name="trendingUp" className="w-4 h-4 aura-text-primary" />
                Flujo de Foco ({timeRange === 'semanal' ? '7 Días' : timeRange === 'mensual' ? '30 Días' : '12 Meses'})
              </h3>
            </div>

            {/* Guide box */}
            <div className="p-2.5 rounded-xl bg-[#040814]/80 border border-white/10 text-[10px] sm:text-[11px] text-slate-300 font-mono mb-3 flex items-center gap-2 relative z-10">
              <Icon name="timer" className="w-4 h-4 aura-text-primary shrink-0" />
              <span className="leading-tight">
                <strong className="text-white">¿Cómo interpretarlo?</strong> Muestra tus minutos de concentración profunda acumulados por día. La línea discontinua naranja marca tu objetivo de 60 min.
              </span>
            </div>

            <div className="w-full h-[220px] sm:h-[240px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradientFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={palette.c1} stopOpacity={1} />
                      <stop offset="100%" stopColor={palette.c2} stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="barGradientFlowToday" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#ffffff"
                    tick={{ fill: '#94a3b8', fontSize: timeRange === 'semanal' ? 10 : 8, fontWeight: 'bold' }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <RechartsTooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                  <ReferenceLine
                    y={60}
                    stroke="#f97316"
                    strokeDasharray="3 3"
                    strokeOpacity={0.7}
                    strokeWidth={2}
                    label={{ position: 'insideTopLeft', value: 'META: 60M', fill: '#f97316', fontSize: 10, fontWeight: 900, dy: -10 }}
                  />
                  <Bar
                    dataKey="focusMinutes"
                    radius={[6, 6, 6, 6]}
                    barSize={timeRange === 'semanal' ? 24 : (timeRange === 'mensual' ? 8 : 18)}
                    minPointSize={2}
                    animationDuration={1200}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isToday ? "url(#barGradientFlowToday)" : "url(#barGradientFlow)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MOXEN SUEÑO: Interactive Sleep Hypnogram */}
          <MoxenSueno
            bedtime={stats.sleepLogs?.[getTodayDateString()]?.bedtime || '23:00'}
            wakeTime={stats.sleepLogs?.[getTodayDateString()]?.wakeTime || '07:00'}
            sleepDurationHours={stats.sleepLogs?.[getTodayDateString()]?.sleepDurationHours || 8.0}
            quality={stats.sleepLogs?.[getTodayDateString()]?.quality || 'Excelente'}
            onSaveSleep={(sleepData) => {
              if (onUpdateStats) {
                const todayStr = getTodayDateString();
                onUpdateStats(prev => ({
                  ...prev,
                  sleepLogs: {
                    ...(prev.sleepLogs || {}),
                    [todayStr]: {
                      bedtime: sleepData.bedtime,
                      wakeTime: sleepData.wakeTime,
                      sleepDurationHours: sleepData.durationHours,
                      quality: sleepData.quality,
                      completedAt: new Date().toISOString()
                    }
                  }
                }));
              }
            }}
          />

          {/* Productivity Pie Chart & Filtered Time Audit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <div className="relative isolate p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] flex flex-col items-center overflow-hidden">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

              <div className="relative z-10 w-full flex flex-col items-center">
                <h3 className="text-sm font-anton text-white uppercase tracking-wider mb-1 self-start flex items-center gap-2">
                  <Icon name="pieChart" className="w-4 h-4 aura-text-primary" />
                  Distribución de Productividad
                </h3>
                <p className="text-[10px] text-slate-400 mb-2 self-start font-mono">
                  Tareas completadas según su categoría ({timeRange}).
                </p>

                {pieData.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-xs">No hay tareas completadas en este periodo ({timeRange}).</p>
                  </div>
                ) : (
                  <div className="w-full h-[200px] sm:h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell
                              key={`pie-cell-${index}`}
                              fill={dynamicPieColors[index % dynamicPieColors.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltipPie />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Filtered Deep Work Time Audit */}
            <div className="relative isolate p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] flex flex-col justify-between overflow-hidden">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

              <div className="relative z-10">
                <h3 className="text-sm font-anton text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Icon name="timer" className="w-4 h-4 aura-text-primary" />
                  Auditoría Deep Work ({timeRange})
                </h3>
                <p className="text-[10px] text-slate-400 mb-2 font-mono">
                  Minutos totales de concentración por proyecto o categoría.
                </p>
                <p className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums mb-3">
                  {Math.floor(filteredTimeAudit.totalMinutes / 60)}h {filteredTimeAudit.totalMinutes % 60}m
                </p>
              </div>

              <div className="relative z-10 space-y-2 max-h-36 overflow-y-auto scrollbar-thin">
                {Object.entries(filteredTimeAudit.audit).length === 0 ? (
                  <p className="text-xs text-slate-400">Sin sesiones de foco en este periodo.</p>
                ) : (
                  Object.entries(filteredTimeAudit.audit).map(([cat, mins]) => {
                    const pct = filteredTimeAudit.totalMinutes > 0 ? Math.round((mins / filteredTimeAudit.totalMinutes) * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center justify-between text-xs font-mono tabular-nums px-2.5 py-1.5 rounded-xl bg-[#040814]/80 border border-white/10">
                        <span className="text-slate-300 uppercase truncate">{cat}</span>
                        <span className="aura-text-soft font-bold">{mins}m ({pct}%)</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* COLLAPSIBLE 365-DAY ANNUAL HEATMAP ACCORDION */}
          <div className="relative isolate p-4 rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden">
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            <div className="relative z-10">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setIsAnnualHeatmapOpen(!isAnnualHeatmapOpen);
                }}
                className="chicle-btn w-full flex items-center justify-between text-xs font-anton uppercase tracking-wider aura-text-soft hover:text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Icon name="activity" className="w-4 h-4 aura-text-primary" />
                  Radiografía Anual de Consistencia Cuántica (Heatmap 365 Días)
                </span>
                {isAnnualHeatmapOpen ? <Icon name="chevronUp" className="w-4 h-4" /> : <Icon name="chevronDown" className="w-4 h-4" />}
              </button>

              {isAnnualHeatmapOpen && (
                <div className="mt-4 pt-4 border-t border-white/10 animate-fadeIn">
                  <IntelligenceOverlay
                    stats={stats}
                    onUpdateStats={onUpdateStats}
                    tasksByDate={tasksByDate}
                    pomodoroSessions={pomodoroSessions}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PESTAÑA 4: [💰 FINANZAS]                                          */}
      {/* ================================================================= */}
      {activeSubTab === 'finance' && (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          <Suspense fallback={<div className="p-8 text-center text-xs font-mono aura-text-primary">Cargando panel financiero...</div>}>
            <FinanceDashboard expenses={expenses} setExpenses={setExpenses} tasksByDate={tasksByDate} />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default WeeklyStats;