import React from 'react';
import { Sun, Check } from 'lucide-react';
import { KAICompanion } from '../KAICompanion';
import { KAI_AURA_INTENSITY_OPTIONS } from '../../data/kaiShapes';
import { KaiAuraIntensity } from '../../types';

interface WorkshopAuraIntensityPanelProps {
  currentAuraIntensity: KaiAuraIntensity;
  onSelectAuraIntensity: (intensity: KaiAuraIntensity) => void;
}

export const WorkshopAuraIntensityPanel: React.FC<WorkshopAuraIntensityPanelProps> = ({
  currentAuraIntensity,
  onSelectAuraIntensity,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-[#040814]/90 border border-white/10 flex flex-col sm:flex-row items-center gap-4">
      {/* Vista previa en vivo sobre el fondo oscuro real de la app (#030712) */}
      <div
        className="w-24 h-24 shrink-0 rounded-2xl bg-[#030712] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner"
        data-preserve-optic="true"
      >
        <KAICompanion
          size={62}
          interactive={false}
          auraIntensity={currentAuraIntensity}
        />
      </div>

      {/* Selector de Intensidad */}
      <div className="flex-1 w-full space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider flex items-center gap-2">
            <Sun className="w-4 h-4 text-cyan-400" />
            <span>Intensidad del Aura &amp; Visibilidad</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            Contraluz + borde luminoso
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-snug">
          Ajusta el resplandor detrás y alrededor de la silueta para que KAI nunca se pierda sobre fondos oscuros.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {KAI_AURA_INTENSITY_OPTIONS.map((opt) => {
            const isActive = currentAuraIntensity === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelectAuraIntensity(opt.id)}
                className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-cyan-500/15 border-cyan-400/80 shadow-[0_0_16px_rgba(0,240,255,0.22)] text-white'
                    : 'bg-black/40 border-white/10 hover:border-white/25 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold block">{opt.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                </div>
                <span className="text-[9.5px] text-slate-400 block mt-0.5 leading-tight">
                  {opt.tagline}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
