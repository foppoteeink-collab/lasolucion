import React, { useEffect } from 'react';
import { DAILY_REWARDS } from '../data/defaults';
import { PlayerStats } from '../types';
import { Gift, Check, Flame, X, Lock, Sparkles, Coins, Zap } from 'lucide-react';
import { triggerShockwave } from '../utils/celebration';
import { soundFX } from '../utils/audio';
import { getTodayDateString } from '../utils/date';

interface DailyRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  onClaimReward: (day: number, xp: number, coins: number, bonusItem?: string) => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onClaimReward,
}) => {
  const todayStr = getTodayDateString();
  const isAlreadyClaimedToday = stats.lastDailyRewardClaimedDate === todayStr;
  
  // Calculate current streak day (1 to 7 cycle)
  const currentStreakDay = ((stats.streakDays - (isAlreadyClaimedToday ? 1 : 0)) % 7) + 1;

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClaim = (day: number, xp: number, coins: number, bonusItem?: string) => {
    soundFX.playLevelUp();
    triggerShockwave({ color: 'gold', intensity: 'epic' });
    onClaimReward(day, xp, coins, bonusItem);
  };

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg max-h-[90dvh] flex flex-col bg-[#030712]/95 border border-amber-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] relative text-left overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Luces de ambiente cyberpunk */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />

        {/* ============================================================== */}
        {/* MODAL HEADER: IDENTIDAD COCKPIT                                */}
        {/* ============================================================== */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-white/10 bg-[#010810]/80 shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-950 to-[#1c1202] border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)] shrink-0">
              <Gift className="w-5 h-5 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-anton tracking-wide text-white uppercase truncate flex items-center gap-2">
                <span>Recompensas Diarias</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-400/50 font-bold shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                  Día {currentStreakDay} / 7
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                Suministros de disciplina • Bono por lealtad continua
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-amber-400/40 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2 active:scale-95"
            title="Cerrar modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* MODAL BODY (SCROLLABLE)                                        */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 relative z-10 custom-scrollbar">
          
          {/* STREAK STATUS BANNER */}
          <div className="p-3.5 rounded-2xl bg-[#08051a]/90 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.12)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                <Flame className="w-5 h-5 fill-amber-400/40 animate-pulse drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Racha Activa</span>
                <span className="text-sm sm:text-base font-anton text-amber-300 tracking-wide uppercase drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                  {stats.streakDays} {stats.streakDays === 1 ? 'Día Consecutivo' : 'Días Consecutivos'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Ciclo de Lealtad</span>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-black/60 text-cyan-300 border border-cyan-500/30 inline-block mt-0.5">
                Paso {currentStreakDay} de 7
              </span>
            </div>
          </div>

          {/* 7 DAYS REWARDS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {DAILY_REWARDS.map((reward) => {
              const isClaimed = reward.day < currentStreakDay || (reward.day === currentStreakDay && isAlreadyClaimedToday);
              const isToday = reward.day === currentStreakDay && !isAlreadyClaimedToday;
              const isLocked = reward.day > currentStreakDay;
              const isGrandPrize = reward.day === 7;

              return (
                <div
                  key={reward.day}
                  className={`relative p-3 rounded-2xl flex flex-col justify-between text-center transition-all ${
                    isGrandPrize ? 'col-span-2 sm:col-span-2' : ''
                  } ${
                    isToday
                      ? 'bg-gradient-to-b from-[#1c1202] via-[#0d0901] to-[#040e1b] border border-amber-400 text-white shadow-[0_0_25px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-amber-400/50 scale-[1.02]'
                      : isClaimed
                      ? 'bg-[#021008]/80 border border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                      : isGrandPrize
                      ? 'bg-[#0a0518]/80 border border-purple-500/30 text-slate-300 opacity-80'
                      : 'bg-[#02050f]/60 border border-white/5 text-slate-400 opacity-60 backdrop-blur-sm'
                  }`}
                >
                  {/* Top Day Header */}
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[10px] font-anton tracking-wider uppercase text-slate-400">
                      Día {reward.day}
                    </span>
                    {isClaimed ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-400/50 text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1 shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> Listo
                      </span>
                    ) : isToday ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-black text-[9px] font-anton tracking-wider uppercase font-bold shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                        ¡Hoy!
                      </span>
                    ) : (
                      <span className="p-0.5 rounded text-slate-500">
                        <Lock className="w-3 h-3 text-slate-500" />
                      </span>
                    )}
                  </div>

                  {/* Icon Tile */}
                  <div className="my-1.5 flex items-center justify-center">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl transition-transform ${
                      isToday 
                        ? 'bg-amber-500/20 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-110' 
                        : isGrandPrize
                        ? 'bg-purple-950/60 border border-purple-400/40 text-2xl shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : isClaimed
                        ? 'bg-emerald-950/40 border border-emerald-500/30'
                        : 'bg-black/40 border border-white/5'
                    }`}>
                      {isGrandPrize ? '👑' : reward.day === 5 ? '🔮' : reward.day === 3 ? '⚡' : '🎁'}
                    </div>
                  </div>

                  {/* Reward Metrics */}
                  <div className="space-y-1 my-1">
                    <div className="flex items-center justify-center gap-1 text-xs font-anton tracking-wide text-amber-300">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>+{reward.coins}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[11px] font-anton tracking-wide text-cyan-300">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>+{reward.xp} XP</span>
                    </div>
                    {reward.bonusItem && (
                      <div 
                        className="mt-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/30 text-[9px] font-mono text-amber-200 truncate w-full"
                        title={reward.bonusItem}
                      >
                        {reward.bonusItem}
                      </div>
                    )}
                  </div>

                  {/* Action Button for Today */}
                  {isToday && (
                    <button
                      type="button"
                      onClick={() => handleClaim(reward.day, reward.xp, reward.coins, reward.bonusItem)}
                      className="w-full mt-2.5 py-2 px-2.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-anton tracking-widest uppercase text-xs rounded-xl shadow-[0_0_18px_rgba(245,158,11,0.5)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 chicle-btn"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>¡Reclamar!</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Feedback Info Box */}
          <div className="pt-1">
            {isAlreadyClaimedToday ? (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.15)] text-center">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
                <span>¡Suministro de hoy reclamado! Vuelve mañana para continuar tu ciclo.</span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/25 text-amber-300 text-xs font-mono flex items-center justify-center gap-2 text-center">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>Pulsa en el cofre activo de hoy para acreditar tus monedas y experiencia.</span>
              </div>
            )}
          </div>

        </div>

        {/* ============================================================== */}
        {/* PINNED STICKY FOOTER (ERGONOMÍA DEL PULGAR)                    */}
        {/* ============================================================== */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#010810]/80 shrink-0 flex items-center justify-between gap-3 relative z-10">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Completar misiones diarias alimenta tu racha de lealtad.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white font-anton uppercase text-xs tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ml-auto"
          >
            <span>Volver al Cockpit</span>
          </button>
        </div>

      </div>
    </div>
  );
};
