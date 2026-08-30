import { useEffect } from 'react';

/**
 * Freeze background scrolling while an overlay is open.
 *
 * Deliberately just `overflow: hidden` rather than the `position: fixed` +
 * negative-offset trick: that variant is a well-known source of lost scroll
 * position and focus jumps, and the overlays here pair this with
 * `overscroll-contain` on their own scroll area, which is enough.
 *
 * The previous value is restored rather than cleared, so nesting two locked
 * overlays doesn't leave the page unscrollable when the inner one closes.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
