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
import { getTodayDateString, addDaysToDateString } from '../utils/date';
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
  Dumbbell,
  Brain,
  BatteryCharging,
  ShieldAlert,
  Shield,
  Coins,
  Sparkles,
  BookOpen,
  Crown,
  Trophy,
  Target,
  Edit2,
  ArrowRight,
  Activity,
  Layers
} from 'lucide-react';
import { getHabitBaseId } from '../intelligence/masteryEngine';
import { CHARACTER_CLASSES, CharacterClassOption, getRankForLevel } from '../data/defaults';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip as RechartsTooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
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
}

type TimeRange = 'semanal' | 'mensual' | 'anual';
type StatsSubTab = 'hero' | 'neuro' | 'time' | 'finance';

// Colores RPG con Gradientes
const ATTRIBUTE_COLORS = {
  Fuerza: {
    start: '#ef4444', // red-500
    end: '#f97316', // orange-500
    glow: 'rgba(239, 68, 68, 0.4)',
    icon: <Dumbbell className="w-4 h-4 text-red-400" />,
    bg: 'bg-red-500/10'
  },
  Mente: {
    start: '#a855f7', // purple-500
    end: '#d946ef', // fuchsia-500
    glow: 'rgba(168, 85, 247, 0.4)',
    icon: <Brain className="w-4 h-4 text-white" />,
    bg: 'bg-purple-500/10'
  },
  Energía: {
    start: '#eab308', // yellow-500
    end: '#f59e0b', // amber-500
    glow: 'rgba(234, 179, 8, 0.4)',
    icon: <BatteryCharging className="w-4 h-4 text-yellow-400" />,
    bg: 'bg-yellow-500/10'
  },
  Disciplina: {
    start: '#3b82f6', // blue-500
    end: '#06b6d4', // cyan-500
    glow: 'rgba(59, 130, 246, 0.4)',
    icon: <ShieldAlert className="w-4 h-4 text-blue-400" />,
    bg: 'bg-blue-500/10'
  },
  Estudio: {
    start: '#10b981', // emerald-500
    end: '#14b8a6', // teal-500
    glow: 'rgba(16, 185, 129, 0.4)',
    icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
    bg: 'bg-emerald-500/10'
  }
};

const PIE_GRADIENTS = [
  { start: '#00f0ff', end: '#3b82f6' },
  { start: '#39ff14', end: '#10b981' },
  { start: '#d946ef', end: '#8b5cf6' },
  { start: '#f59e0b', end: '#ef4444' },
  { start: '#6366f1', end: '#a855f7' },
  { start: '#f43f5e', end: '#fb923c' },
  { start: '#14b8a6', end: '#0ea5e9' }
];

