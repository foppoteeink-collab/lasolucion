import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Trophy, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import { soundFX } from '../utils/audio';
import { isHapticsSupported, triggerHaptic } from '../utils/haptics';
import { useUIStore } from '../store/useUIStore';
import { handleClaimBossBounty } from '../engine/gameEngine';

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
  useEffect(() => {
    if (isOpen) {
      // Triumphant Adventure Fanfare
      soundFX.playAdventureStart();

      // Golden Screen Flash Trigger
      try {
        useUIStore.getState().triggerScreenFlash('buff');
      } catch (e) {}

      // Triumphant Haptic Pattern
      if (isHapticsSupported()) {
        triggerHaptic([100, 50, 150, 50, 300]);
      } else if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        navigator.vibrate([100, 50, 150, 50, 300]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = () => {
    try {
      handleClaimBossBounty();
    } catch (_) {}
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl font-sans"
        onClick={onClose}
      >
        {/* Ambient Pulsing Gold/Amber Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(214,244,33,0.18)_0%,rgba(0,0,0,0.95)_85%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#d6f421]/15 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        <motion.div
          initial={{ scale: 0.88, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0 }}
          className="w-full max-w-sm sm:max-w-md bg-[#000a14] rounded-3xl border-2 border-[#d6f421] shadow-[0_0_60px_rgba(214,244,33,0.35)] overflow-hidden relative text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glowing Victor Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-[#d6f421] via-amber-400 to-[#9600ff] animate-pulse" />
          
          <div className="p-6 sm:p-8 text-center relative z-10 flex flex-col items-center">
            
            {/* Trophy Icon */}
            <div className="w-20 h-20 mb-3 relative flex items-center justify-center">
               <div className="absolute inset-0 bg-[#d6f421] rounded-full blur-xl opacity-40 animate-ping" />
               <div className="w-16 h-16 rounded-2xl border-2 border-[#d6f421] bg-[#001420] flex items-center justify-center relative z-10 shadow-[0_0_25px_rgba(214,244,33,0.5)]">
                 <Trophy className="w-9 h-9 text-[#d6f421]" />
               </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d6f421]/20 border border-[#d6f421]/50 text-[#d6f421] text-[10px] font-mono font-black uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5" /> ¡INCURSIÓN CONQUISTADA!
            </div>

            <h2 className="text-xl sm:text-2xl font-anton uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-[#d6f421] mb-2 drop-shadow-[0_0_15px_rgba(214,244,33,0.4)]">
              {archetypeName || 'Procrastinación Doblegada'}
            </h2>
            
            <p className="text-slate-300 text-xs sm:text-sm mb-4 leading-relaxed font-mono">
              <strong className="text-[#d6f421]">OPERADOR:</strong> Has completado 3 hábitos/prioridades clave hoy. Quebraste la resistencia del letargo y mantuviste el ritmo de combate.
            </p>

            {/* Bounty Card */}
            <div className="w-full bg-[#001224] rounded-2xl p-4 border border-[#d6f421]/30 mb-5 relative overflow-hidden shadow-inner">
               <div className="flex items-center justify-center gap-2 mb-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-400" />
                 <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Botín de Recompensa Activo</span>
               </div>
               
               <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-cyan-900/40 text-center font-mono">
                 <div className="text-amber-400 font-bold text-xs">+50 XP</div>
                 <div className="text-yellow-400 font-bold text-xs">+20 Oro</div>
                 <div className="text-emerald-400 font-bold text-xs flex items-center justify-center gap-1">
                   <Heart className="w-3 h-3 fill-emerald-400" /> +50 HP
                 </div>
               </div>
               <p className="text-[10px] text-slate-400 mt-2 font-mono">
                 {buffDescription || 'Recompensa concedida por disciplina y consistencia de enfoque diario.'}
               </p>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleClaim}
              className="w-full py-3.5 bg-gradient-to-r from-[#d6f421] to-amber-400 hover:from-lime-300 hover:to-amber-300 text-black font-anton rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(214,244,33,0.4)] hover:shadow-[0_0_35px_rgba(214,244,33,0.6)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-black" />
              <span>Reclamar Botín y Restaurar Salud</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
