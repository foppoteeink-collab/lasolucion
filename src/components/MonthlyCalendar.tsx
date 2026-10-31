import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star, Sparkles } from 'lucide-react';
import { TaskItem } from '../types';
import { soundFX } from '../utils/audio';
import { formatDateToLocal, getTodayDateString } from '../utils/date';
import { generateDailyTasks } from '../data/defaults';
import { useTaskStore } from '../store/useTaskStore';

interface MonthlyCalendarProps {
  currentDate: string;
  tasksByDate: Record<string, TaskItem[]>;
  onChangeDate: (date: string) => void;
  onNavigateToDay: (date: string) => void;
}

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ 
  currentDate, 
  tasksByDate, 
  onChangeDate, 
  onNavigateToDay 
}) => {
  const customHabits = useTaskStore(state => state.customHabits);
  const [viewMonth, setViewMonth] = useState(() => new Date(currentDate + "T12:00:00"));

  const daysInMonth = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 0 = Sunday, 1 = Monday. We want Monday as start.
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const days = [];
    // Previous month filler
    for (let i = startOffset - 1; i >= 0; i--) {
       const d = new Date(year, month, -i);
       days.push({ date: formatDateToLocal(d), isCurrentMonth: false });
    }
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
       const d = new Date(year, month, i);
       days.push({ date: formatDateToLocal(d), isCurrentMonth: true });
    }
    // Next month filler (to make complete weeks)
    const remaining = 42 - days.length; // 6 rows of 7
    for (let i = 1; i <= remaining; i++) {
       const d = new Date(year, month + 1, i);
       days.push({ date: formatDateToLocal(d), isCurrentMonth: false });
    }
    
    return days;
  }, [viewMonth]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const prevMonth = () => {
    soundFX.playClick();
    const newD = new Date(viewMonth);
    newD.setMonth(newD.getMonth() - 1);
    setViewMonth(newD);
  };

  const nextMonth = () => {
    soundFX.playClick();
    const newD = new Date(viewMonth);
    newD.setMonth(newD.getMonth() + 1);
    setViewMonth(newD);
  };
  
  const todayStr = getTodayDateString();

  return (
    <div className="relative isolate rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-surface-card border border-white/10 backdrop-blur-2xl shadow-[0_0_35px_rgba(0,0,0,0.6)] overflow-hidden font-sans tracking-wide text-white">
       {/* Ambient corner glows */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
       <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

       {/* HEADER & MONTH NAVIGATION */}
       <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
             </div>
             <div>
               <h2 className="text-lg sm:text-2xl font-anton tracking-wide text-white capitalize">
                 {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
               </h2>
               <p className="text-xs text-slate-400 font-mono">
                 Cronograma Orbital de Misiones
               </p>
             </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
             <button 
               type="button"
               onClick={prevMonth} 
               className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-cyan-950/60 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer active:scale-95"
               title="Mes anterior"
             >
               <ChevronLeft className="w-4 h-4" />
             </button>
             <button 
               type="button"
               onClick={() => {
                 soundFX.playClick();
                 setViewMonth(new Date());
               }} 
               className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-anton tracking-wider uppercase transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)] active:scale-95"
             >
               Hoy
             </button>
             <button 
               type="button"
               onClick={nextMonth} 
               className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-cyan-950/60 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer active:scale-95"
               title="Mes siguiente"
             >
               <ChevronRight className="w-4 h-4" />
             </button>
          </div>
       </div>

       {/* WEEKDAY NAMES HEADER */}
       <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 relative z-10">
          {dayNames.map(day => (
             <div key={day} className="text-center text-[10px] sm:text-xs font-anton tracking-wider text-slate-400 uppercase py-1">
                {day}
             </div>
          ))}
       </div>

       {/* DAYS GRID */}
       <div className="grid grid-cols-7 gap-1 sm:gap-2 relative z-10">
          {daysInMonth.map((day, idx) => {
             const isDayToday = day.date === todayStr;
             const isSelected = day.date === currentDate;
             const dayTasks = tasksByDate[day.date] !== undefined ? tasksByDate[day.date] : generateDailyTasks(day.date, customHabits);
             const completedCount = dayTasks.filter(t => t.completed).length;
             const totalCount = dayTasks.length;
             const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
             const isFullyDone = totalCount > 0 && completedCount === totalCount;
             
             return (
                <button
                   key={idx}
                   type="button"
                   onClick={() => { 
                     soundFX.playClick(); 
                     onChangeDate(day.date); 
                     onNavigateToDay(day.date); 
                   }}
                   className={`relative flex flex-col items-center justify-between py-1.5 px-1 sm:p-2.5 h-16 sm:h-24 rounded-xl sm:rounded-2xl border transition-all cursor-pointer group active:scale-95 ${
                      !day.isCurrentMonth 
                        ? 'opacity-30 hover:opacity-80 bg-black/40 border-white/5' 
                        : isSelected 
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_18px_rgba(0,240,255,0.4)] ring-1 ring-cyan-400 z-10' 
                        : isDayToday 
                        ? 'bg-yellow-400/10 border-yellow-400/60 shadow-[0_0_12px_rgba(250,204,21,0.25)]' 
                        : 'bg-black/30 border-white/5 hover:border-cyan-500/40 hover:bg-[#011420]/70'
                   }`}
                >
                   {isDayToday && (
                     <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                   )}
                   
                   <span className={`text-xs sm:text-base font-anton ${
                      isSelected 
                        ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]' 
                        : !day.isCurrentMonth 
                        ? 'text-slate-600' 
                        : isDayToday 
                        ? 'text-yellow-400' 
                        : 'text-white'
                   }`}>
                      {parseInt(day.date.split('-')[2])}
                   </span>

                   {totalCount > 0 && (
                      <div className="w-full mt-auto space-y-1 flex flex-col items-center">
                         <div className="w-full bg-black/60 rounded-full h-1 sm:h-1.5 overflow-hidden border border-white/10">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                isFullyDone 
                                  ? 'bg-[#d6f421] shadow-[0_0_8px_rgba(214,244,33,0.8)]' 
                                  : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                              }`} 
                              style={{ width: `${progress}%` }} 
                            />
                         </div>
                         <span className="text-[8px] sm:text-[10px] font-mono text-slate-400 leading-none">
                           {completedCount}/{totalCount}
                         </span>
                         {isFullyDone && (
                           <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#d6f421] absolute top-1 left-1 drop-shadow-[0_0_6px_rgba(214,244,33,0.8)]" />
                         )}
                      </div>
                   )}
                </button>
             );
          })}
       </div>
    </div>
  );
};

export default MonthlyCalendar;
