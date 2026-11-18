import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, Calendar } from 'lucide-react';
import { TaskItem } from '../types';
import { useTaskStore } from '../store/useTaskStore';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface DeleteConfirmModalProps {
  task: TaskItem;
  onClose: () => void;
  onConfirm: (deleteEverywhere: boolean) => void;
}

export function DeleteConfirmModal({ task, onClose, onConfirm }: DeleteConfirmModalProps) {
  useEffect(() => {
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundFX.playClick();
        triggerHaptic(15);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const customHabits = useTaskStore.getState().customHabits || [];
  const taskTitleNorm = (task.title || '').toLowerCase().trim();
  const matchesCustomHabit = customHabits.some(
    h => h.id === task.id || (h.title || '').toLowerCase().trim() === taskTitleNorm
  );

  const isHabit = Boolean(
    task.isHabit ||
    task.isQuickHabit ||
    task.isTracked2166 ||
    task.id.includes('habit-') ||
    task.id.includes('task-custom-') ||
    task.id.includes('custom-habit-') ||
    task.id.includes('oracle-task-') ||
    task.id.includes('hab-') ||
    matchesCustomHabit
  );

  const handleConfirmAction = (deleteEverywhere: boolean) => {
    soundFX.playClick();
    triggerHaptic([50, 100]);
    onConfirm(deleteEverywhere);
  };

  const handleCloseAction = () => {
    soundFX.playClick();
    triggerHaptic(15);
    onClose();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[185] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={handleCloseAction}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-modal-title"
        className="relative isolate w-full max-w-md max-h-[88dvh] sm:max-h-[84vh] flex flex-col bg-[#030712]/[0.98] border border-rose-500/40 rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" aria-hidden="true" />

        <button
          type="button"
          onClick={handleCloseAction}
          className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer absolute top-4 right-4 z-20"
          title="Cerrar (Esc)"
          aria-label="Cerrar confirmación de eliminación"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/35 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>
          
          <h2 id="delete-confirm-modal-title" className="text-xl font-anton uppercase tracking-wider text-white text-center mb-2">¿Eliminar Tarea?</h2>
          <p className="text-center text-slate-300 text-sm mb-6">
            Estás a punto de eliminar <strong className="text-white">"{task.title}"</strong>.
          </p>

          {isHabit && (
            <div className="bg-amber-950/35 border border-amber-500/35 rounded-2xl p-4 mb-6">
              <h3 className="text-amber-400 font-anton uppercase tracking-wider text-xs mb-1 flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" /> Regla 21/66 Días
              </h3>
              <p className="text-amber-200/85 text-xs text-center">
                ⚠️ Vinculado a la regla 21/66d. Eliminarlo pausará el avance de racha de este hábito.
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            {isHabit && (
              <button
                type="button"
                onClick={() => handleConfirmAction(true)}
                aria-label={`Eliminar hábito ${task.title} permanentemente`}
                className="chicle-btn optic-active-card w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-anton uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(225,29,72,0.35)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Hábito Permanentemente
              </button>
            )}
            
            <button
              type="button"
              onClick={() => handleConfirmAction(false)}
              aria-label={isHabit ? `Eliminar ${task.title} solo por hoy` : `Eliminar tarea ${task.title}`}
              className={`chicle-btn w-full py-3 px-4 rounded-xl font-anton uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer ${
                isHabit
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40'
                  : 'optic-active-card bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.35)]'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {isHabit ? 'Eliminar SOLO por HOY' : 'Eliminar Tarea'}
            </button>

            <button
              type="button"
              onClick={handleCloseAction}
              aria-label="Cancelar eliminación y volver atrás"
              className="chicle-btn w-full py-3 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white font-anton uppercase tracking-wider text-xs cursor-pointer"
            >
              Cancelar (Volver)
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
