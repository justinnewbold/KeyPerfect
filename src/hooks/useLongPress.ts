import { useCallback, useEffect, useRef, useState } from 'react';
import { haptics } from '../utils/haptics';

export interface LongPressOptions {
  onLongPress: (e: PointerEvent) => void;
  onCancel?: () => void;
  /** Hold duration in ms. Default 500. */
  delay?: number;
  /** Movement that cancels the press, in px. Default 10. */
  moveTolerance?: number;
  /** Fire a medium haptic when the press registers. Default true. */
  haptic?: boolean;
  enabled?: boolean;
}

/**
 * Press-and-hold recognition.
 *
 * Cancelling on movement is what keeps this from competing with scrolling: a
 * scroll always travels well past the tolerance long before the delay
 * elapses, so a scroll can never register as a long press.
 *
 * Note the element also needs the `no-callout` class. Suppressing iOS's
 * selection callout has to be done in CSS -- calling preventDefault on
 * touchstart would work but would also kill scrolling from that element.
 */
export function useLongPress<T extends HTMLElement>(options: LongPressOptions) {
  const ref = useRef<T | null>(null);
  const optsRef = useRef(options);
  optsRef.current = options;

  const [isPressing, setIsPressing] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const pointerIdRef = useRef(-1);
  // Set when a press fires, so the click that follows the release can be
  // swallowed. Without this, long-pressing an answer would both preview it and
  // submit it.
  const firedRef = useRef(false);

  const { enabled = true } = options;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancel = useCallback(
    (notify: boolean) => {
      const wasPending = timerRef.current !== null;
      clearTimer();
      pointerIdRef.current = -1;
      setIsPressing(false);
      if (wasPending && notify) optsRef.current.onCancel?.();
    },
    [clearTimer],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary) {
        cancel(true);
        return;
      }
      firedRef.current = false;
      pointerIdRef.current = e.pointerId;
      originRef.current = { x: e.clientX, y: e.clientY };
      setIsPressing(true);

      const o = optsRef.current;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        firedRef.current = true;
        setIsPressing(false);
        if (o.haptic !== false) haptics.medium();
        o.onLongPress(e);
      }, o.delay ?? 500);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerIdRef.current || timerRef.current === null) return;
      const tolerance = optsRef.current.moveTolerance ?? 10;
      const dx = e.clientX - originRef.current.x;
      const dy = e.clientY - originRef.current.y;
      if (Math.hypot(dx, dy) > tolerance) cancel(true);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerIdRef.current) return;
      cancel(true);
    };

    const onCancelEvent = () => cancel(true);

    // Android raises its own context menu on long press; the browser's menu
    // and ours would both appear.
    const onContextMenu = (e: Event) => {
      if (pointerIdRef.current !== -1 || firedRef.current) e.preventDefault();
    };

    // Capture phase so this runs before the element's own onClick.
    const onClickCapture = (e: MouseEvent) => {
      if (!firedRef.current) return;
      firedRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    };

    const passive = { passive: true } as const;
    el.addEventListener('pointerdown', onPointerDown, passive);
    el.addEventListener('pointermove', onPointerMove, passive);
    el.addEventListener('pointerup', onPointerUp, passive);
    el.addEventListener('pointercancel', onCancelEvent, passive);
    el.addEventListener('pointerleave', onCancelEvent, passive);
    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('click', onClickCapture, true);
    // A scroll that somehow stayed under the move tolerance still isn't a press.
    window.addEventListener('scroll', onCancelEvent, { capture: true, passive: true });
    window.addEventListener('blur', onCancelEvent, passive);

    return () => {
      clearTimer();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onCancelEvent);
      el.removeEventListener('pointerleave', onCancelEvent);
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('scroll', onCancelEvent, { capture: true });
      window.removeEventListener('blur', onCancelEvent);
    };
  }, [enabled, cancel, clearTimer]);

  return { ref, isPressing };
}
