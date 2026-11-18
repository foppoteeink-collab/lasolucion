import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { triggerHaptic } from '../../utils/haptics';

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
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);

  // Counts
  const habits2166Count = useMemo(() => {
    return (customHabits || []).filter(h => Boolean(h.isTracked2166 || h.isQuickHabit)).length;
  }, [customHabits]);

  const agendaCount = useMemo(() => {
    return (customHabits || []).filter(h => !h.isTracked2166 && !h.isQuickHabit).length;
  }, [customHabits]);

  // Filtered List
  const filteredHabits = useMemo(() => {
    return (customHabits || []).filter(h => {
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

  // Cerrar con Escape + ocultar flotantes
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Toggle 21/66d Habit Tracking Mode (Option 1 Core Switch)
  const handleToggle2166 = (habit: CustomHabit) => {
    soundFX.playClick();
    triggerHaptic([30, 45]);
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
    triggerHaptic([40, 60]);
    setDeletingHabitId(null);
    const habit = customHabits.find(h => h.id === habitId);
    const updated = customHabits.filter((h) => h.id !== habitId);
    onSaveHabits(updated);

    if (habit) {
      const targetTitle = (habit.title || '').toLowerCase().trim();
      const taskStore = useTaskStore.getState();
      const updatedTasksByDate = { ...taskStore.tasksByDate };
      let modified = false;
      Object.keys(updatedTasksByDate).forEach(dateKey => {
        const list = updatedTasksByDate[dateKey] || [];
        const pruned = list.filter(t => 
          t.id !== habitId && 
          (t.title || '').toLowerCase().trim() !== targetTitle
        );
        if (pruned.length !== list.length) {
          updatedTasksByDate[dateKey] = pruned;
          modified = true;
        }
      });
      if (modified) {
        taskStore.setTasksByDate(updatedTasksByDate);
      }
    }
  };

  const formatDaysText = (habit: CustomHabit): string => {
    if (habit.frequencyType === 'specific_days' && habit.specificDays && habit.specificDays.length > 0) {
      if (habit.specificDays.length === 7) return 'Todos los días';
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return habit.specificDays.map(d => dayNames[d]).filter(Boolean).join(', ');
    }
    return 'Diario';
  };

  const modalContent = (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[170] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-sans portal-modal-root"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="habit-manager-modal-title"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative isolate w-full max-w-2xl flex flex-col rounded-2xl sm:rounded-3xl bg-[#030712]/[0.98] border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.75)] max-h-[90vh] overflow-hidden text-white text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Micrograno táctil Moxen Vidrio */}
          <span className="vi-grano opacity-5" aria-hidden="true" />
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-white/10 bg-[#040814]/[0.96] shrink-0 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl aura-bg-soft border aura-border-subtle flex items-center justify-center aura-text-primary aura-glow-subtle shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 id="habit-manager-modal-title" className="text-sm sm:text-base font-anton uppercase tracking-wider text-white truncate flex items-center gap-2">
                  <span>Rutinas y Hábitos</span>
                  <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full aura-bg-soft aura-text-primary border aura-border-subtle font-bold shrink-0">
                    {customHabits.length} Activas
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  Organiza tus hábitos diarios (21/66d) y rutinas programadas en tu agenda
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2"
              title="Cerrar modal (Esc)"
              aria-label="Cerrar modal de hábitos"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 relative z-10 custom-scrollbar flex-1">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div 
                role="button"
                tabIndex={0}
                aria-pressed={activeFilter === 'habits2166'}
                onClick={() => {
                  soundFX.playClick();
                  triggerHaptic(15);
                  setActiveFilter('habits2166');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    soundFX.playClick();
                    triggerHaptic(15);
                    setActiveFilter('habits2166');
                  }
                }}
                className={`chicle-btn p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeFilter === 'habits2166' 
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)] optic-active-card' 
                    : 'bg-[#040814]/80 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-anton uppercase tracking-wide text-amber-300">Hábitos 21/66d</span>
                </div>
                <span className="text-sm font-mono font-black tabular-nums text-amber-200 bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
                  {habits2166Count}
                </span>
              </div>

              <div 
                role="button"
                tabIndex={0}
                aria-pressed={activeFilter === 'agenda'}
                onClick={() => {
                  soundFX.playClick();
                  triggerHaptic(15);
                  setActiveFilter('agenda');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    soundFX.playClick();
                    triggerHaptic(15);
                    setActiveFilter('agenda');
                  }
                }}
                className={`chicle-btn p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeFilter === 'agenda' 
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.2)] optic-active-card' 
                    : 'bg-[#040814]/80 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-anton uppercase tracking-wide text-indigo-300">Recordatorios Agenda</span>
                </div>
                <span className="text-sm font-mono font-black tabular-nums text-indigo-200 bg-indigo-950/80 px-2.5 py-0.5 rounded-lg border border-indigo-500/40">
                  {agendaCount}
                </span>
              </div>
            </div>

            {/* Search & Filter Pills */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar rutina o hábito..."
                  aria-label="Buscar rutina o hábito"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#040814]/90 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:aura-border-primary transition-colors shadow-inner font-mono"
                />
              </div>

              <div role="tablist" aria-label="Filtros de rutinas y hábitos" className="flex items-center gap-1 bg-[#040814]/90 p-1 rounded-xl border border-white/10 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === 'all'}
                  onClick={() => {
                    soundFX.playClick();
                    triggerHaptic(15);
                    setActiveFilter('all');
                  }}
                  className={`chicle-btn px-2.5 py-1 rounded-lg text-xs font-anton uppercase tracking-wider transition-all cursor-pointer tabular-nums ${
                    activeFilter === 'all'
                      ? 'aura-btn-gradient optic-active-card font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({customHabits.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === 'habits2166'}
                  onClick={() => {
                    soundFX.playClick();
                    triggerHaptic(15);
                    setActiveFilter('habits2166');
                  }}
                  className={`chicle-btn px-2.5 py-1 rounded-lg text-xs font-anton uppercase tracking-wider transition-all cursor-pointer tabular-nums ${
                    activeFilter === 'habits2166'
                      ? 'bg-amber-400 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)] optic-active-card'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ 21/66d ({habits2166Count})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === 'agenda'}
                  onClick={() => {
                    soundFX.playClick();
                    triggerHaptic(15);
                    setActiveFilter('agenda');
                  }}
                  className={`chicle-btn px-2.5 py-1 rounded-lg text-xs font-anton uppercase tracking-wider transition-all cursor-pointer tabular-nums ${
                    activeFilter === 'agenda'
                      ? 'bg-indigo-500 text-white font-bold shadow-[0_0_10px_rgba(99,102,241,0.4)] optic-active-card'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📅 Agenda ({agendaCount})
                </button>
              </div>
            </div>

            {/* Scrollable Habits / Routines List */}
            <div className="space-y-2.5 my-2 pr-1">
              {filteredHabits.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs italic bg-[#040814]/60 rounded-2xl border border-dashed border-white/10 font-mono">
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
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden ${
                        is2166
                          ? 'bg-[#040a1a]/[0.94] border-amber-500/35 hover:border-amber-400/60 shadow-[0_6px_20px_rgba(245,158,11,0.1)]'
                          : 'bg-[#040814]/80 border-white/10 hover:border-white/25'
                      }`}
                    >
                      {/* Inline Cascade Deletion Confirmation Safeguard */}
                      {deletingHabitId === habit.id && (
                        <div 
                          className="absolute inset-0 bg-rose-950/[0.98] border border-rose-500/60 rounded-2xl flex items-center justify-between px-3.5 py-2 z-20 animate-fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[11px] font-bold text-rose-200 truncate pr-2">
                            ¿Eliminar hábito y sus tareas asociadas en agenda?
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                soundFX.playClick();
                                setDeletingHabitId(null);
                              }}
                              className="chicle-btn px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-200 hover:text-white bg-white/10 border border-white/15 cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteHabit(habit.id);
                              }}
                              className="chicle-btn optic-active-card px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Left: Icon & Details */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="text-xl p-2 rounded-xl bg-black/50 border border-white/10 shrink-0">
                          {habit.quickIcon || (is2166 ? '⚡' : '📅')}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-anton uppercase tracking-wide text-white truncate">{habit.title}</h4>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border uppercase font-semibold ${
                              is2166
                                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                                : 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50'
                            }`}>
                              {habit.category || 'rutina'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1 flex-wrap">
                            <span className="flex items-center gap-1 aura-text-primary">
                              <Calendar className="w-3 h-3 aura-text-primary" />
                              {daysText}
                            </span>
                            
                            {habit.timeBlock && (
                              <span className="flex items-center gap-1 text-indigo-300 tabular-nums">
                                <Clock className="w-3 h-3 text-indigo-400" />
                                {habit.timeBlock}
                              </span>
                            )}

                            {habit.targetCount && habit.targetCount > 1 ? (
                              <span className="text-amber-400 font-bold tabular-nums">
                                Meta: {habit.targetCount} {habit.unit || 'veces'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Right: 1-Click 21/66d Toggle Switch & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 shrink-0">
                        {/* Interactive Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggle2166(habit)}
                          className={`chicle-btn flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                            is2166
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:bg-amber-500/30 optic-active-card'
                              : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-slate-200 hover:border-white/25'
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
                              <ToggleLeft className="w-4 h-4 text-slate-500" />
                              <span>📅 Recordatorio Agenda</span>
                            </>
                          )}
                        </button>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1">
                          {onEditHabit && (
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playClick();
                                onClose();
                                onEditHabit(habit);
                              }}
                              className="chicle-btn p-1.5 aura-text-primary hover:text-white rounded-xl hover:bg-white/[0.08] border aura-border-subtle transition-colors cursor-pointer"
                              title={`Editar detalles de ${habit.title}`}
                              aria-label={`Editar detalles de ${habit.title}`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playClick();
                              triggerHaptic(20);
                              setDeletingHabitId(habit.id);
                            }}
                            className="chicle-btn p-1.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-950/40 border border-transparent hover:border-rose-500/40 transition-colors cursor-pointer"
                            title={`Eliminar rutina ${habit.title}`}
                            aria-label={`Eliminar rutina ${habit.title}`}
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
          </div>

          {/* Sticky Footer Controls (Ergonomía del Pulgar) */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-[#040814]/[0.96] shrink-0 flex items-center gap-2.5 relative z-10">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              aria-label="Volver y cerrar modal de hábitos"
              className="chicle-btn flex-1 sm:flex-none sm:px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-200 hover:text-white font-anton uppercase text-xs tracking-wider transition-all border border-white/15 cursor-pointer text-center"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                triggerHaptic(25);
                onClose();
                onOpenAddModal(activeFilter === 'agenda' ? ('weekly_reminder' as any) : true);
              }}
              aria-label="Crear nueva rutina o hábito"
              className="chicle-btn aura-btn-gradient optic-active-card flex-[2] py-2.5 px-4 rounded-xl font-anton uppercase tracking-wider text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <Plus className="w-4 h-4" />
              <span>{activeFilter === 'agenda' ? '+ Nuevo Recordatorio Semanal' : '+ Nueva Rutina / Hábito'}</span>
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
