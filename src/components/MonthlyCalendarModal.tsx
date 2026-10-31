import React, { useEffect } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { MonthlyCalendar } from './MonthlyCalendar';
import { TaskItem } from '../types';

interface MonthlyCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  tasksByDate: Record<string, TaskItem[]>;
  onChangeDate: (date: string) => void;
}

export const MonthlyCalendarModal: React.FC<MonthlyCalendarModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  tasksByDate,
  onChangeDate,
}) => {
  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92dvh] flex flex-col bg-[#020b14]/95 border border-cyan-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_40px_rgba(0,240,255,0.25)] relative text-left overflow-hidden backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-cyan-500/30 bg-[#010810] shrink-0 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.35)] shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-anton tracking-wide text-white uppercase truncate">
                Planificador & Calendario Mensual
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Toca cualquier día para transportarte directamente a sus misiones
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/50 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
            title="Cerrar calendario (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY WITH CALENDAR */}
        <div className="p-3 sm:p-5 overflow-y-auto relative z-10 custom-scrollbar">
          <MonthlyCalendar
            currentDate={currentDate}
            tasksByDate={tasksByDate}
            onChangeDate={onChangeDate}
            onNavigateToDay={(selectedDate) => {
              onChangeDate(selectedDate);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MonthlyCalendarModal;
