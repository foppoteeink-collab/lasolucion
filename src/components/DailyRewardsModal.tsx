import React from 'react';
import { DAILY_REWARDS } from '../data/defaults';
import { PlayerStats } from '../types';
import { Gift, Check, Flame, X, Lock } from 'lucide-react';
import { triggerShockwave } from '../utils/celebration';
import { soundFX } from '../utils/audio';
import { getTodayDateString } from '../utils/date';
import { DoodleSparkle, DoodleStar } from './DoodleIcons';

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
  if (!isOpen) return null;

  const todayStr = getTodayDateString();
  const isAlreadyClaimedToday = stats.lastDailyRewardClaimedDate === todayStr;
  
  // Calculate current streak day (1 to 7 cycle)
  const currentStreakDay = ((stats.streakDays - (isAlreadyClaimedToday ? 1 : 0)) % 7) + 1;

  const handleClaim = (day: number, xp: number, coins: number, bonusItem?: string) => {
    soundFX.playLevelUp();
    triggerShockwave({ color: 'gold', intensity: 'epic' });
    onClaimReward(day, xp, coins, bonusItem);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#000a14]/80 backdrop-blur-sm animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg max-h-[88dvh] sm:max-h-[84vh] flex flex-col rounded-[24px] bg-white dark:bg-[#001122] border-2 border-slate-900 dark:border-white shadow-[6px_6px_0px_#0f172a] dark:shadow-[6px_6px_0px_#cbd5e1] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#001830] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-300 text-slate-950 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
              <Gift className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-wide uppercase">
                Recompensas Diarias
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Tu racha actual: {stats.streakDays} días
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-[#002244] border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] transition-all cursor-pointer"
            title="Cerrar (Volver atrás)"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Streak Status Banner */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-[#001a33] border-2 border-slate-900 shadow-[2.5px_2.5px_0px_#0f172a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-blue-500 fill-blue-500 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-white">Racha Actual:</span>
                <span className="ml-1.5 text-sm font-black text-blue-600 dark:text-blue-400">
                  {stats.streakDays} {stats.streakDays === 1 ? 'Día' : 'Días'}
                </span>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-blue-200 text-slate-950 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#0f172a]">
              Día {currentStreakDay} de 7
            </span>
          </div>

          {/* 7 Days Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DAILY_REWARDS.map((reward, rIdx) => {
              const isClaimed = reward.day < currentStreakDay || (reward.day === currentStreakDay && isAlreadyClaimedToday);
              const isToday = reward.day === currentStreakDay && !isAlreadyClaimedToday;
              const isLocked = reward.day > currentStreakDay;

              return (
                <div
                  key={reward.day}
                  className={`relative p-3 rounded-2xl border-2 border-slate-900 flex flex-col items-center justify-between text-center transition-all ${
                    reward.day === 7 ? 'col-span-2 sm:col-span-2' : ''
                  } ${
                    isToday
                      ? 'bg-blue-300 text-slate-950 shadow-[3px_3px_0px_#0f172a] scale-102 ring-2 ring-blue-400'
                      : isClaimed
                      ? 'bg-amber-50/50 dark:bg-[#001a33]/40 text-white shadow-[1.5px_1.5px_0px_#0f172a]'
                      : 'bg-white dark:bg-[#001a33] text-slate-900 dark:text-slate-100 shadow-[2px_2px_0px_#0f172a]'
                  }`}
                >
                  {/* Day Badge */}
                  <div className="w-full flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      Día {reward.day}
                    </span>
                    {isClaimed ? (
                      <span className="p-0.5 rounded-md bg-emerald-500 text-white border border-slate-900">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : isLocked ? (
                      <Lock className="w-3 h-3 text-white" />
                    ) : (
                      <DoodleSparkle className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                    )}
                  </div>

                  {/* Reward Chest / Icon */}
                  <div className="my-1 text-2xl sm:text-3xl">
                    {reward.day === 7 ? '👑' : reward.day === 5 ? '🔮' : reward.day === 3 ? '⚡' : '🎁'}
                  </div>

                  {/* Rewards Content */}
                  <div className="text-xs sm:text-sm font-black">
                    +{reward.coins} 🪙
                  </div>
                  <div className="text-xs font-bold text-indigo-700 dark:text-amber-300">
                    +{reward.xp} XP
                  </div>
                  {reward.bonusItem && (
                    <div className="mt-1 text-[10px] font-black text-amber-700 dark:text-amber-300 truncate w-full">
                      {reward.bonusItem}
                    </div>
                  )}

                  {/* Claim Button for Today */}
                  {isToday && (
                    <button
                      onClick={() => handleClaim(reward.day, reward.xp, reward.coins, reward.bonusItem)}
                      className="w-full mt-2 py-1.5 px-2 rounded-xl bg-[#000a14] hover:bg-[#001a33] text-white text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                    >
                      ¡Reclamar! ✨
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer info */}
          <div className="text-center pt-2">
            {isAlreadyClaimedToday ? (
              <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 stroke-[3]" /> ¡Ya reclamaste tu premio de hoy! Vuelve mañana para la siguiente recompensa.
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-white font-bold">
                Pulsa en el botón para recibir tus monedas y experiencia. ✏️
              </p>
            )}
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="p-3 sm:p-4 border-t-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#001428] shrink-0 flex items-center justify-end">
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-[#002244] dark:hover:bg-[#002b55] text-slate-900 dark:text-white text-xs font-black border-2 border-slate-900 transition-colors cursor-pointer"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};
