import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from '../common/Icon';
import { Mic } from 'lucide-react';
import { TaskCategory, HabitEnergyType } from '../../types';
import { HABIT_ENERGY_DETAILS, detectHabitEnergy } from '../../utils/habitEnergyDetector';
import { CATEGORY_COLORS } from '../../data/categoryColors';
import { soundFX } from '../../utils/audio';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import { getTodayDateString } from '../../utils/date';
import { countHighPriorityCompletedToday, MAX_CRITICAL_PRIORITY_CHARGES_PER_DAY } from '../../utils/level3Systems';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'task' | 'habit' | 'oracle';
  onOpenOracle?: () => void;
  onOpenTemplates?: () => void;
  editingTaskId: string | null;
  newTitle: string;
  setNewTitle: (val: string) => void;
  newCategory: TaskCategory;
  setNewCategory: (val: TaskCategory) => void;
  newStartTime: string;
  setNewStartTime: (val: string) => void;
  newEndTime: string;
  setNewEndTime: (val: string) => void;
  newXp: number;
  setNewXp: (val: number) => void;
  newCoins: number;
  setNewCoins: (val: number) => void;
  isHabitType: boolean;
  setIsHabitType: (val: boolean) => void;
  habitTarget: number;
  setHabitTarget: (val: number) => void;
  habitUnit: string;
  setNewHabitUnit: (val: string) => void; // Fixed name typo in my view
  isLegendary: boolean;
  setIsLegendary: (val: boolean) => void;
  isTracked2166: boolean;
  setIsTracked2166: (val: boolean) => void;
  isQuickHabit: boolean;
  setIsQuickHabit: (val: boolean) => void;
  quickIcon: string;
  setQuickIcon: (val: string) => void;
  formFrequency: 'once' | 'daily' | 'specific_days';
  setFormFrequency: (val: 'once' | 'daily' | 'specific_days') => void;
  formSpecificDays: number[];
  toggleSpecificDay: (dayIdx: number) => void;
  newIncomeAmount: number;
  setNewIncomeAmount: (val: number) => void;
  newNotes: string;
  setNewNotes: (val: string) => void;
  habitEnergyType: HabitEnergyType;
  setHabitEnergyType: (val: HabitEnergyType) => void;
  targetStreak?: 21 | 66;
  setTargetStreak?: (val: 21 | 66) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const daysOfWeek = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const quickEmojis = ['⚡', '💧', '🏋️', '📖', '🧘', '🥗', '🧠', '🎨', '💼', '🏃', '💊', '☕'];
const DAYS_OF_WEEK_LABELS = [
  { idx: 1, short: 'Lun', name: 'Lunes' },
  { idx: 2, short: 'Mar', name: 'Martes' },
  { idx: 3, short: 'Mié', name: 'Miércoles' },
  { idx: 4, short: 'Jue', name: 'Jueves' },
  { idx: 5, short: 'Vie', name: 'Viernes' },
  { idx: 6, short: 'Sáb', name: 'Sábado' },
  { idx: 0, short: 'Dom', name: 'Domingo' },
];

const habitPresets = [
  { label: '💧 Agua 2L', title: 'Tomar 2 Litros de Agua', icon: '💧', category: 'habito' as TaskCategory, target: 8, unit: 'vasos', energy: 'purification' as HabitEnergyType, hasCounter: true, targetStreak: 21 as const },
  { label: '🏋️ Gimnasio', title: 'Entrenamiento de Gimnasio', icon: '🏋️', category: 'entrenamiento' as TaskCategory, target: 1, unit: 'sesión', energy: 'strength' as HabitEnergyType, hasCounter: false, targetStreak: 21 as const },
  { label: '📖 Lectura', title: 'Lectura de Desarrollo', icon: '📖', category: 'estudio' as TaskCategory, target: 20, unit: 'min', energy: 'mind' as HabitEnergyType, hasCounter: true, targetStreak: 21 as const },
  { label: '🧘 Meditación', title: 'Meditación & Enfoque', icon: '🧘', category: 'habito' as TaskCategory, target: 10, unit: 'min', energy: 'discipline' as HabitEnergyType, hasCounter: true, targetStreak: 21 as const },
  { label: '🥗 Saludable', title: 'Alimentación Limpia', icon: '🥗', category: 'comida' as TaskCategory, target: 3, unit: 'comidas', energy: 'purification' as HabitEnergyType, hasCounter: true, targetStreak: 21 as const },
];

