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

      // Game Feel 4: Epic Gold & Violet Shockwave Energy Pulses
      triggerShockwave({ color: 'gold', intensity: 'epic' });
      const timer = setTimeout(() => {
        triggerShockwave({ color: 'violet', intensity: 'epic' });
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 font-sans"
      onClick={onClose}
    >
      {/* Sci-Fi Neon Ambient Background Grid & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(150,0,255,0.18)_0%,rgba(0,0,0,0.95)_80%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#d6f421]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#fb5607]/15 rounded-full blur-[120px] pointer-events-none" />

      <div 
        className="relative w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col rounded-[28px] bg-[#000000] border-2 border-[#d6f421] shadow-[0_0_60px_rgba(214,244,33,0.35)] text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top Neon Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#9600ff] via-[#d6f421] to-[#fb5607]" />

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 min-h-0 relative z-10 scrollbar-none">
          
          {/* Header Crown Emblem */}
          <div className="relative inline-block mt-2 mb-3">
            <div className="absolute inset-0 bg-[#d6f421] rounded-full blur-2xl opacity-40 animate-pulse"></div>
            <div className="w-20 h-20 mx-auto rounded-full bg-black border-2 border-[#d6f421] shadow-[0_0_30px_rgba(214,244,33,0.8)] flex items-center justify-center text-4xl relative z-10">
              <Crown className="w-10 h-10 text-[#d6f421] drop-shadow-[0_0_12px_#d6f421]" />
            </div>
          </div>
          
          <p className="text-[11px] font-mono font-bold text-[#d6f421] uppercase tracking-[0.3em] drop-shadow-[0_0_8px_rgba(214,244,33,0.8)]">
            Evolucion de Conciencia Detected
          </p>

          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] mt-1">
            NIVEL <span className="text-[#d6f421] drop-shadow-[0_0_25px_#d6f421]">{newLevel}</span>
          </h2>
          
          {/* RANGO PROTEGIDO / LEVEL NAME IN NEON */}
          <div className="my-5 p-4 rounded-2xl bg-black/80 border border-[#9600ff]/60 shadow-[0_0_30px_rgba(150,0,255,0.25)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#9600ff]/20 rounded-full blur-2xl pointer-events-none" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-purple-300 mb-1">Rango Evolutivo Asignado</p>
            <p className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#d6f421] via-white to-[#fb5607] uppercase tracking-[0.15em] drop-shadow-[0_0_18px_rgba(214,244,33,0.9)] leading-tight">
              {newRankTitle}
            </p>
          </div>

          {/* Stats Improvements Grid */}
          <div className="p-4 rounded-2xl bg-black/90 border border-white/10 shadow-[inset_0_0_20px_rgba(214,244,33,0.05)]">
            <h3 className="text-[11px] font-mono font-black uppercase tracking-wider text-[#d6f421] mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#d6f421]" /> Atributos Amplificados
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-left text-xs">
              <div className="p-2.5 rounded-xl bg-[#000000] border border-[#d6f421]/40 flex items-center gap-2 shadow-[0_0_10px_rgba(214,244,33,0.1)]">
                <Shield className="w-4 h-4 text-[#d6f421] shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Disciplina</span>
                  <span className="font-black text-[#d6f421] text-sm">+1</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#000000] border border-[#fb5607]/40 flex items-center gap-2 shadow-[0_0_10px_rgba(251,86,7,0.1)]">
                <Zap className="w-4 h-4 text-[#fb5607] shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Fuerza</span>
                  <span className="font-black text-[#fb5607] text-sm">+1</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#000000] border border-[#9600ff]/40 flex items-center gap-2 shadow-[0_0_10px_rgba(150,0,255,0.1)]">
                <Brain className="w-4 h-4 text-[#9600ff] shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Mente</span>
                  <span className="font-black text-[#9600ff] text-sm">+1</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#000000] border border-cyan-500/40 flex items-center gap-2 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                <Heart className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Energía</span>
                  <span className="font-black text-cyan-300 text-sm">+1</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-dashed border-white/10 flex items-center justify-between text-xs font-black">
              <span className="text-slate-300 uppercase tracking-wider text-[10px] font-mono">Inyección Creditos Sci-Fi:</span>
              <span className="text-[#d6f421] drop-shadow-[0_0_8px_rgba(214,244,33,0.8)] text-sm font-mono">
                +{20 + newLevel * 5} 🪙
              </span>
            </div>
          </div>
        </div>
        
        {/* EXPLICIT REQUIRED ACTION BUTTON "Asimilar Poder" */}
        <div className="p-4 sm:p-5 pt-2 relative z-10 shrink-0 bg-black">
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#d6f421] via-[#fb5607] to-[#9600ff] hover:opacity-90 text-black font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(214,244,33,0.5)] active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <span>Asimilar Poder</span>
            <ChevronRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
