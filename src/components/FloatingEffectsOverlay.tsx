import React from 'react';

export interface FloatingTextItem {
  id: string;
  x: number;
  y: number;
  text: string;
  type: 'xp' | 'coins' | 'critical' | 'streak' | 'combo' | 'heal';
}

interface FloatingEffectsOverlayProps {
  effects: FloatingTextItem[];
}

export const FloatingEffectsOverlay: React.FC<FloatingEffectsOverlayProps> = React.memo(({ effects }) => {
  if (effects.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden font-sans select-none will-change-transform">
      {effects.map((effect) => {
        let styleColor = 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]';
        if (effect.type === 'xp') {
          styleColor = 'text-indigo-400 font-black text-base sm:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]';
        } else if (effect.type === 'coins') {
          styleColor = 'text-amber-300 font-black text-base sm:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]';
        } else if (effect.type === 'critical') {
          styleColor = 'text-cyan-400 font-black text-lg sm:text-xl drop-shadow-[0_3px_6px_rgba(0,0,0,1)] scale-110 animate-bounce';
        } else if (effect.type === 'combo') {
          styleColor = 'text-blue-400 font-black text-base sm:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]';
        } else if (effect.type === 'heal') {
          styleColor = 'text-emerald-400 font-black text-base sm:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]';
        }

        return (
          <div
            key={effect.id}
            className={`absolute font-black animate-in fade-in slide-in-from-bottom-2 duration-250 ${styleColor}`}
            style={{
              left: `${effect.x}px`,
              top: `${effect.y}px`,
              transform: 'translate3d(-50%, -50%, 0)',
              willChange: 'transform, opacity',
              transition: 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.75s ease-out',
            }}
          >
            {effect.text}
          </div>
        );
      })}
    </div>
  );
});

FloatingEffectsOverlay.displayName = 'FloatingEffectsOverlay';
