import React, { useState, useMemo } from 'react';
import { X, Sparkles, Zap, Check, Target, AlertTriangle, Layers, Grid } from 'lucide-react';
import { JUNG_ARCHETYPES, JungArchetype } from '../data/archetypes';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { OrbitCardStack, OrbitStackItem } from './ui/orbit-card-stack';

interface ArchetypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArchetype: string;
  onSelectArchetype: (archetype: JungArchetype) => void;
}

const ARCHETYPE_ACCENTS: Record<string, string> = {
  inocente: '#f59e0b',
  heroe: '#00f0ff',
  sabio: '#38bdf8',
  rebelde: '#ef4444',
  mago: '#a855f7',
  amante: '#ec4899',
  creador: '#8b5cf6',
  gobernante: '#eab308',
  cuidador: '#10b981',
  bufon: '#f97316',
  explorador: '#14b8a6',
  huerfano: '#94a3b8',
};

export const ArchetypesModal: React.FC<ArchetypesModalProps> = ({
  isOpen,
  onClose,
  currentArchetype,
  onSelectArchetype,
}) => {
  const [viewMode, setViewMode] = useState<'orbit' | 'grid'>('orbit');

  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const currentNorm = normalize(currentArchetype || 'El Héroe');

  const initialActiveIndex = useMemo(() => {
    const idx = JUNG_ARCHETYPES.findIndex(
      (a) => normalize(a.name) === currentNorm || normalize(a.id) === currentNorm
    );
    return idx >= 0 ? idx : 0;
  }, [currentNorm]);

  const orbitItems: OrbitStackItem[] = useMemo(() => {
    return JUNG_ARCHETYPES.map((arch) => {
      const isSelected = currentNorm === normalize(arch.name) || currentNorm === normalize(arch.id);
      const accent = ARCHETYPE_ACCENTS[arch.id] || '#00f0ff';

      return {
        id: arch.id,
        name: arch.name,
        role: `KAI: ${arch.companion?.title || 'Guía'} ${arch.companion?.icon || '🤖'}`,
        description: arch.description,
        avatarIcon: arch.avatar,
        desire: arch.desire,
        fear: arch.fear,
        stat: arch.statBonus,
        accent,
        actionLabel: isSelected ? 'Sintonía Activa ✓' : 'Activar Arquetipo',
        actionDisabled: isSelected,
        onAction: () => {
          soundFX.playItemEquip();
          triggerShockwave({ color: 'violet', intensity: 'medium' });
          onSelectArchetype(arch);
          onClose();
        },
      };
    });
  }, [currentNorm, onSelectArchetype, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="scifi-glass-panel border-2 border-cyan-400 rounded-2xl w-full max-w-3xl shadow-[0_0_40px_rgba(0,240,255,0.35)] flex flex-col max-h-[94dvh] sm:max-h-[90vh] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-cyan-500/40 flex items-center justify-between bg-[#04020e] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)] shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="font-anton text-cyan-300 uppercase tracking-wide text-xs sm:text-base">
                Los 12 Arquetipos Jungianos & KAI
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-300 font-mono mt-0.5">
                Gira el mazo para sincronizar tu resonancia psicológica
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#061426] border border-cyan-500/40 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setViewMode('orbit');
                }}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'orbit'
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mazo Holográfico 3D"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mazo 3D</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setViewMode('grid');
                }}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Cuadrícula completa"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Todas</span>
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area: Orbit 3D Deck or Grid */}
        <div className="p-2 sm:p-5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-transparent">
          {viewMode === 'orbit' ? (
            <div className="flex flex-col items-center justify-center py-2 sm:py-4">
              <div className="w-full">
                <OrbitCardStack
                  items={orbitItems}
                  defaultActiveIndex={initialActiveIndex}
                  spread={140}
                  lift={36}
                  showControls={true}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {JUNG_ARCHETYPES.map((arch) => {
                const isSelected = currentNorm === normalize(arch.name) || currentNorm === normalize(arch.id);

                return (
                  <div
                    key={arch.id}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#06182c] to-[#042838] border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.35)] ring-1 ring-cyan-400'
                        : 'bg-[#030d17]/80 border-cyan-500/30 hover:border-cyan-400 hover:bg-[#041525]'
                    }`}
                  >
                    <div>
                      {/* Top Row: Avatar, Name & Bonus Badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl p-1.5 bg-black/50 rounded-xl border border-cyan-500/30 shrink-0">
                            {arch.avatar}
                          </span>
                          <div>
                            <h4 className="font-anton text-sm sm:text-base uppercase tracking-wider text-white">
                              {arch.name}
                            </h4>
                            <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider font-semibold">
                              KAI: {arch.companion?.title} {arch.companion?.icon}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/40 px-2 py-0.5 rounded-lg font-bold shrink-0">
                          {arch.statBonus}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-200 leading-relaxed font-sans bg-black/40 p-2.5 rounded-xl border border-cyan-500/20 mb-3">
                        {arch.description}
                      </p>

                      {/* Desire & Fear */}
                      <div className="space-y-1.5 text-[11px] font-mono mb-3">
                        <div className="flex items-start gap-1.5 text-cyan-300 bg-[#020b14]/60 p-2 rounded-lg border border-cyan-500/20">
                          <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400" />
                          <span><strong className="text-white">Deseo: </strong>{arch.desire}</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-rose-300 bg-[#020b14]/60 p-2 rounded-lg border border-rose-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                          <span><strong className="text-white">Sombra / Miedo: </strong>{arch.fear}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        Stat: <strong className="text-cyan-300 capitalize">{arch.primaryStat}</strong>
                      </span>

                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-black text-cyan-300 bg-cyan-900/60 border border-cyan-400 px-3 py-1 rounded-xl shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                          <Check className="w-3.5 h-3.5 text-cyan-300" />
                          Sintonía Activa
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playItemEquip();
                            triggerShockwave({ color: 'violet', intensity: 'medium' });
                            onSelectArchetype(arch);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-anton uppercase text-[11px] rounded-xl cursor-pointer transition-all shadow-[0_0_10px_rgba(0,240,255,0.3)] active:scale-95 flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3 fill-black" />
                          Activar Arquetipo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-cyan-500/40 bg-[#04020e] flex items-center justify-between shrink-0">
          <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
            {viewMode === 'orbit'
              ? 'Toca cualquier carta para traerla al frente o usa los botones de navegación.'
              : 'Cada arquetipo calibra la energía y aura bioluminiscente de tu compañero KAI.'}
          </p>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 text-white font-anton uppercase text-xs rounded-xl cursor-pointer transition-all border border-slate-600 active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
