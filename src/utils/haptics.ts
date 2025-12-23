// Haptic Feedback Utility for mobile devices

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

// Check if vibration API is available
export function isHapticsAvailable(): boolean {
  return 'vibrate' in navigator;
}

// Vibration patterns for different feedback types
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  error: [50, 30, 50],
  warning: [30, 20, 30],
};

// Trigger haptic feedback
export function triggerHapticFeedback(type: HapticType = 'light'): void {
  if (!isHapticsAvailable()) return;

  try {
    const pattern = HAPTIC_PATTERNS[type];
    navigator.vibrate(pattern);
  } catch {
    // Silently fail if vibration is not supported or blocked
  }
}

// Cancel any ongoing vibration
export function cancelHapticFeedback(): void {
  if (!isHapticsAvailable()) return;

  try {
    navigator.vibrate(0);
  } catch {
    // Silently fail
  }
}

// Convenience methods
export const haptics = {
  light: () => triggerHapticFeedback('light'),
  medium: () => triggerHapticFeedback('medium'),
  heavy: () => triggerHapticFeedback('heavy'),
  success: () => triggerHapticFeedback('success'),
  error: () => triggerHapticFeedback('error'),
  warning: () => triggerHapticFeedback('warning'),
  cancel: cancelHapticFeedback,
};
