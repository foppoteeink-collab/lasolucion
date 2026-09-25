import React from 'react';
import { 
  Timer, 
  FileText, 
  Edit3, 
  Trash2,
  Dices
} from 'lucide-react';
import { TaskItem } from '../types';
import { soundFX } from '../utils/audio';
import { usePlayerStore } from '../store/usePlayerStore';

interface TaskActionsDropdownProps {
  task: TaskItem;
  onOpenNote: () => void;
  onOpenPomodoro: () => void;
  onOpenEdit: () => void;
  onDelete: () => void;
  onReRoll?: () => void;
  variant?: 'timeline' | 'card';
  isDayEnded?: boolean;
}

export const TaskActionsDropdown: React.FC<TaskActionsDropdownProps> = ({
  task,
  onOpenNote,
  onOpenPomodoro,
  onOpenEdit,
  onDelete,
  onReRoll,
  variant = 'card',
  isDayEnded = false,
}) => {
  const reRollDice = usePlayerStore(s => s.stats.reRollDice || 0);

  return (
    <div 
      className="relative shrink-0 flex items-center gap-1 sm:gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Note Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          soundFX.playClick();
          onOpenNote();
        }}
        className={`w-9 h-9 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs ${
          task.notes
            ? 'bg-[#d6f421]/20 text-[#d6f421] border-[#d6f421] shadow-[0_0_8px_rgba(214,244,33,0.3)]'
            : 'bg-[#03000a] text-slate-400 hover:text-[#d6f421] border-[#9600ff]/60 hover:border-[#d6f421]'
        }`}
        title={task.notes ? "Ver / Editar nota de repaso" : "Añadir nota de repaso"}
      >
        <FileText className="w-4 h-4" />
      </button>

      {/* Pomodoro / Foco Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          soundFX.playPomodoroChime();
          onOpenPomodoro();
        }}
        className="w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 sm:h-8 rounded-xl bg-[#03000a] hover:bg-[#9600ff]/30 text-[#d6f421] hover:text-white border border-[#9600ff]/60 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs text-xs font-bold"
        title="Iniciar temporizador Pomodoro"
      >
        <Timer className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#d6f421]" />
        <span className="hidden sm:inline">Foco</span>
      </button>

      {/* Re-Roll Button (Only if Dice > 0 and provided) */}
      {reRollDice > 0 && onReRoll && !isDayEnded && !task.completed && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            soundFX.playLevelUp(); // Cool sound for re-roll
            onReRoll();
          }}
          className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-[#03000a] hover:bg-yellow-500/30 text-yellow-400 hover:text-white border border-yellow-500/60 hover:border-yellow-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
          title={`Tirar el Dado del Destino (${reRollDice} disponibles) para cambiar tarea`}
        >
          <Dices className="w-4 h-4" />
        </button>
      )}

      {/* Edit Button (Always Directly Visible) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          soundFX.playClick();
          onOpenEdit();
        }}
        className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-[#03000a] hover:bg-[#9600ff]/30 text-white hover:text-[#d6f421] border border-[#9600ff]/60 hover:border-[#9600ff] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
        title="Editar Misión"
      >
        <Edit3 className="w-4 h-4" />
      </button>

      {/* Delete Button (Always Directly Visible) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          soundFX.playClick();
          onDelete();
        }}
        className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-[#03000a] hover:bg-[#fb5607]/30 text-[#fb5607] hover:text-white border border-[#fb5607]/60 hover:border-[#fb5607] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
        title="Eliminar Misión"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

