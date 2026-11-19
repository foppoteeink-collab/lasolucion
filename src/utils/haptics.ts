/**
 * Safe Web Haptic Feedback API Wrapper for Mobile & Touch devices
 * Supports user preference toggles and fallback sensory pulses for iOS
 */
import { useUIStore } from '../store/useUIStore';

const hasUserActivation = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  if (!('userActivation' in navigator)) return true;
  return Boolean((navigator as unknown as { userActivation?: { hasBeenActive?: boolean } }).userActivation?.hasBeenActive);
};

export const isHapticsSupported = (): boolean => {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator && hasUserActivation();
};

const triggerVisualHapticFallback = () => {
  if (typeof document === 'undefined') return;
  document.body.classList.add('haptic-pulse-feedback');
  setTimeout(() => {
    document.body.classList.remove('haptic-pulse-feedback');
  }, 90);
};

export const triggerHaptic = (pattern: number | number[] = 20): boolean => {
  try {
    const isHapticEnabled = useUIStore.getState().hapticEnabled;
    if (!isHapticEnabled) return false;

    if (isHapticsSupported()) {
      return navigator.vibrate(pattern);
    } else {
      triggerVisualHapticFallback();
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
  /** Pomodoro session complete vibration */
  pomodoroComplete: () => triggerHaptic([50, 60, 50, 60, 100]),
  /** Daily reward claim vibration */
  rewardClaim: () => triggerHaptic([30, 40, 50]),
};
