import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star } from 'lucide-react';
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

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ currentDate, tasksByDate, onChangeDate, onNavigateToDay }) => {
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

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
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
    <div className="bg-[#001224]/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700 shadow-2xl relative overflow-hidden font-sans tracking-wide">
       {/* Ambient glow */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 mix-blend-screen pointer-events-none" />

       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-900/40 rounded-2xl border border-blue-500/30">
                <CalendarIcon className="w-6 h-6 text-blue-400" />
             </div>
             <div>
               <h2 className="text-2xl font-black text-white capitalize">{monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}</h2>
               <p className="text-sm font-bold text-slate-400">Planificador Mensual</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 hover:border-slate-500 text-white cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
             <button onClick={() => setViewMonth(new Date())} className="px-4 py-2 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 hover:border-slate-500 text-xs font-bold uppercase tracking-widest text-slate-300 cursor-pointer">Hoy</button>
             <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 hover:border-slate-500 text-white cursor-pointer"><ChevronRight className="w-5 h-5" /></button>
          </div>
       </div>

       <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
             <div key={day} className="text-center text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest py-2">
                {day}
             </div>
          ))}
       </div>

       <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day, idx) => {
             const isToday = day.date === todayStr;
             const isSelected = day.date === currentDate;
             const dayTasks = tasksByDate[day.date] !== undefined ? tasksByDate[day.date] : generateDailyTasks(day.date, customHabits);
             const completedCount = dayTasks.filter(t => t.completed).length;
             const totalCount = dayTasks.length;
             const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
             
             return (
                <button
                   key={idx}
                   onClick={() => { soundFX.playClick(); onChangeDate(day.date); onNavigateToDay(day.date); }}
                   className={`relative flex flex-col items-center justify-start py-2 px-1 sm:p-3 h-20 sm:h-28 rounded-2xl border transition-all cursor-pointer group ${
                      !day.isCurrentMonth ? 'opacity-40 hover:opacity-100 bg-[#000a14] border-slate-800/50' : 
                      isSelected ? 'bg-blue-900/40 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                      isToday ? 'bg-slate-800 border-yellow-500/50' :
                      'bg-[#001830]/50 border-slate-700/50 hover:bg-[#002244] hover:border-slate-500'
                   }`}
                >
                   {isToday && <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-yellow-400 -mt-1 -mr-1 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />}
                   
                   <span className={`text-sm sm:text-lg font-black mb-1 ${
                      isSelected ? 'text-blue-300' :
                      !day.isCurrentMonth ? 'text-slate-600' :
                      isToday ? 'text-yellow-400' : 'text-slate-300'
                   }`}>
                      {parseInt(day.date.split('-')[2])}
                   </span>

                   {totalCount > 0 && (
                      <div className="w-full px-1 mt-auto space-y-1.5 flex flex-col items-center">
                         <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                         </div>
                         <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">{completedCount}/{totalCount}</span>
                         {progress === 100 && <Star className="w-3 h-3 text-yellow-400 absolute bottom-1 right-1" />}
                      </div>
                   )}
                </button>
             );
          })}
       </div>
    </div>
  );
};
