import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Clock, X, CheckCircle2 } from 'lucide-react';
import { TaskItem } from '../../types';

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
  if (!isOpen) return null;

  const duration = calculateSleepHours(sleepBedtime, sleepWakeTime);
  const quality = duration >= 7 ? 'Excelente' : duration >= 6 ? 'Buena' : 'Corta';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl bg-gray-950/90 border border-indigo-500/40 shadow-2xl shadow-indigo-950/50"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">Registro de Sueño y Descanso</h3>
              <p className="text-xs text-gray-400">
                {sleepTargetTask ? sleepTargetTask.title : 'Calibra tus ciclos circadianos'}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Hora de acostarse
                </label>
                <input
                  type="time"
                  value={sleepBedtime}
                  onChange={(e) => setSleepBedtime(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Hora de despertar
                </label>
                <input
                  type="time"
                  value={sleepWakeTime}
                  onChange={(e) => setSleepWakeTime(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-300 block">Duración estimada</span>
                <span className="text-2xl font-bold text-white font-mono">{duration} hrs</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-indigo-300 block">Calificación</span>
                <span className={`text-sm font-semibold ${quality === 'Excelente' ? 'text-emerald-400' : quality === 'Buena' ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {quality}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium text-sm transition-colors border border-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Guardar y Registrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
