import React from 'react';
import { AlertTriangle, Trash2, X, Calendar } from 'lucide-react';
import { TaskItem } from '../types';

interface DeleteConfirmModalProps {
  task: TaskItem;
  onClose: () => void;
  onConfirm: (deleteEverywhere: boolean) => void;
}

export function DeleteConfirmModal({ task, onClose, onConfirm }: DeleteConfirmModalProps) {
  const isHabit = Boolean(
    task.isHabit ||
    task.isQuickHabit ||
    task.isTracked2166 ||
    task.id.includes('habit-') ||
    task.id.includes('task-custom-') ||
    task.id.includes('custom-habit-')
  );

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md max-h-[88dvh] sm:max-h-[84vh] flex flex-col bg-[#001830] border border-red-500/50 rounded-3xl shadow-[0_0_40px_rgba(239,68,68,0.2)] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
          title="Cerrar (Volver atrás)"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h2 className="text-xl font-black text-white text-center mb-2">¿Eliminar Tarea?</h2>
          <p className="text-center text-slate-300 text-sm mb-6">
            Estás a punto de eliminar <strong className="text-white">"{task.title}"</strong>.
          </p>

          {isHabit && (
            <div className="bg-orange-950/40 border border-orange-500/30 rounded-xl p-4 mb-6">
              <h3 className="text-orange-400 font-black text-sm mb-1 flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" /> Regla de 21 / 66 Días
              </h3>
              <p className="text-orange-200/80 text-xs text-center">
                Esta misión o hábito está programada para cumplir la regla de consistencia (21 o 66 días). 
                Si la eliminas o la reprogramas, podrías afectar tu progreso y racha acumulada.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {isHabit && (
              <button
                onClick={() => onConfirm(true)}
                className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black border border-red-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-5 h-5" />
                Eliminar Hábito Permanentemente
              </button>
            )}
            
            <button
              onClick={() => onConfirm(false)}
              className={`w-full py-3 rounded-xl ${isHabit ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black border border-red-500/30'} transition-all flex items-center justify-center gap-2 cursor-pointer`}
            >
              <Trash2 className="w-5 h-5" />
              {isHabit ? 'Eliminar SOLO por HOY' : 'Eliminar Misión'}
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-blue-900/20 hover:bg-blue-800/40 text-blue-300 font-black border border-blue-500/30 transition-all cursor-pointer"
            >
              Cancelar (Volver)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
