import React from 'react';
import {
  Plus,
  RotateCcw,
  Lock,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { formatDateForDisplay } from '../../utils/date';
import { soundFX } from '../../utils/audio';
import { useUIStore } from '../../store/useUIStore';

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
  onOpenAddModal: (mode?: 'task' | 'habit' | 'oracle' | boolean) => void;
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
            <span className="font-semibold">{activeBuff.name || 'Mejora Activa'}</span>
          </div>
          <span className="text-amber-400/80 font-mono text-[11px]">{activeBuff.description}</span>
        </div>
      )}

      {/* Zen Date Header & Single Minimalist Action Button */}
      <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#030814]/85 border border-cyan-500/20 flex items-center justify-between gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
        <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono uppercase tracking-wide truncate">
          {formatDateForDisplay(currentDate)}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              useUIStore.getState().openTacticalGuide(3);
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/10 hover:border-cyan-400/50 bg-[#001020]/60 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title="¿Cómo crear tareas y planificar bloques? Ver guía"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onOpenAddModal('task')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-cyan-400/50 bg-[#001020] hover:bg-cyan-400 hover:text-black text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)] flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title="Centro de Tareas: Añadir Tarea, Hábito u Oráculo"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
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
