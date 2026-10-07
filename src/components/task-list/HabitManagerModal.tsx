import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Flame, 
  Trash2, 
  Edit3, 
  Plus, 
  Zap, 
  Calendar, 
  Check, 
  Search, 
  Clock, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { CustomHabit } from '../../types';
import { soundFX } from '../../utils/audio';
import { useTaskStore } from '../../store/useTaskStore';
import { getTodayDateString } from '../../utils/date';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'habits2166' | 'agenda'>('all');

  if (!isOpen) return null;

  // Counts
  const habits2166Count = useMemo(() => {
    return customHabits.filter(h => Boolean(h.isTracked2166 || h.isQuickHabit)).length;
  }, [customHabits]);

  const agendaCount = useMemo(() => {
    return customHabits.filter(h => !h.isTracked2166 && !h.isQuickHabit).length;
  }, [customHabits]);

  // Filtered List
  const filteredHabits = useMemo(() => {
    return customHabits.filter(h => {
      const is2166 = Boolean(h.isTracked2166 || h.isQuickHabit);
      if (activeFilter === 'habits2166' && !is2166) return false;
      if (activeFilter === 'agenda' && is2166) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = (h.title || '').toLowerCase().includes(q);
        const matchesCat = (h.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat) return false;
      }
      return true;
    });
  }, [customHabits, activeFilter, searchTerm]);

  // Toggle 21/66d Habit Tracking Mode (Option 1 Core Switch)
  const handleToggle2166 = (habit: CustomHabit) => {
    soundFX.playClick();
    const isCurrently2166 = Boolean(habit.isTracked2166 || habit.isQuickHabit);
    const nextState = !isCurrently2166;

    const updated = customHabits.map((h) => {
      if (h.id === habit.id) {
        return {
          ...h,
          isQuickHabit: nextState,
          isTracked2166: nextState,
        };
      }
      return h;
    });
    onSaveHabits(updated);
  };

  const handleDeleteHabit = (habitId: string) => {
    soundFX.playClick();
    const updated = customHabits.filter((h) => h.id !== habitId);
    onSaveHabits(updated);
  };

  const formatDaysText = (habit: CustomHabit): string => {
    if (habit.frequencyType === 'specific_days' && habit.specificDays && habit.specificDays.length > 0) {
      if (habit.specificDays.length === 7) return 'Todos los días';
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return habit.specificDays.map(d => dayNames[d]).filter(Boolean).join(', ');
    }
    return 'Diario';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl p-4 sm:p-6 rounded-2xl bg-gray-950/95 border border-cyan-500/40 shadow-2xl shadow-cyan-950/50 max-h-[90vh] flex flex-col font-sans text-white"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-start gap-3 mb-4 pr-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-display flex items-center gap-2">
                <span>Gestor Unificado de Rutinas y Hábitos</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Controla todas tus actividades recurrentes. Elige con 1-clic cuáles van al Check Rápido (21/66d) y cuáles a tu Agenda por días.
              </p>
            </div>
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
            <div 
              onClick={() => setActiveFilter('habits2166')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                activeFilter === 'habits2166' 
                  ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]' 
                  : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">Hábitos 21/66d</span>
              </div>
              <span className="text-sm font-mono font-black text-amber-200 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/40">
                {habits2166Count}
              </span>
            </div>

            <div 
              onClick={() => setActiveFilter('agenda')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                activeFilter === 'agenda' 
                  ? 'bg-indigo-950/40 border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.2)]' 
                  : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300">Recordatorios Agenda</span>
              </div>
              <span className="text-sm font-mono font-black text-indigo-200 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-500/40">
                {agendaCount}
              </span>
            </div>
          </div>

          {/* Search & Filter Pills */}
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar rutina o hábito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-xl border border-gray-800 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-cyan-500 text-black font-bold shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Todos ({customHabits.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('habits2166')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'habits2166'
                    ? 'bg-amber-500 text-black font-bold shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ⚡ 21/66d ({habits2166Count})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('agenda')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'agenda'
                    ? 'bg-indigo-500 text-white font-bold shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                📅 Agenda ({agendaCount})
              </button>
            </div>
          </div>

          {/* Scrollable Habits / Routines List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
            {filteredHabits.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs italic bg-gray-900/30 rounded-2xl border border-dashed border-gray-800">
                {searchTerm
                  ? 'No se encontraron rutinas o hábitos coincidentes.'
                  : activeFilter === 'habits2166'
                  ? 'No tienes hábitos de 21/66 días activos. Activa el interruptor ⚡ en cualquier rutina inferior.'
                  : activeFilter === 'agenda'
                  ? 'No tienes recordatorios de agenda sin rastreo 21/66d.'
                  : 'No tienes actividades recurrentes registradas. Haz clic en "+ Nueva Rutina / Hábito" para comenzar.'}
              </div>
            ) : (
              filteredHabits.map((habit) => {
                const is2166 = Boolean(habit.isTracked2166 || habit.isQuickHabit);
                const daysText = formatDaysText(habit);

                return (
                  <div
                    key={habit.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      is2166
                        ? 'bg-gradient-to-r from-gray-900/90 via-amber-950/20 to-gray-900/90 border-amber-500/30 hover:border-amber-500/50'
                        : 'bg-gray-900/60 border-gray-800 hover:border-indigo-500/40'
                    }`}
                  >
                    {/* Left: Icon & Details */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="text-xl p-2 rounded-xl bg-gray-950 border border-gray-800 shrink-0">
                        {habit.quickIcon || (is2166 ? '⚡' : '📅')}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white truncate">{habit.title}</h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border uppercase font-semibold ${
                            is2166
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                              : 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50'
                          }`}>
                            {habit.category || 'rutina'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-400 font-mono mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-cyan-300">
                            <Calendar className="w-3 h-3 text-cyan-400" />
                            {daysText}
                          </span>
                          
                          {habit.timeBlock && (
                            <span className="flex items-center gap-1 text-indigo-300">
                              <Clock className="w-3 h-3 text-indigo-400" />
                              {habit.timeBlock}
                            </span>
                          )}

                          {habit.targetCount && habit.targetCount > 1 ? (
                            <span className="text-amber-400 font-bold">
                              Meta: {habit.targetCount} {habit.unit || 'veces'}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Right: 1-Click 21/66d Toggle Switch & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/60 shrink-0">
                      {/* Interactive Switch (Option 1 Core Element) */}
                      <button
                        type="button"
                        onClick={() => handleToggle2166(habit)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border active:scale-95 ${
                          is2166
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:bg-amber-500/30'
                            : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:text-gray-200 hover:border-gray-600'
                        }`}
                        title={
                          is2166
                            ? 'Hábito de disciplina 21/66d activo (se muestra en la barra de Check Rápido y acumula racha)'
                            : 'Rutina de agenda sin seguimiento 21/66d (se muestra en la agenda diaria sin barra superior)'
                        }
                      >
                        {is2166 ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-amber-400" />
                            <span>⚡ Hábito 21/66d</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-gray-500" />
                            <span>📅 Recordatorio Agenda</span>
                          </>
                        )}
                      </button>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-1">
                        {onEditHabit && (
                          <button
                            onClick={() => {
                              onClose();
                              onEditHabit(habit);
                            }}
                            className="p-1.5 text-cyan-400 hover:text-white rounded-lg hover:bg-cyan-950/60 border border-cyan-500/30 transition-colors cursor-pointer"
                            title="Editar detalles y días"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-950/40 border border-transparent hover:border-red-500/40 transition-colors cursor-pointer"
                          title="Eliminar rutina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenAddModal(true);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs sm:text-sm font-mono transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Nueva Rutina / Hábito
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold text-xs sm:text-sm transition-colors border border-gray-800 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
