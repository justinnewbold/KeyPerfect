/**
 * Home Screen icon badge: the number of spaced-repetition items due for
 * review. Installed web apps on iOS 16.4+ and Android support the Badging
 * API; anywhere else this is a no-op. Native apps use the same number on
 * their icon, so the port keeps the behaviour.
 */
import { getDueItems } from './spacedRepetition';

type BadgingNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

export function isBadgingSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof (navigator as BadgingNavigator).setAppBadge === 'function';
}

/** Count of items due now across every review type. */
export function getDueReviewCount(): number {
  try {
    return getDueItems(undefined, 999).length;
  } catch {
    return 0;
  }
}

/** Push the current due count to the app icon. Resolves to what was shown. */
export async function syncAppBadge(count: number = getDueReviewCount()): Promise<number> {
  if (!isBadgingSupported()) return 0;
  const nav = navigator as BadgingNavigator;
  try {
    if (count > 0) {
      await nav.setAppBadge!(count);
    } else if (nav.clearAppBadge) {
      await nav.clearAppBadge();
    } else {
      await nav.setAppBadge!(0);
    }
  } catch {
    // Badging can be refused (not installed, permission); nothing to show.
  }
  return count;
}
