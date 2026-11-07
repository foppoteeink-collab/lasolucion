import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Sparkles,
  Timer,
  Trophy,
  ChevronDown,
  ChevronUp,
  Wallet
} from 'lucide-react';
import { TaskItem, TaskCategory } from '../types';
import { soundFX } from '../utils/audio';
import { parseTimeToMinutes, parseEndTimeToMinutes, sortByChronologicalTime } from '../utils/timeUtils';
import { getTodayDateString } from '../utils/date';
import { MoxenRayas } from './moxen/MoxenRayas';
import { getSavedCurrencySymbol } from '../utils/finance';

interface DailyProgressWidgetProps {
  tasks: TaskItem[];
  currentDate: string;
  onOpenTemplates: () => void;
  onOpenJournal?: () => void;
  onOpenFinishDay: () => void;
  onOpenPomodoroForTask?: (taskTitle: string, category: TaskCategory) => void;
  hasClaimedToday?: boolean;
  onClaimDailyBonus?: (xp: number, coins: number) => void;
  showSchedule?: boolean;
  onToggleSchedule?: () => void;
  enableFinance?: boolean;
  onOpenFinance?: () => void;
  todayFinanceBalance?: number;
  currencySymbol?: string;
}

export const DailyProgressWidget: React.FC<DailyProgressWidgetProps> = ({
  tasks,
  currentDate,
  onOpenPomodoroForTask,
  hasClaimedToday,
  onClaimDailyBonus,
  showSchedule,
  onToggleSchedule,
  enableFinance = true,
  onOpenFinance,
  todayFinanceBalance = 0,
  currencySymbol,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [claimedLocal, setClaimedLocal] = useState(false);
  const activeCurrencySymbol = currencySymbol || getSavedCurrencySymbol();

  useEffect(() => {
    setClaimedLocal(false);
  }, [currentDate]);

  useEffect(() => {
    // 30s interval provides accurate timeblock tracking without draining battery
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter agenda missions consistently with TaskListView (exclude quick 21/66d micro-habits)
  const agendaTasks = (tasks || []).filter(t => {
    if (!t || !t.title) return false;
    if (t.isQuickHabit || t.isTracked2166 || t.category === 'habito' || (typeof t.id === 'string' && t.id.includes('habit-'))) {
      return false;
    }
    if (t.timeBlock) return true;
    const lower = t.title.toLowerCase();
    return !lower.includes('agua') && !lower.includes('dientes');
  });

  const targetList = agendaTasks.length > 0 ? agendaTasks : tasks;
  const total = targetList.length;
  const completed = targetList.filter(t => t.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isAllCompleted = total > 0 && completed === total;
  
  const xpEarned = targetList.filter(t => t.completed).reduce((sum, t) => sum + (t.xpReward || 0), 0);
  const xpTotal = targetList.reduce((sum, t) => sum + (t.xpReward || 0), 0);
  const notesCount = tasks.filter(t => t.notes?.trim()).length;

  // Detect live active task on today's date
  const isToday = currentDate === getTodayDateString();
  const currentTimeMins = currentTime.getHours() * 60 + currentTime.getMinutes();
  const scheduledTasks = sortByChronologicalTime<TaskItem>(
    agendaTasks.filter(t => Boolean(t.timeBlock) && !t.completed)
  );
  const activeTask = isToday
    ? scheduledTasks.find(t => {
        const startMin = parseTimeToMinutes(t.timeBlock);
        const endMin = parseEndTimeToMinutes(t.timeBlock);
        if (startMin === 9999) return false;
        const effectiveEnd = endMin !== 9999 ? endMin : startMin + 60;
        return currentTimeMins >= startMin && currentTimeMins < effectiveEnd;
      })
    : undefined;

  return (
    <div className="px-3 sm:px-4 py-2 rounded-xl scifi-glass-panel relative overflow-hidden text-left text-white space-y-1.5 border border-cyan-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {/* Grano esmerilado táctil */}
      <span className="vi-grano opacity-5" aria-hidden="true" />

      <div className="flex items-center justify-between gap-2 relative z-10">
        {/* Left: Progress label + compact inline bar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          <Zap className="w-4 h-4 fill-cyan-400 text-cyan-400 shrink-0" />
          <span className="text-xs font-black text-white uppercase tracking-wider font-anton shrink-0">
            Progreso
          </span>
          <span className="text-xs text-cyan-300 font-mono font-bold shrink-0 tabular-nums">
            {completed}/{total} ({percent}%)
          </span>
          <div className="w-16 xs:w-24 sm:w-36 shrink-0">
            <MoxenRayas
              progress={percent}
              variant="compact"
              theme="cyan"
              mode="reactive"
            />
          </div>
        </div>

        {/* Right Action Cluster: Tesorería (Ingresos/Gastos) + Horarios + XP */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Botón Horarios del Día */}
          {onToggleSchedule && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onToggleSchedule();
              }}
              className={`h-8 sm:h-9 min-w-[36px] px-2 sm:px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
                showSchedule
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                  : 'bg-surface-card hover:bg-cyan-950/40 text-slate-300 hover:text-white border-white/10'
              }`}
              title="Ver línea de tiempo de horarios del día"
              aria-label="Ver horarios del día"
            >
              {showSchedule ? <ChevronUp className="w-5 h-5 text-cyan-300 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
            </button>
          )}

          {/* XP del día en pantallas medianas y grandes */}
          <div className="hidden md:flex h-8 sm:h-9 px-2.5 rounded-xl bg-surface-card border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold items-center gap-1.5 tabular-nums">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>+{xpEarned}/{xpTotal} XP</span>
          </div>
        </div>
      </div>

      {/* Integrated Active Mission / Creative Block inside the Progress Card */}
      {!showSchedule && activeTask && (
        <div className="flex items-center justify-between gap-2 bg-[#001c38]/95 px-3 py-2 rounded-xl border border-cyan-400/50 relative z-10 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span className="text-[10px] uppercase font-mono font-bold text-cyan-300 shrink-0">
              {activeTask.timeBlock ? activeTask.timeBlock.split('-')[0].trim() : 'AHORA'}:
            </span>
            <span className="font-bold text-white truncate text-xs sm:text-sm">
              {activeTask.title}
            </span>
          </div>
          {onOpenPomodoroForTask && (
            <button
              type="button"
              onClick={() => {
                soundFX.playPomodoroChime();
                onOpenPomodoroForTask(activeTask.title, activeTask.category);
              }}
              className="px-2.5 py-1 bg-cyan-400 text-black hover:bg-cyan-300 rounded-lg font-anton uppercase text-[11px] shrink-0 flex items-center gap-1 shadow-[0_0_10px_rgba(0,240,255,0.4)] cursor-pointer"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Foco</span>
            </button>
          )}
        </div>
      )}

      {/* 100% Daily Completion Bonus Banner */}
      {isAllCompleted && onClaimDailyBonus && !hasClaimedToday && !claimedLocal && (
        <button
          type="button"
          onClick={() => {
            setClaimedLocal(true);
            soundFX.playLevelUp();
            onClaimDailyBonus(25, 10);
          }}
          className="w-full py-1.5 px-3 bg-[#d6f421] hover:bg-yellow-300 text-black rounded-lg font-anton tracking-wider uppercase text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer relative z-10"
        >
          <Trophy className="w-3.5 h-3.5 text-black" />
          <span>¡Día Completado! Reclamar Bono (+25 XP • +10 🪙)</span>
        </button>
      )}
    </div>
  );
};

export default DailyProgressWidget;
