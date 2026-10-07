// Haptic Feedback Utility for mobile devices
//
// Two engines:
//  - `navigator.vibrate` (Android, some desktop browsers).
//  - A hidden `<input type="checkbox" switch>` on iOS. Safari plays the
//    system "switch" haptic when that control toggles, and that is the only
//    haptic a web app can trigger on an iPhone: `navigator.vibrate` does not
//    exist in iOS Safari, so before this every haptics call was a no-op there.
//    Safari only honours the toggle from inside a user gesture, which is where
//    every caller in this app already is (tap handlers, key presses).

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

import { isApplePlatform } from './platform';

function hasVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

// Check if any haptics engine is available
export function isHapticsAvailable(): boolean {
  return hasVibrate() || isApplePlatform();
}

// Vibration patterns for different feedback types (navigator.vibrate engine)
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  error: [50, 30, 50],
  warning: [30, 20, 30],
};

// Number of switch toggles per feedback type (iOS engine). The switch haptic
// has one fixed strength, so "stronger" types are expressed as repeats.
const SWITCH_TAPS: Record<HapticType, number> = {
  light: 1,
  medium: 1,
  heavy: 2,
  success: 2,
  warning: 2,
  error: 3,
};
const SWITCH_TAP_GAP_MS = 70;

let switchInput: HTMLInputElement | null = null;

function getSwitchInput(): HTMLInputElement | null {
  if (typeof document === 'undefined') return null;
  if (switchInput && switchInput.isConnected) return switchInput;

  const input = document.createElement('input');
  input.type = 'checkbox';
  // Non-standard attribute WebKit uses to render a checkbox as a switch; the
  // haptic is tied to this presentation, not to checkboxes in general.
  input.setAttribute('switch', '');
  input.tabIndex = -1;
  input.setAttribute('aria-hidden', 'true');
  // Must stay rendered (not display:none) for the toggle to count; park it
  // off-screen where it can neither be seen nor tapped.
  Object.assign(input.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: '1px',
    height: '1px',
    opacity: '0',
    pointerEvents: 'none',
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(input);
  switchInput = input;
  return input;
}

function tapSwitch(times: number): void {
  const input = getSwitchInput();
  if (!input) return;
  input.click();
  for (let i = 1; i < times; i++) {
    setTimeout(() => input.click(), SWITCH_TAP_GAP_MS * i);
  }
}

// Trigger haptic feedback
export function triggerHapticFeedback(type: HapticType = 'light'): void {
  try {
    if (hasVibrate()) {
      navigator.vibrate(HAPTIC_PATTERNS[type]);
      return;
    }
    if (isApplePlatform()) {
      tapSwitch(SWITCH_TAPS[type]);
    }
  } catch {
    // Silently fail if haptics are not supported or blocked
  }
}

// Cancel any ongoing vibration
export function cancelHapticFeedback(): void {
  if (!hasVibrate()) return;

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
