import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { soundFX } from '../utils/audio';
import { addDaysToDateString, getTodayDateString, parseLocalDate } from '../utils/date';

interface CalendarViewProps {
  currentDate: string;
  onChangeDate: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ currentDate, onChangeDate }) => {
  const weekDays = useMemo(() => {
    const days = [];
    // -3 to +3 keeps currentDate exactly in the center of 7 days
    for (let i = -3; i <= 3; i++) {
      days.push(addDaysToDateString(currentDate, i));
    }
    return days;
  }, [currentDate]);

  const todayStr = getTodayDateString();

  const handlePrevDay = () => {
    soundFX.playClick();
    onChangeDate(addDaysToDateString(currentDate, -1));
  };

  const handleNextDay = () => {
    soundFX.playClick();
    onChangeDate(addDaysToDateString(currentDate, 1));
  };

  const handleGoToday = () => {
    soundFX.playClick();
    onChangeDate(todayStr);
  };

  const formatDayName = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 3);
  };
  
  const formatDayNumber = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    return d.getDate();
  };
  
  const monthName = parseLocalDate(currentDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="scifi-glass-panel rounded-2xl p-3.5 sm:p-4 mb-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-anton tracking-wide text-white uppercase flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]" /> {monthName}
          </h3>
          {currentDate !== todayStr && (
            <button
              onClick={handleGoToday}
              className="text-[11px] font-anton uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-500/30 transition-colors cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.25)]"
              title="Centrar en el día de hoy"
            >
              Ir a Hoy
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevDay} 
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-[#04020e] border border-cyan-500/40 text-cyan-300 hover:border-cyan-300 hover:bg-cyan-950/40 transition-colors cursor-pointer active:scale-95 min-w-[40px] min-h-[40px]"
            title="Día anterior"
          >
            <ChevronLeft className="w-5 h-5 text-cyan-300" />
          </button>
          <div className="relative">
             <input
                type="date"
                value={currentDate}
                onChange={(e) => {
                  if(e.target.value) {
                    soundFX.playClick();
                    onChangeDate(e.target.value);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <button 
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-[#04020e] border border-cyan-500/40 text-cyan-300 hover:border-cyan-300 hover:bg-cyan-950/40 transition-colors cursor-pointer min-w-[40px] min-h-[40px]"
                title="Seleccionar fecha"
              >
                <CalendarIcon className="w-5 h-5 text-cyan-300" />
              </button>
          </div>
          <button 
            onClick={handleNextDay} 
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-[#04020e] border border-cyan-500/40 text-cyan-300 hover:border-cyan-300 hover:bg-cyan-950/40 transition-colors cursor-pointer active:scale-95 min-w-[40px] min-h-[40px]"
            title="Día siguiente"
          >
            <ChevronRight className="w-5 h-5 text-cyan-300" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map(dateStr => {
          const isSelected = dateStr === currentDate;
          const isToday = dateStr === todayStr;
          
          return (
            <button
              key={dateStr}
              onClick={() => {
                soundFX.playClick();
                onChangeDate(dateStr);
              }}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer min-h-[52px] ${
                isSelected && isToday
                  ? 'bg-gradient-to-b from-cyan-500/40 to-[#04020e] text-white border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.6)] scale-105 z-20 ring-2 ring-cyan-400'
                  : isSelected 
                    ? 'bg-cyan-950/80 text-white border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-105 z-10 ring-1 ring-cyan-400'
                    : isToday 
                      ? 'bg-yellow-400/15 border border-yellow-400 text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.35)] hover:border-yellow-300'
                      : 'bg-[#04020e]/80 border border-cyan-500/20 text-slate-300 hover:border-cyan-400/60 hover:text-white'
              }`}
            >
              {isToday && (
                <span className={`absolute -top-2 px-1.5 py-0.2 rounded-full text-[8px] font-anton uppercase tracking-wider shadow-sm z-30 ${
                  isSelected 
                    ? 'bg-cyan-400 text-black ring-1 ring-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.8)]' 
                    : 'bg-yellow-400 text-black font-bold'
                }`}>
                  Hoy
                </span>
              )}
              <span className={`text-[10px] sm:text-xs font-bold uppercase ${
                isSelected 
                  ? 'text-white drop-shadow-md' 
                  : isToday 
                    ? 'text-yellow-300 font-black' 
                    : 'text-slate-400'
              }`}>
                {formatDayName(dateStr)}
              </span>
              <span className={`text-sm sm:text-lg font-anton mt-0.5 ${
                isSelected 
                  ? 'text-white drop-shadow-md' 
                  : isToday 
                    ? 'text-yellow-300 font-black' 
                    : 'text-white'
              }`}>
                {formatDayNumber(dateStr)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
