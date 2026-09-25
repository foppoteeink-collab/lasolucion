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
  const [customArchetype, setCustomArchetype] = useState<string>('El Héroe');
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
      <div className="p-4 rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-[#001428] border border-fuchsia-500/40 shadow-[0_0_20px_rgba(217,70,239,0.15)] flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300 shrink-0 mt-0.5">
          <FlaskConical className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-black text-base uppercase tracking-wider">
              Simulador de Escenarios & Telemetría
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
              SANDBOX SEGURO
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Experimenta cómo se comporta la aplicación completa para distintos perfiles de uso (2 semanas, 1 mes, 3 meses). 
            <strong>Simula el ecosistema completo:</strong> tareas de trabajo reales por horarios, ingresos de clientes, gastos cotidianos, metas de tesorería, sesiones de foco y reflexiones nocturnas.
            <strong className="text-fuchsia-200"> Tus datos personales reales se respaldan de inmediato</strong> y se restauran con un solo toque.
          </p>

          <div className="flex items-center gap-2 pt-1 flex-wrap text-[10px] font-mono font-bold text-slate-300">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
              <Briefcase className="w-3 h-3 text-emerald-400" /> Tareas & Clientes
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-500/40 text-amber-300">
              <Coins className="w-3 h-3 text-amber-400" /> Finanzas & Tesorería
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
              <Flame className="w-3 h-3 text-cyan-400" /> Hábitos & Rachas
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/70 border border-purple-500/40 text-purple-300">
              <BookOpen className="w-3 h-3 text-purple-400" /> Diario & Sueño
            </span>
          </div>
        </div>
      </div>

      {/* FEEDBACK NOTIFICATION */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.25)]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ACTIVE SIMULATION STATUS / RESTORE BUTTON */}
      {activeSim ? (
        <div className="p-4 rounded-2xl bg-[#001d3d] border-2 border-cyan-400 text-white shadow-[0_0_25px_rgba(6,182,212,0.35)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-xl shrink-0">
              🧪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-cyan-400">Modo Simulación Activo</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <p className="font-black text-sm text-white">
                {simDetails?.name || 'Operador Simulado'} ({simDetails?.days || 14} días de datos ficticios)
              </p>
              <p className="text-[11px] text-slate-300">
                La sincronización remota está en pausa para proteger tu cuenta.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRestore}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Mis Datos Reales</span>
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Estás en tu <strong>perfil personal auténtico</strong>. Al activar cualquier escenario, se creará un respaldo seguro automático.</span>
          </div>
        </div>
      )}

      {/* SECTION 1: PRESET ARCHETYPAL SCENARIOS */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
          <span>Escenarios Predefinidos (Personas Arquetípicas)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIO_PRESETS.map((preset) => {
            const isCurrent = activeSim && simDetails?.name === preset.name;
            return (
              <div 
                key={preset.id}
                className={`p-4 rounded-2xl bg-[#001020] border transition-all flex flex-col justify-between ${
                  isCurrent 
                    ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl p-1 bg-black/40 rounded-xl border border-slate-800">{preset.avatar}</span>
                      <div>
                        <h5 className="font-black text-white text-sm">{preset.name}</h5>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{preset.archetype}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      {preset.days} DÍAS
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {preset.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Telemetría clave:</p>
                    {preset.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`mt-4 w-full py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isCurrent 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                      : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-300 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]'
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
      <div className="p-4 sm:p-5 rounded-2xl bg-[#000f1f] border border-fuchsia-900/40 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-fuchsia-400" />
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Generador Personalizado de Escenarios
            </h4>
          </div>
          <span className="text-[10px] font-mono text-fuchsia-300 bg-fuchsia-950/60 px-2 py-0.5 rounded border border-fuchsia-800">
            MOTOR PROCEDURAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold uppercase text-[10px]">Nombre del Operador</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ej. Santiago, Elena..."
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-slate-700 text-white focus:border-fuchsia-400 outline-none text-xs font-bold"
            />
          </div>

          {/* Arquetipo */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold uppercase text-[10px]">Arquetipo de Personalidad</label>
            <select
              value={customArchetype}
              onChange={(e) => setCustomArchetype(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-slate-700 text-white focus:border-fuchsia-400 outline-none text-xs font-bold"
            >
              {CHARACTER_CLASSES.map((c) => (
                <option key={c.id} value={c.name} className="bg-slate-900 text-white">
                  {c.avatar} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duración (Días) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-bold uppercase text-[10px]">Duración Histórica</label>
              <span className="text-fuchsia-400 font-mono font-bold">{customDays} días</span>
            </div>
            <div className="flex gap-1">
              {[7, 14, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setCustomDays(d)}
                  className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-[10px] transition-all cursor-pointer ${
                    customDays === d 
                      ? 'bg-fuchsia-600 text-white shadow-[0_0_10px_rgba(217,70,239,0.5)]'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
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
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-slate-700 text-white focus:border-fuchsia-400 outline-none text-xs font-bold"
            >
              <option value="early" className="bg-slate-900 text-white">🌅 Madrugador (22:30 a 06:30)</option>
              <option value="mixed" className="bg-slate-900 text-white">⚖️ Mixto (Variabilidad normal)</option>
              <option value="night_owl" className="bg-slate-900 text-white">🦉 Noctámbulo (01:00 a 08:30)</option>
            </select>
          </div>
        </div>

        {/* Slider de Consistencia */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-bold uppercase text-[10px]">
              Tasa de Éxito y Cumplimiento
            </label>
            <span className="text-sm font-mono font-black text-fuchsia-400">
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
            className="w-full accent-fuchsia-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>40% (Caídas frecuentes)</span>
            <span>70% (Realista con tropiezos)</span>
            <span>100% (Disciplina absoluta)</span>
          </div>
        </div>

        {/* Botón Inyectar */}
        <button
          type="button"
          onClick={handleApplyCustom}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,70,239,0.35)] transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Inyectar Escenario Personalizado ({customDays} Días / {customRate}% Éxito)</span>
        </button>
      </div>
    </div>
  );
};
