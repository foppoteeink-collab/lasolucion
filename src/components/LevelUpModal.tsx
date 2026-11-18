import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
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
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';

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
  const copy = useNarrativeCopy();
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
      triggerHaptic([100, 50, 100, 50, 300]);

      // Game Feel 4: Gold & Violet Shockwave Pulses
      triggerShockwave({ color: 'gold', intensity: 'epic' });
      const timer = setTimeout(() => {
        triggerShockwave({ color: 'violet', intensity: 'epic' });
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Teclado: Escape para cerrar y ocultar flotantes
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

  const attributeCards = [
    {
      label: 'Disciplina',
      icon: Shield,
      color: 'aura-text-primary',
      valColor: 'aura-text-soft',
      border: 'aura-border-subtle',
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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans"
        onClick={onClose}
      >
        <motion.div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="levelup-modal-title"
          initial={{ y: 18, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative isolate w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#030712]/[0.98] border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.75)] text-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Micrograno táctil Moxen Vidrio */}
          <span className="vi-grano opacity-5" aria-hidden="true" />

          {/* Filamento especular superior */}
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 min-h-0 relative z-10 no-scrollbar">
            
            {/* Header Crown Emblem */}
            <motion.div 
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, type: 'spring', stiffness: 220, damping: 14 }}
              className="relative inline-block mt-1 mb-2.5"
            >
              <div className="w-18 h-18 mx-auto rounded-full bg-[#040814]/90 border aura-border-primary aura-glow flex items-center justify-center relative z-10">
                <Crown className="w-9 h-9 text-amber-300" />
              </div>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.18 }}
              className="text-[10px] font-mono font-bold aura-text-primary uppercase tracking-[0.25em]"
            >
              {copy.levelUpBadge}
            </motion.p>

            <motion.h2 
              id="levelup-modal-title"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.18 }}
              className="text-3xl sm:text-4xl font-anton text-white uppercase tracking-wider mt-1"
            >
              NIVEL <span className="aura-text-primary font-mono tabular-nums">{newLevel}</span>
            </motion.h2>
            
            {/* RANGO EVOLUTIVO */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.2 }}
              className="my-4 p-4 rounded-2xl bg-[#040814]/80 border aura-border-subtle aura-glow-subtle relative overflow-hidden"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest aura-text-soft mb-1">{copy.levelUpRankAssigned}</p>
              <p className="text-xl sm:text-2xl font-anton text-white uppercase tracking-wider leading-tight">
                {newRankTitle}
              </p>
            </motion.div>

            {/* Stats Improvements Grid con revelación escalonada (stagger) */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.2 }}
              className="p-3.5 rounded-2xl bg-[#040814]/80 border border-white/10"
            >
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider aura-text-soft mb-2.5 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 aura-text-primary" />
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
                      className={`p-2.5 rounded-xl bg-black/50 border ${attr.border} flex items-center justify-between gap-2`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComp className={`w-4 h-4 ${attr.color} shrink-0`} />
                        <div className="min-w-0">
                          <span className="text-slate-400 block text-[9px] font-mono uppercase tracking-wider truncate">
                            {attr.label}
                          </span>
                          <span className={`font-mono tabular-nums font-bold ${attr.valColor} text-sm`}>
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
                <span className="text-slate-300 uppercase tracking-wider text-[10px] font-mono">{copy.levelUpCoinsGranted}</span>
                <span className="text-amber-300 text-sm font-mono tabular-nums flex items-center gap-1 font-bold">
                  +{20 + newLevel * 5} <span className="text-xs">🪙</span>
                </span>
              </div>
            </motion.div>
          </div>
          
          {/* BOTONES DE ACCIÓN */}
          <div className="p-4 sm:p-5 pt-3 relative z-10 shrink-0 bg-[#040814]/[0.96] border-t border-white/10 space-y-2">
            {(newLevel >= 50 || canPlayerAscend(stats)) && (
              <button
                type="button"
                onClick={() => {
                  if (handleAscendPlayer()) {
                    onClose();
                  }
                }}
                className="chicle-btn optic-active-card w-full py-2.5 px-3 rounded-xl text-xs font-anton uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Crown className="w-4 h-4 fill-current" />
                <span>{copy.levelUpAscensionTag} (+5% Eficiencia Global)</span>
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
                className="chicle-btn py-3.5 px-3.5 rounded-xl text-xs font-anton uppercase tracking-wider bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                title="Compartir Tarjeta de Progreso 9:16"
              >
                <Sparkles className="w-4 h-4 aura-text-primary" />
                <span>Compartir</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onClose();
                }}
                className="chicle-btn aura-btn-gradient optic-active-card flex-1 py-3.5 rounded-xl font-anton text-sm uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{copy.levelUpCta}</span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
