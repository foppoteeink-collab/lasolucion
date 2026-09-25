import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flame,
  Plus,
  Zap,
  RotateCcw,
  Trash2,
  FileText,
  BookOpen,
  Lock,
  Moon,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { addDaysToDateString, formatDateForDisplay } from '../../utils/date';

interface TaskHeaderHUDProps {
  currentDate: string;
  onChangeDate: (date: string) => void;
  todayDateStr: string;
  isPastDay: boolean;
  isDayFinalized: boolean;
  isDayEnded: boolean;
  finalizedInfo?: any;
  streakCount: number;
  onOpenFinishDay: () => void;
  onOpenTemplates?: () => void;
  onOpenJournal?: () => void;
  onClearDay?: () => void;
  onResetDay?: () => void;
  onReopenDay?: (dateStr?: string) => void;
  onOpenAddModal: (isQuick?: boolean) => void;
  onOpenHabitManager: () => void;
  activeBuff?: any;
}

export const TaskHeaderHUD: React.FC<TaskHeaderHUDProps> = ({
  currentDate,
  onChangeDate,
  todayDateStr,
  isPastDay,
  isDayFinalized,
  isDayEnded,
  finalizedInfo,
  streakCount,
  onOpenFinishDay,
  onOpenTemplates,
  onOpenJournal,
  onClearDay,
  onResetDay,
  onReopenDay,
  onOpenAddModal,
  onOpenHabitManager,
  activeBuff,
}) => {
  const handlePrevDay = () => {
    onChangeDate(addDaysToDateString(currentDate, -1));
  };

  const handleNextDay = () => {
    onChangeDate(addDaysToDateString(currentDate, 1));
  };

  const handleToday = () => {
    onChangeDate(todayDateStr);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Dynamic Status / Buffer Banner */}
      {activeBuff && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-semibold">{activeBuff.name || 'Buff Activo'}</span>
          </div>
          <span className="text-amber-400/80 font-mono">{activeBuff.description}</span>
        </div>
      )}

      {/* Date Control Bar & Actions */}
      <div className="p-4 rounded-2xl bg-gray-950/80 border border-gray-800 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        {/* Date Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-1 bg-gray-900/80 rounded-xl p-1 border border-gray-800">
            <button
              onClick={handlePrevDay}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              title="Día anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                currentDate === todayDateStr
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              HOY
            </button>
            <button
              onClick={handleNextDay}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              title="Día siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              {formatDateForDisplay(currentDate)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          {streakCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
              <span>{streakCount} Días Racha</span>
            </div>
          )}

          {onOpenTemplates && (
            <button
              onClick={onOpenTemplates}
              className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 transition-colors"
              title="Plantillas de día"
            >
              <Layers className="w-4 h-4" />
            </button>
          )}

          {onOpenJournal && (
            <button
              onClick={onOpenJournal}
              className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 transition-colors"
              title="Diario de reflexión"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onOpenAddModal(false)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs font-mono transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            NUEVA TAREA
          </button>
        </div>
      </div>

      {/* Finalized Day / Lock Overlay Banner */}
      {isDayFinalized && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 backdrop-blur-md flex items-center justify-between text-indigo-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Jornada Finalizada & Sellada</h4>
              <p className="text-xs text-indigo-300/80">
                Finalizada a las {finalizedInfo?.finalizedAt ? new Date(finalizedInfo.finalizedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </p>
            </div>
          </div>

          {onReopenDay && (
            <button
              onClick={() => onReopenDay(currentDate)}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reabrir Día
            </button>
          )}
        </div>
      )}
    </div>
  );
};
