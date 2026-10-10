import { FinanceDashboard } from "./FinanceDashboard";
import { HeroProfileModal } from './HeroProfileModal';
import { HoloCompanion } from './HoloCompanion';
import { ScrollReveal } from './common/ScrollReveal';
import React, { useState, useMemo, useEffect } from 'react';
import { IntelligenceOverlay } from '../intelligence/IntelligenceOverlay';
import { PlayerStats, PomodoroSession, TaskItem, HabitMasteryRecord } from '../types';
import { getTodayDateString, addDaysToDateString } from '../utils/date';
import {
  Plus,
  Trash2,
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
  Eye,
  Trophy,
  Target,
  Star,
  TrendingDown,
  Download,
  Edit2,
  X,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Percent
} from 'lucide-react';
import { FinancialTransaction } from '../types';
import { formatMoney, getSavedCurrencySymbol, setSavedCurrencySymbol, SUPPORTED_CURRENCIES } from '../utils/finance';
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

interface WeeklyStatsProps {
  expenses: FinancialTransaction[];
  setExpenses: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
  stats: PlayerStats;
  onUpdateStats?: (updater: PlayerStats | ((prev: PlayerStats) => PlayerStats)) => void;
  tasksByDate: Record<string, TaskItem[]>;
  pomodoroSessions: PomodoroSession[];
  habitMastery?: Record<string, HabitMasteryRecord>;
}

