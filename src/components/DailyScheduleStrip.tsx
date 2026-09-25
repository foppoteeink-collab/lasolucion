import React, { useState, useEffect } from 'react';
import { TaskItem, TaskCategory } from '../types';
import { Clock, Play, Sparkles, ChevronDown, ChevronUp, Calendar, Timer, CheckCircle2 } from 'lucide-react';
import { soundFX } from '../utils/audio';
import { parseTimeToMinutes, parseEndTimeToMinutes, sortByChronologicalTime } from '../utils/timeUtils';

interface DailyScheduleStripProps {
  tasks: TaskItem[];
  onOpenPomodoroForTask: (taskTitle: string, category: TaskCategory) => void;
  onOpenFinishDay: () => void;
}

export const DailyScheduleStrip: React.FC<DailyScheduleStripProps> = ({
  tasks,
  onOpenPomodoroForTask,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAllBlocks, setShowAllBlocks] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTimeNumber = currentHours * 60 + currentMinutes;

  const formattedTimeStr = currentTime.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedDateStr = `${daysOfWeek[currentTime.getDay()]}, ${currentTime.getDate()} ${monthNames[currentTime.getMonth()]}`;

  const checkBlockStatus = (blockStr?: string): { isActive: boolean; isPast: boolean } => {
    if (!blockStr) return { isActive: false, isPast: false };
    const startMin = parseTimeToMinutes(blockStr);
    const endMin = parseEndTimeToMinutes(blockStr);
    if (startMin === 9999) return { isActive: false, isPast: false };
    return {
      isActive: currentTimeNumber >= startMin && currentTimeNumber < (endMin !== 9999 ? endMin : startMin + 60),
      isPast: (endMin !== 9999 ? endMin : startMin + 60) <= currentTimeNumber,
    };
  };

  const scheduledTasks: TaskItem[] = sortByChronologicalTime<TaskItem>(tasks.filter((t) => Boolean(t.timeBlock) && !t.isHabit));
  const activeTask = scheduledTasks.find((t) => checkBlockStatus(t.timeBlock).isActive);

  return (
    <div className="scifi-glass-panel rounded-2xl p-3.5 sm:p-4 font-sans transition-all text-white">
      
      {/* Top Bar: Date + Live Time + Toggle Button */}
      <div className="flex items-center justify-between gap-2">
        
        {/* Left: Day & Live Clock */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#000a14] border border-cyan-400/60 text-xs font-black shadow-[0_0_10px_rgba(0,240,255,0.25)]">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-mono text-xs sm:text-sm text-cyan-300">{formattedTimeStr}</span>
          </div>
          <span className="text-xs font-anton tracking-wide text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formattedDateStr}</span>
          </span>
        </div>

        {/* Right: Collapsible Timeline Toggle */}
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setShowAllBlocks(!showAllBlocks);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#000a14] text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-950/40 hover:text-white transition-all cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.15)] shrink-0 active:scale-95"
        >
          <span>{showAllBlocks ? 'Ocultar' : 'Horarios'}</span>
          {showAllBlocks ? <ChevronUp className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />}
        </button>
      </div>

      {/* Middle Status Banner: Dedicated Active Task or Free Transition */}
      <div className="mt-2.5 pt-2 border-t border-cyan-500/20">
        {activeTask ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#002244]/80 px-3 py-2 rounded-xl border border-cyan-400/60 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-mono font-black text-cyan-300 bg-[#001020] px-1.5 py-0.5 rounded border border-cyan-500/40">
                  En curso ({activeTask?.timeBlock || ''})
                </span>
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {activeTask?.title || 'Tarea activa'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (activeTask?.title) {
                  soundFX.playPomodoroChime();
                  onOpenPomodoroForTask(activeTask.title, activeTask.category);
                }
              }}
              className="self-end sm:self-auto px-3 py-1 bg-cyan-400 text-black hover:bg-cyan-300 rounded-lg border border-cyan-300 font-anton tracking-wider uppercase cursor-pointer text-xs shadow-[0_0_10px_rgba(0,240,255,0.4)] shrink-0 flex items-center gap-1.5 active:scale-95"
              title="Enfocar en Pomodoro"
            >
              <Timer className="w-3.5 h-3.5 text-black" />
              <span>Pomodoro</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 py-1 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Tiempo libre o transición activa entre bloques</span>
          </div>
        )}
      </div>

      {/* Expandable Compact Timeline Chips */}
      {showAllBlocks && (
        <div className="mt-3 pt-3 border-t-2 border-dashed border-cyan-500/30 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {scheduledTasks.filter(t => t && t.title).map((t, idx) => {
              const status = checkBlockStatus(t.timeBlock);
              return (
                <div
                  key={t.id ? `sched-strip-${t.id}-${idx}` : `sched-strip-${idx}`}
                  className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-xs font-sans flex items-center gap-2 transition-all ${
                    status.isActive
                      ? 'bg-cyan-950/80 text-white border-cyan-400 font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      : t.completed
                      ? 'bg-[#000a14]/60 text-slate-500 border-cyan-900/30 line-through'
                      : 'bg-[#000a14] border-cyan-500/30 text-slate-200'
                  }`}
                >
                  <span className="font-mono font-bold text-[11px] text-cyan-300">{t.timeBlock}</span>
                  <span className="font-bold truncate max-w-[130px]">{t.title}</span>
                  {t.completed && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default DailyScheduleStrip;
