import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, Heart, Coins, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useUIStore } from '../store/useUIStore';
import { soundFX } from '../utils/audio';

export const HunterCollapseModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.isHunterCollapseOpen);
  const stats = usePlayerStore((s) => s.stats);
  const revivePlayer = usePlayerStore((s) => s.revivePlayer);
  const addFloatingEffect = useUIStore((s) => s.addFloatingEffect);

  if (!isOpen) return null;

  const currentXp = stats.currentXp || 0;
  const currentCoins = stats.coins || 0;
  const xpPenalty = Math.round(currentXp * 0.20);
  const canAffordCoins = currentCoins >= 30;

  const handleRevive = (method: 'xp' | 'coins') => {
    soundFX.playHeal();
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl font-sans"
      >
        {/* Ambient Red Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.2)_0%,rgba(0,0,0,0.95)_85%)] pointer-events-none" />

        <motion.div
          initial={{ scale: 0.9, y: 25 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm sm:max-w-md bg-[#08020a] rounded-3xl border-2 border-rose-600/80 shadow-[0_0_50px_rgba(225,29,72,0.4)] overflow-hidden relative text-white"
        >
          {/* Top pulse indicator */}
          <div className="h-2 w-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 animate-pulse" />

          <div className="p-6 sm:p-8 text-center flex flex-col items-center">
            {/* Skull & Warning Icon */}
            <div className="w-20 h-20 mb-3 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-rose-600/30 rounded-full blur-xl animate-pulse" />
              <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.6)]">
                <Skull className="w-9 h-9 text-rose-400 animate-bounce" />
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-600/60 text-rose-300 text-[10px] font-mono font-black uppercase tracking-widest mb-2">
              ⚡ ENERGÍA VITAL AGOTADA (0 HP)
            </span>

            <h2 className="text-xl sm:text-2xl font-anton uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-200 to-rose-400 mb-2">
              Agotamiento de Energía
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono mb-5">
              Tu reserva de energía vital se ha agotado. Tu determinación te permite levantarte de nuevo al <strong className="text-emerald-400">50% de HP</strong>. Elige tu método de recuperación:
            </p>

            {/* Options */}
            <div className="w-full space-y-3 mb-4">
              {/* Option 1: Pay with XP */}
              <button
                type="button"
                onClick={() => handleRevive('xp')}
                className="w-full p-4 rounded-2xl bg-[#140510] hover:bg-[#200918] border border-rose-500/40 hover:border-rose-400 text-left transition-all cursor-pointer group shadow-inner"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-anton tracking-wider text-rose-300 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Aceptar el Desgaste (XP)
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400">
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
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  canAffordCoins
                    ? 'bg-[#001018] hover:bg-[#001c2a] border-amber-500/50 hover:border-amber-400 cursor-pointer'
                    : 'bg-black/40 border-slate-800 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-anton tracking-wider text-amber-300 uppercase flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-yellow-400" /> Tratamiento Médico
                  </span>
                  <span className="text-xs font-mono font-bold text-yellow-400">
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
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ambas opciones restablecen tu salud al 50% de HP vital.</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
