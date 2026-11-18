import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Sparkles, 
  Copy, 
  Plus, 
  Trash2, 
  Clock, 
  Check, 
  Layers, 
  Flame,
  Calendar,
  BookmarkPlus
} from 'lucide-react';
import { DayTemplate, TaskItem } from '../types';
import { DEFAULT_DAY_TEMPLATES } from '../data/defaultTemplates';
import { soundFX } from '../utils/audio';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';

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
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateIcon, setNewTemplateIcon] = useState('⚡');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const customOnes = templates.filter(t => t.isCustom);
    safeSetItem('taskquest_day_templates', JSON.stringify(customOnes));
  }, [templates]);

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

  if (!isOpen || typeof document === 'undefined') return null;

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    if (currentTasks.length === 0) {
      soundFX.playClick();
      setSuccessMessage('No hay misiones en el día actual para empaquetar.');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

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
    triggerHaptic([30, 45, 60]);
    setSuccessMessage(`¡Plantilla "${newTemplate.name}" guardada con éxito!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteTemplate = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundFX.playClick();
    triggerHaptic([40, 60]);
    setTemplates(prev => prev.filter(t => t.id !== id));
    setDeletingTemplateId(null);
    if (selectedTemplateId === id) {
      setSelectedTemplateId(DEFAULT_DAY_TEMPLATES[0].id);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-templates-modal-title"
        className="w-full max-w-4xl max-h-[90dvh] sm:max-h-[86vh] flex flex-col rounded-2xl sm:rounded-3xl relative isolate bg-[#030712]/[0.98] border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden text-left text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Filamento especular superior */}
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#040814]/[0.96] shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl aura-bg-soft border aura-border-subtle flex items-center justify-center aura-text-primary aura-glow-subtle shrink-0">
              <Layers className="w-5 h-5 aura-text-primary" />
            </div>
            <div className="min-w-0">
              <h2 id="day-templates-modal-title" className="text-base sm:text-lg font-anton text-white uppercase tracking-wider flex items-center gap-2 leading-tight">
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
            className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
            title="Cerrar modal (Esc)"
            aria-label="Cerrar modal de plantillas"
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 relative z-10">
          
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
                  triggerHaptic(20);
                  setIsCreatingNew(!isCreatingNew);
                }}
                className="chicle-btn text-[11px] font-anton uppercase tracking-wider aura-text-soft hover:text-white flex items-center gap-1.5 aura-bg-soft px-3 py-1.5 rounded-xl border aura-border-subtle cursor-pointer"
                title={currentTasks.length === 0 ? "No hay misiones hoy para guardar" : "Guardar misiones del día como nueva plantilla"}
              >
                <BookmarkPlus className="w-3.5 h-3.5 aura-text-primary" />
                <span>Guardar Día</span>
              </button>
            </div>

            {/* Form to create template from current tasks */}
            {isCreatingNew && (
              <form 
                onSubmit={handleSaveCurrentAsTemplate}
                className="p-4 rounded-2xl bg-[#040814]/80 border aura-border-subtle shadow-xl space-y-3 animate-in fade-in zoom-in duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-anton tracking-wider uppercase aura-text-soft">Guardar Día como Plantilla</span>
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums font-bold">{currentTasks.length} misiones</span>
                </div>

                <div className="flex gap-2 items-center">
                  <select
                    value={newTemplateIcon}
                    onChange={(e) => setNewTemplateIcon(e.target.value)}
                    aria-label="Icono de la plantilla"
                    className="w-12 h-10 rounded-xl bg-black/50 border border-white/15 text-lg flex items-center justify-center text-center cursor-pointer text-white focus:outline-none focus:aura-border-primary"
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
                    aria-label="Nombre de la nueva plantilla"
                    className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:aura-border-primary transition-colors"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Descripción corta (opcional)..."
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  aria-label="Descripción de la nueva plantilla"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:aura-border-primary transition-colors"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="chicle-btn px-3 py-1.5 text-xs font-anton uppercase bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="chicle-btn aura-btn-gradient optic-active-card px-4 py-1.5 text-xs font-anton tracking-wider uppercase rounded-xl cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}

            {/* List of Templates */}
            <div className="space-y-2 max-h-[46vh] overflow-y-auto custom-scrollbar pr-1">
              {templates.map(tmpl => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <div
                    key={tmpl.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => {
                      soundFX.playClick();
                      triggerHaptic(15);
                      setSelectedTemplateId(tmpl.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        soundFX.playClick();
                        triggerHaptic(15);
                        setSelectedTemplateId(tmpl.id);
                      }
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative group flex items-start gap-3 ${
                      isSelected
                        ? 'aura-bg-soft aura-border-primary aura-glow-subtle optic-active-card'
                        : 'bg-[#040814]/80 border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-xl shrink-0">
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
                      <span className="text-[10px] font-mono tabular-nums font-bold aura-text-soft mt-1 inline-block">
                        {tmpl.tasks.length} misiones
                      </span>
                    </div>

                    {tmpl.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFX.playClick();
                          triggerHaptic(20);
                          setDeletingTemplateId(tmpl.id);
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-rose-400 p-1 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                        title={`Eliminar plantilla ${tmpl.name}`}
                        aria-label={`Eliminar plantilla ${tmpl.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Inline Deletion Confirmation Safeguard */}
                    {deletingTemplateId === tmpl.id && (
                      <div 
                        className="absolute inset-0 bg-rose-950/95 border border-rose-500/60 rounded-2xl flex items-center justify-between px-3 py-2 z-20 animate-in fade-in duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[11px] font-bold text-rose-200 truncate pr-2">¿Eliminar plantilla?</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundFX.playClick();
                              setDeletingTemplateId(null);
                            }}
                            className="chicle-btn px-2 py-1 rounded-lg text-[10px] font-bold text-slate-200 hover:text-white bg-white/10 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                            className="chicle-btn px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-sm cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Template Preview */}
          <div className="md:col-span-7 flex flex-col bg-[#040814]/80 border border-white/10 rounded-2xl p-4 sm:p-5">
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
                <div className="my-3 flex-1 overflow-y-auto custom-scrollbar space-y-1.5 max-h-[32vh] pr-1">
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums font-bold text-slate-400 px-1">
                    <span>Tareas incluidas ({selectedTemplate.tasks.length}):</span>
                    <span className="aura-text-primary">XP Total: +{selectedTemplate.tasks.reduce((sum, t) => sum + (t.xpReward || 0), 0)}</span>
                  </div>
                  {selectedTemplate.tasks.map((task, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-slate-500 font-mono tabular-nums text-[10px] w-4">{idx + 1}.</span>
                        <span className="text-white font-medium truncate">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {task.timeBlock && (
                          <span className="text-[10px] font-mono tabular-nums aura-text-soft aura-bg-soft px-2 py-0.5 rounded border aura-border-subtle">
                            {task.timeBlock}
                          </span>
                        )}
                        <span className="text-[10px] font-mono tabular-nums font-bold text-amber-300">
                          +{task.xpReward} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">
                Selecciona una plantilla de la izquierda para ver los detalles.
              </div>
            )}
          </div>

        </div>

        {/* Footer con dos acciones claras */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#040814]/[0.96] flex flex-col gap-2 shrink-0 relative z-10">
          {selectedTemplate && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFX.playTaskComplete();
                  triggerHaptic([30, 50, 40]);
                  onApplyTemplate(selectedTemplate, 'merge');
                  onClose();
                }}
                className="chicle-btn py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-200 hover:text-white font-anton uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 border border-white/15 cursor-pointer"
              >
                <span>➕ Sumar a mi día</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playTaskComplete();
                  triggerHaptic([30, 50, 40]);
                  onApplyTemplate(selectedTemplate, 'replace');
                  onClose();
                }}
                className="chicle-btn aura-btn-gradient optic-active-card py-2.5 px-3 rounded-xl font-anton uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⚡ Empezar limpio</span>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="chicle-btn py-2 bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white rounded-xl font-anton uppercase tracking-wider text-xs text-center cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
