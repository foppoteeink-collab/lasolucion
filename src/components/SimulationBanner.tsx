import React, { useState, useEffect } from 'react';
import { FlaskConical, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { isSimulationActive, getSimulationDetails, restoreRealUserData } from '../utils/scenarioSimulator';
import { soundFX } from '../utils/audio';
import { useUIStore } from '../store/useUIStore';

export const SimulationBanner: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean>(isSimulationActive());
  const [details, setDetails] = useState(getSimulationDetails());

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

  return (
    <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-fuchsia-950/90 via-purple-950/80 to-[#00152b] border-2 border-fuchsia-500/80 text-white shadow-[0_0_25px_rgba(217,70,239,0.3)] flex flex-wrap items-center justify-between gap-4 animate-fade-in z-30 relative">
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
          className="px-3 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-600/50 text-[11px] font-bold text-purple-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Cambiar Escenario</span>
        </button>

        <button
          type="button"
          onClick={handleRestore}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.4)] shrink-0"
          title="Restaurar tu cuenta y datos originales"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Datos Reales</span>
        </button>
      </div>
    </div>
  );
};
