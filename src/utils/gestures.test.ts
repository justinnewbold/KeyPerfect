import { describe, it, expect } from 'vitest';
import {
  SWIPE_DEFAULTS,
  isGestureExempt,
  isWithinEdge,
  lockAxis,
  resolveSwipe,
} from './gestures';

describe('lockAxis', () => {
  it('locks to x when horizontal travel clearly dominates', () => {
    expect(lockAxis(100, 10)).toBe('x');
  });

  it('locks to y when vertical travel clearly dominates', () => {
    expect(lockAxis(10, 100)).toBe('y');
  });

  it('refuses to guess on an ambiguous diagonal', () => {
    // Resolving a 45-degree drag either way steals the gesture from whatever
    // is scrolling underneath, so the gesture is abandoned instead.
    expect(lockAxis(50, 50)).toBeNull();
    expect(lockAxis(50, 40)).toBeNull();
  });
});

describe('resolveSwipe', () => {
  it('recognises a deliberate horizontal swipe', () => {
    expect(resolveSwipe({ dx: -80, dy: 5, dt: 200 }, 'horizontal')).toBe('left');
    expect(resolveSwipe({ dx: 80, dy: 5, dt: 200 }, 'horizontal')).toBe('right');
  });

  it('recognises a vertical swipe', () => {
    expect(resolveSwipe({ dx: 5, dy: 80, dt: 200 }, 'vertical')).toBe('down');
    expect(resolveSwipe({ dx: 5, dy: -80, dt: 200 }, 'vertical')).toBe('up');
  });

  it('rejects travel that is too short to be deliberate', () => {
    expect(resolveSwipe({ dx: 30, dy: 2, dt: 200 }, 'horizontal')).toBeNull();
  });

  it('accepts a short but fast flick', () => {
    // Half the distance threshold, but well over the velocity threshold.
    expect(resolveSwipe({ dx: 35, dy: 2, dt: 60 }, 'horizontal')).toBe('right');
  });

  it('rejects a slow drag past maxDuration', () => {
    expect(resolveSwipe({ dx: 200, dy: 2, dt: 1200 }, 'horizontal')).toBeNull();
  });

  it('rejects a curved gesture that wanders off the locked axis', () => {
    // dx dominates enough to lock to x, but dy exceeds dx/2.
    expect(resolveSwipe({ dx: 100, dy: 60, dt: 200 }, 'horizontal')).toBeNull();
  });

  it('rejects a swipe on an axis the caller did not ask for', () => {
    expect(resolveSwipe({ dx: 5, dy: 80, dt: 200 }, 'horizontal')).toBeNull();
    expect(resolveSwipe({ dx: 80, dy: 5, dt: 200 }, 'vertical')).toBeNull();
  });

  it('accepts either axis when unconstrained', () => {
    expect(resolveSwipe({ dx: 80, dy: 5, dt: 200 }, 'both')).toBe('right');
    expect(resolveSwipe({ dx: 5, dy: 80, dt: 200 }, 'both')).toBe('down');
  });

  it('rejects a zero-duration sample rather than dividing by zero', () => {
    expect(resolveSwipe({ dx: 200, dy: 0, dt: 0 }, 'horizontal')).toBeNull();
  });
});

describe('isWithinEdge', () => {
  it('accepts starts near either edge', () => {
    expect(isWithinEdge(5, 400, 20)).toBe(true);
    expect(isWithinEdge(395, 400, 20)).toBe(true);
  });

  it('rejects a start in the middle of the screen', () => {
    expect(isWithinEdge(200, 400, 20)).toBe(false);
  });

  it('defaults to the shared edge width', () => {
    expect(isWithinEdge(SWIPE_DEFAULTS.edgeSize - 1, 400)).toBe(true);
    expect(isWithinEdge(SWIPE_DEFAULTS.edgeSize + 1, 400)).toBe(false);
  });
});

describe('isGestureExempt', () => {
  function mount(html: string): HTMLElement {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);
    return host;
  }

  it('exempts anything inside a horizontal scroll strip', () => {
    // This is the regression guard for the app's seven tab strips: they are
    // matched by their Tailwind class alone, with no component changes.
    const host = mount('<div class="flex overflow-x-auto"><button id="t">Tab</button></div>');
    expect(isGestureExempt(host.querySelector('#t'))).toBe(true);
  });

  it('exempts range inputs so slider drags are never stolen', () => {
    const host = mount('<input id="t" type="range" class="range-slider" />');
    expect(isGestureExempt(host.querySelector('#t'))).toBe(true);
  });

  it('honours an explicit data-no-swipe opt-out', () => {
    const host = mount('<div data-no-swipe><span id="t">keys</span></div>');
    expect(isGestureExempt(host.querySelector('#t'))).toBe(true);
  });

  it('exempts text entry so typing gestures are never stolen', () => {
    const host = mount('<textarea id="t"></textarea>');
    expect(isGestureExempt(host.querySelector('#t'))).toBe(true);
  });

  it('does not exempt ordinary content', () => {
    const host = mount('<div><p id="t">plain</p></div>');
    expect(isGestureExempt(host.querySelector('#t'))).toBe(false);
  });

  it('returns false for a non-element target', () => {
    expect(isGestureExempt(null)).toBe(false);
  });
});
