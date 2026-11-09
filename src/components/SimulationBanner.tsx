import React, { useState, useEffect } from 'react';
import { FlaskConical, RotateCcw, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { isSimulationActive, getSimulationDetails, restoreRealUserData } from '../utils/scenarioSimulator';
import { soundFX } from '../utils/audio';
import { useUIStore } from '../store/useUIStore';

export const SimulationBanner: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean>(isSimulationActive());
  const [details, setDetails] = useState(getSimulationDetails());
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('taskquest_sim_banner_minimized') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleSimChange = () => {
      setIsActive(isSimulationActive());
      setDetails(getSimulationDetails());
    };
    window.addEventListener('taskquest:simulation-changed', handleSimChange);
    return () => window.removeEventListener('taskquest:simulation-changed', handleSimChange);
  }, []);

  if (!isActive) return null;

  const handleRestore = () => {
    soundFX.playClick();
    const success = restoreRealUserData();
    if (success) {
      soundFX.playSuccess();
      setIsActive(false);
      setDetails(null);
    }
  };

  const handleOpenSimulator = () => {
    soundFX.playClick();
    useUIStore.getState().setActiveTab('settings');
    // Dispatch event to switch to simulator subtab
    window.dispatchEvent(new CustomEvent('taskquest:open-simulator-tab'));
  };

  const toggleMinimized = () => {
    soundFX.playClick();
    setIsMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('taskquest_sim_banner_minimized', String(next));
      } catch {}
      return next;
    });
  };

  if (isMinimized) {
    return (
      <div className="mb-2 p-1.5 px-3 rounded-xl bg-purple-950/90 border border-fuchsia-500/50 text-white shadow-lg flex items-center justify-between gap-2 z-20 relative text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse shrink-0" />
          <span className="font-mono text-[10px] text-fuchsia-300 font-bold uppercase truncate">
            Simulador: {details?.name} ({details?.days}d)
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleRestore}
            className="px-2 py-0.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-[10px] uppercase tracking-wide transition-all cursor-pointer"
            title="Restaurar datos reales"
          >
            Restaurar
          </button>
          <button
            type="button"
            onClick={toggleMinimized}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Expandir aviso de simulación"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-fuchsia-950/90 via-purple-950/80 to-[#00152b] border border-fuchsia-500/70 text-white shadow-[0_0_20px_rgba(217,70,239,0.25)] flex flex-wrap items-center justify-between gap-3 animate-fade-in z-20 relative">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/60 flex items-center justify-center text-fuchsia-300 shrink-0">
          <FlaskConical className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black uppercase text-fuchsia-400 tracking-wider">
              MODO SIMULACIÓN EN VIVO
            </span>
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
          </div>
          <p className="text-xs font-black text-slate-100">
            Escenario: <span className="text-cyan-300">{details?.name}</span> ({details?.days} días simulados)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={handleOpenSimulator}
          className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-600/50 text-[11px] font-bold text-purple-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Cambiar</span>
        </button>

        <button
          type="button"
          onClick={handleRestore}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.4)] shrink-0"
          title="Restaurar tu cuenta y datos originales"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Datos Reales</span>
        </button>

        <button
          type="button"
          onClick={toggleMinimized}
          className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Minimizar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
