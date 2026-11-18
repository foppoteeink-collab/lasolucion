import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, Heart, Coins, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useUIStore } from '../store/useUIStore';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';

export const HunterCollapseModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.isHunterCollapseOpen);
  const stats = usePlayerStore((s) => s.stats);
  const revivePlayer = usePlayerStore((s) => s.revivePlayer);
  const addFloatingEffect = useUIStore((s) => s.addFloatingEffect);
  const copy = useNarrativeCopy();

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
    };
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  const currentXp = stats.currentXp || 0;
  const currentCoins = stats.coins || 0;
  const xpPenalty = Math.round(currentXp * 0.20);
  const canAffordCoins = currentCoins >= 30;

  const handleRevive = (method: 'xp' | 'coins') => {
    soundFX.playHeal();
    triggerHaptic([40, 60]);
    const result = revivePlayer(method);
    
    if (typeof window !== 'undefined') {
      addFloatingEffect({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2 - 30,
        text: method === 'coins' ? `🏥 Reanimado (-30 Monedas) • HP al 50%` : `⚡ Reanimado (-${result.xpLost} XP) • HP al 50%`,
        type: 'heal',
      });
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="hunter-collapse-title"
          initial={{ scale: 0.9, y: 25 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative isolate w-full max-w-sm sm:max-w-md bg-[#030712]/[0.98] rounded-2xl sm:rounded-3xl border border-rose-500/50 shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden text-white"
        >
          {/* Micrograno táctil */}
          <span className="vi-grano opacity-5" aria-hidden="true" />

          {/* Filamento superior peligro semántico */}
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 animate-pulse" aria-hidden="true" />

          <div className="p-6 sm:p-8 text-center flex flex-col items-center relative z-10">
            {/* Skull & Warning Icon */}
            <div className="w-20 h-20 mb-3 relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-950/70 border border-rose-500/60 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.45)]">
                <Skull className="w-9 h-9 text-rose-400 animate-bounce" />
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-600/60 text-rose-300 text-[10px] font-mono font-black uppercase tracking-widest mb-2">
              {copy.collapseBadge}
            </span>

            <h2 id="hunter-collapse-title" className="text-xl sm:text-2xl font-anton uppercase tracking-wider text-rose-200 mb-2">
              {copy.collapseTitle}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono mb-5">
              Tu energía llegó a 0 HP. Restáurate de inmediato al <strong className="text-emerald-400">50% HP</strong>. Sin culpa:
            </p>

            {/* Options */}
            <div className="w-full space-y-3 mb-4">
              {/* Option 1: Pay with XP */}
              <button
                type="button"
                onClick={() => handleRevive('xp')}
                aria-label={`${copy.collapsePenaltyLabel} pagando ${xpPenalty} XP para restaurar HP al 50%`}
                className="chicle-btn !flex !flex-col !items-stretch w-full p-4 rounded-2xl bg-[#040814]/80 hover:bg-rose-950/40 border border-rose-500/40 hover:border-rose-400 text-left cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-anton tracking-wider text-rose-300 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> {copy.collapsePenaltyLabel}
                  </span>
                  <span className="text-xs font-mono tabular-nums font-bold text-rose-400">
                    -{xpPenalty} XP
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono leading-snug">
                  Deduce el 20% de tu barra de XP actual. <span className="text-emerald-400 font-bold">Nunca desciendes de nivel.</span>
                </p>
              </button>

              {/* Option 2: Pay with Coins */}
              <button
                type="button"
                disabled={!canAffordCoins}
                onClick={() => handleRevive('coins')}
                aria-label={canAffordCoins ? `${copy.collapseRecoveryLabel} con 30 monedas para restaurar HP al 50%` : 'Monedas insuficientes para recuperación'}
                className={`chicle-btn !flex !flex-col !items-stretch w-full p-4 rounded-2xl border text-left transition-all ${
                  canAffordCoins
                    ? 'bg-[#040814]/80 hover:bg-amber-950/30 border-amber-500/50 hover:border-amber-400 cursor-pointer'
                    : 'bg-black/40 border-white/10 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-anton tracking-wider text-amber-300 uppercase flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" /> {copy.collapseRecoveryLabel}
                  </span>
                  <span className="text-xs font-mono tabular-nums font-bold text-amber-300">
                    -30 Monedas
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono leading-snug">
                  Paga con tus monedas acumuladas para restaurar tu salud <span className="text-amber-300 font-bold">sin perder XP</span>.
                  {!canAffordCoins && ` (Tienes ${currentCoins} monedas)`}
                </p>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <RefreshCw className="w-3.5 h-3.5 aura-text-primary" />
              <span>Ambas opciones restablecen tu salud al 50% de HP vital.</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
