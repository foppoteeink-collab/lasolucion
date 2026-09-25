import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Trash2, Edit3, Plus, Zap, Sparkles } from 'lucide-react';
import { CustomHabit } from '../../types';

interface HabitManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customHabits: CustomHabit[];
  onSaveHabits: (habits: CustomHabit[]) => void;
  onOpenAddModal: (isQuick?: boolean) => void;
  onEditHabit?: (habit: CustomHabit) => void;
}

export const HabitManagerModal: React.FC<HabitManagerModalProps> = ({
  isOpen,
  onClose,
  customHabits,
  onSaveHabits,
  onOpenAddModal,
  onEditHabit,
}) => {
  if (!isOpen) return null;

  const handleDeleteHabit = (habitId: string) => {
    const updated = customHabits.filter((h) => h.id !== habitId);
    onSaveHabits(updated);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg p-6 rounded-2xl bg-gray-950/95 border border-purple-500/30 shadow-2xl shadow-purple-950/40 max-h-[85vh] flex flex-col"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">Matriz de Hábitos Diarios</h3>
              <p className="text-xs text-gray-400">Gestiona tus rutinas automáticas y protocolo 21/66</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 my-3 pr-1">
            {customHabits.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No tienes hábitos personalizados registrados.
              </div>
            ) : (
              customHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between hover:border-purple-500/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl p-2 rounded-lg bg-purple-950/50 border border-purple-500/20">{habit.quickIcon || '⚡'}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{habit.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-purple-400/90 font-mono mt-0.5">
                        <span className="capitalize">{habit.category || 'rutina'}</span>
                        <span>•</span>
                        <span>{habit.frequencyType === 'specific_days' ? 'Días específicos' : 'Diario'}</span>
                        {habit.targetCount && habit.targetCount > 1 ? (
                          <>
                            <span>•</span>
                            <span className="text-cyan-400 font-bold">{habit.targetCount} {habit.unit || 'veces'}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {onEditHabit && (
                      <button
                        onClick={() => {
                          onClose();
                          onEditHabit(habit);
                        }}
                        className="p-2 text-purple-300 hover:text-white rounded-lg hover:bg-purple-500/20 transition-colors border border-purple-500/20"
                        title="Editar hábito"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Eliminar hábito"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-gray-800 flex gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenAddModal(true);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-semibold text-sm transition-all border border-purple-500/30 flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50"
            >
              <Zap className="w-4 h-4 text-purple-400" />
              Nuevo Hábito Personalizado
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium text-sm transition-colors border border-gray-800"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
