import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Plus, 
  Trash2, 
  Clock, 
  Check, 
  Layers, 
  ArrowRight,
  Flame,
  Calendar,
  Zap,
  BookmarkPlus
} from 'lucide-react';
import { DayTemplate, TaskItem } from '../types';
import { DEFAULT_DAY_TEMPLATES } from '../data/defaultTemplates';
import { soundFX } from '../utils/audio';
import { safeGetItem, safeSetItem } from '../utils/storage';

interface DayTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  currentTasks: TaskItem[];
  onApplyTemplate: (template: DayTemplate, mode: 'replace' | 'merge') => void;
}

const ICONS = ['⚡', '🎯', '🏋️', '💻', '🌿', '🚀', '🔥', '📚', '🎨', '🛡️'];

export const DayTemplatesModal: React.FC<DayTemplatesModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  currentTasks,
  onApplyTemplate,
}) => {
  const [templates, setTemplates] = useState<DayTemplate[]>(() => {
    try {
      const saved = safeGetItem('taskquest_day_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Combine default with user templates, ensuring default IDs aren't lost
        const userCustoms = parsed.filter((t: DayTemplate) => t.isCustom);
        return [...DEFAULT_DAY_TEMPLATES, ...userCustoms];
      }
    } catch (e) {
      console.error('Error loading templates:', e);
    }
    return DEFAULT_DAY_TEMPLATES;
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_DAY_TEMPLATES[0].id);
  const [applyMode, setApplyMode] = useState<'replace' | 'merge'>('replace');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateIcon, setNewTemplateIcon] = useState('⚡');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const customOnes = templates.filter(t => t.isCustom);
    safeSetItem('taskquest_day_templates', JSON.stringify(customOnes));
  }, [templates]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    // Filter out temporary/sleep completion flags from current tasks
    const templateTasks = currentTasks.map(t => ({
      title: t.title,
      category: t.category,
      description: t.description,
      xpReward: t.xpReward || 30,
      coinReward: t.coinReward || 15,
      timeBlock: t.timeBlock,
      isHabit: t.isHabit,
      isTracked2166: t.isTracked2166,
      targetCount: t.targetCount,
      unit: t.unit,
      isLegendaryBounty: t.isLegendaryBounty,
      isQuickHabit: t.isQuickHabit,
      quickIcon: t.quickIcon,
    }));

    const newTemplate: DayTemplate = {
      id: `custom-template-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || `Plantilla guardada con ${templateTasks.length} misiones.`,
      icon: newTemplateIcon,
      isCustom: true,
      createdAt: new Date().toISOString(),
      tasks: templateTasks,
    };

    setTemplates(prev => [...prev, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    setIsCreatingNew(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
    soundFX.playLevelUp();
    setSuccessMessage(`¡Plantilla "${newTemplate.name}" guardada con éxito!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playClick();
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (selectedTemplateId === id) {
      setSelectedTemplateId(DEFAULT_DAY_TEMPLATES[0].id);
    }
  };

  const handleApply = () => {
    if (!selectedTemplate) return;
    soundFX.playTaskComplete();
    onApplyTemplate(selectedTemplate, applyMode);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[90dvh] sm:max-h-[86vh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#030712]/95 border border-cyan-500/35 shadow-[0_0_50px_rgba(0,240,255,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] relative overflow-hidden backdrop-blur-2xl text-left text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Luces de ambiente cyberpunk */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#010810]/80 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-400/60 flex items-center justify-center text-cyan-300 text-xl shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-anton text-white uppercase tracking-wider flex items-center gap-2 leading-tight">
                Plantillas de Día & Rutinas Tipo
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Aplica estructuras predefinidas o guarda tu día ideal para reutilizarlo en un clic.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
            title="Cerrar modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast if any */}
        {successMessage && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300 flex items-center gap-2 relative z-10">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 relative z-10">
          
          {/* Left Column: Template Selector List */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-anton uppercase tracking-wider text-slate-300">
                Selecciona una Rutina
              </span>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setIsCreatingNew(!isCreatingNew);
                }}
                className="text-[11px] font-anton uppercase tracking-wider text-cyan-300 hover:text-white flex items-center gap-1.5 bg-cyan-950/50 hover:bg-cyan-900/60 px-3 py-1.5 rounded-xl border border-cyan-500/40 transition-all cursor-pointer active:scale-95"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Guardar Día</span>
              </button>
            </div>

            {/* Form to create template from current tasks */}
            {isCreatingNew && (
              <form 
                onSubmit={handleSaveCurrentAsTemplate}
                className="p-4 rounded-2xl bg-[#020712]/90 border border-cyan-400/50 shadow-xl space-y-3 animate-in fade-in zoom-in duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-anton tracking-wider uppercase text-cyan-300">Guardar Día como Plantilla</span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">{currentTasks.length} misiones</span>
                </div>

                <div className="flex gap-2 items-center">
                  <select
                    value={newTemplateIcon}
                    onChange={(e) => setNewTemplateIcon(e.target.value)}
                    className="w-12 h-10 rounded-xl bg-[#010810] border border-white/15 text-lg flex items-center justify-center text-center cursor-pointer text-white focus:outline-none focus:border-cyan-400"
                  >
                    {ICONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mi Lunes de Clientes & Gym"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#010810] border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Descripción corta (opcional)..."
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#010810] border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="px-3 py-1.5 text-xs font-anton uppercase text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-anton tracking-wider uppercase rounded-xl shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer active:scale-95 transition-all"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}

            {/* List of Templates */}
            <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
              {templates.map(tmpl => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      soundFX.playClick();
                      setSelectedTemplateId(tmpl.id);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative group flex items-start gap-3 ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400/70 shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                        : 'bg-[#020712]/70 border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-xl shrink-0">
                      {tmpl.icon || '📋'}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">{tmpl.name}</h4>
                        {tmpl.isCustom && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-500/40">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{tmpl.description}</p>
                      <span className="text-[10px] font-mono font-bold text-cyan-300/90 mt-1 inline-block">
                        {tmpl.tasks.length} misiones
                      </span>
                    </div>

                    {tmpl.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-red-400 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Eliminar plantilla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Template Preview */}
          <div className="md:col-span-7 flex flex-col bg-[#020712]/90 border border-white/10 rounded-2xl p-4 sm:p-5">
            {selectedTemplate ? (
              <div className="flex flex-col h-full">
                {/* Selected Template Title */}
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <span className="text-3xl">{selectedTemplate.icon || '⚡'}</span>
                  <div>
                    <h3 className="text-sm sm:text-base font-anton uppercase tracking-wider text-white flex items-center gap-2">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-xs text-slate-400">{selectedTemplate.description}</p>
                  </div>
                </div>

                {/* Tasks List in Template */}
                <div className="my-3 flex-1 overflow-y-auto space-y-1.5 max-h-[32vh] pr-1">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 px-1">
                    <span>Tareas incluidas ({selectedTemplate.tasks.length}):</span>
                    <span className="text-cyan-400">XP Total: +{selectedTemplate.tasks.reduce((sum, t) => sum + (t.xpReward || 0), 0)}</span>
                  </div>
                  {selectedTemplate.tasks.map((task, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-slate-500 font-mono text-[10px] w-4">{idx + 1}.</span>
                        <span className="text-white font-medium truncate">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {task.timeBlock && (
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                            {task.timeBlock}
                          </span>
                        )}
                        <span className="text-[10px] font-anton tracking-wider text-yellow-400">
                          +{task.xpReward} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Apply Options */}
                <div className="pt-3 border-t border-white/10 space-y-3 mt-auto">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <span className="font-anton tracking-wider uppercase text-slate-300">Modo de Aplicación:</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white text-xs">
                        <input
                          type="radio"
                          name="applyMode"
                          checked={applyMode === 'replace'}
                          onChange={() => setApplyMode('replace')}
                          className="accent-cyan-400 cursor-pointer"
                        />
                        <span>Sustituir día actual</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white text-xs">
                        <input
                          type="radio"
                          name="applyMode"
                          checked={applyMode === 'merge'}
                          onChange={() => setApplyMode('merge')}
                          className="accent-cyan-400 cursor-pointer"
                        />
                        <span>Añadir a las existentes</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">
                Selecciona una plantilla de la izquierda para ver los detalles.
              </div>
            )}
          </div>

        </div>

        {/* Pinned Bottom Sticky Footer (Dual Ergonomics del Pulgar) */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#010810]/90 flex items-center justify-between gap-3 shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white font-anton uppercase text-xs rounded-xl cursor-pointer transition-all border border-white/15 active:scale-95"
          >
            Volver
          </button>

          {selectedTemplate && (
            <button
              type="button"
              onClick={handleApply}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-anton uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer transition-all chicle-btn active:scale-95"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>Aplicar al Día ({currentDate})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
