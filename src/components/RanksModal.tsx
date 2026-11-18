import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Award, Shield, CheckCircle2, Lock, Sparkles, Zap } from 'lucide-react';
import { RANKS } from '../data/defaults';
import { soundFX } from '../utils/audio';

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

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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

  return createPortal(
    <div
      className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none pointer-events-auto font-sans"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ranks-modal-title"
        className="relative isolate bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-[0_24px_64px_rgba(0,0,0,0.75)] flex flex-col max-h-[90dvh] sm:max-h-[85vh] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#040814]/[0.96] shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl aura-bg-soft border aura-border-subtle flex items-center justify-center aura-glow-subtle shrink-0">
              <Award className="w-5 h-5 aura-text-primary" />
            </div>
            <div className="min-w-0">
              <h3 id="ranks-modal-title" className="font-anton aura-text-soft uppercase tracking-wider text-sm sm:text-base flex items-center gap-2 truncate">
                Los 100 Niveles y Rangos del Sistema
              </h3>
              <p className="text-[11px] text-slate-300 font-mono tabular-nums mt-0.5">
                Nivel Actual: <span className="aura-text-primary font-bold">Nv. {currentLevel}</span> • 10 Fases de Maestría
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0 ml-2"
            title="Cerrar modal (Esc)"
            aria-label="Cerrar compendio de rangos y niveles"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="p-3 sm:p-5 space-y-6 flex-1 overflow-y-auto scrollbar-thin relative z-10">
          {phases.map(({ phase, phaseName, ranks }) => {
            const isPhaseUnlocked = currentLevel >= ranks[0]?.level;
            const isPhaseCurrent = ranks.some(r => r.level === currentLevel);

            return (
              <div
                key={phase}
                className={`rounded-2xl border p-3.5 sm:p-4 transition-all ${
                  isPhaseCurrent
                    ? 'bg-[#040a1a]/[0.94] aura-border-primary aura-glow-subtle'
                    : isPhaseUnlocked
                    ? 'bg-[#040814]/80 border-white/10'
                    : 'bg-black/40 border-white/[0.06] opacity-75'
                }`}
              >
                {/* Phase Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full uppercase font-black tracking-wider ${
                      isPhaseCurrent
                        ? 'aura-bg-primary optic-active-card'
                        : isPhaseUnlocked
                        ? 'aura-bg-soft border aura-border-subtle'
                        : 'bg-white/[0.05] text-slate-500 border border-white/10'
                    }`}>
                      Fase {phase}
                    </span>
                    <h4 className="font-anton text-xs sm:text-sm uppercase tracking-wider text-white">
                      {phaseName}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums aura-text-soft/80">
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
                            ? 'aura-bg-soft aura-border-primary aura-glow optic-active-card text-white ring-1 ring-white/20'
                            : isPassed
                            ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-200/90'
                            : 'bg-[#040814]/60 border-white/[0.08] text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`font-mono tabular-nums text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                            isCurrent
                              ? 'aura-bg-primary font-bold'
                              : isPassed
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/[0.06] text-slate-400'
                          }`}>
                            Nv. {r.level}
                          </span>
                          <span className={`font-medium truncate ${isCurrent ? 'font-black text-white' : ''}`}>
                            {r.title}
                          </span>
                        </div>

                        <div className="shrink-0 ml-2">
                          {isCurrent ? (
                            <span className="flex items-center gap-1 text-[9px] font-mono font-black uppercase tracking-wider aura-bg-primary px-2 py-0.5 rounded-full animate-pulse">
                              <Zap className="w-2.5 h-2.5 fill-current" />
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
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#040814]/[0.96] flex items-center justify-between gap-3 shrink-0 relative z-10">
          <p className="text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 aura-text-primary shrink-0" />
            Avanza completando misiones y hábitos diarios para ganar EXP y ascender.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="chicle-btn px-4 py-2 aura-btn-gradient optic-active-card font-anton uppercase tracking-wider text-xs rounded-xl cursor-pointer shrink-0"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
