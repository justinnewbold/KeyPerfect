import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function readPreference(): boolean {
  if (typeof document === 'undefined') return false;
  // The app's own setting wins whether or not the OS asks for reduced motion;
  // accessibility.ts puts this class on <html>.
  if (document.documentElement.classList.contains('reduced-motion')) return true;
  // jsdom has no matchMedia, and neither do very old browsers.
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY).matches
    : false;
}

/**
 * True when animation should be suppressed, following both the OS preference
 * and the app's in-app accessibility toggle. Watches the `<html>` class so
 * flipping that toggle takes effect without a reload.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readPreference);

  useEffect(() => {
    const update = () => setReduced(readPreference());

    const media =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(QUERY)
        : null;
    media?.addEventListener('change', update);

    const observer =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(update)
        : null;
    observer?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    update();

    return () => {
      media?.removeEventListener('change', update);
      observer?.disconnect();
    };
  }, []);

  return reduced;
}
