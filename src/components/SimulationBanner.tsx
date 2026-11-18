import React, { useState, useEffect } from 'react';
import { FlaskConical, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
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
      <div className="mb-2 py-2 px-3 rounded-xl relative isolate overflow-hidden bg-[#040a1a]/[0.96] border border-amber-500/45 text-white shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-between gap-2 z-20 text-xs">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div
          className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-2 min-w-0">
          <FlaskConical className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/40 font-mono tabular-nums text-[10px] text-amber-300 font-bold uppercase shrink-0">
            Simulador
          </span>
          <span className="font-mono tabular-nums text-[11px] text-slate-200 font-semibold truncate">
            {details?.name} ({details?.days}d)
          </span>
        </div>

        <div className="relative z-10 flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleRestore}
            className="chicle-btn px-2.5 py-1 rounded-lg aura-btn-gradient optic-active-card font-anton text-[10px] uppercase tracking-wider cursor-pointer"
            title="Restaurar datos reales"
          >
            Restaurar
          </button>
          <button
            type="button"
            onClick={toggleMinimized}
            aria-label="Expandir aviso de simulación"
            className="chicle-btn w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
            title="Expandir aviso de simulación"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 p-3 sm:p-4 rounded-2xl relative isolate overflow-hidden bg-[#040a1a]/[0.96] border border-amber-500/45 text-white shadow-[0_12px_32px_rgba(0,0,0,0.55),0_0_20px_rgba(245,158,11,0.14)] flex flex-wrap items-center justify-between gap-3 animate-fade-in z-20">
      <span className="vi-grano opacity-5" aria-hidden="true" />
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-amber-400/55 via-violet-400/55 to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-400/40 flex items-center justify-center text-violet-300 shrink-0">
          <FlaskConical className="w-4 h-4 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/40 text-[10px] font-mono font-black uppercase text-amber-300 tracking-wider">
              MODO SIMULACIÓN EN VIVO
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <p className="text-xs font-bold text-slate-100 mt-1 truncate">
            Escenario: <span className="aura-text-soft">{details?.name}</span>{' '}
            <span className="font-mono tabular-nums text-slate-300">({details?.days} días simulados)</span>
          </p>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={handleOpenSimulator}
          className="chicle-btn px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-[11px] font-bold text-slate-200 hover:text-white cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Cambiar</span>
        </button>

        <button
          type="button"
          onClick={handleRestore}
          className="chicle-btn px-3 py-1.5 rounded-xl aura-btn-gradient optic-active-card font-anton text-[11px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          title="Restaurar tu cuenta y datos originales"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Datos Reales</span>
        </button>

        <button
          type="button"
          onClick={toggleMinimized}
          aria-label="Minimizar aviso de simulación"
          className="chicle-btn w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
          title="Minimizar aviso"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
