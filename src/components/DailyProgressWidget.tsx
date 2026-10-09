import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  BookOpen, 
  Sparkles,
  Timer,
  Trophy,
} from 'lucide-react';
import { TaskItem, TaskCategory } from '../types';
import { soundFX } from '../utils/audio';
import { parseTimeToMinutes, parseEndTimeToMinutes, sortByChronologicalTime } from '../utils/timeUtils';
import { getTodayDateString } from '../utils/date';

interface DailyProgressWidgetProps {
  tasks: TaskItem[];
  currentDate: string;
  onOpenTemplates: () => void;
  onOpenJournal: () => void;
  onOpenFinishDay: () => void;
  onOpenPomodoroForTask?: (taskTitle: string, category: TaskCategory) => void;
  hasClaimedToday?: boolean;
  onClaimDailyBonus?: (xp: number, coins: number) => void;
}

export const DailyProgressWidget: React.FC<DailyProgressWidgetProps> = ({
  tasks,
  currentDate,
  onOpenJournal,
  onOpenPomodoroForTask,
  hasClaimedToday,
  onClaimDailyBonus,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
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
    <div className="px-3.5 py-2.5 sm:px-4 rounded-2xl scifi-glass-panel relative overflow-hidden text-left text-white space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        {/* Left: Progress label + inline bar */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="flex items-center gap-1.5 shrink-0">
            <Zap className="w-4 h-4 fill-cyan-400 text-cyan-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider font-anton">
              Progreso
            </span>
            <span className="text-xs text-cyan-300 font-mono font-bold">
              {completed}/{total} ({percent}%)
            </span>
          </div>

          <div className="flex-1 h-2 bg-black/60 rounded-full border border-cyan-500/30 overflow-hidden max-w-xs">
            <div 
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-blue-500 via-cyan-400 to-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.6)]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Right: XP + Journal */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className="px-2 py-1 rounded-lg bg-[#000a14] border border-cyan-400/30 text-cyan-300 text-[11px] font-mono font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>+{xpEarned}/{xpTotal} XP</span>
          </div>

          <button
            type="button"
            onClick={() => { soundFX.playClick(); onOpenJournal(); }}
            className="px-2.5 py-1 rounded-lg bg-[#000a14] hover:bg-amber-950/40 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Abrir bitácora y notas"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Bitácora{notesCount > 0 ? ` (${notesCount})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Live Active Mission Banner (Automatic when a scheduled timeBlock is in progress right now) */}
      {activeTask && (
        <div className="flex items-center justify-between gap-2 bg-[#002244]/85 px-3 py-2 rounded-xl border border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.2)] relative z-10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-mono font-black text-cyan-300 bg-[#001020] px-1.5 py-0.5 rounded border border-cyan-500/40 shrink-0">
                En curso ({activeTask.timeBlock})
              </span>
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                {activeTask.title}
              </span>
            </div>
          </div>
          {onOpenPomodoroForTask && (
            <button
              type="button"
              onClick={() => {
                soundFX.playPomodoroChime();
                onOpenPomodoroForTask(activeTask.title, activeTask.category);
              }}
              className="px-3 py-1 bg-cyan-400 text-black hover:bg-cyan-300 rounded-lg border border-cyan-300 font-anton tracking-wider uppercase cursor-pointer text-xs shadow-[0_0_10px_rgba(0,240,255,0.4)] shrink-0 flex items-center gap-1.5 active:scale-95"
              title="Enfocar en Pomodoro"
            >
              <Timer className="w-3.5 h-3.5 text-black" />
              <span>Pomodoro</span>
            </button>
          )}
        </div>
      )}

      {/* 100% Daily Completion Bonus Banner */}
      {isAllCompleted && onClaimDailyBonus && !hasClaimedToday && (
        <button
          type="button"
          onClick={() => {
            soundFX.playLevelUp();
            onClaimDailyBonus(25, 10);
          }}
          className="w-full py-2 px-3 bg-[#d6f421] hover:bg-yellow-300 text-black rounded-xl font-anton tracking-widest uppercase text-xs transition-all shadow-[0_0_15px_rgba(214,244,33,0.45)] flex items-center justify-center gap-2 cursor-pointer relative z-10"
        >
          <Trophy className="w-4 h-4 text-black" />
          <span>¡Agenda Completada! Reclamar Bono (+25 XP • +10 🪙)</span>
        </button>
      )}
    </div>
  );
};

export default DailyProgressWidget;
