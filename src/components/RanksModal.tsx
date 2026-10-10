import React, { useEffect, useRef } from 'react';
import { X, Award, Shield, CheckCircle2, Lock, Sparkles, Zap } from 'lucide-react';
import { RANKS } from '../data/defaults';

interface RanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
}

export const RanksModal: React.FC<RanksModalProps> = ({ isOpen, onClose, currentLevel }) => {
  const currentLevelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && currentLevelRef.current) {
      setTimeout(() => {
        currentLevelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Group RANKS by phase (1 to 10)
  const phases = Array.from({ length: 10 }, (_, i) => {
    const phaseNum = i + 1;
    const phaseRanks = RANKS.filter(r => r.phase === phaseNum);
    const phaseName = phaseRanks[0]?.phaseName || `Fase ${phaseNum}`;
    return {
      phase: phaseNum,
      phaseName,
      ranks: phaseRanks
    };
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="scifi-glass-panel border-2 border-cyan-400 rounded-2xl w-full max-w-2xl shadow-[0_0_40px_rgba(0,240,255,0.35)] flex flex-col max-h-[90dvh] sm:max-h-[85vh] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/40 flex items-center justify-between bg-[#04020e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)]">
              <Award className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="font-anton text-cyan-300 uppercase tracking-wide text-sm sm:text-base flex items-center gap-2">
                Los 100 Niveles y Rangos del Sistema
              </h3>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                Nivel Actual: <span className="text-cyan-300 font-bold">Nv. {currentLevel}</span> • 10 Fases de Maestría
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

        {/* Scrollable list */}
        <div className="p-3 sm:p-5 space-y-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-transparent">
          {phases.map(({ phase, phaseName, ranks }) => {
            const isPhaseUnlocked = currentLevel >= ranks[0]?.level;
            const isPhaseCurrent = ranks.some(r => r.level === currentLevel);

            return (
              <div 
                key={phase}
                className={`rounded-2xl border p-3.5 sm:p-4 transition-all ${
                  isPhaseCurrent
                    ? 'bg-[#06182c]/90 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                    : isPhaseUnlocked
                    ? 'bg-[#020b14]/70 border-cyan-500/30'
                    : 'bg-[#02060b]/50 border-slate-800/60 opacity-75'
                }`}
              >
                {/* Phase Header */}
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-black tracking-wider ${
                      isPhaseCurrent 
                        ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(0,240,255,0.8)]' 
                        : isPhaseUnlocked 
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' 
                        : 'bg-slate-900 text-slate-500'
                    }`}>
                      Fase {phase}
                    </span>
                    <h4 className="font-anton text-xs sm:text-sm uppercase tracking-wider text-white">
                      {phaseName}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400/80">
                    Niveles {ranks[0]?.level} - {ranks[ranks.length - 1]?.level}
                  </span>
                </div>

                {/* Level Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ranks.map((r) => {
                    const isPassed = currentLevel > r.level;
                    const isCurrent = currentLevel === r.level;

                    return (
                      <div
                        key={r.level}
                        ref={isCurrent ? currentLevelRef : undefined}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                          isCurrent
                            ? 'bg-cyan-950/90 border-cyan-300 text-white shadow-[0_0_15px_rgba(0,240,255,0.5)] ring-1 ring-cyan-300'
                            : isPassed
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200/90'
                            : 'bg-[#030d17]/40 border-slate-800/60 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`font-mono text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                            isCurrent
                              ? 'bg-cyan-400 text-black font-bold'
                              : isPassed
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            Nv. {r.level}
                          </span>
                          <span className={`font-medium truncate ${isCurrent ? 'font-black text-cyan-200' : ''}`}>
                            {r.title}
                          </span>
                        </div>

                        <div className="shrink-0 ml-2">
                          {isCurrent ? (
                            <span className="flex items-center gap-1 text-[9px] font-mono font-black text-cyan-300 uppercase tracking-wider bg-cyan-900/60 border border-cyan-400 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(0,240,255,0.6)] animate-pulse">
                              <Zap className="w-2.5 h-2.5 fill-cyan-300" />
                              Actual
                            </span>
                          ) : isPassed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Lock className="w-3 h-3 text-slate-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-cyan-500/40 bg-[#04020e] flex items-center justify-between shrink-0">
          <p className="text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Avanza completando misiones y hábitos diarios para ganar EXP y ascender.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-anton uppercase text-xs rounded-xl cursor-pointer transition-all shadow-[0_0_12px_rgba(0,240,255,0.4)]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
