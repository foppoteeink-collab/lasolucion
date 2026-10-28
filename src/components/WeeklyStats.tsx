import React, { useState, useMemo, lazy, Suspense } from 'react';
import { HoloCompanion } from './HoloCompanion';
import { ScrollReveal } from './common/ScrollReveal';
import { IntelligenceOverlay } from '../intelligence/IntelligenceOverlay';
import { PlayerStats, PomodoroSession, TaskItem, HabitMasteryRecord, FinancialTransaction } from '../types';
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
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
  Flame,
  Award,
  PieChart as PieChartIcon,
  Calendar,
  CalendarDays,
  Brain,
  Shield,
  Coins,
  Sparkles,
  Trophy,
  Target,
  Edit2,
  Activity,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Quote
} from 'lucide-react';
import { getHabitBaseId } from '../intelligence/masteryEngine';
import { CHARACTER_CLASSES, getRankForLevel } from '../data/defaults';
import { soundFX } from '../utils/audio';
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
  tasksByDate: Record<string, TaskItem[]>;
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
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <>{prefix}{count.toLocaleString('es-CR')}{suffix}</>;
};

export const WeeklyStats: React.FC<WeeklyStatsProps> = ({
  stats,
  onUpdateStats,
  tasksByDate,
  pomodoroSessions,
  habitMastery = {},
  expenses,
  setExpenses,
  cloudSync,
  onOpenAwakening,
  onOpenKaiWorkshop,
  onOpenSkills
}) => {
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

  // --- TRACKED HABITS (Strictly 21/66 Days System) ---
  const trackedHabits = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Gather all habits from habitMastery
    Object.entries(habitMastery || {}).forEach(([baseId, record]) => {
      map.set(baseId, { ...(record as any), baseId });
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

  const getHabitRealTitle = (baseId: string) => {
    if (!baseId) return 'Hábito Desconocido';
    if (baseId === 'habito-ejercicio-diario') return 'Entrenamiento Diario';
    for (const tasks of Object.values(tasksByDate) as TaskItem[][]) {
      const found = tasks.find(t => getHabitBaseId(t) === baseId);
      if (found) return found.title;
    }
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
        'linear-gradient(90deg, #00f0ff, #3b82f6)',
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
  }, [trackedHabits]);

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

  // --- CUSTOM TOOLTIPS ---
  const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#001830]/95 backdrop-blur-md border border-cyan-500/50 p-2.5 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.25)]">
          <p className="text-white text-[10px] uppercase tracking-wider font-bold mb-1">{label}</p>
          <p className="text-white text-sm font-mono font-black flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
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
        <div className="bg-[#001830]/95 backdrop-blur-md border border-fuchsia-500/50 p-2.5 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.25)] z-30">
          <p className="text-fuchsia-300 text-[10px] uppercase tracking-wider font-bold mb-1">{payload[0].name}</p>
          <p className="text-white text-sm font-mono font-black flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-fuchsia-400" />
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
        <div className="bg-[#001830]/95 backdrop-blur-md border border-purple-500/50 p-3 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] text-white text-xs max-w-xs space-y-1.5">
          <p className="font-anton uppercase tracking-wider text-purple-300 text-sm flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            {data.fullName}
          </p>
          <div className="flex items-center justify-between font-mono">
            <span className="text-slate-400">Racha Actual:</span>
            <span className="font-bold text-cyan-300">{data.currentStreak} días</span>
          </div>
          <div className="flex items-center justify-between font-mono">
            <span className="text-slate-400">Récord Máximo:</span>
            <span className="font-bold text-amber-300">{data.highestStreak} días</span>
          </div>
          <div className="pt-1 border-t border-purple-500/30 text-[11px]">
            {data.isMastered ? (
              <p className="text-yellow-400 font-bold flex items-center gap-1">
                <span>👑</span> ¡Maestría Cuántica Consolidada (66d+)!
              </p>
            ) : data.isMaltzReached ? (
              <p className="text-purple-300 font-bold flex items-center gap-1">
                <span>⚡</span> Hábito Formado (21d). Faltan {66 - data.currentStreak}d para Maestría.
              </p>
            ) : (
              <p className="text-cyan-300 flex items-center gap-1">
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
          currentArchetype={stats.characterClass || 'El Héroe'}
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4 MASTER SUB-TABS SELECTOR (TACTICAL SCI-FI SWITCHER)              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 mb-4 p-1 sm:p-1.5 rounded-2xl bg-[#030612]/95 backdrop-blur-md border border-cyan-500/40 shadow-[0_4px_25px_rgba(0,240,255,0.15)] grid grid-cols-4 gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveSubTab('hero');
          }}
          className={`py-2 px-1 sm:px-3 rounded-xl font-anton text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'hero'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-black shadow-[0_0_15px_rgba(0,240,255,0.5)] font-black'
              : 'text-slate-300 hover:text-cyan-300 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>Héroe</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveSubTab('neuro');
          }}
          className={`py-2 px-1 sm:px-3 rounded-xl font-anton text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'neuro'
              ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] font-black'
              : 'text-slate-300 hover:text-purple-300 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Brain className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">Hábitos</span>
          <span className="hidden sm:inline">Hábitos 21/66</span>
          {trackedHabits.length > 0 && (
            <span className={`hidden sm:inline-block px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeSubTab === 'neuro' ? 'bg-black/50 text-purple-200' : 'bg-purple-900/60 text-purple-300'
            }`}>
              {trackedHabits.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveSubTab('energy');
          }}
          className={`py-2 px-1 sm:px-3 rounded-xl font-anton text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'energy'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(0,240,255,0.5)] font-black'
              : 'text-slate-300 hover:text-cyan-300 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">Foco</span>
          <span className="hidden sm:inline">Energía & Foco</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveSubTab('finance');
          }}
          className={`py-2 px-1 sm:px-3 rounded-xl font-anton text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'finance'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] font-black'
              : 'text-slate-300 hover:text-amber-300 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Coins className="w-3.5 h-3.5 shrink-0" />
          <span>Finanzas</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* PESTAÑA 1: [🛡️ HÉROE & LINAJE]                                   */}
      {/* ================================================================= */}
      {activeSubTab === 'hero' && (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          {/* Full Width Hero RPG Character Card */}
          <div className="rounded-[22px] sm:rounded-[24px] scifi-glass-panel border-2 border-cyan-400 p-3.5 sm:p-6 shadow-[0_0_25px_rgba(0,240,255,0.25)] flex flex-col justify-between relative overflow-hidden text-white">
            {onUpdateStats && (
              <button
                onClick={() => {
                  soundFX.playClick();
                  setIsEditingProfile(true);
                }}
                className="absolute top-4 right-4 z-20 p-2 bg-[#04020e] rounded-xl border border-cyan-500/60 text-cyan-300 hover:bg-cyan-950/60 hover:text-white transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                title="Editar Identidad del Cazador"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            <div>
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-cyan-500/30 pr-12">
                <h3 className="text-xs font-anton uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Ficha de Héroe del Sistema
                </h3>
                <span className="text-xs font-anton px-2.5 py-0.5 rounded-lg bg-cyan-400 text-black border border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.5)] uppercase">
                  Nivel {stats.level}
                </span>
              </div>

              {/* Avatar Showcase & Holo Companion */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#04020e] border-2 border-cyan-400 flex items-center justify-center text-3xl sm:text-4xl shadow-[0_0_15px_rgba(0,240,255,0.35)]">
                      {stats.avatarIcon || '👤'}
                    </div>
                    <div className="absolute -bottom-1.5 -right-1 px-1.5 py-0.5 rounded-md bg-black text-amber-300 text-[10px] font-anton border border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                      Nv.{stats.level}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    {stats.username && (
                      <p className="text-cyan-300 font-mono text-[10px] mb-0.5 tracking-wider truncate">
                        @{stats.username} {stats.fullName && <span className="text-slate-400 ml-1">| {stats.fullName}</span>}
                      </p>
                    )}
                    <h2 className="text-base sm:text-lg font-anton uppercase text-white tracking-wide truncate">
                      {stats.characterClass || 'Héroe del Sistema'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="text-xs text-cyan-300/90 font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-cyan-400" />
                        {displayRankTitle}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setIsRanksModalOpen(true);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-300 text-[10px] font-mono font-bold text-cyan-300 hover:text-white transition-all cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.2)] active:scale-95"
                      >
                        Ver 100 Rangos
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {selectedClassOption.statBonus}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setIsArchetypesModalOpen(true);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 hover:border-indigo-300 text-[10px] font-mono font-bold text-indigo-300 hover:text-white transition-all cursor-pointer shadow-[0_0_8px_rgba(99,102,241,0.2)] active:scale-95"
                      >
                        Ver 12 Arquetipos
                      </button>
                    </div>

                    {/* Quick Badges */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-[11px] font-anton text-amber-300 bg-[#04020e] px-2.5 py-0.5 rounded-lg border border-amber-500/50">
                        <Coins className="w-3 h-3 text-amber-400" />
                        {stats.coins}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-anton text-amber-400 bg-[#04020e] px-2.5 py-0.5 rounded-lg border border-amber-500/50">
                        <Flame className="w-3 h-3 text-amber-400" />
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
                  className="p-3 rounded-2xl bg-[#04020e] border border-cyan-500/50 hover:border-cyan-300 transition-all cursor-pointer flex items-center gap-3 shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.15)] group"
                  title="Haz clic para abrir el Taller Cuántico de KAI"
                >
                  <div className="shrink-0">
                    <HoloCompanion archetype={stats.characterClass || 'El Héroe'} size="sm" showHUD={false} />
                  </div>
                  <div className="min-w-0 pr-2">
                    <div className="text-[9px] font-mono text-cyan-300 uppercase tracking-wider font-bold">Compañero Guía</div>
                    <div className="text-xs font-anton text-white truncate group-hover:text-cyan-300 transition-colors">
                      KAI • Nv. {stats.level || 1}
                    </div>
                    <div className="text-[10px] text-cyan-300/80 flex items-center gap-1 mt-0.5">
                      <span className="text-cyan-400 font-bold underline">Taller KAI 🎨</span>
                      <Sparkles className="w-3 h-3 text-amber-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Details Row (Including previously omitted Profession & Mantra) */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {stats.profession && (
                  <span className="text-[10px] bg-[#04020e] text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/40 font-mono flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-cyan-400" /> {stats.profession}
                  </span>
                )}
                {stats.age && (
                  <span className="text-[10px] bg-[#04020e] text-slate-300 px-2.5 py-1 rounded-lg border border-cyan-500/30 font-mono">
                    Edad: {stats.age}
                  </span>
                )}
                {stats.mainGoal && (
                  <span className="text-[10px] bg-[#04020e] text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/40 font-mono flex items-center gap-1">
                    <Target className="w-3 h-3 text-amber-400" /> Meta: {stats.mainGoal}
                  </span>
                )}
              </div>

              {stats.mantra && (
                <div className="w-full mb-3 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs font-mono text-cyan-200 italic flex items-center gap-2">
                  <Quote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>"{stats.mantra}"</span>
                </div>
              )}

              {stats.bio && (
                <p className="text-cyan-300/80 text-xs italic border-l-2 border-cyan-400 pl-2 mb-4 leading-tight">
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
            characterClass={stats.characterClass || 'Héroe del Sistema'}
            title="Matriz de Poder Pentagonal"
          />

          {/* Historical RPG Phase Journey (Cleanly re-anchored to Hero tab) */}
          {phaseProgressionData.length > 0 && (
            <div className="p-3.5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-emerald-900/40 shadow-[0_10px_30px_rgba(16,185,129,0.08)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Evolución del Cazador
                  </div>
                  <h3 className="text-sm sm:text-lg font-anton uppercase tracking-wide text-white mt-0.5">
                    Diario de Fases del Sistema (1 a 10)
                  </h3>
                </div>
                <span className="self-start sm:self-auto text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  Fase Actual: {activeRank.phase || 1}
                </span>
              </div>

              {/* Guide box */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[10px] sm:text-[11px] text-emerald-200 font-mono mb-3 flex items-center gap-2 relative z-10">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-tight">
                  <strong>Cronología:</strong> Registro histórico con la fecha exacta en la que tu héroe desbloqueó cada una de las 10 fases.
                </span>
              </div>

              <div className="w-full h-[200px] sm:h-[220px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={phaseProgressionData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lineGradHero" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
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
                            <div className="bg-[#001830] border border-emerald-900/50 rounded-xl p-3 shadow-xl backdrop-blur-md">
                              <p className="font-bold text-emerald-300 text-xs tracking-wider mb-1 uppercase">{data.phase}</p>
                              <p className="font-black text-white text-sm mb-1">{data.name}</p>
                              <p className="text-white text-xs font-semibold">Alcanzado: {data.date}</p>
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
                      dot={{ fill: '#050a18', stroke: '#10b981', strokeWidth: 2, r: 5 }}
                      activeDot={{ fill: '#10b981', stroke: '#fff', strokeWidth: 2, r: 7 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Récords de Leyenda */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-yellow-400">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest">Récords de Leyenda del Cazador</h3>
            </div>

            <div className="bg-gradient-to-br from-[#120a00] to-[#0a0500] p-3 sm:p-4 rounded-2xl border border-yellow-900/50 shadow-[0_4px_20px_rgba(234,179,8,0.05)]">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-black/40 border border-yellow-900/40">
                  <div className="p-2 sm:p-2.5 bg-yellow-500/20 rounded-xl text-yellow-400 shrink-0"><Zap className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Máximo XP / Día</p>
                    <p className="text-base sm:text-xl font-black text-yellow-400 truncate">{maxDailyXp} <span className="text-[10px] text-yellow-600">XP</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-black/40 border border-purple-900/40">
                  <div className="p-2 sm:p-2.5 bg-purple-500/20 rounded-xl text-purple-400 shrink-0"><Clock className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Deep Work Máx.</p>
                    <p className="text-base sm:text-xl font-black text-purple-300 truncate">{maxPomodoro} <span className="text-[10px] text-purple-400 font-bold">MIN</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-black/40 border border-orange-900/40">
                  <div className="p-2 sm:p-2.5 bg-orange-500/20 rounded-xl text-orange-400 shrink-0"><Flame className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Racha Récord</p>
                    <p className="text-base sm:text-xl font-black text-orange-400 truncate">{maxHabitStreak} <span className="text-[10px] text-orange-400 font-bold">DÍAS</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-black/40 border border-cyan-900/40">
                  <div className="p-2 sm:p-2.5 bg-cyan-500/20 rounded-xl text-cyan-400 shrink-0"><Target className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Tareas Totales</p>
                    <p className="text-base sm:text-xl font-black text-cyan-400 truncate">{totalTasksDone} <span className="text-[10px] text-cyan-600">TAR.</span></p>
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
          <div className="p-3.5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#12081f] via-[#080d24] to-[#040817] border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-full bg-purple-600/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-6 h-6 text-purple-400" />
                <h2 className="text-base sm:text-lg font-anton uppercase tracking-wider text-white">
                  Arquitectura Biológica de la Neuroplasticidad (21 / 66 Días)
                </h2>
              </div>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed mb-5">
                La neuroplasticidad no es motivación abstracta: es remodelación anatómica de vías sinápticas.
                El sistema divide cada hábito en dos umbrales biológicos rigurosos para eliminar la resistencia de la corteza prefrontal.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-black/50 border border-purple-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-anton text-purple-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-purple-400" />
                      Fase 1: Barrera de Maltz (1 a 21 Días)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/40">
                      Rompimiento de Inercia
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    Desbloquea el <strong>Aura Elemental de KAI</strong>. Se supera la resistencia celular inicial y se consolidan las conexiones neuronales tempranas.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-anton text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      Fase 2: Maestría de Lally (22 a 66 Días)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-200 border border-amber-500/40">
                      Automatización Basal
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    Desbloquea la <strong>Forma Maestra de KAI</strong> y blindaje cuántico. La acción pasa de la corteza prefrontal a los ganglios basales: se ejecuta sin fatiga ni gasto de fuerza de voluntad.
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
          <div className="p-3.5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-purple-900/60 shadow-[0_10px_30px_rgba(168,85,247,0.1)] flex flex-col relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 relative z-10">
              <div>
                <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-amber-300 flex items-center gap-2 uppercase tracking-widest">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Curva Cuántica de Neuroplasticidad
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparativa de rachas activas frente a la Barrera de Maltz (21d) y la Automatización de Lally (66d).
                </p>
              </div>

              <div className="flex items-center gap-3 text-[10px] sm:text-[11px] font-mono">
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
            <div className="p-2 sm:p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[10px] sm:text-[11px] text-purple-200 font-mono mb-3 flex items-center gap-2 relative z-10">
              <Brain className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="leading-tight">
                <strong>Curva de hábito:</strong> 21 días supera la resistencia inicial; 66 días automatiza la conducta.
              </span>
            </div>

            {neuroChartData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-dashed border-purple-900/40 rounded-2xl bg-black/20">
                <Brain className="w-10 h-10 text-purple-400 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-bold text-purple-200">No hay hábitos en seguimiento activo</p>
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
                        <stop offset="0%" stopColor="#00f0ff" stopOpacity={1} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
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
                    <RechartsTooltip content={<CustomTooltipNeuro />} cursor={{ fill: 'rgba(168, 85, 247, 0.08)' }} />
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
              <div className="flex items-center gap-2 text-fuchsia-400">
                <Award className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest">Vitrina de Hábitos Activos</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
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
                    className={`p-4 rounded-2xl border relative overflow-hidden flex flex-col gap-3 transition-all hover:scale-[1.01] ${
                      isMastered
                        ? 'bg-gradient-to-r from-[#18150d] to-[#0a0805] border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]'
                        : isFormed
                        ? 'bg-gradient-to-r from-[#12081f] to-[#05020a] border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                        : 'bg-gradient-to-r from-[#001a33] to-[#000a14] border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between relative z-10 gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 text-xl relative ${
                          isMastered
                            ? 'bg-yellow-950/80 border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                            : isFormed
                            ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}>
                          {energyDetail.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white line-clamp-1">{title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isMastered ? 'text-yellow-400' : (isFormed ? 'text-purple-300' : 'text-cyan-400')}`}>
                              {isMastered ? '👑 66d Automatizado' : (isFormed ? '⚡ 21d Formado' : '🌱 En Construcción')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">• {energyDetail.label}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xl font-black text-white font-mono">{currentStreak} <span className="text-xs text-slate-400 font-sans font-bold">Días</span></p>
                      </div>
                    </div>

                    {/* Kai Rewards Status */}
                    <div className="relative z-10 p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-400" /> Aura 21d Kai:
                        </span>
                        <span className={`font-bold text-[11px] ${isFormed ? 'text-purple-300' : 'text-slate-500'}`}>
                          {isFormed ? `✅ ${energyDetail.auraName21}` : `🔒 ${energyDetail.auraName21} (${Math.max(0, 21 - currentStreak)}d restantes)`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-1">
                        <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-400" /> Maestría 66d Kai:
                        </span>
                        <span className={`font-bold text-[11px] ${isMastered ? 'text-amber-300' : 'text-slate-500'}`}>
                          {isMastered ? `✅ ${energyDetail.masterForm66}` : `🔒 ${energyDetail.masterForm66} (${Math.max(0, 66 - currentStreak)}d restantes)`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative z-10 mt-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>Progreso de Neuroplasticidad</span>
                        <span>{currentStreak} / {target} Días</span>
                      </div>
                      <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full relative transition-all duration-1000 ${isMastered ? 'bg-yellow-400' : (isFormed ? 'bg-purple-400' : 'bg-cyan-400')}`}
                          style={{ width: `${progress}%` }}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-[#0a0f25] to-[#050a18] p-3 rounded-2xl border border-cyan-900/50 shadow-[0_4px_20px_rgba(0,240,255,0.05)] gap-3">
            <h2 className="text-cyan-400 font-black text-sm px-2 flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp className="w-4 h-4" /> Periodo Operativo de Foco
            </h2>
            <div className="flex items-center bg-[#03060f]/80 p-1.5 rounded-xl border border-cyan-900/40 backdrop-blur-sm mx-auto sm:mx-0 w-full sm:w-auto">
              <button
                onClick={() => {
                  soundFX.playClick();
                  setTimeRange('semanal');
                }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  timeRange === 'semanal'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                    : 'text-white hover:text-cyan-400 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Semanal
              </button>
              <button
                onClick={() => {
                  soundFX.playClick();
                  setTimeRange('mensual');
                }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  timeRange === 'mensual'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                    : 'text-white hover:text-cyan-400 hover:bg-white/5 border border-transparent'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Mensual
              </button>
              <button
                onClick={() => {
                  soundFX.playClick();
                  setTimeRange('anual');
                }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  timeRange === 'anual'
                    ? 'bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 text-fuchsia-300 border border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.25)]'
                    : 'text-white hover:text-fuchsia-400 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Anual
              </button>
            </div>
          </div>

          {/* Quick Metrics in Current Period */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c072b] to-[#050a18] border border-cyan-800/50 shadow-[0_8px_20px_rgba(0,240,255,0.1)] text-white relative overflow-hidden">
              <div className="flex items-center gap-2 text-white text-[11px] uppercase tracking-wider font-black mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tareas</span>
              </div>
              <span className="text-3xl font-black text-cyan-300 font-mono">
                <AnimatedCounter value={completedTasksCount} />
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block font-semibold">EN ESTE PERIODO</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c072b] to-[#050a18] border border-orange-800/50 shadow-[0_8px_20px_rgba(249,115,22,0.1)] text-white relative overflow-hidden">
              <div className="flex items-center gap-2 text-orange-300 text-[11px] uppercase tracking-wider font-black mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Racha</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-orange-400 font-mono">
                  <AnimatedCounter value={stats.streakDays} />
                </span>
                <span className="text-xs text-orange-400 font-bold uppercase">días</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block font-semibold">ACTIVIDAD CONTINUA</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c072b] to-[#050a18] border border-purple-800/50 shadow-[0_8px_20px_rgba(168,85,247,0.1)] text-white relative overflow-hidden">
              <div className="flex items-center gap-2 text-purple-300 text-[11px] uppercase tracking-wider font-black mb-1">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Nivel</span>
              </div>
              <span className="text-3xl font-black text-purple-400 font-mono">
                Nv. <AnimatedCounter value={stats.level} />
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block font-semibold truncate">{displayRankTitle}</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c072b] to-[#050a18] border border-blue-800/50 shadow-[0_8px_20px_rgba(59,130,246,0.1)] text-white relative overflow-hidden">
              <div className="flex items-center gap-2 text-white text-[11px] uppercase tracking-wider font-black mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Minutos Foco</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-blue-400 font-mono">
                  <AnimatedCounter value={totalFocusMinutes} />
                </span>
                <span className="text-xs text-blue-400 font-bold uppercase">min</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block font-semibold">TOTAL EN PERIODO</span>
            </div>
          </div>

          {/* Focus Flow BarChart */}
          <div className="p-3.5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-cyan-900/50 shadow-[0_10px_30px_rgba(0,240,255,0.08)] flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 flex items-center gap-2 uppercase tracking-widest">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Flujo de Foco ({timeRange === 'semanal' ? '7 Días' : timeRange === 'mensual' ? '30 Días' : '12 Meses'})
              </h3>
            </div>

            {/* Guide box */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[10px] sm:text-[11px] text-cyan-200 font-mono mb-3 flex items-center gap-2 relative z-10">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="leading-tight">
                <strong>¿Cómo interpretarlo?</strong> Muestra tus minutos de concentración profunda acumulados por día. La línea discontinua naranja marca tu objetivo de 60 min.
              </span>
            </div>

            <div className="w-full h-[220px] sm:h-[240px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradientFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f0ff" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="barGradientFlowToday" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#39ff14" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
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
                  <RechartsTooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                  <ReferenceLine
                    y={60}
                    stroke="#f97316"
                    strokeDasharray="3 3"
                    strokeOpacity={0.6}
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
            <div className="p-3.5 sm:p-5 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-pink-900/40 shadow-[0_10px_30px_rgba(236,72,153,0.08)] flex flex-col items-center">
              <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500 uppercase tracking-widest mb-1 self-start flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-pink-400" />
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
                            fill={PIE_GRADIENTS[index % PIE_GRADIENTS.length].start}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltipPie />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Filtered Deep Work Time Audit */}
            <div className="p-3.5 sm:p-5 rounded-3xl bg-[#001830] border border-cyan-900/40 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Auditoría Deep Work ({timeRange})
                </h3>
                <p className="text-[10px] text-slate-400 mb-2 font-mono">
                  Minutos totales de concentración por proyecto o categoría.
                </p>
                <p className="text-xl sm:text-2xl font-black text-white font-mono mb-3">
                  {Math.floor(filteredTimeAudit.totalMinutes / 60)}h {filteredTimeAudit.totalMinutes % 60}m
                </p>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto">
                {Object.entries(filteredTimeAudit.audit).length === 0 ? (
                  <p className="text-xs text-slate-400">Sin sesiones de foco en este periodo.</p>
                ) : (
                  Object.entries(filteredTimeAudit.audit).map(([cat, mins]) => {
                    const pct = filteredTimeAudit.totalMinutes > 0 ? Math.round((mins / filteredTimeAudit.totalMinutes) * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300 uppercase truncate">{cat}</span>
                        <span className="text-cyan-300 font-bold">{mins}m ({pct}%)</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* COLLAPSIBLE 365-DAY ANNUAL HEATMAP ACCORDION */}
          <div className="p-4 rounded-3xl bg-[#030712] border border-cyan-500/30">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setIsAnnualHeatmapOpen(!isAnnualHeatmapOpen);
              }}
              className="w-full flex items-center justify-between text-xs font-anton uppercase tracking-wider text-cyan-300 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Radiografía Anual de Consistencia Cuántica (Heatmap 365 Días)
              </span>
              {isAnnualHeatmapOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isAnnualHeatmapOpen && (
              <div className="mt-4 pt-4 border-t border-cyan-500/20 animate-fadeIn">
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
      )}

      {/* ================================================================= */}
      {/* PESTAÑA 4: [💰 FINANZAS]                                          */}
      {/* ================================================================= */}
      {activeSubTab === 'finance' && (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-cyan-400">Cargando panel financiero...</div>}>
            <FinanceDashboard expenses={expenses} setExpenses={setExpenses} tasksByDate={tasksByDate} />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default WeeklyStats;