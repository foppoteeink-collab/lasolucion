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

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const modalContent = (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[180] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl flex flex-col rounded-2xl sm:rounded-3xl bg-[#030712]/95 border border-cyan-500/35 shadow-[0_0_50px_rgba(0,240,255,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] max-h-[90vh] overflow-hidden backdrop-blur-2xl text-white text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Micrograno táctil Moxen Vidrio */}
          <span className="vi-grano opacity-5" aria-hidden="true" />

          {/* Luces de ambiente cyberpunk */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-white/10 bg-[#010810]/80 shrink-0 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-950 to-[#021824] border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.35)] shrink-0">
                <Zap className="w-5 h-5 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-anton uppercase tracking-wide text-white truncate flex items-center gap-2">
                  <span>Rutinas y Hábitos</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-400/50 font-bold shrink-0">
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
              className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2 active:scale-95"
              title="Cerrar modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 relative z-10 custom-scrollbar flex-1">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div 
                onClick={() => {
                  soundFX.playClick();
                  setActiveFilter('habits2166');
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeFilter === 'habits2166' 
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : 'bg-[#020712]/80 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-anton uppercase tracking-wide text-amber-300">Hábitos 21/66d</span>
                </div>
                <span className="text-sm font-mono font-black text-amber-200 bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
                  {habits2166Count}
                </span>
              </div>

              <div 
                onClick={() => {
                  soundFX.playClick();
                  setActiveFilter('agenda');
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeFilter === 'agenda' 
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                    : 'bg-[#020712]/80 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-anton uppercase tracking-wide text-indigo-300">Recordatorios Agenda</span>
                </div>
                <span className="text-sm font-mono font-black text-indigo-200 bg-indigo-950/80 px-2.5 py-0.5 rounded-lg border border-indigo-500/40">
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#020712]/90 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors shadow-inner font-mono"
                />
              </div>

              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setActiveFilter('all');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-anton uppercase tracking-wider transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-cyan-400 text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({customHabits.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setActiveFilter('habits2166');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-anton uppercase tracking-wider transition-all cursor-pointer ${
                    activeFilter === 'habits2166'
                      ? 'bg-amber-400 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ 21/66d ({habits2166Count})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setActiveFilter('agenda');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-anton uppercase tracking-wider transition-all cursor-pointer ${
                    activeFilter === 'agenda'
                      ? 'bg-indigo-500 text-white font-bold shadow-[0_0_10px_rgba(99,102,241,0.4)]'
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
                <div className="text-center py-10 text-slate-500 text-xs italic bg-[#020712]/40 rounded-2xl border border-dashed border-white/10 font-mono">
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
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        is2166
                          ? 'bg-gradient-to-r from-[#0d0901] via-[#150e02] to-[#040e1b] border-amber-500/35 hover:border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                          : 'bg-[#020712]/80 border-white/10 hover:border-indigo-500/40'
                      }`}
                    >
                      {/* Left: Icon & Details */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="text-xl p-2 rounded-xl bg-black/70 border border-white/10 shrink-0">
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
                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 shrink-0">
                        {/* Interactive Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggle2166(habit)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border active:scale-95 ${
                            is2166
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:bg-amber-500/30'
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
                              className="p-1.5 text-cyan-400 hover:text-white rounded-lg hover:bg-cyan-950/60 border border-cyan-500/30 transition-colors cursor-pointer"
                              title="Editar detalles y días"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-950/40 border border-transparent hover:border-red-500/40 transition-colors cursor-pointer"
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
          </div>

          {/* Sticky Footer Controls (Ergonomía del Pulgar) */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-[#010810]/90 shrink-0 flex items-center gap-2.5 relative z-10">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="flex-1 sm:flex-none sm:px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white font-anton uppercase text-xs tracking-wider transition-all border border-white/15 cursor-pointer active:scale-95 text-center"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
                onOpenAddModal(true);
              }}
              className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-anton uppercase tracking-wider text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 chicle-btn text-center"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Rutina / Hábito</span>
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
