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
  // Listener de tecla Escape para accesibilidad
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundFX.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const duration = calculateSleepHours(sleepBedtime, sleepWakeTime);
  const quality = duration >= 7 ? 'Excelente' : duration >= 6 ? 'Buena' : 'Corta';
  const cycles = (duration / 1.5).toFixed(1);

  const modalContent = (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="sleep-modal-title"
        className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md portal-modal-root select-none font-sans"
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
          className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl sm:rounded-3xl bg-[#030712]/95 border border-indigo-500/40 shadow-2xl shadow-indigo-950/50 text-white backdrop-blur-2xl"
        >
          <span className="vi-grano opacity-5" aria-hidden="true" />
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            aria-label="Cerrar modal de sueño"
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <h3 id="sleep-modal-title" className="text-lg sm:text-xl font-anton uppercase tracking-wide text-white">Registro de Sueño y Descanso</h3>
              <p className="text-xs text-gray-400 font-mono">
                {sleepTargetTask ? sleepTargetTask.title : 'Calibra tus ciclos circadianos'}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#010810]/80 border border-white/10">
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Hora de acostarse
                </label>
                <input
                  type="time"
                  value={sleepBedtime}
                  aria-label="Hora de acostarse"
                  onChange={(e) => setSleepBedtime(e.target.value)}
                  className="w-full bg-[#020712] border border-white/15 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#010810]/80 border border-white/10">
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Hora de despertar
                </label>
                <input
                  type="time"
                  value={sleepWakeTime}
                  aria-label="Hora de despertar"
                  onChange={(e) => setSleepWakeTime(e.target.value)}
                  className="w-full bg-[#020712] border border-white/15 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-300 block font-mono">Duración estimada</span>
                <span className="text-2xl font-bold text-white font-mono">{duration} hrs</span>
                <span className="text-[10px] text-indigo-200/80 font-mono block">≈ {cycles} ciclos REM (90m c/u)</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-indigo-300 block font-mono">Calificación</span>
                <span className={`text-sm font-semibold ${quality === 'Excelente' ? 'text-emerald-400' : quality === 'Buena' ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {quality}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {duration >= 7 ? '✓ Recuperación óptima' : duration >= 6 ? 'Suficiente' : '⚠️ Descanso corto'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-300 hover:text-white font-anton uppercase text-xs tracking-wider transition-colors border border-white/10 cursor-pointer active:scale-95 text-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playLevelUp();
                onSave();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-anton uppercase text-xs tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Guardar y Registrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
