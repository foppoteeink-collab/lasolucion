import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Clock, Crown, Zap, Flame, ChevronDown, ChevronUp, FileText, Smile, Layers } from 'lucide-react';
import { TaskCategory, HabitEnergyType } from '../../types';
import { HABIT_ENERGY_DETAILS, detectHabitEnergy } from '../../utils/habitEnergyDetector';
import { CATEGORY_COLORS } from '../../data/categoryColors';

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
  setHabitUnit: (val: string) => void;
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

const habitPresets = [
  { label: '💧 Agua 2L', title: 'Tomar 2 Litros de Agua', icon: '💧', category: 'habito' as TaskCategory, target: 8, unit: 'vasos', energy: 'purification' as HabitEnergyType, hasCounter: true, targetStreak: 21 as const },
  { label: '🏋️ Gimnasio', title: 'Entrenamiento de Gimnasio', icon: '🏋️', category: 'entrenamiento' as TaskCategory, target: 1, unit: 'sesión', energy: 'strength' as HabitEnergyType, hasCounter: false, targetStreak: 21 as const },
  { label: '📖 Lectura', title: 'Lectura de Desarrollo', icon: '📖', category: 'estudio' as TaskCategory, target: 20, unit: 'min', energy: 'mind' as HabitEnergyType, hasCounter: true, targetStreak: 21 as const },
  { label: '🧘 Meditación', title: 'Meditación & Enfoque', icon: '🧘', category: 'habito' as TaskCategory, target: 10, unit: 'min', energy: 'discipline' as HabitEnergyType, hasCounter: true, targetStreak: 21 as const },
  { label: '🥗 Saludable', title: 'Alimentación Limpia', icon: '🥗', category: 'comida' as TaskCategory, target: 3, unit: 'comidas', energy: 'purification' as HabitEnergyType, hasCounter: true, targetStreak: 21 as const },
];

