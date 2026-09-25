import React, { useMemo } from 'react';
import { AlertTriangle, Trash2, X, Calendar, Flame, ShieldAlert, Award } from 'lucide-react';
import { TaskItem, HabitMasteryRecord } from '../types';
import { getHabitBaseId } from '../intelligence/masteryEngine';
import { formatDateForDisplay } from '../utils/date';

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
  if (!isOpen) return null;

  // Filter tasks that have 21/66 tracking or active streaks
  const trackedItems = useMemo(() => {
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

  const hasHighStreakWarning = trackedItems.some((item) => item.streak > 0 || item.isTracked2166);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] flex flex-col bg-[#001830] border border-red-500/50 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.25)] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
          title="Cerrar (Volver atrás)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Trash2 className="w-8 h-8 text-red-400" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white text-center mb-2 tracking-wide">
            ¿Limpiar Misiones del Día?
          </h2>

          <p className="text-center text-slate-300 text-sm mb-5 leading-relaxed">
            Estás a punto de cancelar las{' '}
            <strong className="text-white font-bold">{tasks.length} misiones</strong> programadas para el{' '}
            <span className="text-cyan-300 font-bold">{formatDateForDisplay(currentDate)}</span>.
          </p>

          {/* 21 / 66 Days Streak Warning */}
          {hasHighStreakWarning && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 mb-5 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-black text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 animate-bounce" />
                <span>Advertencia: Regla de 21 / 66 Días</span>
              </div>

              <p className="text-amber-200/90 text-xs sm:text-sm leading-relaxed mb-3">
                Tienes hábitos programados para la regla de consistencia y maestría (21 o 66 días). Si limpias las misiones de hoy porque necesitas el tiempo para otra actividad urgente, ten en cuenta que no se registrará avance hoy para estos hábitos:
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {trackedItems.map((item, idx) => (
                  <div
                    key={item.id ? `${item.id}-${idx}` : `clear-item-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#001224]/80 border border-amber-500/30 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="text-white font-bold truncate">{item.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.streak > 0 ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 font-black border border-orange-500/30">
                          <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                          {item.streak} {item.streak === 1 ? 'día' : 'días'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                          21/66 Días
                        </span>
                      )}

                      {item.isMastered ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/30">
                          Maestría (66+)
                        </span>
                      ) : item.isFormed ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                          Formado (21+)
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-amber-300/70 mt-3 italic">
                * Puedes volver a restablecer las misiones predeterminadas en cualquier momento usando el botón "Restablecer Día".
              </p>
            </div>
          )}

          {!hasHighStreakWarning && (
            <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4 mb-5 text-xs text-blue-200/90 leading-relaxed">
              Al limpiar el día, la lista de misiones quedará despejada para que puedas enfocarte en tus otras prioridades. Siempre podrás pulsar <strong className="text-white">"Restablecer Día"</strong> si deseas recuperar la plantilla habitual de tareas.
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onConfirm}
              className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white font-black shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Trash2 className="w-5 h-5" />
              Sí, Limpiar Misiones de Hoy
            </button>

            <button
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-slate-300 hover:text-white font-bold border border-slate-700 transition-all cursor-pointer text-sm"
            >
              Cancelar (Conservar Misiones)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
