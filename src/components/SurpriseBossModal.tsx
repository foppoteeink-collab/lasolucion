import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Crosshair, Skull, ShieldAlert, AlertTriangle } from 'lucide-react';
import { soundFX } from '../utils/audio';
import { isHapticsSupported, triggerHaptic } from '../utils/haptics';
import { useUIStore } from '../store/useUIStore';

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
      // Audio SFX for Boss Incursion
      soundFX.playDamageSound();

      // Red Screen Flash Trigger
      try {
        useUIStore.getState().triggerScreenFlash('damage');
      } catch (e) {}

      // Tactical Alarm Haptic Pattern
      if (isHapticsSupported()) {
        triggerHaptic([200, 100, 200, 100, 400]);
      } else if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-xl font-sans"
        onClick={onClose}
      >
        {/* Ambient Pulsing Red Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,86,7,0.25)_0%,rgba(0,0,0,0.95)_85%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#fb5607]/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        <motion.div
          initial={{ scale: 0.88, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0 }}
          className="w-full max-w-sm sm:max-w-md bg-[#000000] rounded-3xl border-2 border-[#fb5607] shadow-[0_0_60px_rgba(251,86,7,0.5)] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glowing Alarm Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-[#fb5607] via-red-600 to-[#9600ff] animate-pulse" />
          
          <div className="p-6 sm:p-8 text-center relative z-10 flex flex-col items-center">
            
            {/* Tactical Crosshair Icon */}
            <div className="w-24 h-24 mb-4 relative">
               <div className="absolute inset-0 bg-[#fb5607] rounded-full blur-xl opacity-60 animate-ping"></div>
               <div className="w-full h-full rounded-full border-2 border-[#fb5607] bg-[#000000] flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(251,86,7,0.8)]">
                 <Crosshair className="w-12 h-12 text-[#fb5607] animate-pulse" />
               </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 text-[10px] font-mono font-black uppercase tracking-widest mb-3">
              <Zap className="w-3.5 h-3.5" /> DESAFÍO TÁCTICO DE ENFOQUE
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-200 mb-3 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
              JEFE DE PRUEBA
            </h2>
            
            <p className="text-slate-300 text-xs sm:text-sm mb-5 leading-relaxed font-mono">
              <strong className="text-amber-400">OPERADOR:</strong> Tu excelente cadencia de ejecución ha convocado al <span className="font-bold text-white uppercase">{archetypeName || 'Guardián del Enfoque'}</span>. ¡Supéralo completando tus tareas para reclamar recompensas de XP, oro y <strong className="text-emerald-400">recuperar HP vital</strong>!
            </p>

            {/* Tactical Warning Box */}
            <div className="w-full bg-[#110c00] rounded-2xl p-4 border border-amber-500/40 mb-6 relative overflow-hidden shadow-[inset_0_0_25px_rgba(251,191,36,0.15)]">
               <div className="flex items-center justify-center gap-2 mb-2">
                 <Zap className="w-4 h-4 text-amber-400" />
                 <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">Oportunidad de Sincronización</span>
               </div>
               
               <h3 className="text-sm font-black text-white mb-1 uppercase tracking-wider">{buffName || 'Maestría de Dominio Táctico'}</h3>
               <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                 {buffDescription || 'Completa tus tareas clave para doblegar al desafío, recargar tu energía y fortalecer tu disciplina.'}
               </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black rounded-xl text-xs sm:text-sm uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-black" />
              <span>Aceptar el Desafío</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