const ENERGY_DEFAULT_ICONS: Record<HabitEnergyType, string> = {
  strength: '⚡',
  purification: '💧',
  mind: '🧠',
  discipline: '🧘',
  creativity: '🎨',
};

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
  setHabitUnit,
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

  const isEditingHabitMode = activeTab === 'habit' || isHabitType || isTracked2166 || isQuickHabit;

  useEffect(() => {
    if (isOpen) {
      if (editingTaskId) {
        setActiveTab((isHabitType || isTracked2166 || isQuickHabit) ? 'habit' : 'task');
      } else if (initialTab) {
        setActiveTab(initialTab);
      }
      setIsIconManuallyChosen(Boolean(editingTaskId));
      document.body.classList.add('modal-open-hide-floating');
      return () => {
        document.body.classList.remove('modal-open-hide-floating');
      };
    }
  }, [isOpen, editingTaskId, initialTab]);

  const handleTabChange = (tab: 'task' | 'habit' | 'oracle') => {
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

  // Mapeo automático de Categoría y sincronización de Icono según Aura de Kai
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
    // Sincronizar el icono si el usuario no ha escogido manualmente un icono personalizado
    const isCurrentIconAuraDefault = Object.values(ENERGY_DEFAULT_ICONS).includes(quickIcon || '');
    if (!isIconManuallyChosen || isCurrentIconAuraDefault) {
      setQuickIcon(ENERGY_DEFAULT_ICONS[energyKey]);
    }
  };

  // Auto detect energy when user types title if not manually selected
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
    setHabitUnit(preset.unit);
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-gray-950/95 border shadow-2xl overflow-hidden transition-all ${
            activeTab === 'oracle'
              ? 'border-amber-500/40 shadow-amber-950/50'
              : isEditingHabitMode
                ? 'border-purple-500/40 shadow-purple-950/50'
                : 'border-cyan-500/30 shadow-cyan-950/40'
          }`}
        >
          {/* Header Fijo */}
          <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-5 pb-3 border-b border-white/5 bg-gray-950/95 relative">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className={`p-2 sm:p-2.5 rounded-xl border ${
                activeTab === 'oracle'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : isEditingHabitMode 
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}>
                {activeTab === 'oracle' ? (
                  <Sparkles className="w-5 h-5 animate-pulse" />
                ) : isEditingHabitMode ? (
                  <Flame className="w-5 h-5" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-display">
                  {editingTaskId 
                    ? (isEditingHabitMode ? 'Editar Hábito' : 'Editar Tarea')
                    : (activeTab === 'oracle'
                        ? 'Oráculo & Plantillas'
                        : activeTab === 'habit'
                          ? 'Nuevo Hábito (21/66 Días)'
                          : 'Nueva Tarea'
                      )
                  }
                </h3>
                <p className="text-[10.5px] sm:text-xs text-gray-400">
                  {activeTab === 'oracle'
                    ? 'Planificador inteligente con tu compañero KAI y plantillas de rutina'
                    : isEditingHabitMode 
                      ? 'Define tu rutina diaria para fortalecer hábitos en 21/66 días'
                      : 'Organiza tu día agregando una nueva tarea o actividad'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Cuerpo del Formulario Scrolleable */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 custom-scrollbar">
              {/* Selector de Pestañas de la Tríada Unificada */}
              {!editingTaskId && (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 mb-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange('task')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-anton tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
                      activeTab === 'task'
                        ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Tarea Hoy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('habit')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-anton tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
                      activeTab === 'habit'
                        ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Hábito 21/66</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('oracle')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-anton tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
                      activeTab === 'oracle'
                        ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Oráculo & IA</span>
                  </button>
                </div>
              )}

              {/* Vista 3: Oráculo KAI & Plantillas de Rutina */}
              {activeTab === 'oracle' && (
                <div className="space-y-3 py-1">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#0b0716] to-purple-950/30 border border-amber-500/30 space-y-3 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0">
                        <Sparkles className="w-6 h-6 animate-pulse" />
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
                      <Sparkles className="w-4 h-4" />
                      <span>Consultar al Oráculo</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-[#040818] to-indigo-950/30 border border-cyan-500/30 space-y-3 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shrink-0">
                        <Layers className="w-6 h-6" />
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
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-anton tracking-wider text-xs uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.35)] transition-all cursor-pointer active:scale-95"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Cargar Plantilla de Rutina</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Vistas 1 y 2: Formulario de Tarea u Hábito */}
              {activeTab !== 'oracle' && (
                <>
                  {/* Presets Rápidos de 1-Clic para Hábitos (Sin scrollbar visible) */}
                  {isEditingHabitMode && (
                <div className="p-2 sm:p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20">
                  <span className="block text-[10px] sm:text-[10.5px] font-mono font-bold text-purple-300 uppercase tracking-wider mb-1">
                    ⚡ Sugerencias Rápidas de 1-Clic (Opcional):
                  </span>
                  <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-0.5">
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
              )}

              {/* Bloque Atómico de Identidad: Icono + Nombre del Hábito */}
              <div className="space-y-2">
                {/* Selector de Icono/Emoji para Hábito (grid-cols-6 en móvil, grid-cols-12 en desktop) */}
                {isEditingHabitMode && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                      <Smile className="w-3.5 h-3.5 text-purple-400" />
                      Icono del Hábito
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                      {quickEmojis.map((emoji) => {
                        const isSelected = (quickIcon || '⚡') === emoji;
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
                                : 'bg-gray-900/80 border border-gray-800 hover:bg-gray-800 hover:border-gray-700 opacity-80 hover:opacity-100'
                            }`}
                            title={`Seleccionar icono ${emoji}`}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Título (Campo Libre 100% Personalizado) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    {isEditingHabitMode ? 'Nombre de tu Hábito (100% Personalizable)' : 'Título de la tarea'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={isEditingHabitMode ? 'Ej. Dejar de fumar, Tomar agua, Gimnasio, Estudiar...' : 'Ej. Sesión de código profundo...'}
                    className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-3.5 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Badge de Recompensa Estimada (Modo Tarea) */}
                {!isEditingHabitMode && (
                  <div className="px-3 py-1.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-mono text-[11px]">Recompensa estimada:</span>
                    <span className="font-bold text-cyan-300 font-mono text-xs">
                      ⚡ +{isLegendary ? (newXp || 10) * 2 : (newXp || 10)} XP • 🪙 +{isLegendary ? (newCoins || 4) * 2 : (newCoins || 4)} Monedas
                    </span>
                  </div>
                )}
              </div>

              {/* Selector de Energía de Recompensa para Kai (2 columnas forzadas en móvil) */}
              {isEditingHabitMode && (
                <div className="p-2 sm:p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1.5">
                  <label className="block text-xs font-bold text-purple-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
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
                          className={`py-1 px-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px] ${
                            isFifthCard ? 'col-span-2 justify-center' : ''
                          } ${
                            isSelected
                              ? `${detail.badgeColor} scale-[1.01] ring-1 ring-purple-400`
                              : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:bg-gray-800/80 hover:text-white'
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

            {/* Frecuencia & Meta de Racha (2 columnas compactas de 34px - 0 espacio extra) */}
            {isEditingHabitMode ? (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Frecuencia</label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-2.5 py-1.5 text-white focus:outline-none text-xs h-[34px]"
                  >
                    <option value="daily">Todos los días</option>
                    <option value="specific_days">Días específicos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Meta Protocolo
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-gray-950/80 border border-gray-800 rounded-xl h-[34px] items-center">
                    <button
                      type="button"
                      onClick={() => setTargetStreak && setTargetStreak(21)}
                      className={`h-full rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        (targetStreak || 21) === 21
                          ? 'bg-purple-600/80 text-white shadow-sm ring-1 ring-purple-400'
                          : 'text-gray-400 hover:text-white'
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
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Meta de 66 días (Fase Maestría / Automatización total & Forma Maestra)"
                    >
                      <span>🏆 66d</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                    className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-3 py-2.5 text-white focus:outline-none text-xs"
                  >
                    <option value="rutina">Rutina</option>
                    <option value="habito">Hábito / Disciplina</option>
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
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Frecuencia</label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-3 py-2.5 text-white focus:outline-none text-xs"
                  >
                    <option value="once">Una sola vez (Hoy)</option>
                    <option value="daily">Todos los días</option>
                    <option value="specific_days">Días específicos</option>
                  </select>
                </div>
              </div>
            )}

            {formFrequency === 'specific_days' && (
              <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800">
                <label className="block text-xs text-gray-400 mb-2">Seleccionar días de la semana:</label>
                <div className="flex gap-1.5 justify-between">
                  {daysOfWeek.map((day, idx) => {
                    const isSelected = formSpecificDays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleSpecificDay(idx)}
                        className={`w-9 h-9 rounded-lg font-mono text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sección Contador / Meta (Colapsada por defecto para máxima fluidez) */}
            <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800 space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-semibold text-gray-300">¿Es un hábito con contador de meta?</span>
                <input
                  type="checkbox"
                  checked={isHabitType}
                  onChange={(e) => setIsHabitType(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500 cursor-pointer"
                />
              </label>

              {isHabitType && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Meta numérica</label>
                    <input
                      type="number"
                      min={1}
                      value={habitTarget}
                      onChange={(e) => setHabitTarget(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Unidad</label>
                    <input
                      type="text"
                      value={habitUnit}
                      onChange={(e) => setHabitUnit(e.target.value)}
                      placeholder="veces, mins, L..."
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-purple-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Opciones Avanzadas Desplegables (Horarios y Notas) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-2 px-3 rounded-xl bg-gray-900/60 hover:bg-gray-900 border border-gray-800 text-xs font-mono text-gray-400 hover:text-white flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  {showAdvanced ? 'Ocultar Horarios y Notas' : '⚙️ Opciones Avanzadas (Horario y Notas Opcionales)'}
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                      <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        Hora Inicio
                      </label>
                      <input
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        Hora Fin
                      </label>
                      <input
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {isEditingHabitMode && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Categoría Manual (auto-asignada por Aura de Kai)
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                        className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-3 py-2 text-white focus:outline-none text-xs"
                      >
                        <option value="rutina">Rutina</option>
                        <option value="habito">Hábito / Disciplina</option>
                        <option value="estudio">Estudio & Mente</option>
                        <option value="entrenamiento">Entrenamiento</option>
                        <option value="comida">Alimentación & Salud</option>
                        <option value="creativo">Creatividad & Flujo</option>
                        <option value="trabajo">Trabajo / Negocios</option>
                        <option value="limpieza">Limpieza / Orden</option>
                        <option value="clientes">Clientes / Mensajes</option>
                      </select>
                    </div>
                  )}

                  {!isEditingHabitMode && (
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        isLegendary ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' : 'bg-gray-900/40 border-gray-800 text-gray-400'
                      }`}>
                        <input
                          type="checkbox"
                          checked={isLegendary}
                          onChange={(e) => setIsLegendary(e.target.checked)}
                          className="hidden"
                        />
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold">Caza Legendaria (XP x2)</span>
                      </label>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      Notas operativas (Opcional)
                    </label>
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      rows={2}
                      placeholder="Añade instrucciones o notas adicionales..."
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sticky Actions Footer (Siempre Visible) */}
      <div className="shrink-0 p-3 sm:p-4 bg-[#070510]/95 backdrop-blur-md border-t border-white/10 flex gap-2.5">
        {activeTab === 'oracle' ? (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium text-xs sm:text-sm transition-colors border border-gray-800 cursor-pointer"
          >
            Cerrar
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium text-xs sm:text-sm transition-colors border border-gray-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg cursor-pointer ${
                isEditingHabitMode
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-purple-950/50'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-cyan-500/25'
              }`}
            >
              {editingTaskId 
                ? 'Guardar Cambios' 
                : (isEditingHabitMode ? 'Guardar Hábito' : 'Guardar Tarea')
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
};
