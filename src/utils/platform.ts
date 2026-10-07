/**
 * Platform sniffing, kept in one place. Feature detection is preferred
 * everywhere it exists; these are for the handful of iOS behaviours that have
 * no feature to detect (the ringer switch, the missing install prompt, the
 * switch-input haptic).
 */

export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  // iPadOS reports itself as a Mac; the touch check tells them apart.
  return /Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document;
}

/** Running as an installed Home Screen app rather than in a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * Safari proper on an iPhone or iPad: the only place "Add to Home Screen"
 * installs a web app with push, badging and the switch haptic. Chrome and
 * Firefox on iOS use WebKit too but identify themselves (CriOS, FxiOS), and
 * their installs lack those capabilities.
 */
export function isIOSSafari(): boolean {
  if (!isApplePlatform()) return false;
  const ua = navigator.userAgent || '';
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}
