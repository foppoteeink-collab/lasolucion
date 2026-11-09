import React, { useState, useEffect } from 'react';
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

  if (!isDayRhythmOpen) return null;

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

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-rhythm-modal-title"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-[#000f24] border border-cyan-500/70 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Ambient glow backgrounds */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-cyan-950/80 bg-gradient-to-b from-[#001836] to-[#000f24] relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400/90 font-bold block">
                  Calibración de Ritmo Circadiano
                </span>
                <h2 id="day-rhythm-modal-title" className="text-base sm:text-lg font-black text-white tracking-tight">
                  Inicio de tu Jornada de Tareas
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar calibración de ritmo circadiano"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cyan-500/20 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs text-slate-300 custom-scrollbar relative z-10">
            {/* Friendly explanation */}
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-200 text-[11px] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p>
                Dinos a qué hora comienza tu jornada diaria de trabajo o actividades. La aplicación mantendrá todas tus tareas de la jornada <strong>unidas sin dividirse</strong> durante 24 horas continuas, protegiendo tus rachas sin importar si trabajas de día o de noche.
              </p>
            </div>

            {/* Quick Presets Grid */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
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
                      role="button"
                      aria-pressed={isSelected}
                      aria-label={`Seleccionar turno habitual ${preset.label}`}
                      onClick={() => {
                        soundFX.playClick();
                        setSelectedHour(preset.hour);
                      }}
                      className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400'
                          : 'bg-[#00152b]/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-[#001c38]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900 text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate flex items-center gap-1.5">
                            <span>{preset.label}</span>
                            {preset.badge && (
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                {preset.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{preset.sublabel}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Exact Hour Selector */}
            <div className="p-3.5 rounded-xl bg-[#00152b]/80 border border-cyan-900/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Personalizar hora exacta:
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-[#000a14] border border-cyan-500/40">
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
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>12 AM (00:00)</span>
                <span>06 AM</span>
                <span>12 PM</span>
                <span>06 PM</span>
                <span>11 PM</span>
              </div>
            </div>

            {/* Live Operational Preview Box */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#001a33] to-[#001224] border border-cyan-500/40 shadow-inner space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Vista Previa Operativa de tu Día</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Inicio de ciclo:</span>
                  <span className="font-mono font-bold text-white">{startStr}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cierre de ciclo (24h completas):</span>
                  <span className="font-mono font-bold text-white">{endStr}</span>
                </div>
                <p className="text-[10px] text-cyan-400/90 pt-1 border-t border-cyan-900/50">
                  ⚡ Las tareas que agendes durante este intervalo de 24 horas aparecerán juntas en tu lista de hoy sin partirse a la mitad.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-4 sm:p-5 border-t border-cyan-950/80 bg-[#001229] flex items-center justify-between gap-3 relative z-10">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Guardar Ritmo</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
