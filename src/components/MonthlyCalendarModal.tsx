import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  RotateCcw,
  Sparkles,
  Calendar as CalendarIcon
} from 'lucide-react';
import { TaskItem } from '../types';
import { soundFX } from '../utils/audio';
import { formatDateToLocal, getTodayDateString, parseLocalDate } from '../utils/date';
import { generateDailyTasks } from '../data/defaults';
import { useTaskStore } from '../store/useTaskStore';
import { usePlayerStore } from '../store/usePlayerStore';

interface MonthlyCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  tasksByDate?: Record<string, TaskItem[]>;
  onChangeDate: (date: string) => void;
}

export const MonthlyCalendarModal: React.FC<MonthlyCalendarModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  tasksByDate: propTasksByDate,
  onChangeDate,
}) => {
  const storeTasksByDate = useTaskStore((s) => s.tasksByDate);
  const tasksByDate = propTasksByDate || storeTasksByDate;
  const customHabits = useTaskStore((s) => s.customHabits);
  const restDays = usePlayerStore((s) => s.stats.restDays);
  const [viewMonth, setViewMonth] = useState(() => new Date(currentDate + 'T12:00:00'));

  // Sync viewMonth whenever currentDate changes
  useEffect(() => {
    if (currentDate) {
      setViewMonth(new Date(currentDate + 'T12:00:00'));
    }
  }, [currentDate]);

  // ESC key listener + ocultar flotantes
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const daysInMonth = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday start: 0 = Sun -> 6, 1 = Mon -> 0
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];
    // Filler prev month
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: formatDateToLocal(d), isCurrentMonth: false });
    }
    // Days in current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: formatDateToLocal(d), isCurrentMonth: true });
    }
    // Filler next month
    const remaining = (days.length % 7 === 0) ? 0 : 7 - (days.length % 7);
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: formatDateToLocal(d), isCurrentMonth: false });
    }

    return days;
  }, [viewMonth]);

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

  const handleGoToday = () => {
    soundFX.playClick();
    const today = getTodayDateString();
    setViewMonth(new Date());
    onChangeDate(today);
    onClose();
  };

  const todayStr = getTodayDateString();

  if (!isOpen) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Calendario mensual"
      className="fixed inset-0 z-[170] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in portal-modal-root"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[92dvh] overflow-y-auto no-scrollbar flex flex-col bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.75)] relative isolate text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grano esmerilado táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* ====================================================================
            ENCABEZADO UNIFICADO LIMPIO (SIN DOBLE HEADER)
            ==================================================================== */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-[#040814]/[0.96] shrink-0 relative z-10">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={prevMonth} 
              className="chicle-btn w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:aura-border-subtle text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <h3 className="text-sm sm:text-base font-anton tracking-wide text-white uppercase truncate tabular-nums">
              {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </h3>

            <button 
              type="button"
              onClick={nextMonth} 
              className="chicle-btn w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:aura-border-subtle text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMonth(new Date())}
              className="chicle-btn px-2.5 py-1.5 rounded-xl aura-bg-soft border aura-border-subtle aura-text-primary text-[10px] font-anton tracking-wider uppercase transition-all cursor-pointer"
            >
              Hoy
            </button>

            {/* BOTÓN CERRAR SUPERIOR DESTACADO */}
            <button
              type="button"
              onClick={onClose}
              className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Cerrar calendario (Esc)"
              aria-label="Cerrar calendario"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ====================================================================
            CUERPO DEL CALENDARIO: MATRIZ CONSTELACIÓN ZEN
            ==================================================================== */}
        <div className="p-3.5 sm:p-4 space-y-2 relative z-10">
          {/* Weekday Labels Row */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayNames.map((day) => (
              <span key={day} className="text-[10px] font-anton tracking-wider text-slate-400 uppercase py-0.5">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid in Squircles with Status Micro-Dots */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day, idx) => {
              const isDayToday = day.date === todayStr;
              const isSelected = day.date === currentDate;
              const isRest = Boolean(day.date && restDays?.[day.date]);

              // Calculate tasks completed status
              const dayTasks = tasksByDate[day.date] !== undefined 
                ? tasksByDate[day.date] 
                : generateDailyTasks(day.date, customHabits);
              const completedCount = dayTasks.filter((t) => t.completed).length;
              const totalCount = dayTasks.length;
              const isFullyDone = totalCount > 0 && completedCount === totalCount;
              const hasPending = totalCount > 0 && completedCount < totalCount;

              const dayNum = parseInt(day.date.split('-')[2]);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    onChangeDate(day.date);
                    onClose();
                  }}
                  className={`chicle-btn relative flex flex-col items-center justify-center h-10 sm:h-11 rounded-xl transition-all cursor-pointer ${
                    !day.isCurrentMonth
                      ? 'opacity-25 hover:opacity-70 bg-transparent text-slate-500'
                      : isSelected
                      ? 'aura-btn-gradient optic-active-card font-anton font-bold z-10'
                      : isDayToday
                      ? 'bg-amber-400/15 border border-amber-400/75 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.22)]'
                      : isRest
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-200'
                  }`}
                  title={`${day.date}${isFullyDone ? ' • ¡Completado!' : hasPending ? ` • ${completedCount}/${totalCount} misiones` : ''}`}
                >
                  <span className={`text-xs sm:text-sm leading-none font-anton tabular-nums ${
                    isSelected ? 'text-slate-950' : ''
                  }`}>
                    {dayNum}
                  </span>

                  {/* Micro-Dot Táctico de Estado */}
                  <div className="h-1.5 flex items-center justify-center gap-0.5 mt-0.5">
                    {isFullyDone ? (
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-black' : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                      }`} />
                    ) : hasPending ? (
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-black/60' : 'aura-bg-primary'
                      }`} />
                    ) : isRest ? (
                      <span className="text-[8px] leading-none">🌿</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Micro Legend */}
          <div className="flex items-center justify-center gap-3 pt-2 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span>Completado</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full aura-bg-primary" />
              <span>Pendiente</span>
            </span>
            <span className="flex items-center gap-1">
              <span>🌿</span>
              <span>Descanso</span>
            </span>
          </div>
        </div>

        {/* ====================================================================
            FOOTER: SALIDA GARANTIZADA AL ALCANCE DEL PULGAR (THUMB ZONE)
            ==================================================================== */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#040814]/[0.96] shrink-0 relative z-10 flex items-center gap-2">
          {currentDate !== todayStr && (
            <button
              type="button"
              onClick={handleGoToday}
              className="chicle-btn aura-btn-gradient optic-active-card flex-1 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ir a Hoy</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="chicle-btn flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white font-anton text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Volver a Misiones</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default MonthlyCalendarModal;
