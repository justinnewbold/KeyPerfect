// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { acquireWakeLock, isWakeLockSupported } from './wakeLock';

function installWakeLock() {
  const release = vi.fn().mockResolvedValue(undefined);
  const request = vi.fn().mockResolvedValue({ release, released: false });
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
  return { request, release };
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('wakeLock', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  afterEach(() => {
    delete (navigator as unknown as Record<string, unknown>).wakeLock;
  });

  it('is a no-op without the API', () => {
    expect(isWakeLockSupported()).toBe(false);
    expect(() => acquireWakeLock()()).not.toThrow();
  });

  it('requests a screen lock, re-requests on return to foreground, and releases', async () => {
    const { request, release } = installWakeLock();
    const stop = acquireWakeLock();
    await Promise.resolve();
    expect(request).toHaveBeenCalledWith('screen');

    // Hidden: the OS drops the lock itself. Visible again: we take it back.
    setVisibility('hidden');
    expect(request).toHaveBeenCalledTimes(1);
    setVisibility('visible');
    expect(request).toHaveBeenCalledTimes(2);

    stop();
    await Promise.resolve();
    expect(release).toHaveBeenCalled();

    // Released holders stop listening.
    setVisibility('visible');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not request while the page is hidden', async () => {
    const { request } = installWakeLock();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    const stop = acquireWakeLock();
    await Promise.resolve();
    expect(request).not.toHaveBeenCalled();
    stop();
  });
});