const AnimatedCounter = ({ value, duration = 1500, prefix = "", suffix = "" }: { value: number, duration?: number, prefix?: string, suffix?: string }) => {
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
  onOpenKaiWorkshop
}) => {
  const [activeSubTab, setActiveSubTab] = useState<StatsSubTab>('hero');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRanksModalOpen, setIsRanksModalOpen] = useState(false);
  const [isArchetypesModalOpen, setIsArchetypesModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('semanal');

  // --- CALCULATE RECORDS ---
  const xpPercent = Math.min(100, Math.max(0, Math.floor((stats.currentXp / Math.max(1, stats.requiredXp)) * 100)));
  const selectedClassOption = CHARACTER_CLASSES.find(c => c.name === stats.characterClass) || CHARACTER_CLASSES[0];
  const activeRank = getRankForLevel(stats.level);
  const displayRankTitle = activeRank.title;

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

  // --- TIME AUDIT ---
  const timeAudit = useMemo(() => {
    const audit: Record<string, number> = {};
    let totalMinutes = 0;
    pomodoroSessions.forEach(p => {
      const cat = p.category || 'otros';
      if (audit[cat] === undefined) {
        audit[cat] = 0;
      }
      audit[cat] += p.durationMinutes;
      totalMinutes += p.durationMinutes;
    });
    return { audit, totalMinutes };
  }, [pomodoroSessions]);

  // --- MASTERED HABITS (Strictly 21/66 Days System) ---
  const trackedHabits = useMemo(() => {
    const map = new Map<string, any>();
    
    // 1. Gather all habits from habitMastery
    Object.entries(habitMastery || {}).forEach(([baseId, record]) => {
      map.set(baseId, { ...(record as any), baseId });
    });

    // 2. Also check tasksByDate for any tracked 21/66 habit that might not be in habitMastery yet
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

  const getAttribute = (cat: string) => {
    switch (cat) {
      case 'entrenamiento': return 'Fuerza';
      case 'creativo': 
      case 'pomodoro': return 'Mente';
      case 'comida':
      case 'limpieza': return 'Energía';
      case 'habito':
      case 'clientes': return 'Disciplina';
      case 'estudio': return 'Estudio';
      default: return 'Disciplina';
    }
  };

  const chartData = useMemo(() => {
    const today = new Date();
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    if (timeRange === 'anual') {
      return Array.from({ length: 12 }).map((_, idx) => {
        const d = new Date(today);
        d.setMonth(d.getMonth() - (11 - idx));
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const dayLabel = `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
        
        const monthSessions = pomodoroSessions.filter(s => s.date.startsWith(yearMonth));
        const focusMinutes = monthSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

        let Fuerza = 0, Mente = 0, Energía = 0, Disciplina = 0, Estudio = 0;
        Object.keys(tasksByDate).forEach(date => {
          if (date.startsWith(yearMonth)) {
            tasksByDate[date].forEach(t => {
              if (t.completed) {
                const attr = getAttribute(t.category);
                if (attr === 'Fuerza') Fuerza++;
                if (attr === 'Mente') Mente++;
                if (attr === 'Energía') Energía++;
                if (attr === 'Disciplina') Disciplina++;
                if (attr === 'Estudio') Estudio++;
              }
            });
          }
        });

        return {
          dateStr: yearMonth,
          dayLabel,
          focusMinutes,
          isToday: idx === 11,
          Fuerza, Mente, Energía, Disciplina, Estudio
        };
      });
    }

    const daysCount = timeRange === 'semanal' ? 7 : 30;
    const todayStr = getTodayDateString();
    return Array.from({ length: daysCount }).map((_, idx) => {
      const offset = -(daysCount - 1 - idx);
      const dateStr = addDaysToDateString(todayStr, offset);
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      
      let dayLabel = '';
      if (timeRange === 'semanal') {
        dayLabel = dayNames[d.getDay()];
      } else {
        dayLabel = `${d.getDate()} ${months[d.getMonth()]}`;
      }

      const daySessions = pomodoroSessions.filter((s) => s.date === dateStr);
      const focusMinutes = daySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

      let Fuerza = 0, Mente = 0, Energía = 0, Disciplina = 0, Estudio = 0;
      const dayTasks = tasksByDate[dateStr] || [];
      dayTasks.forEach(t => {
        if (t.completed) {
          const attr = getAttribute(t.category);
          if (attr === 'Fuerza') Fuerza++;
          if (attr === 'Mente') Mente++;
          if (attr === 'Energía') Energía++;
          if (attr === 'Disciplina') Disciplina++;
          if (attr === 'Estudio') Estudio++;
        }
      });

      return {
        dateStr,
        dayLabel,
        focusMinutes,
        isToday: idx === daysCount - 1,
        Fuerza, Mente, Energía, Disciplina, Estudio
      };
    });
  }, [pomodoroSessions, tasksByDate, timeRange]);

  const totalFocusMinutes = chartData.reduce((acc, d) => acc + d.focusMinutes, 0);

  const completedTasksInPeriod = useMemo(() => {
    let completed: TaskItem[] = [];
    if (timeRange === 'anual') {
      chartData.forEach(month => {
        Object.keys(tasksByDate).forEach(date => {
          if (date.startsWith(month.dateStr)) {
            completed = [...completed, ...tasksByDate[date].filter(t => t.completed)];
          }
        });
      });
    } else {
      chartData.forEach(day => {
        const dayTasks = tasksByDate[day.dateStr] || [];
        completed = [...completed, ...dayTasks.filter(t => t.completed)];
      });
    }
    return completed;
  }, [chartData, tasksByDate, timeRange]);

  const completedTasksCount = completedTasksInPeriod.length;

  // Radar Chart Data
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
      const dateStr = stats.phaseHistory[phaseNum];
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

  const attributesData = useMemo(() => {
    let f = stats.attributes.fuerza;
    let m = stats.attributes.mente;
    let e = stats.attributes.energia;
    let d = stats.attributes.disciplina;
    let s = stats.attributes.estudio ?? 0;
    
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
       })
    });
    
    return [
      { subject: 'Disciplina', level: Math.floor(d), fullMark: 100 },
      { subject: 'Fuerza', level: Math.floor(f), fullMark: 100 },
      { subject: 'Mente', level: Math.floor(m), fullMark: 100 },
      { subject: 'Energía', level: Math.floor(e), fullMark: 100 },
      { subject: 'Estudio', level: Math.floor(s), fullMark: 100 },
    ];
  }, [stats.attributes, tasksByDate]);

  // Pie Chart Data
  const categoryCounts = completedTasksInPeriod.reduce((acc, t) => {
    const cat = t.category.charAt(0).toUpperCase() + t.category.slice(1);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const pieData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);

  // Neuroplasticity Chart Data (21/66 Days System)
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

  // Custom Tooltips
  const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#001830]/90 backdrop-blur-sm border border-cyan-500/50 p-2.5 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.25)]">
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
        <div className="bg-[#001830]/95 backdrop-blur-sm border border-fuchsia-500/50 p-2.5 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.25)] z-30">
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

  const CustomTooltipRadar = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const subject = payload[0].payload.subject;
      const colorConf = ATTRIBUTE_COLORS[subject as keyof typeof ATTRIBUTE_COLORS] || ATTRIBUTE_COLORS.Fuerza;
      
      return (
        <div className="bg-[#001830]/90 backdrop-blur-sm border p-2.5 rounded-xl flex items-center gap-2" style={{ borderColor: colorConf.end, boxShadow: `0 0 15px ${colorConf.glow}` }}>
          <div className="bg-black/40 p-1.5 rounded-lg">
            {colorConf.icon}
          </div>
          <div>
            <p className="text-white text-[10px] uppercase tracking-wider font-bold">{subject}</p>
            <p className="text-white text-sm font-mono font-black">Nivel {payload[0].value}</p>
          </div>
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
    <div className="space-y-5 pb-6">

      <Suspense fallback={null}>
        <HeroProfileModal 
          isOpen={isEditingProfile} 
          onClose={() => setIsEditingProfile(false)} 
          stats={stats} 
          onUpdateStats={onUpdateStats} 
          cloudSync={cloudSync}
          onOpenAwakening={onOpenAwakening}
          onOpenArchetypes={() => setIsArchetypesModalOpen(true)}
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

      {/* ---------------- SUB-TABS SELECTOR (TACTICAL SCI-FI SWITCHER) ---------------- */}
      <div className="sticky top-0 z-30 mb-5 p-1.5 rounded-2xl bg-[#030612]/95 backdrop-blur-md border border-cyan-500/40 shadow-[0_4px_25px_rgba(0,240,255,0.15)] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveSubTab('hero');
          }}
          className={`flex-1 min-w-[110px] py-2 px-2.5 rounded-xl font-anton text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'hero'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-black shadow-[0_0_15px_rgba(0,240,255,0.5)] font-black'
              : 'text-slate-300 hover:text-cyan-300 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Héroe</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveSubTab('neuro');
          }}
          className={`flex-1 min-w-[145px] py-2 px-2.5 rounded-xl font-anton text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'neuro'
              ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] font-black'
              : 'text-slate-300 hover:text-purple-300 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Hábitos 21/66</span>
          {trackedHabits.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
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
            setActiveSubTab('time');
          }}
          className={`flex-1 min-w-[130px] py-2 px-2.5 rounded-xl font-anton text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'time'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.5)] font-black'
              : 'text-slate-300 hover:text-cyan-300 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Tiempo & Foco</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveSubTab('finance');
          }}
          className={`flex-1 min-w-[110px] py-2 px-2.5 rounded-xl font-anton text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'finance'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] font-black'
              : 'text-slate-300 hover:text-amber-300 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Finanzas</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: [🛡️ HÉROE & AURAS] */}
      {/* ========================================================================= */}
      {activeSubTab === 'hero' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Full Width Hero RPG Character Card */}
          <div className="rounded-[24px] scifi-glass-panel border-2 border-cyan-400 p-4 sm:p-6 shadow-[0_0_25px_rgba(0,240,255,0.25)] flex flex-col justify-between relative overflow-hidden text-white">
            
            {onUpdateStats && (
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="absolute top-4 right-4 z-20 p-2 bg-[#04020e] rounded-xl border border-cyan-500/60 text-cyan-300 hover:bg-cyan-950/60 hover:text-white transition-colors cursor-pointer"
                title="Editar Perfil"
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
              
              {/* Avatar Big Showcase & Holo Companion */}
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
                      <p className="text-cyan-300 font-mono text-[10px] mb-0.5 tracking-wider truncate">@{stats.username} {stats.fullName && <span className="text-slate-400 ml-1">| {stats.fullName}</span>}</p>
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
                        title="Explorar los 100 Rangos y 10 Fases del Sistema"
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
                        title="Explorar las explicaciones y bonos de los 12 Arquetipos"
                      >
                        Ver 12 Arquetipos
                      </button>
                    </div>
                    
                    {/* Quick Currency Stats */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-[11px] font-anton text-amber-300 bg-[#04020e] px-2.5 py-0.5 rounded-lg border border-amber-500/50 shadow-xs">
                        <Coins className="w-3 h-3 text-amber-400" />
                        {stats.coins}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-anton text-amber-400 bg-[#04020e] px-2.5 py-0.5 rounded-lg border border-amber-500/50 shadow-xs">
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
                  title="Haz clic para abrir el Taller de KAI (Formas, Auras, Forja IA)"
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
                      <span className="text-cyan-400 font-bold underline">Taller & Forja 🎨</span>
                      <Sparkles className="w-3 h-3 text-amber-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Character & Companion Achievement Badges (21d / 66d Habits) */}
              <div className="mb-4 p-3 rounded-2xl bg-[#04020e] border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-anton text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" /> Insignias de Maestría y Auras (21d / 66d)
                  </span>
                  <div className="flex items-center gap-2">
                    {onOpenKaiWorkshop && (
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          onOpenKaiWorkshop();
                        }}
                        className="px-2 py-0.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-[10px] font-anton uppercase text-cyan-300 hover:text-white transition-all cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.2)] active:scale-95"
                      >
                        🎨 Taller KAI
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setActiveSubTab('neuro');
                      }}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Hábitos</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {trackedHabits.filter(h => h.currentStreak >= 21).length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    Completa tus hábitos durante 21 días (Hábito Formado) o 66 días (Maestría) para exhibir sus insignias épicas bajo tu personaje.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {trackedHabits.filter(h => h.currentStreak >= 21).map(h => {
                      const title = getHabitRealTitle(h.baseId);
                      const isMastered = h.currentStreak >= 66;
                      return (
                        <div 
                          key={h.baseId} 
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${
                            isMastered 
                              ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                              : 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          }`}
                          title={`${title}: ${h.currentStreak} días de racha`}
                        >
                          <span className="text-sm">{isMastered ? '👑' : '🛡️'}</span>
                          <span className="truncate max-w-[120px]">{title}</span>
                          <span className="text-[10px] font-mono opacity-80">({h.currentStreak}d)</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {(stats.age || stats.mainGoal) && (
                <div className="flex flex-wrap items-center gap-3 mb-3">
                   {stats.age && <span className="text-[10px] bg-[#04020e] text-slate-300 px-2 py-0.5 rounded border border-cyan-500/30">Edad: {stats.age}</span>}
                   {stats.mainGoal && <span className="text-[10px] bg-[#04020e] text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 font-mono">Meta: {stats.mainGoal}</span>}
                </div>
              )}
              {stats.bio && (
                <p className="text-cyan-300/80 text-xs italic border-l-2 border-cyan-400 pl-2 mb-4 leading-tight">"{stats.bio}"</p>
              )}

              {/* XP Gauge */}
              <div className="space-y-1 mb-4 p-2.5 rounded-xl bg-[#04020e] border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center gap-1 text-cyan-300 font-anton tracking-wide">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" /> EXP DEL SISTEMA
                  </span>
                  <span className="text-cyan-300 font-mono">{stats.currentXp} / {stats.requiredXp} ({xpPercent}%)</span>
                </div>
                <div className="w-full h-2.5 bg-black rounded-full border border-cyan-500/50 p-0.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,240,255,0.8)]" 
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
              
              {/* Attribute Progress Bars */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-white">
                <div className="flex items-center justify-between bg-[#04020e] px-2.5 py-1.5 rounded-lg border border-cyan-500/30">
                  <span className="text-slate-400">Disciplina</span>
                  <strong className="text-white font-mono font-anton">{stats.attributes.disciplina}</strong>
                </div>
                <div className="flex items-center justify-between bg-[#04020e] px-2.5 py-1.5 rounded-lg border border-cyan-500/30">
                  <span className="text-slate-400">Fuerza</span>
                  <strong className="text-white font-mono font-anton">{stats.attributes.fuerza}</strong>
                </div>
                <div className="flex items-center justify-between bg-[#04020e] px-2.5 py-1.5 rounded-lg border border-cyan-500/30">
                  <span className="text-slate-400">Foco</span>
                  <strong className="text-white font-mono font-anton">{stats.attributes.mente}</strong>
                </div>
                <div className="flex items-center justify-between bg-[#04020e] px-2.5 py-1.5 rounded-lg border border-cyan-500/30">
                  <span className="text-cyan-300">Hábitos</span>
                  <strong className="text-white font-mono font-anton">{stats.attributes.energia}</strong>
                </div>
                <div className="flex items-center justify-between bg-[#04020e] px-2.5 py-1.5 rounded-lg border border-cyan-500/30 col-span-2">
                  <span className="text-slate-400">Estudio</span>
                  <strong className="text-white font-mono font-anton">{stats.attributes.estudio ?? 0}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Biometrics & Attributes Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* RPG Character Attributes Matrix (Radar) */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-purple-900/50 shadow-[0_10px_30px_rgba(168,85,247,0.08)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-400 flex items-center gap-2 uppercase tracking-widest">
                  <Award className="w-4 h-4 text-white" />
                  Matriz de Poder
                </h3>
                <span className="text-[10px] font-bold text-purple-500/70 uppercase tracking-widest bg-purple-500/10 px-2 py-1 rounded-md">
                  Todos los niveles
                </span>
              </div>
              
              <div className="w-full h-[260px] relative z-10">
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={attributesData}>
                    <defs>
                      <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#d946ef" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="#ffffff" strokeDasharray="3 3" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#ffffff', fontSize: 11, fontWeight: '900', letterSpacing: '1px' }} 
                    />
                    <RechartsTooltip content={<CustomTooltipRadar />} />
                    <Radar
                      name="Nivel"
                      dataKey="level"
                      stroke="#d946ef"
                      strokeWidth={3}
                      fill="url(#radarGradient)"
                      animationDuration={2000}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RPG Attribute Breakdown Bars */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest mb-6">
                <Zap className="w-4 h-4 text-yellow-400" />
                Desglose de Atributos RPG
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {attributesData.map((attr, idx) => {
                  const config = ATTRIBUTE_COLORS[attr.subject as keyof typeof ATTRIBUTE_COLORS];
                  const maxLevel = Math.max(100, ...attributesData.map(a => a.level));
                  const percentage = Math.min((attr.level / maxLevel) * 100, 100);
                  return (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${config.bg} border`} style={{ borderColor: config.end }}>
                            {config.icon}
                          </div>
                          <span className="font-bold text-white text-sm tracking-wide">{attr.subject}</span>
                        </div>
                        <span className="font-mono font-black text-lg" style={{ color: config.start }}>
                          Nv. {attr.level}
                        </span>
                      </div>
                      {/* Progress Bar Track */}
                      <div className="h-3 w-full bg-[#001830] rounded-full overflow-hidden border border-slate-800 relative">
                        {/* Progress Bar Fill with Gradient */}
                        <div 
                          className="h-full rounded-full relative transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${config.start}, ${config.end})`,
                            boxShadow: `0 0 10px ${config.glow}`
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 w-full h-1/2 rounded-t-full"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Récords de Leyenda */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Trophy className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-widest">Récords de Leyenda</h3>
            </div>
            
            <div className="bg-gradient-to-br from-[#120a00] to-[#0a0500] p-4 rounded-2xl border border-yellow-900/50 shadow-[0_4px_20px_rgba(234,179,8,0.05)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Record: XP */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-yellow-900/40">
                  <div className="p-2.5 bg-yellow-500/20 rounded-xl text-yellow-400"><Zap className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Máximo XP en 1 Día</p>
                    <p className="text-xl font-black text-yellow-400">{maxDailyXp} <span className="text-xs text-yellow-600">XP</span></p>
                  </div>
                </div>
                {/* Record: Pomodoro */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-purple-900/40">
                  <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-400"><Clock className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sesión Deep Work Máxima</p>
                    <p className="text-xl font-black text-purple-300">{maxPomodoro} <span className="text-xs text-purple-400 font-bold">MIN</span></p>
                  </div>
                </div>
                {/* Record: Racha */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-orange-900/40">
                  <div className="p-2.5 bg-orange-500/20 rounded-xl text-orange-400"><Flame className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mejor Racha Histórica</p>
                    <p className="text-xl font-black text-orange-400">{maxHabitStreak} <span className="text-xs text-orange-400 font-bold">DÍAS</span></p>
                  </div>
                </div>
                {/* Record: Total Tareas */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-cyan-900/40">
                  <div className="p-2.5 bg-cyan-500/20 rounded-xl text-cyan-400"><Target className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Misiones Completadas</p>
                    <p className="text-xl font-black text-cyan-400">{totalTasksDone} <span className="text-xs text-cyan-600">MISIONES</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: [🧠 NEUROPLASTICIDAD 21/66] */}
      {/* ========================================================================= */}
      {activeSubTab === 'neuro' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Neuroplasticity Scientific Overview Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#12081f] via-[#080d24] to-[#040817] border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative overflow-hidden">
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
                {/* Phase 1: 21 Days */}
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

                {/* Phase 2: 66 Days */}
                <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-anton text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
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

          {/* Dedicated 21/66 Neuroplasticity Recharts Progression Curve */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-purple-900/60 shadow-[0_10px_30px_rgba(168,85,247,0.1)] flex flex-col relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10">
              <div>
                <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-amber-300 flex items-center gap-2 uppercase tracking-widest">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Curva Cuántica de Neuroplasticidad
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparativa de rachas activas frente a la Barrera de Maltz (21d) y la Automatización de Lally (66d).
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono">
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

            {neuroChartData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-dashed border-purple-900/40 rounded-2xl bg-black/20">
                <Brain className="w-10 h-10 text-purple-400 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-bold text-purple-200">No hay hábitos en seguimiento activo</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Crea tu primer hábito desde la pestaña de Misiones Diarias o el Oráculo Cuántico para ver tu curva de neuroplasticidad.
                </p>
              </div>
            ) : (
              <div className="w-full h-[320px] relative z-10">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={neuroChartData} margin={{ top: 25, right: 30, left: 0, bottom: 25 }}>
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
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
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
                      barSize={36}
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

            {trackedHabits.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-fuchsia-900/30 rounded-2xl bg-[#00152b]">
                <div className="w-12 h-12 bg-fuchsia-900/20 rounded-full flex items-center justify-center mb-3">
                  <Award className="w-6 h-6 text-fuchsia-400/60" />
                </div>
                <p className="text-sm font-black text-fuchsia-300 uppercase tracking-widest">Sin Hábitos Registrados</p>
                <p className="text-xs text-slate-300 mt-2 max-w-sm">
                  Registra hábitos diarios en el calendario o lista de misiones para activar tu matriz de neuroplasticidad.
                </p>
              </div>
            ) : (
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
                      {(isMastered || isFormed) && (
                        <div className={`absolute top-0 right-0 w-36 h-full opacity-15 pointer-events-none ${isMastered ? 'bg-yellow-500 blur-2xl' : 'bg-purple-500 blur-2xl'}`} />
                      )}
                      
                      <div className="flex items-start justify-between relative z-10 gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 text-xl relative ${
                            isMastered 
                              ? 'bg-yellow-950/80 border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                              : isFormed
                              ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}>
                            {isMastered && (
                              <>
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
                                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse delay-150" />
                              </>
                            )}
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
                            <Crown className="w-3 h-3 text-amber-400" /> Maestría 66d Kai:
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
                        <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className={`h-full relative transition-all duration-1000 ${isMastered ? 'bg-yellow-400' : (isFormed ? 'bg-purple-400' : 'bg-cyan-400')}`}
                            style={{ width: `${progress}%` }}
                          >
                            <div className="absolute top-0 left-0 w-full h-full bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '0.5rem 0.5rem' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: [⏱️ TIEMPO & FOCO] */}
      {/* ========================================================================= */}
      {activeSubTab === 'time' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Time Toggle Control */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-[#0a0f25] to-[#050a18] p-3 rounded-2xl border border-cyan-900/50 shadow-[0_4px_20px_rgba(0,240,255,0.05)] gap-3">
            <h2 className="text-cyan-400 font-black text-sm px-2 flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp className="w-4 h-4" /> Periodo Operativo
            </h2>
            <div className="flex items-center bg-[#03060f]/80 p-1.5 rounded-xl border border-cyan-900/40 backdrop-blur-sm mx-auto sm:mx-0 w-full sm:w-auto">
              <button
                onClick={() => setTimeRange('semanal')}
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
                onClick={() => setTimeRange('mensual')}
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
                onClick={() => setTimeRange('anual')}
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

          {/* Top Metrics Cards */}
          <ScrollReveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c072b] to-[#050a18] border border-cyan-800/50 shadow-[0_8px_20px_rgba(0,240,255,0.1)] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all"></div>
                <div className="flex items-center gap-2 text-white text-[11px] uppercase tracking-wider font-black mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tareas</span>
                </div>
                <div className="flex items-baseline gap-1.5 relative z-10">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 font-mono">
                    <AnimatedCounter value={completedTasksCount} />
                  </span>
                </div>
                <span className="text-[10px] text-white mt-1 block font-semibold">COMPLETADAS EN PERIODO</span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c072b] to-[#050a18] border border-orange-800/50 shadow-[0_8px_20px_rgba(249,115,22,0.1)] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition-all"></div>
                <div className="flex items-center gap-2 text-orange-300 text-[11px] uppercase tracking-wider font-black mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>Racha Actual</span>
                </div>
                <div className="flex items-baseline gap-1.5 relative z-10">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 font-mono">
                    <AnimatedCounter value={stats.streakDays} />
                  </span>
                  <span className="text-xs text-orange-400 font-bold uppercase">días</span>
                </div>
                <span className="text-[10px] text-white mt-1 block font-semibold">CONSECUTIVOS</span>
              </div>

              <div 
                onClick={() => {
                  soundFX.playClick();
                  setIsRanksModalOpen(true);
                }}
                className="p-4 rounded-2xl bg-gradient-to-br from-[#0c072b] to-[#050a18] border border-purple-800/50 shadow-[0_8px_20px_rgba(168,85,247,0.1)] text-white relative overflow-hidden group cursor-pointer hover:border-purple-400/70 transition-all"
                title="Haz clic para ver los 100 Niveles y Rangos"
              >
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
                <div className="flex items-center gap-2 text-purple-300 text-[11px] uppercase tracking-wider font-black mb-1">
                  <Zap className="w-3.5 h-3.5 text-white" />
                  <span>Nivel General</span>
                </div>
                <div className="flex items-baseline gap-1.5 relative z-10">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 font-mono">
                    Nv. <AnimatedCounter value={stats.level} />
                  </span>
                </div>
                <span className="text-[10px] text-white mt-1 block font-semibold tracking-wider">{displayRankTitle} • XP: {stats.totalXpEarned}</span>
              </div>
              
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c072b] to-[#050a18] border border-blue-800/50 shadow-[0_8px_20px_rgba(59,130,246,0.1)] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                <div className="flex items-center gap-2 text-white text-[11px] uppercase tracking-wider font-black mb-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Minutos Foco</span>
                </div>
                <div className="flex items-baseline gap-1.5 relative z-10">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 font-mono">
                    <AnimatedCounter value={totalFocusMinutes} />
                  </span>
                  <span className="text-xs text-blue-400 font-bold uppercase">min</span>
                </div>
                <span className="text-[10px] text-white mt-1 block font-semibold">TOTAL EN PERIODO</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Main Focus Charts */}
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Focus Bar Chart */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-cyan-900/50 shadow-[0_10px_30px_rgba(0,240,255,0.08)] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 flex items-center gap-2 uppercase tracking-widest">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Flujo de Foco
                  </h3>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-cyan-500/10 px-2 py-1 rounded-md">
                    {timeRange === 'semanal' ? '7 Días' : timeRange === 'mensual' ? '30 Días' : '12 Meses'}
                  </span>
                </div>

                {totalFocusMinutes === 0 && (
                  <div className="mb-3 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-center gap-2 relative z-10">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Sin sesiones de Pomodoro registradas aún. ¡Inicia un bloque de foco para iluminar tus barras!</span>
                  </div>
                )}

                <div className="w-full h-[260px] relative z-10">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00f0ff" stopOpacity={1} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="barGradientToday" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#39ff14" stopOpacity={1} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="dayLabel" 
                        stroke="#ffffff" tick={{ fill: '#ffffff', fontSize: timeRange === 'semanal' ? 11 : 9, fontWeight: 'bold' }} 
                        axisLine={false}
                        tickLine={false}
                        minTickGap={timeRange === 'semanal' ? 0 : 15}
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
                        barSize={timeRange === 'semanal' ? 32 : (timeRange === 'mensual' ? 12 : 24)}
                        minPointSize={2}
                        animationDuration={1500}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isToday ? "url(#barGradientToday)" : "url(#barGradient)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Phase Progression Tracking */}
              {phaseProgressionData.length > 0 && (
                <div className="col-span-1 p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-emerald-900/40 shadow-[0_10px_30px_rgba(16,185,129,0.08)] flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center gap-2 uppercase tracking-widest">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Diario de Fases
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      Fase Actual: {activeRank.phase || 1}
                    </span>
                  </div>
                  
                  <div className="w-full h-[260px] relative z-10">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={phaseProgressionData} margin={{ top: 15, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#0ea5e9" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis 
                          dataKey="phase" 
                          stroke="#ffffff" tick={{ fill: '#ffffff', fontSize: 10, fontWeight: 700 }}
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
                          stroke="url(#lineGrad)" 
                          strokeWidth={4} 
                          dot={{ fill: '#050a18', stroke: '#10b981', strokeWidth: 3, r: 6 }}
                          activeDot={{ fill: '#10b981', stroke: '#fff', strokeWidth: 2, r: 8 }}
                          animationDuration={2000}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Task Distribution Pie Chart (Fixed Mobile Responsive Container) */}
          {pieData.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-pink-900/40 shadow-[0_10px_30px_rgba(236,72,153,0.08)] flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-500/10 blur-3xl rounded-full pointer-events-none"></div>
              
              <div className="w-full md:w-1/2 text-left">
                <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500 flex items-center gap-2 uppercase tracking-widest mb-2">
                  <PieChartIcon className="w-4 h-4 text-pink-400" />
                  Distribución de Productividad
                </h3>
                <p className="text-xs font-semibold text-slate-300 mb-4">
                  Categorías de misiones completadas durante el periodo {timeRange}.
                </p>
                
                {/* Custom Legend */}
                <div className="flex flex-col gap-2 relative z-10 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {pieData.map((entry, index) => {
                    const grad = PIE_GRADIENTS[index % PIE_GRADIENTS.length];
                    return (
                      <div key={entry.name} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-3 h-3 rounded-full shadow-lg shrink-0" 
                            style={{ background: `linear-gradient(135deg, ${grad.start}, ${grad.end})`, boxShadow: `0 0 8px ${grad.start}80` }} 
                          />
                          <span className="text-xs font-bold text-white">{entry.name}</span>
                        </div>
                        <span className="font-mono font-black text-white text-xs px-2 py-0.5 rounded-md bg-black/40 border border-white/5">{entry.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="w-full md:w-1/2 h-[260px] relative z-10 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <defs>
                      {pieData.map((_, index) => {
                        const grad = PIE_GRADIENTS[index % PIE_GRADIENTS.length];
                        return (
                          <linearGradient id={`pieGrad-${index}`} x1="0" y1="0" x2="1" y2="1" key={index}>
                            <stop offset="0%" stopColor={grad.start} stopOpacity={1} />
                            <stop offset="100%" stopColor={grad.end} stopOpacity={1} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1500}
                      stroke="rgba(0,0,0,0.5)"
                      strokeWidth={2}
                      cornerRadius={6}
                    >
                      {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#pieGrad-${index})`} 
                          style={{ filter: `drop-shadow(0px 0px 8px ${PIE_GRADIENTS[index % PIE_GRADIENTS.length].start}40)` }}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltipPie />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Auditoría de Tiempo Pomodoro */}
          <div className="mt-6 mb-6">
            <div className="flex items-center gap-2 mb-4 text-cyan-400">
              <PieChartIcon className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-widest">Auditoría de Tiempo (Deep Work)</h3>
            </div>
            <div className="bg-[#001830] p-5 rounded-2xl border border-cyan-900/30 shadow-[0_4px_20px_rgba(0,240,255,0.05)]">
              <div className="flex flex-col md:flex-row items-center gap-6">
                
                <div className="flex-shrink-0 text-center md:text-left">
                  <p className="text-[10px] text-white font-bold uppercase tracking-wider mb-1">Total Tiempo Foco</p>
                  <p className="text-3xl font-black text-cyan-400 font-mono">
                    {Math.floor(timeAudit.totalMinutes / 60)}<span className="text-sm text-cyan-600">h</span> {timeAudit.totalMinutes % 60}<span className="text-sm text-cyan-600">m</span>
                  </p>
                </div>

                <div className="flex-1 w-full space-y-3">
                  {timeAudit.totalMinutes === 0 ? (
                    <div className="text-xs text-white text-center py-2">No hay registros de tiempo Pomodoro aún.</div>
                  ) : (
                    (Object.entries(timeAudit.audit) as [string, number][]).filter(([_, mins]) => mins > 0).sort((a, b) => b[1] - a[1]).map(([category, mins]) => {
                      const percentage = Math.round((mins / timeAudit.totalMinutes) * 100);
                      const isMente = ['creativo', 'estudio', 'clientes', 'trabajo', 'pomodoro'].includes(category);
                      const isFuerza = ['entrenamiento'].includes(category);
                      const isEnergia = ['comida', 'limpieza', 'rutina'].includes(category);
                      const isDisciplina = ['habito', 'hogar'].includes(category);
                      let barColor = 'bg-slate-500';
                      let textColor = 'text-white';
                      if (isFuerza) { barColor = 'bg-red-500'; textColor = 'text-red-400'; }
                      else if (isMente) { barColor = 'bg-purple-500'; textColor = 'text-purple-400'; }
                      else if (isEnergia) { barColor = 'bg-yellow-500'; textColor = 'text-yellow-400'; }
                      else if (isDisciplina) { barColor = 'bg-cyan-500'; textColor = 'text-cyan-400'; }

                      return (
                        <div key={category} className="flex items-center gap-3">
                          <div className="w-24 text-right">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${textColor}`}>{category}</span>
                          </div>
                          <div className="flex-1 h-3 bg-black rounded-full overflow-hidden border border-slate-800">
                            <div className={`h-full ${barColor} relative`} style={{ width: `${percentage}%` }}>
                              <div className="absolute top-0 left-0 w-full h-full bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
                            </div>
                          </div>
                          <div className="w-16 text-left">
                            <span className="text-[10px] font-mono text-white">{Math.floor(mins / 60)}h {mins % 60}m</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: [💰 FINANZAS & ORÁCULO] */}
      {/* ========================================================================= */}
      {activeSubTab === 'finance' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Finance Dashboard */}
          <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-cyan-400">Cargando panel financiero...</div>}>
            <FinanceDashboard expenses={expenses} setExpenses={setExpenses} tasksByDate={tasksByDate} />
          </Suspense>

          {/* Advanced Intelligence Layer */}
          <ScrollReveal>
            <IntelligenceOverlay stats={stats} onUpdateStats={onUpdateStats} tasksByDate={tasksByDate} pomodoroSessions={pomodoroSessions} />
          </ScrollReveal>
        </div>
      )}

    </div>
  );
};

export default WeeklyStats;