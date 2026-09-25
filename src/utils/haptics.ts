/**
 * Safe Web Haptic Feedback API Wrapper for Mobile & Touch devices
 */

export const isHapticsSupported = (): boolean => {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

export const triggerHaptic = (pattern: number | number[] = 20): boolean => {
  try {
    if (isHapticsSupported()) {
      return navigator.vibrate(pattern);
    }
  } catch (err) {
    // Silently handle devices that restrict vibrate without user interaction
  }
  return false;
};

export const hapticPresets = {
  /** Light subtle click for buttons and tabs */
  click: () => triggerHaptic(15),
  /** Success feedback for completing standard tasks */
  taskComplete: () => triggerHaptic([25, 35, 20]),
  /** Critical hit feedback for boss attacks or high-reward tasks */
  criticalHit: () => triggerHaptic([40, 50, 30, 60, 40]),
  /** Level up celebration vibration */
  levelUp: () => triggerHaptic([60, 40, 60, 40, 100]),
};
