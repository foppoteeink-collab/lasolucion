import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Trophy, ShieldCheck, Sparkles, Heart, Flame } from 'lucide-react';
import { soundFX } from '../utils/audio';
import { isHapticsSupported, triggerHaptic } from '../utils/haptics';
import { useUIStore } from '../store/useUIStore';
import { handleClaimBossBounty } from '../engine/gameEngine';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';

interface SurpriseBossModalProps {
  isOpen: boolean;
  onClose: () => void;
  archetypeName: string;
  buffName: string;
  buffDescription: string;
}

export const SurpriseBossModal: React.FC<SurpriseBossModalProps> = ({
  isOpen,
  onClose,
  archetypeName,
  buffName,
  buffDescription,
}) => {
  const copy = useNarrativeCopy();
  useEffect(() => {
    if (isOpen) {
      // Triumphant Adventure Fanfare
      soundFX.playAdventureStart();

      // Golden Screen Flash Trigger
      try {
        useUIStore.getState().triggerScreenFlash('buff');
      } catch (e) {}

      // Triumphant Haptic Pattern
      triggerHaptic([100, 50, 150, 50, 300]);
    }
  }, [isOpen]);

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

  const handleClaim = () => {
    try {
      soundFX.playClick();
      triggerHaptic([30, 45, 60]);
      handleClaimBossBounty();
    } catch (_) {}
    onClose();
  };

  const displayTitle = archetypeName === 'Comandante de la Procrastinación' || archetypeName === 'Jefe Sorpresa'
    ? 'Ruptura de Inercia'
    : (archetypeName || 'Ruptura de Inercia');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl font-sans"
        onClick={onClose}
      >
        {/* Resplandor ambiental de plasma en cian y dorado */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.12)_0%,rgba(0,0,0,0.92)_85%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="surprise-boss-title"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm sm:max-w-md bg-[#030712]/95 rounded-3xl border border-cyan-500/35 shadow-[0_0_50px_rgba(0,240,255,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden relative text-white backdrop-blur-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Micrograno táctil Moxen Vidrio */}
          <span className="vi-grano opacity-5" aria-hidden="true" />

          {/* Filamento especular superior */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />
          
          <div className="p-6 sm:p-8 text-center relative z-10 flex flex-col items-center">
            
            {/* Emblema de Conquista */}
            <div className="w-20 h-20 mb-3 relative flex items-center justify-center">
               <div className="absolute inset-0 bg-cyan-400 rounded-full blur-xl opacity-30 animate-pulse" />
               <div className="w-16 h-16 rounded-2xl border border-cyan-400/50 bg-black/80 flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(0,240,255,0.35)]">
                 <Trophy className="w-8 h-8 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
               </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-anton uppercase tracking-wider mb-2 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <Sparkles className="w-3.5 h-3.5" /> {copy.surpriseBossBadge}
            </div>

            <h2 id="surprise-boss-title" className="text-xl sm:text-2xl font-anton uppercase tracking-wide text-white mb-1.5 drop-shadow-[0_0_15px_rgba(0,240,255,0.35)]">
              {displayTitle}
            </h2>
            
            <p className="text-slate-300 text-xs sm:text-sm mb-4 leading-relaxed font-mono">
              <strong className="text-cyan-300">FOCO CONQUISTADO:</strong> Has completado 3 tareas o hábitos prioritarios y recuperado tu impulso diario.
            </p>

            {/* Tarjeta de Recompensas */}
            <div className="w-full bg-black/50 rounded-2xl p-4 border border-white/10 mb-5 relative overflow-hidden shadow-inner">
               <div className="flex items-center justify-center gap-2 mb-2.5">
                 <ShieldCheck className="w-4 h-4 text-emerald-400" />
                 <span className="text-[11px] font-anton uppercase tracking-wider text-emerald-300">{copy.surpriseBossRewardLabel}</span>
               </div>
               
               <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-b border-white/10 text-center font-mono">
                 <div className="p-1 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 font-bold text-xs">
                   +50 XP
                 </div>
                 <div className="p-1 rounded-xl bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 font-bold text-xs">
                   +20 Monedas
                 </div>
                 <div className="p-1 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1">
                   <Heart className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                   <span>+50 HP</span>
                 </div>
               </div>
               <p className="text-[10px] text-slate-400 mt-2 font-mono">
                 {buffDescription || 'Recompensa concedida por consistencia y disciplina diaria.'}
               </p>
            </div>

            {/* Botón de Acción Principal Cinético Neon */}
            <button
              type="button"
              onClick={handleClaim}
              className="btn-neon-hunter w-full py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-2 font-bold"
            >
              <Zap className="w-4 h-4 text-cyan-300" />
              <span>{copy.surpriseBossCta}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
