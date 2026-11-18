import React, { useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, Calendar, Flame, ShieldAlert, Award } from 'lucide-react';
import { TaskItem, HabitMasteryRecord } from '../types';
import { getHabitBaseId } from '../intelligence/masteryEngine';
import { formatDateForDisplay } from '../utils/date';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface ClearDayConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentDate: string;
  tasks: TaskItem[];
  habitMastery: Record<string, HabitMasteryRecord>;
}

export const ClearDayConfirmModal: React.FC<ClearDayConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentDate,
  tasks,
  habitMastery,
}) => {
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  // Filter tasks that have 21/66 tracking or active streaks (Keep before conditional return)
  const trackedItems = useMemo(() => {
    if (!tasks || !habitMastery) return [];
    return tasks
      .filter((t) => {
        if (t.isTracked2166) return true;
        const baseId = getHabitBaseId(t);
        const record = habitMastery[baseId] || habitMastery[t.id];
        if (record && record.currentStreak > 0) return true;
        if (t.isHabit) return true;
        return false;
      })
      .map((t) => {
        const baseId = getHabitBaseId(t);
        const record = habitMastery[baseId] || habitMastery[t.id];
        const streak = record?.currentStreak || 0;
        const target = streak < 21 ? 21 : 66;
        const isMastered = record?.isMastered || streak >= 66;
        const isFormed = record?.isMaltzReached || streak >= 21;

        return {
          id: t.id,
          title: t.title,
          category: t.category,
          streak,
          target,
          isFormed,
          isMastered,
          isTracked2166: t.isTracked2166 || false,
        };
      });
  }, [tasks, habitMastery]);

  if (!isOpen) return null;

  const hasHighStreakWarning = trackedItems.some((item) => item.streak > 0 || item.isTracked2166);

  const handleConfirmAction = () => {
    soundFX.playClick();
    triggerHaptic([50, 100]);
    onConfirm();
  };

  const handleCloseAction = () => {
    soundFX.playClick();
    triggerHaptic(15);
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[185] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={handleCloseAction}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-day-modal-title"
        className="relative isolate w-full max-w-lg max-h-[90dvh] flex flex-col bg-[#030712]/[0.98] border border-rose-500/40 rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" aria-hidden="true" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleCloseAction}
          className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer absolute top-4 right-4 z-20"
          title="Cerrar (Esc)"
          aria-label="Cerrar confirmación de limpieza de día"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-7 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/35 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-rose-400" />
          </div>

          <h2 id="clear-day-modal-title" className="text-xl sm:text-2xl font-anton uppercase tracking-wider text-white text-center mb-2">
            ¿Limpiar Tareas del Día?
          </h2>

          <p className="text-center text-slate-300 text-sm mb-5 leading-relaxed">
            Se cancelarán las{' '}
            <strong className="text-white font-mono tabular-nums font-bold">{tasks.length} tareas</strong> del{' '}
            <span className="aura-text-soft font-bold">{formatDateForDisplay(currentDate)}</span>.
          </p>

          {/* 21 / 66 Days Streak Warning */}
          {hasHighStreakWarning && (
            <div className="bg-amber-950/35 border border-amber-500/40 rounded-2xl p-4 sm:p-5 mb-5">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-anton uppercase tracking-wider text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 animate-bounce" />
                <span>Advertencia: Regla 21/66 Días</span>
              </div>

              <p className="text-amber-200/90 text-xs sm:text-sm leading-relaxed mb-3">
                ⚠️ Tienes hábitos de 21/66d activos hoy. Si los limpias sin completarlos, pausarás tu racha si no usas un Escudo:
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {trackedItems.map((item, idx) => (
                  <div
                    key={item.id ? `${item.id}-${idx}` : `clear-item-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#040814]/80 border border-amber-500/30 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="text-white font-bold truncate">{item.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.streak > 0 ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 font-mono tabular-nums font-bold border border-orange-500/30">
                          <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                          {item.streak} {item.streak === 1 ? 'día' : 'días'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg aura-bg-soft aura-text-soft font-mono font-bold border aura-border-subtle">
                          21/66 Días
                        </span>
                      )}

                      {item.isMastered ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                          Maestría (66+)
                        </span>
                      ) : item.isFormed ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                          Formado (21+)
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-amber-300/70 mt-3 italic">
                * Puedes restaurar tus tareas habituales con "Restablecer Día".
              </p>
            </div>
          )}

          {!hasHighStreakWarning && (
            <div className="bg-[#040814]/80 border border-white/10 rounded-2xl p-4 mb-5 text-xs text-slate-300 leading-relaxed">
              La lista del día quedará en blanco. Tu historial previo se mantiene intacto y puedes usar <strong className="text-white">"Restablecer Día"</strong> cuando quieras.
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleConfirmAction}
              aria-label="Confirmar y limpiar tareas de hoy"
              className="chicle-btn optic-active-card w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-anton uppercase tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.35)] flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Sí, Limpiar Tareas de Hoy
            </button>

            <button
              type="button"
              onClick={handleCloseAction}
              aria-label="Cancelar limpieza y conservar tareas"
              className="chicle-btn w-full py-3.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white font-anton uppercase tracking-wider cursor-pointer text-xs sm:text-sm"
            >
              Cancelar (Conservar Tareas)
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
};
