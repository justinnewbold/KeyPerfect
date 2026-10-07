// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1';

async function loadHaptics() {
  vi.resetModules();
  return import('./haptics');
}

describe('haptics', () => {
  let originalUA: string;
  let originalVibrate: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalUA = navigator.userAgent;
    originalVibrate = Object.getOwnPropertyDescriptor(Navigator.prototype, 'vibrate');
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
    if (originalVibrate) {
      Object.defineProperty(Navigator.prototype, 'vibrate', originalVibrate);
    } else {
      delete (Navigator.prototype as unknown as Record<string, unknown>).vibrate;
    }
    vi.useRealTimers();
  });

  it('uses navigator.vibrate where it exists', async () => {
    const vibrate = vi.fn().mockReturnValue(true);
    Object.defineProperty(Navigator.prototype, 'vibrate', { value: vibrate, configurable: true });
    const { triggerHapticFeedback, isHapticsAvailable } = await loadHaptics();

    expect(isHapticsAvailable()).toBe(true);
    triggerHapticFeedback('success');
    expect(vibrate).toHaveBeenCalledWith([10, 50, 20]);
    expect(document.querySelector('input[switch]')).toBeNull();
  });

  it('falls back to a hidden switch toggle on iPhone, where vibrate is absent', async () => {
    delete (Navigator.prototype as unknown as Record<string, unknown>).vibrate;
    Object.defineProperty(navigator, 'userAgent', { value: IPHONE_UA, configurable: true });
    const { triggerHapticFeedback, isHapticsAvailable } = await loadHaptics();

    expect(isHapticsAvailable()).toBe(true);
    triggerHapticFeedback('light');

    const input = document.querySelector<HTMLInputElement>('input[type="checkbox"][switch]');
    expect(input).not.toBeNull();
    expect(input!.getAttribute('aria-hidden')).toBe('true');
    expect(input!.checked).toBe(true);

    // "error" is three taps spaced out; only the first lands synchronously.
    // Three toggles from "on" end "off".
    const changes = vi.fn();
    input!.addEventListener('change', changes);
    triggerHapticFeedback('error');
    expect(changes).toHaveBeenCalledTimes(1);
    expect(input!.checked).toBe(false);
    vi.runAllTimers();
    expect(changes).toHaveBeenCalledTimes(3);
    expect(input!.checked).toBe(false);
    // One shared element, not one per call.
    expect(document.querySelectorAll('input[switch]')).toHaveLength(1);
  });

  it('is a silent no-op where neither engine exists', async () => {
    delete (Navigator.prototype as unknown as Record<string, unknown>).vibrate;
    Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (X11; Linux x86_64)', configurable: true });
    const { triggerHapticFeedback, isHapticsAvailable } = await loadHaptics();

    expect(isHapticsAvailable()).toBe(false);
    expect(() => triggerHapticFeedback('heavy')).not.toThrow();
    expect(document.querySelector('input[switch]')).toBeNull();
  });
});
