import React from 'react';
import {
  Plus,
  RotateCcw,
  Lock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { formatDateForDisplay } from '../../utils/date';

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
  onOpenOracle?: () => void;
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
  isDayFinalized,
  finalizedInfo,
  onOpenTemplates,
  onOpenOracle,
  onReopenDay,
  onOpenAddModal,
  activeBuff,
}) => {
  return (
    <div className="space-y-2.5 mb-3">
      {/* Dynamic Status / Buff Banner */}
      {activeBuff && (
        <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-semibold">{activeBuff.name || 'Buff Activo'}</span>
          </div>
          <span className="text-amber-400/80 font-mono text-[11px]">{activeBuff.description}</span>
        </div>
      )}

      {/* Compact Single-Row Action Bar (No duplicate date arrows or duplicate streak/journal buttons) */}
      <div className="px-3.5 py-2.5 rounded-2xl bg-[#040814]/90 border border-cyan-500/25 flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono uppercase tracking-wide truncate">
          {formatDateForDisplay(currentDate)}
        </span>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {onOpenTemplates && (
            <button
              type="button"
              onClick={onOpenTemplates}
              className="px-2.5 py-1.5 rounded-xl bg-black/50 hover:bg-cyan-950/50 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/40 transition-colors text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              title="Cargar plantilla de rutina"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Plantillas</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenAddModal(false)}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-anton tracking-wider text-xs uppercase transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Finalized Day / Lock Banner */}
      {isDayFinalized && (
        <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 backdrop-blur-md flex items-center justify-between text-indigo-200">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs font-bold text-white">
              Jornada Sellada ({finalizedInfo?.finalizedAt ? new Date(finalizedInfo.finalizedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'})
            </span>
          </div>

          {onReopenDay && (
            <button
              type="button"
              onClick={() => onReopenDay(currentDate)}
              className="px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-semibold transition-all flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reabrir</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
