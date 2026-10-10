import { triggerHaptic } from './haptics';

export type ShockwaveColor = 'cyan' | 'emerald' | 'gold' | 'violet';
export type ShockwaveIntensity = 'subtle' | 'medium' | 'epic';

export interface ShockwaveOptions {
  color?: ShockwaveColor;
  intensity?: ShockwaveIntensity;
  origin?: { x: number; y: number };
}

/**
 * Triggers a cinematic anamorphic lens flare & prismatic crystal fracture.
 * Mature, epic, and high-impact visual celebration.
 */
export const triggerShockwave = (options?: ShockwaveOptions) => {
  if (typeof window === 'undefined') return;

  const color = options?.color || 'cyan';
  const intensity = options?.intensity || 'medium';
  const origin = options?.origin || {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

  // Crisp dual-pulse tactile feedback (like glass fracturing)
  try {
    if (intensity === 'epic') {
      triggerHaptic([40, 30, 60, 30, 80]);
    } else {
      triggerHaptic([25, 30, 45]);
    }
  } catch {}

  window.dispatchEvent(
    new CustomEvent('celebration-shockwave', {
      detail: { color, intensity, origin },
    })
  );
};

// Drop-in alias for convenience across modals
export const triggerCelebration = triggerShockwave;
