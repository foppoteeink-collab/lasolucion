import React from 'react';
import { Check } from 'lucide-react';
import { KaiVectorGraphics } from '../KaiVectorGraphics';
import { KAICompanion } from '../KAICompanion';
import { KaiShapeKey, KaiCustomForm } from '../../types';

interface WorkshopShapesTabProps {
  currentShape: KaiShapeKey;
  customForm: KaiCustomForm | null | undefined;
  systemPalette: { c1: string; c2: string };
  has21Days: boolean;
  has66Days: boolean;
  ascensionCrystals: number;
  onSelectShape: (shapeId: KaiShapeKey) => void;
}

export const WorkshopShapesTab: React.FC<WorkshopShapesTabProps> = ({
  currentShape,
  customForm,
  systemPalette,
  has21Days,
  has66Days,
  ascensionCrystals,
  onSelectShape,
}) => {
  const isPrismSelected = currentShape !== 'custom';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-1 border-b border-white/5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Compañero Génesis &amp; Creaciones
        </span>
        <span className="text-[10px] font-mono text-cyan-300">
          Forma Sagrada Día 0
        </span>
      </div>

      {/* Grid: El Prisma Cuántico y Compañero Forjado IA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {/* 1. EL PRISMA CUÁNTICO */}
        <div
          onClick={() => onSelectShape('prism')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
            isPrismSelected
              ? 'aura-bg-soft aura-border-primary aura-glow-subtle optic-active-card'
              : 'bg-[#040814]/80 border-white/10 hover:aura-border-subtle hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative flex items-center justify-center bg-black/70 rounded-2xl border border-white/10 p-1.5 overflow-hidden shadow-inner"
              data-preserve-optic="true"
            >
              <KaiVectorGraphics
                shapeId="prism"
                activeColor={isPrismSelected ? systemPalette.c1 : '#94a3b8'}
                secondaryColor={systemPalette.c2}
                glowFilterId="preview-genesis-prism"
                has21Days={has21Days}
                has66Days={has66Days}
                ascensionCrystalsCount={ascensionCrystals}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🔺</span>
                <h4 className="text-sm sm:text-base font-anton tracking-wide text-white truncate">
                  El Prisma
                </h4>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 block tracking-wider uppercase">
                ORÁCULO // PRIMA
              </span>
              <span className="inline-block self-start px-2 py-0.5 rounded-lg text-[9px] font-mono bg-white/5 border border-white/10 text-slate-300">
                Visión &amp; Foco Mental
              </span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">
              {isPrismSelected ? '● Estado: Activo' : 'Compañero Canónico'}
            </span>
            {isPrismSelected ? (
              <span className="text-xs font-anton tracking-wider uppercase text-cyan-300 bg-cyan-950/80 border border-cyan-400/60 px-3 py-1 rounded-xl shadow-[0_0_12px_rgba(0,240,255,0.3)] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-300 stroke-[3]" />
                Equipado
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectShape('prism');
                }}
                className="chicle-btn px-4 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-400 hover:text-black border border-cyan-400/40 font-anton text-xs uppercase tracking-wider text-cyan-200 transition-all cursor-pointer active:scale-95"
              >
                Equipar
              </button>
            )}
          </div>
        </div>

        {/* Tarjeta de Forma Forjada por IA (Si existe) */}
        {customForm && (
          <div
            onClick={() => onSelectShape('custom')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
              currentShape === 'custom'
                ? 'bg-fuchsia-950/40 border-fuchsia-400/80 shadow-[0_0_25px_rgba(217,70,239,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]'
                : 'bg-[#040814]/80 border-white/10 hover:border-fuchsia-500/40 hover:bg-[#12041e]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative flex items-center justify-center bg-black/70 rounded-2xl border border-fuchsia-500/30 p-1 overflow-hidden shadow-inner">
                <KAICompanion
                  customForm={customForm}
                  shapeId="custom"
                  size={60}
                  interactive={false}
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">✨</span>
                  <h4 className="text-sm sm:text-base font-anton tracking-wide text-fuchsia-200 truncate">
                    {customForm.name}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-fuchsia-400 block tracking-wider uppercase">
                  FORJA NEURAL IA
                </span>
                <span className="inline-block self-start px-2 py-0.5 rounded-lg text-[9px] font-mono bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">
                  {customForm.detectedObject || 'Personalizado'}
                </span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">
                {currentShape === 'custom' ? '● Estado: Activo' : 'Creación Neural'}
              </span>
              {currentShape === 'custom' ? (
                <span className="text-xs font-anton tracking-wider uppercase text-fuchsia-300 bg-fuchsia-950/80 border border-fuchsia-400/60 px-3 py-1 rounded-xl shadow-[0_0_12px_rgba(217,70,239,0.3)] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-fuchsia-300 stroke-[3]" />
                  Equipado
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectShape('custom');
                  }}
                  className="chicle-btn px-4 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-400 hover:text-black font-anton text-xs uppercase tracking-wider text-fuchsia-200 transition-all cursor-pointer border border-fuchsia-500/40 active:scale-95"
                >
                  Equipar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
