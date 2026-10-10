import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Clock, Crown, Zap, Flame, ChevronDown, ChevronUp, FileText, Smile } from 'lucide-react';
import { TaskCategory, HabitEnergyType } from '../../types';
import { HABIT_ENERGY_DETAILS, detectHabitEnergy } from '../../utils/habitEnergyDetector';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onSubmit: (e: React.FormEvent) => void;
}

const daysOfWeek = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const quickEmojis = ['⚡', '💧', '🏋️', '📖', '🧘', '🥗', '🧠', '🎨', '💼', '🏃', '💊', '☕'];

const habitPresets = [
  { label: '💧 Agua 2L', title: 'Tomar 2 Litros de Agua', icon: '💧', category: 'energia' as TaskCategory, target: 2, unit: 'litros', energy: 'purification' as HabitEnergyType },
  { label: '🏋️ Gimnasio', title: 'Entrenamiento de Gimnasio', icon: '🏋️', category: 'entrenamiento' as TaskCategory, target: 1, unit: 'sesión', energy: 'strength' as HabitEnergyType },
  { label: '📖 Lectura', title: 'Lectura de Desarrollo', icon: '📖', category: 'mente' as TaskCategory, target: 20, unit: 'mins', energy: 'mind' as HabitEnergyType },
  { label: '🧘 Meditación', title: 'Meditación & Enfoque', icon: '🧘', category: 'disciplina' as TaskCategory, target: 10, unit: 'mins', energy: 'discipline' as HabitEnergyType },
  { label: '🥗 Saludable', title: 'Alimentación Limpia', icon: '🥗', category: 'energia' as TaskCategory, target: 3, unit: 'comidas', energy: 'purification' as HabitEnergyType },
];

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
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
  onSubmit,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto detect energy when user types title if not manually selected
  useEffect(() => {
    if (newTitle.trim()) {
      const autoEnergy = detectHabitEnergy(newTitle, newCategory);
      setHabitEnergyType(autoEnergy);
    }
  }, [newTitle, newCategory]);

  if (!isOpen) return null;

  const isEditingHabitMode = isHabitType || isTracked2166 || isQuickHabit;

  const applyPreset = (preset: typeof habitPresets[0]) => {
    setNewTitle(preset.title);
    setQuickIcon(preset.icon);
    setNewCategory(preset.category);
    setHabitTarget(preset.target);
    setHabitUnit(preset.unit);
    setHabitEnergyType(preset.energy);
    setIsHabitType(true);
    setIsTracked2166(true);
    setIsQuickHabit(true);
    if (formFrequency === 'once') {
      setFormFrequency('daily');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative w-full max-w-lg my-8 p-6 rounded-2xl bg-gray-950/95 border shadow-2xl transition-all ${
            isEditingHabitMode
              ? 'border-purple-500/40 shadow-purple-950/50'
              : 'border-cyan-500/30 shadow-cyan-950/40'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-3 rounded-xl border ${
              isEditingHabitMode 
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              {isEditingHabitMode ? <Flame className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">
                {editingTaskId 
                  ? (isEditingHabitMode ? 'Editar Hábito' : 'Editar Tarea')
                  : (isEditingHabitMode ? 'Nuevo Hábito (21/66 Días)' : 'Nueva Tarea')
                }
              </h3>
              <p className="text-xs text-gray-400">
                {isEditingHabitMode 
                  ? 'Define tu rutina diaria para fortalecer hábitos en 21/66 días'
                  : 'Organiza tu día agregando una nueva tarea o actividad'
                }
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Presets Rápidos de 1-Clic para Hábitos */}
            {isEditingHabitMode && (
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20">
                <span className="block text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                  ⚡ Sugerencias Rápidas de 1-Clic (Opcional):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {habitPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-xs font-semibold text-purple-200 transition-all hover:scale-105"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Icono/Emoji para Hábito */}
            {isEditingHabitMode && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-purple-400" />
                  Icono del Hábito
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={quickIcon || '⚡'}
                    onChange={(e) => setQuickIcon(e.target.value)}
                    maxLength={3}
                    className="w-12 h-10 text-center bg-gray-900 border border-purple-500/40 rounded-xl text-lg text-white focus:outline-none focus:border-purple-400"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setQuickIcon(emoji)}
                        className={`w-8 h-8 rounded-lg text-sm transition-transform ${
                          quickIcon === emoji ? 'bg-purple-500/30 border border-purple-400 scale-110' : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Título (Campo Libre 100% Personalizado) */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {isEditingHabitMode ? 'Nombre de tu Hábito (100% Personalizable)' : 'Título de la tarea'}
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={isEditingHabitMode ? 'Ej. Dejar de fumar, Tomar agua, Gimnasio, Estudiar...' : 'Ej. Sesión de código profundo...'}
                className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Selector de Energía de Recompensa para Kai */}
            {isEditingHabitMode && (
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                <label className="block text-xs font-bold text-purple-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    ✨ Recompensa de Energía para Kai (Aura a 21 y 66 días)
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {(['purification', 'strength', 'mind', 'discipline', 'creativity'] as HabitEnergyType[]).map((energyKey) => {
                    const detail = HABIT_ENERGY_DETAILS[energyKey];
                    const isSelected = habitEnergyType === energyKey;
                    return (
                      <button
                        key={energyKey}
                        type="button"
                        onClick={() => setHabitEnergyType(energyKey)}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? `${detail.badgeColor} scale-[1.02] ring-1 ring-purple-400`
                            : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:bg-gray-800/80 hover:text-white'
                        }`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{detail.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-bold leading-snug">{detail.label}</span>
                          <span className="block text-[10px] opacity-80 line-clamp-1 font-mono mt-0.5">
                            ⚡ 21d: {detail.auraName21}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categoría y Frecuencia */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Categoría</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-3 py-2.5 text-white focus:outline-none text-xs"
                >
                  <option value="rutina">Rutina / Hábitos</option>
                  <option value="mente">Mente & Estudio</option>
                  <option value="disciplina">Disciplina & Foco</option>
                  <option value="energia">Energía & Salud</option>
                  <option value="entrenamiento">Entrenamiento</option>
                  <option value="trabajo">Trabajo / Negocios</option>
                  <option value="finanzas">Finanzas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Frecuencia</label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as any)}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-3 py-2.5 text-white focus:outline-none text-xs"
                >
                  {!isEditingHabitMode && <option value="once">Una sola vez (Hoy)</option>}
                  <option value="daily">Todos los días</option>
                  <option value="specific_days">Días específicos</option>
                </select>
              </div>
            </div>

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

            {/* Badge Ley 21/66 Días */}
            {isEditingHabitMode && (
              <label className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between cursor-pointer transition-all hover:border-purple-400">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="block text-xs font-bold text-purple-200">Protocolo Ley 21/66 Activo</span>
                    <span className="block text-[10px] text-purple-400/80 font-mono">Monitorea neuroplasticidad (21 días aura / 66 días evolución)</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isTracked2166}
                  onChange={(e) => {
                    setIsTracked2166(e.target.checked);
                    setIsQuickHabit(e.target.checked);
                  }}
                  className="w-4 h-4 rounded border-purple-700 text-purple-500 focus:ring-purple-500"
                />
              </label>
            )}

            {/* Sección Contador / Meta */}
            <div className="p-3.5 rounded-xl bg-gray-900/50 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">¿Es un hábito con contador de meta?</span>
                <input
                  type="checkbox"
                  checked={isHabitType}
                  onChange={(e) => setIsHabitType(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500"
                />
              </div>

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
                      placeholder="veces, mins, L, mins..."
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

            {/* Actions */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium text-sm transition-colors border border-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all shadow-lg ${
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
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
