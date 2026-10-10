import { triggerHaptic } from './haptics';

export type ShockwaveColor = 'cyan' | 'emerald' | 'gold' | 'violet';
export type ShockwaveIntensity = 'subtle' | 'medium' | 'epic';

export interface ShockwaveOptions {
  color?: ShockwaveColor;
  intensity?: ShockwaveIntensity;
}

/**
 * Triggers an elegant, non-invasive edge shockwave & energy ring pulse.
 * Replaces generic confetti with a high-end, Apple/Linear style celebration.
 */
export const triggerShockwave = (options?: ShockwaveOptions) => {
  if (typeof window === 'undefined') return;

  const color = options?.color || 'emerald';
  const intensity = options?.intensity || 'medium';

  // Haptic micro-pulse
  try {
    if (intensity === 'epic') {
      triggerHaptic([50, 40, 70]);
    } else {
      triggerHaptic([35, 40]);
    }
  } catch {}

  window.dispatchEvent(
    new CustomEvent('celebration-shockwave', {
      detail: { color, intensity },
    })
  );
};

// Drop-in alias for convenience across modals
export const triggerCelebration = triggerShockwave;