type TimeRange = 'semanal' | 'mensual' | 'anual';

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
  setExpenses
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // --- CALCULATE RECORDS ---
  
  const handleClassPick = (charClass: CharacterClassOption) => {
    soundFX.playItemEquip();
    if (onUpdateStats) {
      onUpdateStats({
        ...stats,
        characterClass: charClass.name,
        avatarIcon: charClass.avatar,
      });
    }
    triggerShockwave({ color: 'violet', intensity: 'medium' });
  };

  const xpPercent = Math.min(100, Math.max(0, Math.floor((stats.currentXp / Math.max(1, stats.requiredXp)) * 100)));
  const selectedClassOption = CHARACTER_CLASSES.find(c => c.name === stats.characterClass) || CHARACTER_CLASSES[0];
  const activeRank = getRankForLevel(stats.level);
  const displayRankTitle = stats.rankTitle && (stats.level === 1 || stats.rankTitle !== 'Chispazo de Voluntad')
    ? (stats.rankTitle === 'Aventurero' ? activeRank.title : stats.rankTitle)
    : activeRank.title;

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


  // Finance module extracted to FinanceDashboard.tsx

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
    return Object.entries(habitMastery || {})
      .map(([baseId, record]) => ({ ...(record as any), baseId }))
      .filter(h => {
        if (h.highestStreak <= 0 && h.currentStreak <= 0) return false;
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
  const [timeRange, setTimeRange] = useState<TimeRange>('semanal');

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
        <div className="bg-[#001830]/90 backdrop-blur-sm border border-fuchsia-500/50 p-2.5 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.25)]">
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

  return (
    <div className="space-y-5 pb-6">

            <HeroProfileModal 
        isOpen={isEditingProfile} 
        onClose={() => setIsEditingProfile(false)} 
        stats={stats} 
        onUpdateStats={onUpdateStats} 
      />

      {/* ---------------- HERO RPG STATUS WINDOW (SOLO LEVELING SCI-FI) ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
        {/* Full Width Hero RPG Character Card */}
        <div className="lg:col-span-12 rounded-[24px] scifi-glass-panel border-2 border-cyan-400 p-4 sm:p-6 shadow-[0_0_25px_rgba(0,240,255,0.25)] flex flex-col justify-between relative overflow-hidden text-white">
          
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
                  <p className="text-xs text-cyan-300/90 font-bold mt-0.5 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    {displayRankTitle}
                  </p>
                  <p className="text-[11px] text-amber-300 font-bold mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    {selectedClassOption.statBonus}
                  </p>
                  
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
                onClick={() => setIsEditingProfile(true)}
                className="p-3 rounded-2xl bg-[#04020e] border border-cyan-500/50 hover:border-cyan-300 transition-all cursor-pointer flex items-center gap-3 shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.15)] group"
                title="Haz clic para cambiar tu arquetipo y compañero en Editar Perfil"
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
                    <span>Espíritu Bioluminiscente</span>
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
                <span className="text-[10px] text-slate-400 font-mono">
                  {trackedHabits.filter(h => h.currentStreak >= 21).length} Desbloqueadas
                </span>
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
      </div>

      {/* ---------------- NEW: BIOMETRICS & ATTRIBUTES ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        
        {/* RPG Character Attributes Matrix (Radar) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-purple-900/50 shadow-[0_10px_30px_rgba(168,85,247,0.08)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-400 flex items-center gap-2 uppercase tracking-widest">
              <Award className="w-4 h-4 text-white" />
              Matriz de Poder
            </h3>
            <span className="text-[10px] font-bold text-purple-500/70 uppercase tracking-widest bg-purple-500/10 px-2 py-1 rounded-md">
              Todos los niveles
            </span>
          </div>
          
          <div className="flex-1 w-full min-h-[260px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
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

        
      {/* NEW: RPG Attribute Breakdown Bars */}
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
                    {/* Inner highlight */}
                    <div className="absolute inset-0 bg-white/20 w-full h-1/2 rounded-t-full"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      </div>
      
      


      {/* ---------------- NEW: SALA DE MAESTRÍA & RÉCORDS ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        
        {/* LEFT COLUMN: Récords Personales (Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 mb-2 text-yellow-400">
             <Trophy className="w-5 h-5" />
             <h3 className="text-sm font-black uppercase tracking-widest">Récords de Leyenda</h3>
          </div>
          
          <div className="bg-gradient-to-br from-[#120a00] to-[#0a0500] p-4 rounded-2xl border border-yellow-900/50 shadow-[0_4px_20px_rgba(234,179,8,0.05)]">
             <div className="space-y-4">
               {/* Record: XP */}
               <div className="flex items-center justify-between border-b border-yellow-900/30 pb-3">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400"><Zap className="w-4 h-4" /></div>
                   <div>
                     <p className="text-[10px] text-white font-bold uppercase tracking-wider">Máximo XP en 1 Día</p>
                     <p className="text-lg font-black text-yellow-400">{maxDailyXp} <span className="text-xs text-yellow-600">XP</span></p>
                   </div>
                 </div>
               </div>
               {/* Record: Pomodoro */}
               <div className="flex items-center justify-between border-b border-yellow-900/30 pb-3">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-500/20 rounded-lg text-white"><Clock className="w-4 h-4" /></div>
                   <div>
                     <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Sesión Deep Work Máxima</p>
                     <p className="text-lg font-black text-white">{maxPomodoro} <span className="text-xs text-purple-600">MIN</span></p>
                   </div>
                 </div>
               </div>
               {/* Record: Racha */}
               <div className="flex items-center justify-between border-b border-yellow-900/30 pb-3">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><Flame className="w-4 h-4" /></div>
                   <div>
                     <p className="text-[10px] text-white font-bold uppercase tracking-wider">Mejor Racha Histórica</p>
                     <p className="text-lg font-black text-orange-400">{maxHabitStreak} <span className="text-xs text-orange-600">DÍAS</span></p>
                   </div>
                 </div>
               </div>
               {/* Record: Total Tareas */}
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400"><Target className="w-4 h-4" /></div>
                   <div>
                     <p className="text-[10px] text-white font-bold uppercase tracking-wider">Misiones Completadas</p>
                     <p className="text-lg font-black text-cyan-400">{totalTasksDone} <span className="text-xs text-cyan-600">MISIONES</span></p>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Vitrina de Maestría (Span 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2 mb-2 text-fuchsia-400">
             <Award className="w-5 h-5" />
             <h3 className="text-sm font-black uppercase tracking-widest">Progreso de Hábitos</h3>
          </div>
          
          <div className="bg-[#00152b] p-5 rounded-2xl border border-fuchsia-900/30 shadow-[0_4px_20px_rgba(217,70,239,0.05)] h-[calc(100%-2.5rem)] overflow-y-auto max-h-[400px] custom-scrollbar">
            {trackedHabits.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-fuchsia-900/30 rounded-xl">
                 <div className="w-12 h-12 bg-fuchsia-900/20 rounded-full flex items-center justify-center mb-3">
                   <Award className="w-6 h-6 text-fuchsia-900/60" />
                 </div>
                 <p className="text-sm font-black text-fuchsia-300/50 uppercase tracking-widest">Sin Hábitos Activos</p>
                 <p className="text-xs text-white mt-2 max-w-xs">Comienza a registrar hábitos diarios para ver tu progreso hacia la Barrera de Maltz (21 días) y la Maestría (66 días).</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                 {trackedHabits.map(habit => {
                   const title = getHabitRealTitle(habit.baseId);
                   
                   // Detect habit energy type and rewards
                   const energyType = habit.habitEnergyType || detectHabitEnergy(title, habit.category);
                   const energyDetail = HABIT_ENERGY_DETAILS[energyType] || HABIT_ENERGY_DETAILS.purification;

                   // Use habitMastery from GameContext to get streak info
                   const masteryRecord = habitMastery?.[habit.baseId] || { currentStreak: 0, highestStreak: 0, isMastered: false };
                   const currentStreak = masteryRecord.currentStreak || 0;
                   
                   const target = currentStreak >= 21 ? 66 : 21;
                   const progress = Math.min((currentStreak / target) * 100, 100);
                   const isMastered = currentStreak >= 66;
                   const isFormed = currentStreak >= 21;
                   
                   return (
                   <div key={habit.baseId} className={`p-4 rounded-xl border relative overflow-hidden flex flex-col gap-3 transition-all hover:scale-[1.01] ${
                     isMastered 
                       ? 'bg-gradient-to-r from-[#18150d] to-[#0a0805] border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]'
                       : isFormed
                       ? 'bg-gradient-to-r from-[#12081f] to-[#05020a] border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                       : 'bg-gradient-to-r from-[#001a33] to-[#000a14] border-slate-700/50'
                   }`}>
                     {/* Glow Background */}
                     {(isMastered || isFormed) && (
                       <div className={`absolute top-0 right-0 w-36 h-full opacity-15 pointer-events-none ${isMastered ? 'bg-yellow-500 blur-2xl' : 'bg-purple-500 blur-2xl'}`}></div>
                     )}
                     
                     <div className="flex items-start justify-between relative z-10 gap-2">
                       <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 text-xl relative ${
                           isMastered 
                             ? 'bg-yellow-950/80 border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                             : isFormed
                             ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                             : 'bg-slate-900 border-slate-700 text-slate-300'
                         }`}>
                           {/* Particulas para 66 días */}
                           {isMastered && (
                             <>
                               <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                               <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse delay-150"></div>
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

                     {/* Recompensas de Kai en Progreso / Desbloqueadas */}
                     <div className="relative z-10 p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1.5 text-xs font-mono">
                       <div className="flex items-center justify-between">
                         <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                           <Sparkles className="w-3 h-3 text-purple-400" /> Premio 21d Kai:
                         </span>
                         <span className={`font-bold text-[11px] ${isFormed ? 'text-purple-300' : 'text-slate-500'}`}>
                           {isFormed ? `✅ ${energyDetail.auraName21}` : `🔒 ${energyDetail.auraName21} (${Math.max(0, 21 - currentStreak)}d restantes)`}
                         </span>
                       </div>

                       <div className="flex items-center justify-between border-t border-white/5 pt-1">
                         <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                           <Crown className="w-3 h-3 text-amber-400" /> Premio 66d Kai:
                         </span>
                         <span className={`font-bold text-[11px] ${isMastered ? 'text-amber-300' : 'text-slate-500'}`}>
                           {isMastered ? `✅ ${energyDetail.masterForm66}` : `🔒 ${energyDetail.masterForm66} (${Math.max(0, 66 - currentStreak)}d restantes)`}
                         </span>
                       </div>
                     </div>
                     
                     <div className="relative z-10 mt-1">
                       <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                         <span>Progreso de Neuroplasticidad</span>
                         <span>{currentStreak} / {target} Días</span>
                       </div>
                       <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-slate-800">
                         <div 
                           className={`h-full relative transition-all duration-1000 ${isMastered ? 'bg-yellow-400' : (isFormed ? 'bg-purple-400' : 'bg-cyan-400')}`}
                           style={{ width: `${progress}%` }}
                         >
                           <div className="absolute top-0 left-0 w-full h-full bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '0.5rem 0.5rem' }}></div>
                         </div>
                       </div>
                     </div>
                   </div>
                 )})}
               </div>
            )}
          </div>
        </div>      </div>
      
      {/* ---------------- REGISTRO DE ACTIVIDAD DE COMBATE ---------------- */}
      <div className="pt-6 mt-8 border-t border-cyan-900/30 mb-6">
        <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase tracking-widest flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-cyan-400" /> Registro de Actividad de Combate
        </h2>
      </div>
      {/* Time Toggle Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-[#0a0f25] to-[#050a18] p-3 rounded-2xl border border-cyan-900/50 shadow-[0_4px_20px_rgba(0,240,255,0.05)] gap-3">
        <h2 className="text-cyan-400 font-black text-sm px-2 flex items-center gap-2 uppercase tracking-widest">
          <TrendingUp className="w-4 h-4" /> Progreso de Héroe
        </h2>
        <div className="flex items-center bg-[#03060f]/80 p-1.5 rounded-xl border border-cyan-900/40 backdrop-blur-sm mx-auto sm:mx-0 w-full sm:w-auto">
          <button
            onClick={() => setTimeRange('semanal')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
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
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
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
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
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

          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c072b] to-[#050a18] border border-purple-800/50 shadow-[0_8px_20px_rgba(168,85,247,0.1)] text-white relative overflow-hidden group">
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

      {/* Main Charts */}
      <ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Focus Bar Chart */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-cyan-900/50 shadow-[0_10px_30px_rgba(0,240,255,0.08)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Flujo de Foco
            </h3>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-cyan-500/10 px-2 py-1 rounded-md">
              {timeRange === 'semanal' ? '7 Días' : timeRange === 'mensual' ? '30 Días' : '12 Meses'}
            </span>
          </div>
          <div className="flex-1 w-full min-h-[260px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center gap-2 uppercase tracking-widest">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Diario de Fases
              </h3>
            </div>
            
            <div className="flex-1 w-full min-h-[260px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={phaseProgressionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                  <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
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
      {/* Task Distribution Pie Chart */}
      {pieData.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0a0f25] to-[#030612] border border-pink-900/40 shadow-[0_10px_30px_rgba(236,72,153,0.08)] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-500/10 blur-3xl rounded-full pointer-events-none"></div>
          
          <div className="w-full md:w-1/3 text-left">
            <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500 flex items-center gap-2 uppercase tracking-widest mb-2">
              <PieChartIcon className="w-4 h-4 text-pink-400" />
              Distribución de Productividad
            </h3>
            <p className="text-xs font-semibold text-white mb-6">
              Métricas basadas en las categorías de tareas completadas durante el periodo {timeRange}.
            </p>
            
            {/* Custom Legend */}
            <div className="flex flex-col gap-3 relative z-10">
              {pieData.map((entry, index) => {
                const grad = PIE_GRADIENTS[index % PIE_GRADIENTS.length];
                return (
                  <div key={entry.name} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-3 h-3 rounded-full shadow-lg" 
                        style={{ background: `linear-gradient(135deg, ${grad.start}, ${grad.end})`, boxShadow: `0 0 8px ${grad.start}80` }} 
                      />
                      <span className="text-xs font-bold text-white">{entry.name}</span>
                    </div>
                    <span className="font-mono font-black text-white text-sm">{entry.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="w-full md:w-2/3 min-h-[300px] relative z-10 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
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
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={6}
                  dataKey="value"
                  animationDuration={1500}
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={2}
                  cornerRadius={8}
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
      <FinanceDashboard expenses={expenses} setExpenses={setExpenses} tasksByDate={tasksByDate} />
      
      {/* ---------------- NEW: AUDITORÍA DE TIEMPO (TIME AUDIT) ---------------- */}
      <div className="mt-8 mb-8">
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
      </ScrollReveal>
      
      {/* ---------------- NEW: ADVANCED INTELLIGENCE LAYER ---------------- */}
      <ScrollReveal>
        <IntelligenceOverlay stats={stats} onUpdateStats={onUpdateStats} tasksByDate={tasksByDate} pomodoroSessions={pomodoroSessions} />
      </ScrollReveal>
    </div>
  );
};