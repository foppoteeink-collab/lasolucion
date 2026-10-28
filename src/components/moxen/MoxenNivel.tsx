import React from 'react';
import './moxen.css';
import { Zap, Crown, Sparkles } from 'lucide-react';

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
  rankTitle = 'Cazador',
  onOpenRanks
}) => {
  const percent = Math.min(100, Math.max(0, Math.floor((currentXp / Math.max(1, requiredXp)) * 100)));

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0b1022] to-[#040817] border border-cyan-500/40 shadow-[0_4px_25px_rgba(0,240,255,0.15)] relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300 font-black shadow-[0_0_10px_rgba(0,240,255,0.4)] shrink-0">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
              Calibrador de Rango Cuántico
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-anton uppercase text-white tracking-wide truncate">
                Nivel {level} • <span className="text-cyan-300">{rankTitle}</span>
              </span>
              {onOpenRanks && (
                <button
                  type="button"
                  onClick={onOpenRanks}
                  className="text-[9px] font-mono text-cyan-400 hover:text-white underline cursor-pointer"
                >
                  Ver Rangos
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start text-right">
          <span className="text-xs sm:text-sm font-mono font-black text-amber-300">
            {currentXp} <span className="text-[10px] sm:text-xs text-slate-400">/ {requiredXp} XP</span>
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono text-cyan-300 font-bold block">
            {percent}% hacia Nv.{level + 1}
          </span>
        </div>
      </div>

      {/* Track with Comet Head */}
      <div className="nv-barra-track mt-3">
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
