import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Clock, X, CheckCircle2 } from 'lucide-react';
import { TaskItem } from '../../types';
import { soundFX } from '../../utils/audio';

interface SleepScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  sleepBedtime: string;
  setSleepBedtime: (val: string) => void;
  sleepWakeTime: string;
  setSleepWakeTime: (val: string) => void;
  sleepTargetTask: TaskItem | null;
  calculateSleepHours: (bedtime: string, wakeTime: string) => number;
}

export const SleepScheduleModal: React.FC<SleepScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  sleepBedtime,
  setSleepBedtime,
  sleepWakeTime,
  setSleepWakeTime,
  sleepTargetTask,
  calculateSleepHours,
}) => {
  // Listener de tecla Escape + ocultar flotantes para accesibilidad
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundFX.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const duration = calculateSleepHours(sleepBedtime, sleepWakeTime);
  const quality = duration >= 7 ? 'Excelente' : duration >= 6 ? 'Buena' : 'Corta';
  const cycles = (duration / 1.5).toFixed(1);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="sleep-modal-title"
          className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm portal-modal-root select-none font-sans"
          onClick={() => {
            soundFX.playClick();
            onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative isolate w-full max-w-md overflow-hidden rounded-2xl sm:rounded-3xl bg-[#030712]/[0.98] border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.75)] text-white flex flex-col"
          >
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            {/* Header estructurado Obsidian */}
            <div className="p-4 sm:p-5 border-b border-white/10 bg-[#040814]/[0.96] flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl aura-bg-soft border aura-border-subtle aura-text-primary shrink-0">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 id="sleep-modal-title" className="text-base sm:text-lg font-anton uppercase tracking-wider text-white truncate">Registro de Sueño</h3>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {sleepTargetTask ? sleepTargetTask.title : 'Calibra tus ciclos circadianos'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onClose();
                }}
                aria-label="Cerrar modal de sueño"
                className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Cerrar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 relative z-10">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#040814]/80 border border-white/10">
                  <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5 font-semibold">
                    <Clock className="w-3.5 h-3.5 aura-text-primary" />
                    Acostarse
                  </label>
                  <input
                    type="time"
                    value={sleepBedtime}
                    aria-label="Hora de acostarse"
                    onChange={(e) => setSleepBedtime(e.target.value)}
                    className="w-full bg-[#030712] border border-white/15 rounded-xl px-3 py-2 text-white font-mono tabular-nums text-sm focus:outline-none focus:aura-border-primary"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#040814]/80 border border-white/10">
                  <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5 font-semibold">
                    <Clock className="w-3.5 h-3.5 aura-text-primary" />
                    Despertar
                  </label>
                  <input
                    type="time"
                    value={sleepWakeTime}
                    aria-label="Hora de despertar"
                    onChange={(e) => setSleepWakeTime(e.target.value)}
                    className="w-full bg-[#030712] border border-white/15 rounded-xl px-3 py-2 text-white font-mono tabular-nums text-sm focus:outline-none focus:aura-border-primary"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#040a1a]/[0.94] border aura-border-subtle flex items-center justify-between">
                <div>
                  <span className="text-xs aura-text-soft block font-mono">Duración estimada</span>
                  <span className="text-2xl font-bold text-white font-mono tabular-nums">{duration} hrs</span>
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums block">≈ {cycles} ciclos REM (90m c/u)</span>
                </div>
                <div className="text-right">
                  <span className="text-xs aura-text-soft block font-mono">Calificación</span>
                  <span className={`text-sm font-semibold ${quality === 'Excelente' ? 'text-emerald-400' : quality === 'Buena' ? 'aura-text-primary' : 'text-amber-400'}`}>
                    {quality}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {duration >= 7 ? '✓ Recuperación óptima' : duration >= 6 ? 'Suficiente' : '⚠️ Descanso corto'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#040814]/[0.96] flex gap-3 relative z-10">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onClose();
                }}
                className="chicle-btn flex-1 py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-200 hover:text-white font-anton uppercase text-xs tracking-wider transition-colors border border-white/15 cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playLevelUp();
                  onSave();
                }}
                className="chicle-btn aura-btn-gradient optic-active-card flex-1 py-2.5 px-4 rounded-xl font-anton uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Guardar y Registrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
