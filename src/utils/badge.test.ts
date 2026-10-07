// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';

vi.mock('./spacedRepetition', () => ({
  getDueItems: vi.fn(() => [{ id: 'a' }, { id: 'b' }, { id: 'c' }]),
}));

import { syncAppBadge, getDueReviewCount, isBadgingSupported } from './badge';

describe('badge', () => {
  afterEach(() => {
    delete (navigator as unknown as Record<string, unknown>).setAppBadge;
    delete (navigator as unknown as Record<string, unknown>).clearAppBadge;
  });

  it('counts due items across every type', () => {
    expect(getDueReviewCount()).toBe(3);
  });

  it('is a no-op without the Badging API', async () => {
    expect(isBadgingSupported()).toBe(false);
    expect(await syncAppBadge()).toBe(0);
  });

  it('sets the due count and clears at zero', async () => {
    const setAppBadge = vi.fn().mockResolvedValue(undefined);
    const clearAppBadge = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'setAppBadge', { value: setAppBadge, configurable: true });
    Object.defineProperty(navigator, 'clearAppBadge', { value: clearAppBadge, configurable: true });

    expect(await syncAppBadge()).toBe(3);
    expect(setAppBadge).toHaveBeenCalledWith(3);

    expect(await syncAppBadge(0)).toBe(0);
    expect(clearAppBadge).toHaveBeenCalled();
  });

  it('swallows a refused badge', async () => {
    Object.defineProperty(navigator, 'setAppBadge', {
      value: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
      configurable: true,
    });
    await expect(syncAppBadge(2)).resolves.toBe(2);
  });
});
