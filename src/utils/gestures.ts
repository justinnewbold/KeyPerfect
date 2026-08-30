// Pure gesture logic, deliberately free of React and of any DOM measurement
// that jsdom cannot provide, so the parts that are easy to get subtly wrong
// (axis locking, the swipe threshold, the opt-out walk) are directly testable.

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
export type SwipeAxis = 'horizontal' | 'vertical' | 'both';

export interface SwipeThresholds {
  /** Travel along the locked axis needed for a deliberate swipe, in px. */
  distance: number;
  /** px/ms at which a shorter flick still counts. */
  velocity: number;
  /** Dominant axis must beat the other by this factor, or the gesture aborts. */
  axisRatio: number;
  /** Travel before the axis is decided, in px. */
  lockOffset: number;
  /** Beyond this the pointer was dragging or scrolling, not swiping, in ms. */
  maxDuration: number;
  /** Width of the screen-edge band for edge-only swipes, in px. */
  edgeSize: number;
}

export const SWIPE_DEFAULTS: SwipeThresholds = {
  distance: 60,
  velocity: 0.35,
  axisRatio: 1.5,
  lockOffset: 12,
  maxDuration: 800,
  edgeSize: 20,
};

export interface SwipeSample {
  dx: number;
  dy: number;
  /** Elapsed time in ms. */
  dt: number;
}

/**
 * Decide the gesture's axis once, after it has travelled far enough to be
 * meaningful. Returning null aborts: an ambiguous diagonal should not be
 * resolved arbitrarily, because guessing wrong steals the gesture from a
 * scroll container. The caller locks this in and never re-evaluates, so a
 * gesture that starts as a scroll can't turn into a swipe halfway through.
 */
export function lockAxis(
  dx: number,
  dy: number,
  thresholds: SwipeThresholds = SWIPE_DEFAULTS,
): 'x' | 'y' | null {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax > ay * thresholds.axisRatio) return 'x';
  if (ay > ax * thresholds.axisRatio) return 'y';
  return null;
}

/**
 * Classify a completed pointer movement. Returns null when it is not a swipe,
 * or is not a swipe on the axis the caller asked for.
 */
export function resolveSwipe(
  sample: SwipeSample,
  axis: SwipeAxis = 'both',
  thresholds: SwipeThresholds = SWIPE_DEFAULTS,
): SwipeDirection | null {
  const { dx, dy, dt } = sample;

  // A slow drag is someone repositioning their finger, not flicking.
  if (dt > thresholds.maxDuration) return null;
  if (dt <= 0) return null;

  const lock = lockAxis(dx, dy, thresholds);
  if (lock === null) return null;
  if (lock === 'x' && axis === 'vertical') return null;
  if (lock === 'y' && axis === 'horizontal') return null;

  const primary = lock === 'x' ? dx : dy;
  const secondary = lock === 'x' ? dy : dx;
  const distance = Math.abs(primary);

  // Wandering perpendicular to the locked axis means the finger was tracing a
  // curve rather than swiping.
  if (Math.abs(secondary) > distance / 2) return null;

  const farEnough = distance >= thresholds.distance;
  const fastEnough =
    distance >= thresholds.distance / 2 && distance / dt >= thresholds.velocity;
  if (!farEnough && !fastEnough) return null;

  if (lock === 'x') return primary < 0 ? 'left' : 'right';
  return primary < 0 ? 'up' : 'down';
}

/** True when x sits within `edgeSize` of either edge of a `width`-wide viewport. */
export function isWithinEdge(
  x: number,
  width: number,
  edgeSize: number = SWIPE_DEFAULTS.edgeSize,
): boolean {
  return x <= edgeSize || x >= width - edgeSize;
}

/**
 * Elements a swipe must never be taken from. Matching on Tailwind's own class
 * names is deliberate: `overflow-x-auto` is literally present in the DOM on
 * all seven horizontal tab strips, so they are covered without editing a
 * single component. `[data-no-swipe]` is the explicit escape hatch for
 * anything new, such as the piano's scroller.
 */
const EXEMPT_SELECTOR = [
  '[data-no-swipe]',
  'input',
  'textarea',
  'select',
  'option',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[role="slider"]',
  '.overflow-x-auto',
  '.overflow-x-scroll',
  '.range-slider',
].join(',');

/**
 * Two layers, because neither alone is enough.
 *
 * Layer 1 is a selector match: cheap, explicit, and the only layer that works
 * under jsdom (which has no layout, so every scrollWidth is 0).
 *
 * Layer 2 walks ancestors looking for a container that is *actually* scrolling
 * horizontally, or that has claimed touch handling via `touch-action`. That
 * catches custom drag surfaces without them needing to know this module
 * exists, and avoids blocking swipes over a strip that happens not to overflow.
 */
export function isGestureExempt(target: EventTarget | null, root?: Element | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest(EXEMPT_SELECTOR)) return true;

  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return false;
  }

  let el: Element | null = target;
  while (el && el !== root) {
    const style = window.getComputedStyle(el);
    const overflowX = style.overflowX;
    if (
      (overflowX === 'auto' || overflowX === 'scroll') &&
      el.scrollWidth > el.clientWidth + 1
    ) {
      return true;
    }
    const touchAction = style.touchAction;
    if (touchAction === 'none' || touchAction === 'pan-x') return true;
    el = el.parentElement;
  }

  return false;
}
