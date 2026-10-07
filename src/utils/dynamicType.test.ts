// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { measureDynamicTypeScale, applyDynamicType, watchDynamicType, DYNAMIC_TYPE_VAR } from './dynamicType';

function mockSystemBody(px: number | null) {
  const supports = vi.fn((prop: string, value: string) => px !== null && prop === 'font' && value === '-apple-system-body');
  Object.defineProperty(globalThis, 'CSS', { value: { supports }, configurable: true });
  if (px !== null) {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () => ({ fontSize: `${px}px` }) as unknown as CSSStyleDeclaration,
    );
  }
}

describe('dynamicType', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.removeProperty(DYNAMIC_TYPE_VAR);
  });

  it('is 1 where -apple-system-body is unsupported', () => {
    mockSystemBody(null);
    expect(measureDynamicTypeScale()).toBe(1);
  });

  it('is 1 at the iOS default body size and scales with the setting', () => {
    mockSystemBody(17);
    expect(measureDynamicTypeScale()).toBe(1);
    mockSystemBody(21);
    expect(measureDynamicTypeScale()).toBeCloseTo(1.24, 2);
  });

  it('clamps the accessibility extremes to a survivable range', () => {
    mockSystemBody(53);
    expect(measureDynamicTypeScale()).toBe(1.5);
    mockSystemBody(12);
    expect(measureDynamicTypeScale()).toBe(0.85);
  });

  it('publishes the scale as a root custom property and leaves no probe behind', () => {
    mockSystemBody(19);
    expect(applyDynamicType()).toBeCloseTo(1.12, 2);
    expect(document.documentElement.style.getPropertyValue(DYNAMIC_TYPE_VAR)).toBe('1.12');
    expect(document.querySelectorAll('span[aria-hidden]')).toHaveLength(0);
  });

  it('re-measures when the page returns to the foreground', () => {
    mockSystemBody(17);
    const stop = watchDynamicType();
    mockSystemBody(21);
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(document.documentElement.style.getPropertyValue(DYNAMIC_TYPE_VAR)).toBe('1.24');
    stop();
  });
});
