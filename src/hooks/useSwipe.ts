import { useEffect, useRef } from 'react';
import {
  SWIPE_DEFAULTS,
  SwipeAxis,
  SwipeDirection,
  SwipeThresholds,
  isGestureExempt,
  isWithinEdge,
  lockAxis,
  resolveSwipe,
} from '../utils/gestures';
import { haptics } from '../utils/haptics';

export interface SwipeOptions {
  onSwipe?: (direction: SwipeDirection) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  /** Restrict recognition to one axis. Default 'both'. */
  axis?: SwipeAxis;
  /** Default true. When false, listeners are torn down entirely. */
  enabled?: boolean;
  /**
   * Default ['touch', 'pen']. Mouse is excluded so that a desktop click-drag
   * over text never navigates.
   */
  allowedPointerTypes?: readonly string[];
  /**
   * Require a horizontal swipe to begin near a screen edge. This is what keeps
   * tab navigation from competing with the app's horizontal scroll strips and
   * the piano keyboard: the gesture is unavailable everywhere they live.
   */
  edgeOnly?: boolean;
  /** Per-consumer veto evaluated at pointerdown, e.g. "only when scrolled to top". */
  shouldStart?: (e: PointerEvent) => boolean;
  /** Fire a light haptic tick on a recognised swipe. Default true. */
  haptic?: boolean;
  thresholds?: Partial<SwipeThresholds>;
}

type Phase = 'idle' | 'tracking' | 'locked-x' | 'locked-y' | 'aborted';

/**
 * Swipe recognition over Pointer Events.
 *
 * Every listener is passive and this hook never calls preventDefault, so
 * native scrolling, momentum and pinch-zoom are untouched: recognition is
 * entirely after the fact. It also never captures the pointer, which would
 * steal move events from whatever is scrolling underneath.
 */
export function useSwipe<T extends HTMLElement>(options: SwipeOptions) {
  const ref = useRef<T | null>(null);

  // Callbacks live in a ref so that a caller passing fresh arrow functions on
  // every render doesn't tear down and re-add listeners each time.
  const optsRef = useRef(options);
  optsRef.current = options;

  const { enabled = true, axis = 'both' } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const thresholds: SwipeThresholds = { ...SWIPE_DEFAULTS, ...optsRef.current.thresholds };

    let phase: Phase = 'idle';
    let pointerId = -1;
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const reset = () => {
      phase = 'idle';
      pointerId = -1;
    };

    const onPointerDown = (e: PointerEvent) => {
      // A second finger means a pinch or a two-finger pan; abandon rather than
      // interpreting one of the two paths as a swipe.
      if (phase !== 'idle') {
        phase = 'aborted';
        return;
      }

      const o = optsRef.current;
      const allowed = o.allowedPointerTypes ?? ['touch', 'pen'];
      if (!e.isPrimary) return;
      if (!allowed.includes(e.pointerType)) return;
      if (isGestureExempt(e.target, el)) return;
      if (o.shouldStart && o.shouldStart(e) === false) return;
      if (
        o.edgeOnly &&
        !isWithinEdge(e.clientX, window.innerWidth, thresholds.edgeSize)
      ) {
        return;
      }

      phase = 'tracking';
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startTime = e.timeStamp || Date.now();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (phase !== 'tracking' || e.pointerId !== pointerId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.hypot(dx, dy) < thresholds.lockOffset) return;

      const lock = lockAxis(dx, dy, thresholds);
      if (lock === null) {
        phase = 'aborted';
        return;
      }
      // Lock onto the wrong axis and the gesture is someone else's.
      if (lock === 'x' && axis === 'vertical') {
        phase = 'aborted';
        return;
      }
      if (lock === 'y' && axis === 'horizontal') {
        phase = 'aborted';
        return;
      }
      phase = lock === 'x' ? 'locked-x' : 'locked-y';
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const settled = phase === 'locked-x' || phase === 'locked-y';
      if (!settled) {
        reset();
        return;
      }

      const direction = resolveSwipe(
        {
          dx: e.clientX - startX,
          dy: e.clientY - startY,
          dt: (e.timeStamp || Date.now()) - startTime,
        },
        axis,
        thresholds,
      );
      reset();
      if (!direction) return;

      const o = optsRef.current;
      if (o.haptic !== false) haptics.light();
      o.onSwipe?.(direction);
      if (direction === 'left') o.onSwipeLeft?.();
      else if (direction === 'right') o.onSwipeRight?.();
      else if (direction === 'up') o.onSwipeUp?.();
      else o.onSwipeDown?.();
    };

    const onCancel = () => reset();

    const passive = { passive: true } as const;
    el.addEventListener('pointerdown', onPointerDown, passive);
    el.addEventListener('pointermove', onPointerMove, passive);
    el.addEventListener('pointerup', onPointerUp, passive);
    el.addEventListener('pointercancel', onCancel, passive);
    el.addEventListener('lostpointercapture', onCancel, passive);
    document.addEventListener('visibilitychange', onCancel, passive);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onCancel);
      el.removeEventListener('lostpointercapture', onCancel);
      document.removeEventListener('visibilitychange', onCancel);
    };
  }, [enabled, axis]);

  return { ref };
}
