import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { PlayerStats } from '../types';
import { Sparkles, Zap, Shield, Brain, Heart, Crown, ChevronRight } from 'lucide-react';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { triggerHaptic, isHapticsSupported } from '../utils/haptics';
import { useUIStore } from '../store/useUIStore';
import { canPlayerAscend } from '../utils/level3Systems';
import { handleAscendPlayer } from '../engine/gameEngine';
import { generateAndShareLegacyCard } from '../utils/shareCardGenerator';
import { getArchetypeByName } from '../data/archetypes';

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
      // Game Feel 1: Audio SFX sincronizado al inicio exacto de la escala
      soundFX.playLevelUp();
      soundFX.playSubBassConfirm();
      soundFX.playLevelUpImpact();

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

      // Game Feel 4: Gold & Violet Shockwave Pulses
      triggerShockwave({ color: 'gold', intensity: 'epic' });
      const timer = setTimeout(() => {
        triggerShockwave({ color: 'violet', intensity: 'epic' });
      }, 350);

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

  const attributeCards = [
    {
      label: 'Disciplina',
      icon: Shield,
      color: 'text-cyan-400',
      valColor: 'text-cyan-300',
      border: 'border-cyan-500/40',
      currentVal: (stats.attributes?.disciplina || 0) + newLevel,
    },
    {
      label: 'Fuerza',
      icon: Zap,
      color: 'text-amber-400',
      valColor: 'text-amber-300',
      border: 'border-amber-500/40',
      currentVal: (stats.attributes?.fuerza || 0) + newLevel,
    },
    {
      label: 'Mente',
      icon: Brain,
      color: 'text-purple-400',
      valColor: 'text-purple-300',
      border: 'border-purple-500/40',
      currentVal: (stats.attributes?.mente || 0) + newLevel,
    },
    {
      label: 'Energía',
      icon: Heart,
      color: 'text-emerald-400',
      valColor: 'text-emerald-300',
      border: 'border-emerald-500/40',
      currentVal: (stats.attributes?.energia || 0) + newLevel,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-xl font-sans"
      onClick={onClose}
    >
      {/* Sci-Fi Ambient Background Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.1)_0%,rgba(0,0,0,0.98)_80%)] pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08, duration: 0.25 }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-[130px] pointer-events-none" 
      />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.25 }}
        className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-500/15 rounded-full blur-[130px] pointer-events-none" 
      />

      <motion.div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="levelup-modal-title"
        initial={{ y: 18, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col rounded-3xl bg-[#030712]/98 border border-cyan-400/50 shadow-[0_0_80px_rgba(0,240,255,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] text-center overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Filamento especular superior */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/90 to-transparent pointer-events-none" />

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 min-h-0 relative z-10 scrollbar-none">
          
          {/* Header Crown Emblem */}
          <motion.div 
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 220, damping: 14 }}
            className="relative inline-block mt-1 mb-2.5"
          >
            <div className="absolute inset-0 bg-cyan-400 rounded-full blur-2xl opacity-45 animate-pulse" />
            <div className="w-18 h-18 mx-auto rounded-full bg-black/85 border border-cyan-400/80 shadow-[0_0_30px_rgba(0,240,255,0.55)] flex items-center justify-center relative z-10">
              <Crown className="w-9 h-9 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
            </div>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.18 }}
            className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-[0.25em] drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
          >
            ⚡ Evolución de Conciencia Activada
          </motion.p>

          <motion.h2 
            id="levelup-modal-title"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.18 }}
            className="text-3xl sm:text-4xl font-anton text-white uppercase tracking-wider drop-shadow-[0_0_20px_rgba(255,255,255,1)] mt-1"
          >
            NIVEL <span className="text-cyan-400 drop-shadow-[0_0_25px_rgba(0,240,255,1)]">{newLevel}</span>
          </motion.h2>
          
          {/* RANGO EVOLUTIVO */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.2 }}
            className="my-4 p-4 rounded-2xl bg-[#040d1a]/90 border border-cyan-500/40 shadow-[0_0_30px_rgba(0,240,255,0.2)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/90 mb-1">Rango Evolutivo Asignado</p>
            <p className="text-xl sm:text-2xl font-anton text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 uppercase tracking-wider leading-tight drop-shadow-[0_0_14px_rgba(0,240,255,0.9)]">
              {newRankTitle}
            </p>
          </motion.div>

          {/* Stats Improvements Grid con revelación escalonada (stagger) */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.2 }}
            className="p-3.5 rounded-2xl bg-[#02050e]/95 border border-white/10 shadow-[inset_0_0_25px_rgba(0,240,255,0.1)]"
          >
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 mb-2.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Atributos Amplificados</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-left text-xs">
              {attributeCards.map((attr, idx) => {
                const IconComp = attr.icon;
                return (
                  <motion.div
                    key={attr.label}
                    initial={{ opacity: 0, x: -8, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.48 + idx * 0.06, duration: 0.18 }}
                    className={`p-2.5 rounded-xl bg-black/75 border ${attr.border} flex items-center justify-between gap-2`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <IconComp className={`w-4 h-4 ${attr.color} shrink-0`} />
                      <div className="min-w-0">
                        <span className="text-slate-400 block text-[9px] font-mono uppercase tracking-wider truncate">
                          {attr.label}
                        </span>
                        <span className={`font-anton ${attr.valColor} text-sm tracking-wide`}>
                          +1
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                      Nv.{attr.currentVal}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-3 pt-2.5 border-t border-dashed border-white/10 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300 uppercase tracking-wider text-[10px] font-mono">Inyección de Monedas:</span>
              <span className="text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] text-sm font-mono flex items-center gap-1 font-bold">
                +{20 + newLevel * 5} <span className="text-xs">🪙</span>
              </span>
            </div>
          </motion.div>
        </div>
        
        {/* BOTONES DE ACCIÓN: ASCENSIÓN (NV 50+), COMPARTIR LEGADO Y ASIMILAR PODER */}
        <div className="p-4 sm:p-5 pt-2 relative z-10 shrink-0 bg-[#030712]/98 border-t border-white/10 space-y-2">
          {(newLevel >= 50 || canPlayerAscend(stats)) && (
            <button
              type="button"
              onClick={() => {
                if (handleAscendPlayer()) {
                  onClose();
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider font-bold bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-[0_0_20px_rgba(251,191,36,0.5)] active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Crown className="w-4 h-4 fill-current" />
              <span>★ Protocolo de Ascensión (+5% Eficiencia Global)</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                const arch = getArchetypeByName(stats.characterClass);
                void generateAndShareLegacyCard({
                  stats: { ...stats, level: newLevel, rankTitle: newRankTitle },
                  archetypeName: arch.name,
                });
              }}
              className="py-3.5 px-3.5 rounded-xl text-xs uppercase tracking-wider font-bold bg-white/[0.06] hover:bg-white/[0.12] border border-cyan-500/35 text-cyan-200 active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0"
              title="Compartir Tarjeta Táctica 9:16"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Compartir</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="btn-neon-hunter flex-1 py-3.5 rounded-xl text-sm uppercase tracking-wider shadow-lg active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-2 font-bold bg-cyan-950/40 border border-cyan-500/50 hover:bg-cyan-900/60"
            >
              <span>Asimilar Poder</span>
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
