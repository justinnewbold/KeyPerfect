/**
 * Screen Wake Lock, for the modes that keep the microphone open.
 *
 * Singing an interval or tuning a guitar means not touching the screen for a
 * while, and iOS dims and then locks an idle screen, which also ends the mic
 * session. Home Screen web apps have had the Wake Lock API since iOS 18.4.
 *
 * The lock is released by the OS whenever the page is hidden, so the holder
 * re-acquires it when the page comes back; `release()` stops that too.
 */

type WakeLockSentinelLike = { release: () => Promise<void>; released?: boolean };

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

/** Hold a screen wake lock until the returned function is called. */
export function acquireWakeLock(): () => void {
  if (!isWakeLockSupported()) return () => {};

  let sentinel: WakeLockSentinelLike | null = null;
  let active = true;

  const request = async () => {
    if (!active || typeof document === 'undefined' || document.visibilityState !== 'visible') return;
    try {
      const wakeLock = (navigator as Navigator & { wakeLock: { request: (t: 'screen') => Promise<WakeLockSentinelLike> } }).wakeLock;
      const s = await wakeLock.request('screen');
      // The holder may have released while the request was in flight.
      if (!active) {
        void s.release();
        return;
      }
      sentinel = s;
    } catch {
      // Denied (low battery, permissions policy). Nothing to do; the screen
      // will dim as it always did.
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') void request();
  };

  document.addEventListener('visibilitychange', onVisibility);
  void request();

  return () => {
    active = false;
    document.removeEventListener('visibilitychange', onVisibility);
    const s = sentinel;
    sentinel = null;
    if (s && !s.released) void s.release().catch(() => {});
  };
}
