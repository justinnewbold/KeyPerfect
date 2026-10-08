// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { classifyScreenChange, runScreenTransition } from './screenTransition';

describe('classifyScreenChange', () => {
  it('treats moves between tab roots as tab switches', () => {
    expect(classifyScreenChange('home', 'learn')).toBe('none');
    expect(classifyScreenChange('stats', 'levelSelect')).toBe('none');
  });

  it('pushes when drilling in and pops when returning to a root', () => {
    expect(classifyScreenChange('levelSelect', 'game')).toBe('push');
    expect(classifyScreenChange('home', 'settings')).toBe('push');
    expect(classifyScreenChange('game', 'result')).toBe('push');
    expect(classifyScreenChange('settings', 'home')).toBe('pop');
    expect(classifyScreenChange('result', 'levelSelect')).toBe('pop');
  });

  it('does nothing for the same screen', () => {
    expect(classifyScreenChange('game', 'game')).toBe('none');
  });
});

describe('runScreenTransition', () => {
  afterEach(() => {
    delete (document as unknown as Record<string, unknown>).startViewTransition;
    delete document.documentElement.dataset.vt;
  });

  it('applies the update directly without the API', () => {
    const update = vi.fn();
    expect(runScreenTransition('push', update, false)).toBe(false);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('runs a push inside a view transition and tags the root while it runs', async () => {
    let resolveFinished!: () => void;
    const finished = new Promise<void>(r => (resolveFinished = r));
    const start = vi.fn((cb: () => void) => {
      cb();
      return { finished };
    });
    Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true });

    const update = vi.fn();
    expect(runScreenTransition('push', update, false)).toBe(true);
    expect(start).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(document.documentElement.dataset.vt).toBe('push');

    resolveFinished();
    await finished;
    await Promise.resolve();
    await Promise.resolve();
    expect(document.documentElement.dataset.vt).toBeUndefined();
  });

  it('skips the transition for tab switches and reduced motion', () => {
    const start = vi.fn();
    Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true });
    const update = vi.fn();
    expect(runScreenTransition('none', update, false)).toBe(false);
    expect(runScreenTransition('pop', update, true)).toBe(false);
    expect(start).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(2);
  });
});