const reminderPresets = [
  { label: '📋 Revisión Semanal', title: 'Revisión y Planificación Semanal', icon: '📋', category: 'rutina' as TaskCategory, days: [0] },
  { label: '🧹 Limpieza Profunda', title: 'Limpieza y Orden General', icon: '🧹', category: 'limpieza' as TaskCategory, days: [6] },
  { label: '💳 Finanzas & Facturas', title: 'Revisión Financiera y Cierre', icon: '💳', category: 'trabajo' as TaskCategory, days: [5] },
  { label: '🌿 Mantenimiento', title: 'Mantenimiento del Hogar / Rutina', icon: '🌿', category: 'rutina' as TaskCategory, days: [2] },
];

const ENERGY_DEFAULT_ICONS: Record<HabitEnergyType, string> = {
  strength: '⚡',
  purification: '💧',
  mind: '🧠',
  discipline: '🧘',
  creativity: '🎨',
};

const EMPTY_TASKS: any[] = [];

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  initialTab,
  onOpenOracle,
  onOpenTemplates,
  editingTaskId,
  newTitle,
  setNewTitle,
  newCategory,
  setNewCategory,
  newStartTime,
  setNewStartTime,
  newEndTime,
  setNewEndTime,
  newXp,
  setNewXp,
  newCoins,
  setNewCoins,
  isHabitType,
  setIsHabitType,
  habitTarget,
  setHabitTarget,
  habitUnit,
  setNewHabitUnit,
  isLegendary,
  setIsLegendary,
  isTracked2166,
  setIsTracked2166,
  isQuickHabit,
  setIsQuickHabit,
  quickIcon,
  setQuickIcon,
  formFrequency,
  setFormFrequency,
  formSpecificDays,
  toggleSpecificDay,
  newNotes,
  setNewNotes,
  habitEnergyType,
  setHabitEnergyType,
  targetStreak = 21,
  setTargetStreak,
  onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<'task' | 'habit' | 'oracle'>(initialTab || 'task');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isIconManuallyChosen, setIsIconManuallyChosen] = useState(Boolean(editingTaskId));
  const currentViewDate = useTaskStore((s) => s.currentViewDate);
  const setCurrentViewDate = useTaskStore((s) => s.setCurrentViewDate);
  const openVoiceDictation = useUIStore((s) => s.openVoiceDictation);
  const isViewingToday = currentViewDate === getTodayDateString();
  const currentViewTasks = useTaskStore((s) => s.tasksByDate[s.currentViewDate] || EMPTY_TASKS);
  const criticalUsedToday = countHighPriorityCompletedToday(currentViewTasks);
  const criticalRemaining = Math.max(0, MAX_CRITICAL_PRIORITY_CHARGES_PER_DAY - criticalUsedToday);

  const isEditingHabitMode = activeTab === 'habit' || isHabitType || isTracked2166 || isQuickHabit;
  const is2166HabitMode = isEditingHabitMode && Boolean(isTracked2166 || isQuickHabit);

  // Referencia estable para onClose (evita que el useEffect se re-dispare al recrear la función)
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      } else if (editingTaskId) {
        setActiveTab((isHabitType || isTracked2166 || isQuickHabit) ? 'habit' : 'task');
      }
      setIsIconManuallyChosen(Boolean(editingTaskId));
      document.body.classList.add('modal-open-hide-floating');

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          soundFX.playClick();
          onCloseRef.current();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.classList.remove('modal-open-hide-floating');
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, editingTaskId, initialTab]);

  const handleTabChange = (tab: 'task' | 'habit' | 'oracle') => {
    if (tab === 'oracle') {
      // Abrir directamente el Oráculo real en vez de mostrar pestaña intermediaria
      soundFX.playClick();
      onClose();
      if (onOpenOracle) onOpenOracle();
      return;
    }
    setActiveTab(tab);
    if (tab === 'task') {
      setIsHabitType(false);
      setIsTracked2166(false);
      setIsQuickHabit(false);
      setFormFrequency('once');
    } else if (tab === 'habit') {
      setIsTracked2166(true);
      setIsQuickHabit(true);
      if (!quickIcon) setQuickIcon('⚡');
      setFormFrequency('daily');
    }
  };

  const handleSelectEnergy = (energyKey: HabitEnergyType) => {
    setHabitEnergyType(energyKey);
    const categoryMap: Record<HabitEnergyType, TaskCategory> = {
      strength: 'entrenamiento',
      mind: 'estudio',
      discipline: 'habito',
      purification: 'comida',
      creativity: 'creativo',
    };
    if (categoryMap[energyKey]) {
      setNewCategory(categoryMap[energyKey]);
    }
    const isCurrentIconAuraDefault = Object.values(ENERGY_DEFAULT_ICONS).includes(quickIcon || '');
    if (!isIconManuallyChosen || isCurrentIconAuraDefault) {
      setQuickIcon(ENERGY_DEFAULT_ICONS[energyKey]);
    }
  };

  useEffect(() => {
    if (newTitle.trim()) {
      const autoEnergy = detectHabitEnergy(newTitle, newCategory);
      setHabitEnergyType(autoEnergy);
      const isCurrentIconAuraDefault = Object.values(ENERGY_DEFAULT_ICONS).includes(quickIcon || '');
      if (!isIconManuallyChosen || isCurrentIconAuraDefault) {
        setQuickIcon(ENERGY_DEFAULT_ICONS[autoEnergy]);
      }
    }
  }, [newTitle, newCategory]);

  if (!isOpen) return null;

  const applyPreset = (preset: typeof habitPresets[0]) => {
    setNewTitle(preset.title);
    setQuickIcon(preset.icon);
    setNewCategory(preset.category);
    setHabitTarget(preset.target);
    setNewHabitUnit(preset.unit);
    setHabitEnergyType(preset.energy);
    setIsHabitType(preset.hasCounter);
    setIsTracked2166(true);
    setIsQuickHabit(true);
    setIsIconManuallyChosen(false);
    if (formFrequency === 'once') {
      setFormFrequency('daily');
    }
    if (setTargetStreak) {
      setTargetStreak(preset.targetStreak || 21);
    }
  };

  const applyReminderPreset = (preset: typeof reminderPresets[0]) => {
    soundFX.playClick();
    setNewTitle(preset.title);
    setQuickIcon(preset.icon);
    setNewCategory(preset.category);
    setIsHabitType(false);
    setIsTracked2166(false);
    setIsQuickHabit(false);
    setIsIconManuallyChosen(true);
    setFormFrequency('specific_days');
    if (preset.days && preset.days.length > 0) {
      preset.days.forEach((d) => {
        if (!formSpecificDays.includes(d)) {
          toggleSpecificDay(d);
        }
      });
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Formulario de tarea o hábito"
        className="fixed inset-0 z-[170] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden font-sans portal-modal-root"
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
          className="relative isolate w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#030712]/[0.98] border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden transition-all text-white"
        >
          <span className="vi-grano opacity-5" aria-hidden="true" />
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

          <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-5 pb-3 border-b border-white/10 bg-[#040814]/[0.96] relative z-10">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                activeTab === 'oracle'
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : isEditingHabitMode 
                    ? (is2166HabitMode ? 'bg-purple-950/60 border-purple-500/50 text-purple-300' : 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300')
                    : 'aura-bg-soft aura-border-subtle aura-text-primary aura-glow-subtle'
              }`}>
                {activeTab === 'oracle' ? (
                  <Icon name="sparkles" className="w-5 h-5" />
                ) : isEditingHabitMode ? (
                  is2166HabitMode ? <Icon name="flame" className="w-5 h-5" /> : <Icon name="calendar" className="w-5 h-5" />
                ) : (
                  <Icon name="zap" className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-anton uppercase tracking-wider text-white">
                  {editingTaskId 
                    ? (isEditingHabitMode ? (is2166HabitMode ? 'Editar Hábito 21/66' : 'Editar Recordatorio Semanal') : 'Editar Tarea')
                    : (activeTab === 'oracle'
                        ? 'Oráculo & Plantillas'
                        : activeTab === 'habit'
                          ? (is2166HabitMode ? 'Nuevo Hábito (21/66 Días)' : 'Nuevo Recordatorio Semanal')
                          : 'Nueva Tarea de Hoy'
                      )
                  }
                </h3>
                <p className="text-[10.5px] sm:text-xs text-slate-400 font-mono">
                  {activeTab === 'oracle'
                    ? 'Planificador inteligente con tu compañero KAI y plantillas de rutina'
                    : isEditingHabitMode 
                      ? (is2166HabitMode 
                          ? 'Define tu rutina diaria para fortalecer hábitos en 21/66 días'
                          : 'Programa una actividad semanal que se activará en tu agenda (ej. todos los martes)'
                        )
                      : 'Organiza tu jornada agregando una tarea puntual para hoy'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {!editingTaskId && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    onClose();
                    openVoiceDictation();
                  }}
                  className="chicle-btn h-9 px-2.5 rounded-xl aura-bg-soft border aura-border-subtle aura-text-primary hover:text-white flex items-center gap-1.5 text-[11px] font-anton uppercase tracking-wider transition-all cursor-pointer"
                  title="Dictar múltiples tareas o hábitos por voz con KAI"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Voz</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onClose();
                }}
                aria-label="Cerrar formulario"
                className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Cerrar modal (Esc)"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 custom-scrollbar">
              {!editingTaskId && !isViewingToday && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono mb-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <Icon name="calendar" className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="truncate">Destino: <strong className="text-white tabular-nums">{currentViewDate}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setCurrentViewDate(getTodayDateString());
                    }}
                    className="chicle-btn shrink-0 px-2.5 py-1 rounded-lg aura-bg-soft border aura-border-subtle aura-text-primary text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer"
                  >
                    Cambiar a Hoy
                  </button>
                </div>
              )}
              {!editingTaskId && (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#040814]/90 border border-white/10 mb-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange('task')}
                    className={`chicle-btn flex-1 py-1.5 px-2 rounded-lg text-xs font-anton tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
                      activeTab === 'task'
                        ? 'aura-btn-gradient optic-active-card'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon name="zap" className="w-3.5 h-3.5" />
                    <span>Tarea Hoy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('habit')}
                    className={`chicle-btn flex-1 py-1.5 px-2 rounded-lg text-xs font-anton tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
                      activeTab === 'habit'
                        ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] optic-active-card'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon name="flame" className="w-3.5 h-3.5" />
                    <span>Hábitos & Rutinas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('oracle')}
                    className={`chicle-btn flex-1 py-1.5 px-2 rounded-lg text-xs font-anton tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
                      activeTab === 'oracle'
                        ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)] optic-active-card'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon name="sparkles" className="w-3.5 h-3.5" />
                    <span>Oráculo & IA</span>
                  </button>
                </div>
              )}
              {activeTab === 'oracle' && (
                <div className="space-y-3 py-1">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#0b0716] to-purple-950/30 border border-amber-500/30 space-y-3 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0">
                        <Icon name="sparkles" className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white font-anton tracking-wide uppercase flex items-center gap-2">
                          Oráculo KAI
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Pide a Kai que divida una meta compleja en pasos diarios, organice tu jornada o te dé un micro-plan contra la procrastinación.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenOracle) onOpenOracle();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-anton tracking-wider text-xs uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(251,191,36,0.35)] transition-all cursor-pointer active:scale-95"
                    >
                      <Icon name="sparkles" className="w-4 h-4" />
                      <span>Consultar al Oráculo</span>
                    </button>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-[#040818] to-indigo-950/30 border border-cyan-500/30 space-y-3 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shrink-0">
                        <Icon name="book" className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white font-anton tracking-wide uppercase flex items-center gap-2">
                          Plantillas de Rutina
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Carga un bloque preconfigurado de hábitos y tareas para Mañanas de Alto Rendimiento, Gimnasio & Enfoque o Reset Mental.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenTemplates) onOpenTemplates();
                      }}
                      className="chicle-btn aura-btn-gradient optic-active-card w-full py-2.5 px-4 rounded-xl font-anton tracking-wider text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Icon name="book" className="w-4 h-4" />
                      <span>Cargar Plantilla de Rutina</span>
                    </button>
                  </div>
                </div>
              )}
              {activeTab !== 'oracle' && (
                <>
                  {isEditingHabitMode && (
                    <div className="space-y-2 mb-2">
                      {/* Sub-selector de modo de hábito/rutina */}
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/70 border border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playClick();
                            setIsTracked2166(true);
                            setIsQuickHabit(true);
                            if (!quickIcon || quickIcon === '📅') setQuickIcon('⚡');
                            setFormFrequency('daily');
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-anton tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
                            is2166HabitMode
                              ? 'bg-amber-400 text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon name="flame" className="w-3.5 h-3.5" />
                          <span>⚡ Hábito 21/66 Días</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playClick();
                            setIsTracked2166(false);
                            setIsQuickHabit(false);
                            setFormFrequency('specific_days');
                            if (!quickIcon || quickIcon === '⚡') setQuickIcon('📅');
                            if (formSpecificDays.length === 0) {
                              toggleSpecificDay(new Date().getDay());
                            }
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-anton tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
                            !is2166HabitMode
                              ? 'bg-indigo-500 text-white font-bold shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon name="calendar" className="w-3.5 h-3.5" />
                          <span>📅 Recordatorio Semanal</span>
                        </button>
                      </div>

                      {/* Notificación informativa del modo activo */}
                      {!is2166HabitMode ? (
                        <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-xs text-indigo-200 flex items-start gap-2.5">
                          <Icon name="calendar" className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold text-white block">Recordatorio Semanal en Agenda (Sin 21/66d)</span>
                            <span className="text-[11px] text-slate-300">
                              Se integrará automáticamente a tu agenda los días específicos que elijas (ej. todos los martes). No exige rachas consecutivas ni auras de 21 o 66 días.
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {/* Presets según el modo */}
                      {is2166HabitMode ? (
                        <div className="p-2 sm:p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20">
                          <span className="block text-[10px] sm:text-[10.5px] font-mono font-bold text-purple-300 uppercase tracking-wider mb-1">
                            ⚡ Sugerencias Rápidas 21/66d (Opcional):
                          </span>
                          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            {habitPresets.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => applyPreset(preset)}
                                className="px-2 sm:px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-[11px] sm:text-xs font-semibold text-purple-200 transition-all hover:scale-105 shrink-0 whitespace-nowrap cursor-pointer"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
                          <span className="block text-[10px] sm:text-[10.5px] font-mono font-bold text-indigo-300 uppercase tracking-wider mb-1">
                            📅 Plantillas Semanales Rápidas (Opcional):
                          </span>
                          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            {reminderPresets.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => applyReminderPreset(preset)}
                                className="px-2 sm:px-2.5 py-1 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-[11px] sm:text-xs font-semibold text-indigo-200 transition-all hover:scale-105 shrink-0 whitespace-nowrap cursor-pointer"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {isEditingHabitMode && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                          <Icon name="smile" className="w-3.5 h-3.5 text-purple-400" />
                          Icono Identificador
                        </label>
                        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                          {quickEmojis.map((emoji) => {
                            const isSelected = (quickIcon || (is2166HabitMode ? '⚡' : '📅')) === emoji;
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setQuickIcon(emoji);
                                  setIsIconManuallyChosen(true);
                                }}
                                className={`h-8 rounded-xl text-base transition-all flex items-center justify-center cursor-pointer ${
                                  isSelected
                                    ? 'bg-purple-500/30 border border-purple-400 scale-105 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                                    : 'bg-[#040814]/90 border border-white/10 hover:border-white/25 hover:bg-white/[0.04] opacity-80 hover:opacity-100'
                                }`}
                              >
                                {emoji}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {!isEditingHabitMode && !editingTaskId && (
                      <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-slate-200 flex items-start gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-bold shrink-0 mt-0.5 text-xs">
                          💡
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block">Añade tu tarea para hoy</span>
                          <span className="text-[11px] text-slate-300 block">
                            Escribe lo que vas a realizar y pulsa "Crear Tarea". Al terminarla, tocas su casilla para marcarla (darle check/X) y acumular tus puntos y monedas.
                          </span>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isEditingHabitMode 
                          ? (is2166HabitMode ? 'Nombre de tu Hábito (100% Personalizable)' : 'Nombre del Recordatorio Semanal') 
                          : 'Título de la tarea'
                        }
                      </label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder={
                          isEditingHabitMode 
                            ? (is2166HabitMode ? 'Ej. Tomar 2L de agua, Caminar 30 mins, Leer 10 páginas...' : 'Ej. Revisión semanal, Pagar servicios, Reporte de lunes...') 
                            : 'Ej. Enviar reporte a cliente, Limpiar espacio de trabajo, Comprar insumos...'
                        }
                        className="w-full bg-[#040814]/90 border border-white/15 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl px-3.5 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                    {/* Hora rápida: solo en modo tarea simple */}
                    {!isEditingHabitMode && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                          <Icon name="clock" className="w-3.5 h-3.5 text-cyan-400" />
                          ¿A qué hora? <span className="text-slate-500 font-normal ml-1">(opcional)</span>
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { label: '🌅 Mañana', value: '09:00' },
                            { label: '☀️ Mediodía', value: '12:00' },
                            { label: '🌆 Tarde', value: '15:00' },
                            { label: '🌙 Noche', value: '19:00' },
                          ].map(({ label, value }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                soundFX.playClick();
                                setNewStartTime(newStartTime === value ? '' : value);
                              }}
                              className={`chicle-btn px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                                newStartTime === value
                                  ? 'aura-bg-soft aura-border-primary aura-text-primary aura-glow-subtle optic-active-card'
                                  : 'bg-black/40 border-white/15 text-slate-400 hover:border-white/30 hover:text-white'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                          <input
                            type="time"
                            value={newStartTime}
                            onChange={(e) => setNewStartTime(e.target.value)}
                            className="h-8 px-2 rounded-xl bg-black/40 border border-white/15 focus:border-cyan-400 text-white font-mono text-xs focus:outline-none w-[90px]"
                            title="Hora personalizada"
                          />
                        </div>
                      </div>
                    )}
                    {!isEditingHabitMode && (
                      <div className="px-3 py-1.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono text-[11px]">Recompensa estimada:</span>
                        <span className="font-bold text-cyan-300 font-mono text-xs">
                          ⚡ +{isLegendary ? (newXp || 10) * 2 : (newXp || 10)} XP • 🪙 +{isLegendary ? (newCoins || 4) * 2 : (newCoins || 4)} Monedas
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Aura para Kai: Solo en Hábitos de 21/66 días */}
                  {is2166HabitMode && (
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-[#040a1a]/[0.94] border border-purple-500/30 space-y-1.5 shadow-[0_0_15px_rgba(168,85,247,0.12)]">
                      <label className="block text-xs font-bold text-purple-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Icon name="sparkles" className="w-3.5 h-3.5 text-purple-400" />
                          ✨ Recompensa de Energía para Kai (Aura a 21 y 66 días)
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        {(['purification', 'strength', 'mind', 'discipline', 'creativity'] as HabitEnergyType[]).map((energyKey) => {
                          const detail = HABIT_ENERGY_DETAILS[energyKey];
                          const isSelected = habitEnergyType === energyKey;
                          const isFifthCard = energyKey === 'creativity';
                          return (
                            <button
                              key={energyKey}
                              type="button"
                              onClick={() => handleSelectEnergy(energyKey)}
                              className={`py-1.5 px-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px] ${
                                isFifthCard ? 'col-span-2 justify-center' : ''
                              } ${
                                isSelected
                                  ? `${detail.badgeColor} scale-[1.01] ring-1 ring-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]`
                                  : 'bg-black/50 border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white'
                              }`}
                            >
                              <span className="text-sm shrink-0">{detail.icon}</span>
                              <div className={`min-w-0 ${isFifthCard ? 'flex-initial text-center sm:text-left' : 'flex-1'}`}>
                                <span className="block text-[10.5px] sm:text-[11px] font-bold leading-tight">{detail.label}</span>
                                <span className="block text-[9px] opacity-75 truncate font-mono">
                                  ⚡ {detail.auraName21}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Frecuencia y Configuración según Modo */}
                  {is2166HabitMode ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-300 mb-1">Frecuencia</label>
                        <select
                          value={formFrequency}
                          onChange={(e) => setFormFrequency(e.target.value as any)}
                          className="w-full bg-[#040814]/90 border border-white/15 focus:border-cyan-400 rounded-xl px-2.5 py-1.5 text-white focus:outline-none text-xs h-[34px] transition-colors"
                        >
                          <option value="daily">Todos los días</option>
                          <option value="specific_days">Días específicos</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Meta Protocolo
                        </label>
                        <div className="grid grid-cols-2 gap-1 p-0.5 bg-black/60 border border-white/10 rounded-xl h-[34px] items-center">
                          <button
                            type="button"
                            onClick={() => setTargetStreak && setTargetStreak(21)}
                            className={`h-full rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              (targetStreak || 21) === 21
                                ? 'bg-purple-600/80 text-white shadow-sm ring-1 ring-purple-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Meta de 21 días (Fase Neuroplasticidad / Desbloqueo de Aura para Kai)"
                          >
                            <span>🔥 21d</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTargetStreak && setTargetStreak(66)}
                            className={`h-full rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              targetStreak === 66
                                ? 'bg-amber-600/80 text-white shadow-sm ring-1 ring-amber-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Meta de 66 días (Fase Maestría / Automatización total & Forma Maestra)"
                          >
                            <span>🏆 66d</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : isEditingHabitMode ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Categoría</label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                          className="w-full bg-[#040814]/90 border border-white/15 focus:border-cyan-400 rounded-xl px-3 py-2 text-white focus:outline-none text-xs transition-colors"
                        >
                          <option value="rutina">Rutina</option>
                          <option value="estudio">Estudio & Mente</option>
                          <option value="entrenamiento">Entrenamiento</option>
                          <option value="comida">Alimentación & Salud</option>
                          <option value="creativo">Creatividad & Flujo</option>
                          <option value="trabajo">Trabajo / Negocios</option>
                          <option value="limpieza">Limpieza / Orden</option>
                          <option value="clientes">Clientes / Mensajes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Repetición</label>
                        <select
                          value={formFrequency}
                          onChange={(e) => setFormFrequency(e.target.value as any)}
                          className="w-full bg-[#040814]/90 border border-white/15 focus:border-cyan-400 rounded-xl px-3 py-2 text-white focus:outline-none text-xs transition-colors"
                        >
                          <option value="specific_days">Días específicos de la semana</option>
                          <option value="daily">Todos los días</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Categoría</label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                          className="w-full bg-[#040814]/90 border border-white/15 focus:border-cyan-400 rounded-xl px-3 py-2 text-white focus:outline-none text-xs transition-colors"
                        >
                          <option value="rutina">Rutina</option>
                          <option value="estudio">Estudio & Mente</option>
                          <option value="entrenamiento">Entrenamiento</option>
                          <option value="comida">Alimentación & Salud</option>
                          <option value="creativo">Creatividad & Flujo</option>
                          <option value="trabajo">Trabajo / Negocios</option>
                          <option value="limpieza">Limpieza / Orden</option>
                          <option value="clientes">Clientes / Mensajes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Frecuencia</label>
                        <div className="w-full bg-[#040814]/90 border border-white/15 rounded-xl px-3 py-2 text-cyan-300 text-xs flex items-center justify-between">
                          <span>Una sola vez (Hoy)</span>
                          <button
                            type="button"
                            onClick={() => handleTabChange('habit')}
                            className="text-[10px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
                          >
                            ¿Recurrente?
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selector de días específicos: visible si frequency === 'specific_days' O si es recordatorio semanal */}
                  {(formFrequency === 'specific_days' || (!is2166HabitMode && isEditingHabitMode)) && (
                    <div className="p-3 rounded-2xl bg-[#040814]/90 border border-indigo-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Icon name="calendar" className="w-3.5 h-3.5 text-indigo-400" />
                          ¿Qué días de la semana debe realizarse?
                        </label>
                        {formSpecificDays.length > 0 && (
                          <span className="text-[10px] font-mono text-indigo-300 font-bold">
                            {formSpecificDays.map(d => DAYS_OF_WEEK_LABELS.find(l => l.idx === d)?.short).filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {DAYS_OF_WEEK_LABELS.map((day) => {
                          const isSelected = formSpecificDays.includes(day.idx);
                          return (
                            <button
                              key={day.idx}
                              type="button"
                              onClick={() => toggleSpecificDay(day.idx)}
                              className={`chicle-btn py-2 px-1 rounded-xl font-mono text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-indigo-300 optic-active-card'
                                  : 'bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                              }`}
                              title={day.name}
                            >
                              <span className="text-[11px] leading-tight">{day.short}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {isEditingHabitMode && (
                    <div className="p-3.5 rounded-2xl bg-[#040814]/80 border border-white/10 space-y-2.5">
                      <label className="flex items-center justify-between cursor-pointer select-none">
                        <span className="text-xs font-semibold text-slate-300">¿Es un hábito con contador de meta?</span>
                        <input
                          type="checkbox"
                          checked={isHabitType}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsHabitType(checked);
                            if (checked && habitTarget <= 1) {
                              const match = newTitle.match(/(\d+)\s*(vasos?|litros?|mins?|minutos?|veces|p[aá]ginas?|km|pasos?|horas?|comidas?|sesiones?)?/i);
                              const parsedTarget = match ? parseInt(match[1], 10) : NaN;
                              const nextTarget = Number.isFinite(parsedTarget) && parsedTarget > 1 ? parsedTarget : 3;
                              setHabitTarget(nextTarget);
                              const parsedUnit = match?.[2]?.trim();
                              if (parsedUnit && (!habitUnit || habitUnit === 'veces' || habitUnit === 'vez')) {
                                setNewHabitUnit(parsedUnit.toLowerCase());
                              }
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500 cursor-pointer"
                        />
                      </label>
                      {isHabitType && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1 font-mono uppercase tracking-wider">Meta numérica</label>
                            <input
                              type="number"
                              min={1}
                              value={habitTarget}
                              onChange={(e) => setHabitTarget(parseInt(e.target.value, 10) || 1)}
                              className="w-full bg-[#040814]/90 border border-white/15 focus:border-purple-400 rounded-xl px-3 py-1.5 text-white font-mono text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1 font-mono uppercase tracking-wider">Unidad</label>
                            <input
                              type="text"
                              value={habitUnit}
                              onChange={(e) => setNewHabitUnit(e.target.value)}
                              placeholder="veces, mins, L..."
                              className="w-full bg-[#040814]/90 border border-white/15 focus:border-purple-400 rounded-xl px-3 py-1.5 text-white text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-slate-400 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon name="clock" className="w-3.5 h-3.5 text-cyan-400" />
                        {showAdvanced ? 'Ocultar Opciones Avanzadas' : '⚙️ Opciones Avanzadas (Horario, notas, contador opcional)'}
                      </span>
                      {showAdvanced ? <Icon name="chevronUp" className="w-4 h-4" /> : <Icon name="chevronDown" className="w-4 h-4" />}
                    </button>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                              <Icon name="timer" className="w-3.5 h-3.5 text-cyan-400" />
                              Hora Inicio
                            </label>
                            <input
                              type="time"
                              value={newStartTime}
                              onChange={(e) => setNewStartTime(e.target.value)}
                              className="w-full bg-[#040814]/90 border border-white/15 focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                              <Icon name="timer" className="w-3.5 h-3.5 text-cyan-400" />
                              Hora Fin
                            </label>
                            <input
                              type="time"
                              value={newEndTime}
                              onChange={(e) => setNewEndTime(e.target.value)}
                              className="w-full bg-[#040814]/90 border border-white/15 focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none"
                            />
                          </div>
                        </div>
                        {!isEditingHabitMode && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                              isLegendary ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' : 'bg-[#040814]/90 border-white/10 text-slate-400'
                            }`}>
                              <input
                                type="checkbox"
                                checked={isLegendary}
                                onChange={(e) => setIsLegendary(e.target.checked)}
                                className="hidden"
                              />
                              <Icon name="crown" className="w-4 h-4 text-amber-400" />
                              <span className="text-xs font-semibold">
                                Enfoque Crítico ({criticalRemaining}/{MAX_CRITICAL_PRIORITY_CHARGES_PER_DAY} cargas x2.0 hoy)
                              </span>
                            </label>

                            <div className="p-3 rounded-xl bg-[#040814]/90 border border-white/10">
                              <label className="flex items-center justify-between cursor-pointer select-none">
                                <span className="text-xs text-slate-300">Contador de meta</span>
                                <input
                                  type="checkbox"
                                  checked={isHabitType}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setIsHabitType(checked);
                                    if (checked && habitTarget <= 1) setHabitTarget(3);
                                  }}
                                  className="w-4 h-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500 cursor-pointer"
                                />
                              </label>
                              {isHabitType && (
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                  <input
                                    type="number"
                                    min={1}
                                    value={habitTarget}
                                    onChange={(e) => setHabitTarget(parseInt(e.target.value, 10) || 1)}
                                    placeholder="Meta (3)"
                                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-white font-mono text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={habitUnit}
                                    onChange={(e) => setNewHabitUnit(e.target.value)}
                                    placeholder="veces..."
                                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-white text-xs"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                            <Icon name="fileText" className="w-3.5 h-3.5 text-slate-400" />
                            Notas operativas (Opcional)
                          </label>
                          <textarea
                            value={newNotes}
                            onChange={(e) => setNewNotes(e.target.value)}
                            rows={2}
                            placeholder="Añade instrucciones o notas adicionales..."
                            className="w-full bg-[#040814]/90 border border-white/15 focus:border-purple-400 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="shrink-0 p-3 sm:p-4 bg-[#040814]/[0.96] border-t border-white/10 flex items-center gap-2.5 relative z-10">
              {activeTab === 'oracle' ? (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    onClose();
                  }}
                  className="chicle-btn w-full py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-200 hover:text-white font-anton uppercase text-xs tracking-wider transition-all border border-white/15 cursor-pointer text-center"
                >
                  Cerrar Oráculo
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      onClose();
                    }}
                    className="chicle-btn flex-1 sm:flex-none sm:px-6 py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-200 hover:text-white font-anton uppercase text-xs tracking-wider transition-all border border-white/15 cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`chicle-btn optic-active-card flex-[2] py-2.5 px-4 rounded-xl font-anton uppercase tracking-wider text-xs sm:text-sm transition-all shadow-lg cursor-pointer text-center font-bold ${
                      isEditingHabitMode
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        : 'aura-btn-gradient'
                    }`}
                  >
                    {editingTaskId 
                      ? 'Guardar Cambios' 
                      : (isEditingHabitMode ? 'Guardar Hábito 21/66' : 'Crear Tarea')
                    }
                  </button>
                </>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
