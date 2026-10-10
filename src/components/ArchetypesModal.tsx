import React from 'react';
import { X, Sparkles, Zap, Check, Target, AlertTriangle } from 'lucide-react';
import { JUNG_ARCHETYPES, JungArchetype } from '../data/archetypes';
import { HoloCompanion } from './HoloCompanion';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';

interface ArchetypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArchetype: string;
  onSelectArchetype: (archetype: JungArchetype) => void;
}

export const ArchetypesModal: React.FC<ArchetypesModalProps> = ({
  isOpen,
  onClose,
  currentArchetype,
  onSelectArchetype,
}) => {
  if (!isOpen) return null;

  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const currentNorm = normalize(currentArchetype || 'El Héroe');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="scifi-glass-panel border-2 border-cyan-400 rounded-2xl w-full max-w-3xl shadow-[0_0_40px_rgba(0,240,255,0.35)] flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/40 flex items-center justify-between bg-[#04020e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)]">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="font-anton text-cyan-300 uppercase tracking-wide text-sm sm:text-base">
                Los 12 Arquetipos Jungianos & Compañeros KAI
              </h3>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                Elige tu resonancia psicológica y potencia tus atributos en el Sistema
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Archetypes List */}
        <div className="p-3 sm:p-5 space-y-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-transparent">
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
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-cyan-500/40 bg-[#04020e] flex items-center justify-between shrink-0">
          <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
            Cada arquetipo calibra la energía y el aura bioluminiscente de tu compañero KAI.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-anton uppercase text-xs rounded-xl cursor-pointer transition-all border border-slate-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
