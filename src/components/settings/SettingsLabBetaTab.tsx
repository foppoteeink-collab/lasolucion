import React, { useState, Suspense, lazy } from 'react';
import { 
  FlaskConical, 
  Headphones, 
  Sparkles, 
  Box, 
  Activity, 
  Layers, 
  Play,
  RotateCw
} from 'lucide-react';
import { soundFX } from '../../utils/audio';
import { QuantumSoundscapeConsole } from '../QuantumSoundscapeConsole';
import { QuantumCubeLoader } from '../QuantumCubeLoader';

const ScenarioSimulatorPanel = lazy(() =>
  import('../ScenarioSimulatorPanel').then((m) => ({ default: m.ScenarioSimulatorPanel }))
);

interface SettingsLabBetaTabProps {
  onOpenOracle?: () => void;
}

type BetaSubModule = 'simulator' | 'audio' | 'loader' | 'oracle';

export const SettingsLabBetaTab: React.FC<SettingsLabBetaTabProps> = ({ onOpenOracle }) => {
  const [activeModule, setActiveModule] = useState<BetaSubModule>('simulator');
  
  // Controles de prueba para el QuantumCubeLoader experimental
  const [loaderSize, setLoaderSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [loaderSpeed, setLoaderSpeed] = useState<'slow' | 'normal' | 'superslow'>('slow');
  const [showLoaderLabel, setShowLoaderLabel] = useState(true);
  const [loaderLabel, setLoaderLabel] = useState('NÚCLEO SINCRONIZADO CON ESTA APARIENCIA');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* BANNER INFORMATIVO BETA */}
      <div className="w-full relative isolate rounded-2xl bg-[#040a1a]/[0.94] p-4 sm:p-5 border border-fuchsia-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent" aria-hidden="true" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-400/40 flex items-center justify-center text-fuchsia-300 shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-anton uppercase tracking-wider text-white">
                  Laboratorio Experimental & Suite Beta
                </h3>
                <span className="text-[10px] font-mono font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40 px-2 py-0.5 rounded-full uppercase">
                  Beta 2.0
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Herramientas de simulación, pruebas acústicas y componentes visuales en evaluación aislada.
              </p>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN MODULAR DE EXPERIMENTOS */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-3 border-t border-white/10 custom-scrollbar">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActiveModule('simulator');
            }}
            className={`chicle-btn px-3.5 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeModule === 'simulator'
                ? 'bg-fuchsia-500/25 border border-fuchsia-400 text-fuchsia-200 shadow-[0_0_15px_rgba(217,70,239,0.3)] font-bold'
                : 'bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Simulador Táctico</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActiveModule('audio');
            }}
            className={`chicle-btn px-3.5 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeModule === 'audio'
                ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold'
                : 'bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mezclador Acústico</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActiveModule('loader');
            }}
            className={`chicle-btn px-3.5 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeModule === 'loader'
                ? 'bg-amber-500/25 border border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-bold'
                : 'bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>Cubo Cuántico (Loader)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActiveModule('oracle');
            }}
            className={`chicle-btn px-3.5 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeModule === 'oracle'
                ? 'bg-purple-500/25 border border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)] font-bold'
                : 'bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Oráculo de Pruebas</span>
          </button>
        </div>
      </div>

      {/* EXPERIMENTO 1: SIMULADOR TÁCTICO */}
      {activeModule === 'simulator' && (
        <div className="space-y-4">
          <Suspense
            fallback={
              <div className="p-8 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
                Iniciando motor del simulador táctico...
              </div>
            }
          >
            <ScenarioSimulatorPanel />
          </Suspense>
        </div>
      )}

      {/* EXPERIMENTO 2: MESA ACÚSTICA & PAISAJES SONOROS */}
      {activeModule === 'audio' && (
        <div className="w-full relative isolate rounded-2xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-cyan-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
          <span className="vi-grano opacity-5" aria-hidden="true" />
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-cyan-400 to-transparent" aria-hidden="true" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-anton uppercase tracking-wider text-white">
                  Laboratorio Acústico & Frecuencias
                </h3>
                <p className="text-xs text-slate-400">
                  Generador generativo de ondas binaurales, ruido cuántico y paisajes inmersivos para enfoque.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-2 border-t border-white/10">
            <QuantumSoundscapeConsole compact={false} />
          </div>
        </div>
      )}

      {/* EXPERIMENTO 3: VISOR CUÁNTICO & CUADROS DE CARGA */}
      {activeModule === 'loader' && (
        <div className="w-full relative isolate rounded-2xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-amber-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-5">
          <span className="vi-grano opacity-5" aria-hidden="true" />
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-amber-400 to-transparent" aria-hidden="true" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-anton uppercase tracking-wider text-white">
                Banco de Pruebas: QuantumCubeLoader
              </h3>
              <p className="text-xs text-slate-400">
                Visualizador de animación con cubitos y barritas utilizado en transiciones de carga pesada.
              </p>
            </div>
          </div>

          {/* Banco de Control Interactivo */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#040814]/80 border border-white/10 text-xs">
            <div>
              <span className="block font-mono text-[10px] text-slate-400 uppercase mb-1">Tamaño</span>
              <div className="flex gap-1.5">
                {(['sm', 'md', 'lg'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLoaderSize(s)}
                    className={`px-2.5 py-1 rounded-lg font-anton uppercase tracking-wider text-[11px] ${
                      loaderSize === s ? 'bg-amber-500/25 border border-amber-400 text-amber-200' : 'bg-white/5 border border-white/10 text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block font-mono text-[10px] text-slate-400 uppercase mb-1">Velocidad</span>
              <div className="flex gap-1.5">
                {(['slow', 'normal', 'superslow'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLoaderSpeed(v)}
                    className={`px-2.5 py-1 rounded-lg font-anton uppercase tracking-wider text-[11px] ${
                      loaderSpeed === v ? 'bg-amber-500/25 border border-amber-400 text-amber-200' : 'bg-white/5 border border-white/10 text-slate-400'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block font-mono text-[10px] text-slate-400 uppercase mb-1">Etiqueta</span>
              <button
                type="button"
                onClick={() => setShowLoaderLabel(!showLoaderLabel)}
                className={`w-full py-1 px-2 rounded-lg font-anton uppercase tracking-wider text-[11px] ${
                  showLoaderLabel ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300' : 'bg-white/5 border border-white/10 text-slate-400'
                }`}
              >
                {showLoaderLabel ? 'Texto Visible' : 'Oculto'}
              </button>
            </div>
          </div>

          {/* Escenario de renderizado del componente */}
          <div className="relative z-10 py-10 rounded-2xl bg-[#02050f] border border-white/10 flex flex-col items-center justify-center min-h-[160px] shadow-inner">
            <QuantumCubeLoader 
              size={loaderSize} 
              speed={loaderSpeed} 
              showLabel={showLoaderLabel} 
              label={loaderLabel} 
            />
          </div>
        </div>
      )}

      {/* EXPERIMENTO 4: ORÁCULO DE PRUEBAS */}
      {activeModule === 'oracle' && (
        <div className="w-full relative isolate rounded-2xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-purple-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
          <span className="vi-grano opacity-5" aria-hidden="true" />
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-purple-400 to-transparent" aria-hidden="true" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-anton uppercase tracking-wider text-white">
                Consola del Oráculo IA
              </h3>
              <p className="text-xs text-slate-400">
                Punto de prueba para evaluar la heurística y generación de misiones de KAI.
              </p>
            </div>
          </div>

          <div className="relative z-10 p-5 rounded-2xl bg-[#040814]/80 border border-white/10 space-y-3 text-xs text-slate-300">
            <p>
              El Oráculo analiza la coherencia entre tus tareas activas, arquetipo de personalidad y nivel actual para ofrecerte recomendaciones estratégicas.
            </p>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                if (onOpenOracle) onOpenOracle();
              }}
              className="chicle-btn aura-btn-gradient optic-active-card px-5 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ejecutar Oráculo de Pruebas</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
