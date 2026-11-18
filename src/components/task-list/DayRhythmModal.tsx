import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Sun, Moon, Coffee, Sparkles, CheckCircle2, X, Info, Flame, ShieldCheck } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { soundFX } from '../../utils/audio';
import { formatHourToHuman } from '../../utils/timeUtils';
import { getGlobalDayStartHour, setGlobalDayStartHour } from '../../utils/date';

interface PresetOption {
  hour: number;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const PRESETS: PresetOption[] = [
  {
    hour: 6,
    label: 'Mañana (06:00 AM)',
    sublabel: 'Turno estándar diurno',
    icon: Sun,
    badge: 'Popular',
  },
  {
    hour: 10,
    label: 'Media Mañana (10:00 AM)',
    sublabel: 'Mañanas relajadas o creativas',
    icon: Coffee,
  },
  {
    hour: 15,
    label: 'Tarde (03:00 PM)',
    sublabel: 'Turno vespertino / tarde-noche',
    icon: Flame,
  },
  {
    hour: 21,
    label: 'Noche (09:00 PM)',
    sublabel: 'Turno nocturno temprano',
    icon: Moon,
    badge: 'Nocturno',
  },
  {
    hour: 0,
    label: 'Medianoche (12:00 AM)',
    sublabel: 'Turno de guardia / veladas',
    icon: Moon,
  },
  {
    hour: 3,
    label: 'Madrugada (03:00 AM)',
    sublabel: 'Búho nocturno (Modo clásico)',
    icon: Sparkles,
  },
];

export const DayRhythmModal: React.FC = () => {
  const isDayRhythmOpen = useUIStore((s) => s.isDayRhythmOpen);
  const setModalState = useUIStore((s) => s.setModalState);

  const stats = usePlayerStore((s) => s.stats);
  const setStats = usePlayerStore((s) => s.setStats);

  const currentConfiguredHour = stats.dayStartHour !== undefined ? stats.dayStartHour : getGlobalDayStartHour();
  const [selectedHour, setSelectedHour] = useState<number>(currentConfiguredHour);

  useEffect(() => {
    if (isDayRhythmOpen) {
      setSelectedHour(stats.dayStartHour !== undefined ? stats.dayStartHour : getGlobalDayStartHour());
    }
  }, [isDayRhythmOpen, stats.dayStartHour]);

  useEffect(() => {
    if (!isDayRhythmOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundFX.playClick();
        setModalState('isDayRhythmOpen', false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', onKey);
    };
  }, [isDayRhythmOpen, setModalState]);

  const handleClose = () => {
    soundFX.playClick();
    setModalState('isDayRhythmOpen', false);
  };

  const handleSave = () => {
    soundFX.playLevelUp();
    setGlobalDayStartHour(selectedHour);
    setStats((prev) => ({
      ...prev,
      dayStartHour: selectedHour,
    }));
    setModalState('isDayRhythmOpen', false);
  };

  const endHour = (selectedHour + 23) % 24;
  const startStr = formatHourToHuman(selectedHour);
  const endStr = formatHourToHuman(endHour).replace(':00', ':59');

  const modalContent = (
    <AnimatePresence>
      {isDayRhythmOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-rhythm-modal-title"
          className="fixed inset-0 z-[170] portal-modal-root flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm select-none"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="relative isolate w-full max-w-lg bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.75)] flex flex-col max-h-[92vh] overflow-hidden"
          >
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 bg-[#040814]/[0.96] relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl aura-bg-soft border aura-border-subtle aura-text-primary aura-glow-subtle">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase aura-text-primary font-bold block">
                    Calibración de Ritmo Circadiano
                  </span>
                  <h2 id="day-rhythm-modal-title" className="text-base sm:text-lg font-anton uppercase tracking-wider text-white">
                    Inicio de tu Jornada de Tareas
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar calibración de ritmo circadiano"
                className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs text-slate-300 custom-scrollbar relative z-10">
              {/* Friendly explanation */}
              <div className="p-3 rounded-xl aura-bg-soft border aura-border-subtle text-slate-200 text-[11px] flex items-start gap-2.5">
                <Info className="w-4 h-4 aura-text-primary shrink-0 mt-0.5" />
                <p>
                  Dinos a qué hora comienza tu jornada diaria de trabajo o actividades. La aplicación mantendrá todas tus tareas de la jornada <strong>unidas sin dividirse</strong> durante 24 horas continuas, protegiendo tus rachas sin importar si trabajas de día o de noche.
                </p>
              </div>

              {/* Quick Presets Grid */}
              <div className="space-y-2">
                <label className="text-[11px] font-anton text-slate-300 uppercase tracking-wider block">
                  Selecciona tu horario o turno habitual:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = selectedHour === preset.hour;
                    return (
                      <button
                        key={preset.hour}
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`Seleccionar turno habitual ${preset.label}`}
                        onClick={() => {
                          soundFX.playClick();
                          setSelectedHour(preset.hour);
                        }}
                        className={`chicle-btn p-3 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'aura-bg-soft aura-border-primary text-white aura-glow-subtle optic-active-card'
                            : 'bg-[#040814]/80 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'aura-bg-soft aura-text-primary' : 'bg-white/[0.04] text-slate-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs truncate flex items-center gap-1.5">
                              <span>{preset.label}</span>
                              {preset.badge && (
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded aura-bg-soft aura-text-primary border aura-border-subtle">
                                  {preset.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{preset.sublabel}</div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 aura-text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Exact Hour Selector */}
              <div className="p-3.5 rounded-xl bg-[#040814]/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 aura-text-primary" />
                    Personalizar hora exacta:
                  </span>
                  <span className="text-xs font-mono font-bold tabular-nums aura-text-primary px-2 py-0.5 rounded-lg bg-[#030712] border aura-border-subtle">
                    {formatHourToHuman(selectedHour)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="23"
                  step="1"
                  value={selectedHour}
                  aria-label="Hora exacta de inicio de la jornada diaria"
                  aria-valuemin={0}
                  aria-valuemax={23}
                  aria-valuenow={selectedHour}
                  aria-valuetext={formatHourToHuman(selectedHour)}
                  onChange={(e) => {
                    setSelectedHour(parseInt(e.target.value, 10));
                  }}
                  className="w-full cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  style={{ accentColor: 'var(--aura-color-1, #00f0ff)' }}
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                  <span>12 AM (00:00)</span>
                  <span>06 AM</span>
                  <span>12 PM</span>
                  <span>06 PM</span>
                  <span>11 PM</span>
                </div>
              </div>

              {/* Live Operational Preview Box */}
              <div className="p-3.5 rounded-xl bg-[#040a1a]/[0.94] border aura-border-subtle shadow-inner space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold aura-text-primary">
                  <ShieldCheck className="w-4 h-4 aura-text-primary" />
                  <span>Vista Previa Operativa de tu Día</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Inicio de ciclo:</span>
                    <span className="font-mono font-bold tabular-nums text-white">{startStr}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cierre de ciclo (24h completas):</span>
                    <span className="font-mono font-bold tabular-nums text-white">{endStr}</span>
                  </div>
                  <p className="text-[10px] aura-text-soft pt-1 border-t border-white/10">
                    ⚡ Las tareas que agendes durante este intervalo de 24 horas aparecerán juntas en tu lista de hoy sin partirse a la mitad.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#040814]/[0.96] flex items-center justify-between gap-3 relative z-10">
              <button
                type="button"
                onClick={handleClose}
                className="chicle-btn px-4 py-2.5 rounded-xl text-xs font-anton uppercase tracking-wider bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="chicle-btn aura-btn-gradient optic-active-card px-5 py-2.5 rounded-xl text-xs font-anton uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Ritmo</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
