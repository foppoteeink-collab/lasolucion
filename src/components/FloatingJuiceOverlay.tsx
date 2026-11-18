import React from 'react';
import { Zap, Coins, Flame, Swords, Sparkles } from 'lucide-react';
import { useUIStore, FloatingEffect } from '../store/useUIStore';

export const spawnJuiceParticle = (particle: Omit<FloatingEffect, 'id'>) => {
  useUIStore.getState().addFloatingEffect(particle);
};

export const spawnBossEmojiExplosion = (_originX?: number, _originY?: number) => {
  // No-op: Pirotecnia invasiva eliminada
};

export const FloatingJuiceOverlay: React.FC = React.memo(() => {
  const particles = useUIStore((s) => s.floatingEffects);
  const removeFloatingEffect = useUIStore((s) => s.removeFloatingEffect);

  if (particles.length === 0) return null;

  // Limitar a las últimas 16 partículas simultáneas para preservar 60fps estables en móviles
  const visibleParticles = particles.length > 16 ? particles.slice(-16) : particles;

  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none will-change-transform">
      {visibleParticles.map((p: FloatingEffect) => {
        let icon = <Zap className="w-4 h-4 aura-text-primary inline mr-1 shrink-0" />;
        let textStyle = 'aura-text-primary aura-glow aura-border-primary bg-[#040a1a]/[0.95]';

        if (p.type === 'coins') {
          icon = <Coins className="w-4 h-4 text-amber-300 inline mr-1 shrink-0" />;
          textStyle = 'text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.75)] border-amber-400/80 bg-[#040a1a]/[0.95]';
        } else if (p.type === 'boss' || p.type === 'critical' || p.isCrit) {
          icon = <Swords className="w-5 h-5 text-rose-400 inline mr-1 shrink-0 animate-pulse" />;
          textStyle = 'text-rose-400 font-black text-sm sm:text-base tracking-wider shadow-[0_0_18px_rgba(244,63,94,0.85)] border-rose-500 bg-[#040a1a]/[0.96]';
        } else if (p.type === 'streak') {
          icon = <Flame className="w-4 h-4 text-orange-400 inline mr-1 shrink-0" />;
          textStyle = 'text-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.75)] border-orange-400/80 bg-[#040a1a]/[0.95]';
        } else if (p.type === 'custom' && p.colorClass) {
          icon = <Sparkles className="w-4 h-4 inline mr-1 shrink-0" />;
          textStyle = p.colorClass;
        }

        const animClass = p.isCrit ? 'animate-juice-crit' : 'animate-juice-float';

        return (
          <div
            key={p.id}
            onAnimationEnd={() => removeFloatingEffect(p.id)}
            style={{ 
              left: `${p.x}px`, 
              top: `${p.y}px`,
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform, opacity'
            }}
            className={`absolute flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-black tracking-wide font-sans shadow-2xl ${textStyle} ${animClass}`}
          >
            {icon}
            <span>{p.text}</span>
          </div>
        );
      })}
    </div>
  );
});

FloatingJuiceOverlay.displayName = 'FloatingJuiceOverlay';
