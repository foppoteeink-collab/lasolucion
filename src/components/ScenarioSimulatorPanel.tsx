import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, Sparkles, CheckCircle2, RotateCcw, AlertTriangle, 
  Flame, Shield, Clock, Calendar, Zap, Award, User, Play, ChevronRight,
  Coins, Briefcase, BookOpen
} from 'lucide-react';
import { 
  SCENARIO_PRESETS, 
  SimulatedScenarioConfig, 
  applyScenario, 
  restoreRealUserData, 
  isSimulationActive, 
  getSimulationDetails 
} from '../utils/scenarioSimulator';
import { soundFX } from '../utils/audio';
import { CHARACTER_CLASSES } from '../data/defaults';

interface ScenarioSimulatorPanelProps {
  onClose?: () => void;
}

export const ScenarioSimulatorPanel: React.FC<ScenarioSimulatorPanelProps> = ({ onClose }) => {
  const [activeSim, setActiveSim] = useState<boolean>(isSimulationActive());
  const [simDetails, setSimDetails] = useState(getSimulationDetails());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Custom Simulator Form State
  const [customName, setCustomName] = useState<string>('Alex Thorne');
  const [customDays, setCustomDays] = useState<number>(30);
  const [customRate, setCustomRate] = useState<number>(75);
  const [customArchetype, setCustomArchetype] = useState<string>('Espíritu Heroico');
  const [customSleep, setCustomSleep] = useState<'early' | 'night_owl' | 'mixed'>('mixed');

  useEffect(() => {
    const handleSimChange = () => {
      setActiveSim(isSimulationActive());
      setSimDetails(getSimulationDetails());
    };
    window.addEventListener('taskquest:simulation-changed', handleSimChange);
    return () => window.removeEventListener('taskquest:simulation-changed', handleSimChange);
  }, []);

  const handleApplyPreset = (preset: SimulatedScenarioConfig) => {
    soundFX.playClick();
    const success = applyScenario(preset);
    if (success) {
      soundFX.playLevelUp();
      setActiveSim(true);
      setSimDetails(getSimulationDetails());
      setStatusMessage(`✓ Simulación de ${preset.name} (${preset.days} días) inyectada con éxito`);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleApplyCustom = () => {
    soundFX.playClick();
    const selectedClass = CHARACTER_CLASSES.find(c => c.name === customArchetype) || CHARACTER_CLASSES[0];
    
    const customConfig: SimulatedScenarioConfig = {
      id: `custom_${Date.now()}`,
      name: customName.trim() || 'Operador Simulado',
      avatar: selectedClass.avatar || '⚡',
      archetype: customArchetype,
      characterClass: customArchetype,
      days: customDays,
      consistencyRate: customRate / 100,
      sleepPattern: customSleep,
      tagline: `Simulación personalizada de ${customDays} días (${customRate}% cumplimiento)`,
      description: `Telemetría algorítmica inyectada para evaluar ${customDays} días continuos con ${customRate}% de consistencia en hábitos y tareas.`,
      highlights: [
        `${customDays} días calculados matemáticamente`,
        `Tasa de consistencia configurada al ${customRate}%`,
        `Patrón de descanso: ${customSleep === 'early' ? 'Madrugador (8h)' : customSleep === 'night_owl' ? 'Noctámbulo' : 'Mixto'}`,
        `Arquetipo base: ${customArchetype}`
      ]
    };

    const success = applyScenario(customConfig);
    if (success) {
      soundFX.playLevelUp();
      setActiveSim(true);
      setSimDetails(getSimulationDetails());
      setStatusMessage(`✓ Escenario personalizado "${customConfig.name}" inyectado con éxito`);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleRestore = () => {
    soundFX.playClick();
    const success = restoreRealUserData();
    if (success) {
      soundFX.playSuccess();
      setActiveSim(false);
      setSimDetails(null);
      setStatusMessage('✓ Datos reales restaurados con éxito. Modo simulación desactivado.');
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER EXPLANATION */}
      <div className="relative isolate p-4 sm:p-5 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        <div className="relative z-10 flex items-start gap-3">
          <div className="p-2.5 rounded-xl aura-bg-soft border aura-border-subtle aura-text-primary shrink-0 mt-0.5">
            <FlaskConical className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-anton text-base uppercase tracking-wider">
                Simulador de Progreso & Proyecciones
              </h3>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase font-mono aura-bg-soft border aura-border-subtle aura-text-soft">
                MODO PRUEBA
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Prueba la aplicación con perfiles de 2 semanas, 1 mes o 3 meses de uso continuo.{' '}
              <strong className="aura-text-soft">Tus datos reales se respaldan automáticamente</strong> y se restauran con un toque.
            </p>

            <div className="flex items-center gap-2 pt-1 flex-wrap text-[10px] font-mono font-bold text-slate-300">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#040814]/80 border border-emerald-500/35 text-emerald-300">
                <Briefcase className="w-3 h-3 text-emerald-400" /> Tareas & Clientes
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#040814]/80 border border-amber-500/35 text-amber-300">
                <Coins className="w-3 h-3 text-amber-400" /> Finanzas & Tesorería
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#040814]/80 border aura-border-subtle aura-text-soft">
                <Flame className="w-3 h-3 aura-text-primary" /> Hábitos & Rachas
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#040814]/80 border border-purple-500/35 text-purple-300">
                <BookOpen className="w-3 h-3 text-purple-400" /> Diario & Sueño
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK NOTIFICATION */}
      {statusMessage && (
        <div role="status" aria-live="polite" className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ACTIVE SIMULATION STATUS / RESTORE BUTTON */}
      {activeSim ? (
        <div className="relative isolate p-4 rounded-2xl bg-[#040a1a]/[0.94] border aura-border-primary aura-glow-subtle text-white overflow-hidden">
          <span className="vi-grano opacity-5" aria-hidden="true" />
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl aura-bg-soft border aura-border-primary flex items-center justify-center text-xl shrink-0">
                🧪
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase aura-text-primary">Modo Simulación Activo</span>
                  <span className="w-2 h-2 rounded-full aura-bg-primary animate-ping" />
                </div>
                <p className="font-anton uppercase tracking-wider text-sm text-white">
                  {simDetails?.name || 'Operador Simulado'} (<span className="font-mono tabular-nums">{simDetails?.days || 14}</span> días de datos ficticios)
                </p>
                <p className="text-[11px] text-slate-300">
                  La sincronización remota está en pausa para proteger tu cuenta.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRestore}
              className="chicle-btn aura-btn-gradient optic-active-card w-full sm:w-auto px-4 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar Mis Datos Reales</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-[#040814]/80 border border-white/10 flex items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Estás en tu <strong className="text-white">perfil personal auténtico</strong>. Al activar cualquier escenario, se creará un respaldo seguro automático.</span>
          </div>
        </div>
      )}

      {/* SECTION 1: PRESET ARCHETYPAL SCENARIOS */}
      <div className="space-y-3">
        <h4 className="text-xs font-anton uppercase text-slate-300 tracking-wider flex items-center gap-2">
          <span>Escenarios Predefinidos (Personas Arquetípicas)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIO_PRESETS.map((preset) => {
            const isCurrent = activeSim && simDetails?.name === preset.name;
            return (
              <div
                key={preset.id}
                className={`relative isolate p-4 rounded-2xl bg-[#040a1a]/[0.94] border transition-all flex flex-col justify-between overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.45)] ${
                  isCurrent
                    ? 'aura-border-primary aura-glow-subtle ring-1 ring-white/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <span className="vi-grano opacity-5" aria-hidden="true" />
                <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl p-1.5 bg-[#040814]/80 rounded-xl border border-white/10">{preset.avatar}</span>
                      <div>
                        <h5 className="font-anton uppercase tracking-wider text-white text-sm">{preset.name}</h5>
                        <span className="text-[10px] font-mono aura-text-primary font-bold uppercase">{preset.archetype}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono tabular-nums font-bold aura-bg-soft aura-text-soft border aura-border-subtle">
                      {preset.days} DÍAS
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {preset.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Métricas clave:</p>
                    {preset.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <CheckCircle2 className="w-3 h-3 aura-text-primary shrink-0" />
                        <span className="truncate">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  aria-label={`${isCurrent ? 'Reiniciar' : 'Cargar'} escenario de ${preset.name}`}
                  className={`relative z-10 chicle-btn mt-4 w-full py-2.5 px-3 rounded-xl font-anton text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isCurrent
                      ? 'aura-bg-soft aura-text-primary border aura-border-primary optic-active-card'
                      : 'bg-white/[0.04] hover:bg-white/[0.1] border border-white/15 hover:aura-border-subtle text-slate-200 hover:text-white'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isCurrent ? 'Reiniciar Este Escenario' : 'Cargar Este Escenario'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CUSTOM SCENARIO GENERATOR */}
      <div className="relative isolate p-4 sm:p-5 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 aura-text-primary" />
              <h4 className="text-sm font-anton text-white uppercase tracking-wider">
                Generador Personalizado de Escenarios
              </h4>
            </div>
            <span className="text-[10px] font-mono aura-text-soft aura-bg-soft px-2.5 py-0.5 rounded-lg border aura-border-subtle">
              SIMULADOR DINÁMICO
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold uppercase text-[10px]">Tu Nombre o Alias</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ej. Santiago, Elena..."
                className="w-full px-3 py-2 rounded-xl bg-[#040814]/80 border border-white/15 text-white focus:border-cyan-400 outline-none text-xs font-bold"
              />
            </div>

            {/* Arquetipo */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold uppercase text-[10px]">Arquetipo de Personalidad</label>
              <select
                value={customArchetype}
                onChange={(e) => setCustomArchetype(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#040814]/80 border border-white/15 text-white focus:border-cyan-400 outline-none text-xs font-bold"
              >
                {CHARACTER_CLASSES.map((c) => (
                  <option key={c.id} value={c.name} className="bg-[#030712] text-white">
                    {c.avatar} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Duración (Días) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-bold uppercase text-[10px]">Duración Histórica</label>
                <span className="aura-text-primary font-mono tabular-nums font-bold">{customDays} días</span>
              </div>
              <div className="flex gap-1">
                {[7, 14, 30, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setCustomDays(d);
                    }}
                    aria-pressed={customDays === d}
                    aria-label={`Seleccionar duración de ${d} días`}
                    className={`chicle-btn flex-1 py-1.5 rounded-xl font-mono tabular-nums font-bold text-[10px] border transition-all cursor-pointer ${
                      customDays === d
                        ? 'aura-bg-soft aura-text-primary aura-border-primary optic-active-card'
                        : 'bg-[#040814]/80 text-slate-400 border-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Patrón de Sueño */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold uppercase text-[10px]">Horario de Sueño</label>
              <select
                value={customSleep}
                onChange={(e) => setCustomSleep(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#040814]/80 border border-white/15 text-white focus:border-cyan-400 outline-none text-xs font-bold"
              >
                <option value="early" className="bg-[#030712] text-white">🌅 Madrugador (22:30 a 06:30)</option>
                <option value="mixed" className="bg-[#030712] text-white">⚖️ Mixto (Variabilidad normal)</option>
                <option value="night_owl" className="bg-[#030712] text-white">🦉 Noctámbulo (01:00 a 08:30)</option>
              </select>
            </div>
          </div>

          {/* Slider de Consistencia */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold uppercase text-[10px]">
                Tasa de Éxito y Cumplimiento
              </label>
              <span className="text-sm font-mono tabular-nums font-black aura-text-primary">
                {customRate}% {customRate === 100 ? '(Impecable)' : customRate >= 80 ? '(Alto Rendimiento)' : customRate >= 60 ? '(Vida Real / Resiliente)' : '(Irregular / En Riesgo)'}
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              step="5"
              value={customRate}
              onChange={(e) => setCustomRate(parseInt(e.target.value, 10))}
              style={{ accentColor: 'var(--aura-color-1, #00f0ff)' }}
              className="w-full cursor-pointer h-2 bg-white/10 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono tabular-nums text-slate-400">
              <span>40% (Caídas frecuentes)</span>
              <span>70% (Realista con tropiezos)</span>
              <span>100% (Disciplina absoluta)</span>
            </div>
          </div>

          {/* Botón Inyectar */}
          <button
            type="button"
            onClick={handleApplyCustom}
            className="chicle-btn aura-btn-gradient optic-active-card w-full py-3 px-4 rounded-xl font-anton text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Inyectar Escenario Personalizado ({customDays} Días / {customRate}% Éxito)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
