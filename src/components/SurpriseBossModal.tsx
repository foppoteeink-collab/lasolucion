import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    if (!isOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="surprise-boss-title"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative isolate w-full max-w-sm sm:max-w-md bg-[#030712]/[0.98] rounded-2xl sm:rounded-3xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Micrograno táctil Moxen Vidrio */}
          <span className="vi-grano opacity-5" aria-hidden="true" />

          {/* Filamento especular superior */}
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
          
          <div className="p-6 sm:p-8 text-center relative z-10 flex flex-col items-center">
            
            {/* Emblema de Conquista */}
            <div className="w-20 h-20 mb-3 relative flex items-center justify-center">
               <div className="w-16 h-16 rounded-2xl border aura-border-subtle bg-[#040814]/90 aura-glow flex items-center justify-center relative z-10">
                 <Trophy className="w-8 h-8 text-amber-300" />
               </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full aura-bg-soft border aura-border-subtle aura-text-soft text-[10px] font-anton uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 aura-text-primary" /> {copy.surpriseBossBadge}
            </div>

            <h2 id="surprise-boss-title" className="text-xl sm:text-2xl font-anton uppercase tracking-wider text-white mb-1.5">
              {displayTitle}
            </h2>
            
            <p className="text-slate-300 text-xs sm:text-sm mb-4 leading-relaxed font-sans">
              <strong className="aura-text-soft">¡Gran avance!</strong> Has completado tus tareas prioritarias y asegurado tu avance del día.
            </p>

            {/* Tarjeta de Recompensas */}
            <div className="w-full bg-[#040814]/80 rounded-2xl p-4 border border-white/10 mb-5 relative overflow-hidden shadow-inner">
               <div className="flex items-center justify-center gap-2 mb-2.5">
                 <ShieldCheck className="w-4 h-4 text-emerald-400" />
                 <span className="text-[11px] font-anton uppercase tracking-wider text-emerald-300">{copy.surpriseBossRewardLabel}</span>
               </div>
               
               <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-b border-white/10 text-center font-mono tabular-nums">
                 <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 font-bold text-xs">
                   +50 XP
                 </div>
                 <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 font-bold text-xs">
                   +20 Monedas
                 </div>
                 <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1">
                   <Heart className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                   <span>+50 HP</span>
                 </div>
               </div>
               <p className="text-[10px] text-slate-400 mt-2 font-mono">
                 {buffDescription || 'Recompensa concedida por consistencia y disciplina diaria.'}
               </p>
            </div>

            {/* Botón de Acción Principal Aura */}
            <button
              type="button"
              onClick={handleClaim}
              className="chicle-btn aura-btn-gradient optic-active-card w-full py-3.5 rounded-xl font-anton text-xs sm:text-sm uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>{copy.surpriseBossCta}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
