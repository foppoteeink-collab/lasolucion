import React from 'react';
import { FloatingReward } from '../types';

interface Props {
  rewards: FloatingReward[];
}

export const FloatingGainEffect: React.FC<Props> = React.memo(({ rewards }) => {
  if (rewards.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden will-change-transform">
      {rewards.map((reward) => (
        <div
          key={reward.id}
          className="absolute flex flex-col items-center justify-center animate-float-up animate-out fade-out slide-out-to-top-12 duration-[2400ms] ease-out"
          style={{
            textShadow: '0 0 20px rgba(0, 240, 255, 0.8), 0 0 10px rgba(0, 0, 0, 1)'
          }}
        >
          {reward.text && (
            <span className="text-sm font-black uppercase tracking-widest text-white mb-2 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] px-4 py-1 rounded-full border border-cyan-400/50 bg-[#001f3f]/80">
              {reward.text}
            </span>
          )}
          <div className="flex items-center gap-6">
            {reward.xp !== 0 && (
              <span className={`text-3xl md:text-5xl font-black ${reward.xp >= 0 ? 'text-cyan-300' : 'text-rose-400'} drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] flex items-center gap-2 transform scale-110`}>
                <span className={`${reward.xp >= 0 ? 'text-cyan-400' : 'text-rose-400'} text-2xl md:text-3xl`}>XP</span>
                {reward.xp >= 0 ? `+${reward.xp}` : `${reward.xp}`}
              </span>
            )}
            {reward.coins !== 0 && (
              <span className={`text-3xl md:text-5xl font-black ${reward.coins >= 0 ? 'text-amber-300' : 'text-rose-400'} drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] flex items-center gap-2 transform scale-110`}>
                <span className="text-2xl md:text-3xl">🪙</span>
                {reward.coins >= 0 ? `+${reward.coins}` : `${reward.coins}`}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

FloatingGainEffect.displayName = 'FloatingGainEffect';
