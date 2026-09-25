import React from 'react';
import { Zap, Coins, Flame, Swords, Sparkles } from 'lucide-react';
import { useUIStore, FloatingEffect } from '../store/useUIStore';

export const spawnJuiceParticle = (particle: Omit<FloatingEffect, 'id'>) => {
  useUIStore.getState().addFloatingEffect(particle);
};

export const spawnBossEmojiExplosion = (originX?: number, originY?: number) => {
  if (typeof window === 'undefined') return;
  const centerX = originX || window.innerWidth / 2;
  const centerY = originY || window.innerHeight / 2;

  const emojiItems = [
    { text: '⚡ PROTOCOLO NÉMESIS: DERROTADO', color: 'text-purple-300 bg-[#1c002b]/95 border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.9)]' },
    { text: '🌐 MODO OVERDRIVE QUANTUM', color: 'text-cyan-300 bg-[#001830]/95 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.9)]' },
    { text: '🛡️ SINTONIZACIÓN DE ARQUETIPO', color: 'text-amber-300 bg-[#2b1800]/95 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.9)]' },
    { text: '💎 BOTÍN CIBERNÉTICO LEGENDARIO', color: 'text-emerald-300 bg-[#002b12]/95 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.9)]' },
    { text: '⚔️ IMPACTO CRÍTICO DE DISCIPLINA', color: 'text-rose-300 bg-[#2b000a]/95 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.9)]' },
    { text: '🔥 SOBRECARGA DE FLUJO MÁXIMA', color: 'text-orange-300 bg-[#2b0c00]/95 border-orange-400 shadow-[0_0_25px_rgba(251,146,60,0.9)]' },
  ];

  emojiItems.forEach((item, index) => {
    const offsetX = (index - 2.5) * 55;
    const offsetY = (index % 2 === 0 ? -1 : 1) * 35 - 40;
    setTimeout(() => {
      spawnJuiceParticle({
        x: Math.max(20, Math.min(window.innerWidth - 220, centerX + offsetX)),
        y: Math.max(60, centerY + offsetY),
        text: item.text,
        type: 'custom' as any,
        isCrit: true,
        colorClass: item.color,
      } as any);
    }, index * 70);
  });
};

export const FloatingJuiceOverlay: React.FC = React.memo(() => {
  const particles = useUIStore((s) => s.floatingEffects);
  const removeFloatingEffect = useUIStore((s) => s.removeFloatingEffect);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none will-change-transform">
      {particles.map((p: any) => {
        let icon = <Zap className="w-4 h-4 text-cyan-300 inline mr-1 shrink-0" />;
        let textStyle = 'text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.8)] border-cyan-400/80 bg-[#001830]/90';

        if (p.type === 'coin' || p.type === 'coins') {
          icon = <Coins className="w-4 h-4 text-amber-300 inline mr-1 shrink-0" />;
          textStyle = 'text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)] border-amber-400/80 bg-[#1c1200]/90';
        } else if (p.type === 'boss' || p.type === 'critical' || p.isCrit) {
          icon = <Swords className="w-5 h-5 text-rose-400 inline mr-1 shrink-0 animate-pulse" />;
          textStyle = 'text-rose-400 font-black text-sm sm:text-base tracking-wider shadow-[0_0_18px_rgba(244,63,94,0.9)] border-rose-500 bg-[#2b000a]/95';
        } else if (p.type === 'streak') {
          icon = <Flame className="w-4 h-4 text-orange-400 inline mr-1 shrink-0" />;
          textStyle = 'text-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.8)] border-orange-400/80 bg-[#1f0b00]/90';
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
