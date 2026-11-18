import React from 'react';
import './moxen.css';
import { Zap } from 'lucide-react';

interface MoxenNivelProps {
  level: number;
  currentXp: number;
  requiredXp: number;
  rankTitle?: string;
  onOpenRanks?: () => void;
}

export const MoxenNivel: React.FC<MoxenNivelProps> = ({
  level,
  currentXp,
  requiredXp,
  rankTitle = 'Iniciado',
  onOpenRanks
}) => {
  const percent = Math.min(100, Math.max(0, Math.floor((currentXp / Math.max(1, requiredXp)) * 100)));

  const isNearLevelUp = percent >= 85;
  const pulseClasses = isNearLevelUp ? 'aura-border-subtle aura-glow' : '';

  return (
    <div className={`relative isolate p-4 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden ${pulseClasses}`}>
      <span className="vi-grano opacity-5" aria-hidden="true" />
      <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl aura-bg-soft optic-active-card border aura-border-primary aura-glow-subtle flex items-center justify-center font-black shrink-0">
            <Zap className="w-4 h-4 aura-text-primary" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-mono aura-text-primary font-bold uppercase tracking-wider block">
              Calibrador de Rango Cuántico
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-anton uppercase text-white tracking-wider truncate">
                Nivel <span className="font-mono tabular-nums">{level}</span> • <span className="aura-text-soft">{rankTitle}</span>
              </span>
              {onOpenRanks && (
                <button
                  type="button"
                  onClick={onOpenRanks}
                  className="text-[10px] font-mono aura-text-primary hover:text-white underline underline-offset-2 cursor-pointer"
                >
                  Ver Rangos
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start text-right">
          <span className="text-xs sm:text-sm font-mono tabular-nums font-black text-amber-300">
            {currentXp} <span className="text-[10px] sm:text-xs text-slate-400">/ {requiredXp} XP</span>
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono tabular-nums aura-text-soft font-bold block">
            {percent}% hacia Nv.{level + 1}
          </span>
        </div>
      </div>

      {/* Track with Comet Head */}
      <div className="nv-barra-track mt-3 relative z-10">
        <div
          className="nv-barra-fill"
          style={{ width: `${percent}%` }}
        >
          {percent > 2 && <div className="nv-cometa" />}
        </div>
      </div>
    </div>
  );
};

export default MoxenNivel;
