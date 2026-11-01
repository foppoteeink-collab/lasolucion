import React, { useEffect } from 'react';
import { PlayerStats } from '../types';
import { Sparkles, Zap, Shield, Brain, Heart, Crown, ChevronRight } from 'lucide-react';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { triggerHaptic, isHapticsSupported } from '../utils/haptics';
import { useUIStore } from '../store/useUIStore';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  newRankTitle: string;
  stats: PlayerStats;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  newLevel,
  newRankTitle,
  stats,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Game Feel 1: Audio SFX
      soundFX.playSubBassConfirm();

      // Game Feel 2: Screen Flash Trigger
      try {
        useUIStore.getState().triggerScreenFlash('heal');
      } catch (e) {}

      // Game Feel 3: Mobile Victory Vibration Pattern
      if (isHapticsSupported()) {
        triggerHaptic([100, 50, 100, 50, 300]);
      } else if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 300]);
      }

      // Game Feel 4: Cyan & Gold Shockwave Pulses
      triggerShockwave({ color: 'gold', intensity: 'epic' });
      const timer = setTimeout(() => {
        triggerShockwave({ color: 'violet', intensity: 'epic' });
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Teclado: Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 font-sans"
      onClick={onClose}
    >
      {/* Sci-Fi Ambient Background Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.12)_0%,rgba(0,0,0,0.96)_80%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div 
        className="relative w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col rounded-3xl bg-[#030712]/95 border border-cyan-500/35 shadow-[0_0_60px_rgba(0,240,255,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] text-center overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Filamento especular superior */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 min-h-0 relative z-10 scrollbar-none">
          
          {/* Header Crown Emblem */}
          <div className="relative inline-block mt-2 mb-3">
            <div className="absolute inset-0 bg-cyan-400 rounded-full blur-2xl opacity-35 animate-pulse" />
            <div className="w-20 h-20 mx-auto rounded-full bg-black/80 border border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center justify-center relative z-10">
              <Crown className="w-10 h-10 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
            </div>
          </div>
          
          <p className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-[0.25em] drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
            ⚡ Evolución de Conciencia Activada
          </p>

          <h2 className="text-3xl sm:text-4xl font-anton text-white uppercase tracking-wider drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] mt-1">
            NIVEL <span className="text-cyan-400 drop-shadow-[0_0_25px_rgba(0,240,255,0.8)]">{newLevel}</span>
          </h2>
          
          {/* RANGO PROTEGIDO / LEVEL NAME EN MOXEN VIDRIO */}
          <div className="my-5 p-4 rounded-2xl bg-[#040d1a]/80 border border-cyan-500/30 shadow-[0_0_25px_rgba(0,240,255,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/80 mb-1">Rango Evolutivo Asignado</p>
            <p className="text-xl sm:text-2xl font-anton text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-amber-300 uppercase tracking-wider leading-tight">
              {newRankTitle}
            </p>
          </div>

          {/* Stats Improvements Grid */}
          <div className="p-4 rounded-2xl bg-[#02050e]/90 border border-white/10 shadow-[inset_0_0_20px_rgba(0,240,255,0.05)]">
            <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Atributos Amplificados</span>
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-left text-xs">
              <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/30 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[9px] font-mono uppercase tracking-wider">Disciplina</span>
                  <span className="font-anton text-cyan-300 text-sm tracking-wide">+1</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/30 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[9px] font-mono uppercase tracking-wider">Fuerza</span>
                  <span className="font-anton text-amber-300 text-sm tracking-wide">+1</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-purple-500/30 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[9px] font-mono uppercase tracking-wider">Mente</span>
                  <span className="font-anton text-purple-300 text-sm tracking-wide">+1</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-emerald-500/30 flex items-center gap-2">
                <Heart className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[9px] font-mono uppercase tracking-wider">Energía</span>
                  <span className="font-anton text-emerald-300 text-sm tracking-wide">+1</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-dashed border-white/10 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300 uppercase tracking-wider text-[10px] font-mono">Inyección de Monedas:</span>
              <span className="text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] text-sm font-mono flex items-center gap-1 font-bold">
                +{20 + newLevel * 5} <span className="text-xs">🪙</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* BOTÓN ASIMILAR PODER */}
        <div className="p-4 sm:p-5 pt-2 relative z-10 shrink-0 bg-[#030712]/95 border-t border-white/5">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="chicle-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-95 text-black font-anton text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.4)] active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-2 font-bold"
          >
            <span>Asimilar Poder</span>
            <ChevronRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
