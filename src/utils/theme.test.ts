// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyTheme, resolveTheme, watchSystemTheme, applyGlassIntensity } from './theme';

type Listener = (e: { matches: boolean }) => void;

function mockMatchMedia(prefersDark: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: prefersDark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, fn: Listener) => listeners.add(fn),
    removeEventListener: (_: string, fn: Listener) => listeners.delete(fn),
    addListener: (fn: Listener) => listeners.add(fn),
    removeListener: (fn: Listener) => listeners.delete(fn),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return {
    flip(matches: boolean) {
      mql.matches = matches;
      listeners.forEach(fn => fn({ matches }));
    },
    listenerCount: () => listeners.size,
  };
}

describe('theme', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    document.documentElement.removeAttribute('style');
    document.head.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
  });

  it('resolves system to dark or light from prefers-color-scheme', () => {
    mockMatchMedia(true);
    expect(resolveTheme('system')).toBe('dark');
    mockMatchMedia(false);
    expect(resolveTheme('system')).toBe('light');
    expect(resolveTheme('purple')).toBe('purple');
  });

  it('applies exactly one theme class and the matching theme-color', () => {
    mockMatchMedia(true);
    applyTheme('blue');
    const classes = Array.from(document.documentElement.classList).filter(c => c.startsWith('theme-'));
    expect(classes).toEqual(['theme-blue']);
    expect(document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content).toBe('#0c1929');
    expect(document.documentElement.style.colorScheme).toBe('dark');

    applyTheme('light');
    expect(document.documentElement.classList.contains('theme-blue')).toBe(false);
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content).toBe('#f0f0f5');
  });

  it('follows OS appearance changes while the theme is system, and stops on cleanup', () => {
    const media = mockMatchMedia(true);
    applyTheme('system');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);

    const stop = watchSystemTheme('system');
    media.flip(false);
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);

    stop();
    expect(media.listenerCount()).toBe(0);
    media.flip(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
  });

  it('does not listen for OS changes under an explicit theme', () => {
    const media = mockMatchMedia(true);
    const stop = watchSystemTheme('purple');
    expect(media.listenerCount()).toBe(0);
    stop();
  });

  it('exposes glass intensity as a data attribute', () => {
    applyGlassIntensity('tinted');
    expect(document.documentElement.dataset.glass).toBe('tinted');
  });
});
