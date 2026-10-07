import React, { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';
import { isIOSSafari, isStandalone } from '../utils/platform';
import { NAV_HEIGHT_PX } from './Navigation';

const DISMISSED_KEY = 'keyperfect_install_hint_dismissed';
const OPENS_KEY = 'keyperfect_install_hint_opens';
/** Visits before the hint appears: a first-time visitor is still deciding. */
const OPENS_BEFORE_HINT = 3;

function readInt(key: string): number {
  try {
    return parseInt(localStorage.getItem(key) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Decide once per page load whether to show the hint; also bumps the visit
 * counter. Exported for tests.
 */
export function shouldShowInstallHint(): boolean {
  if (!isIOSSafari() || isStandalone()) return false;
  try {
    if (localStorage.getItem(DISMISSED_KEY)) return false;
    const opens = readInt(OPENS_KEY) + 1;
    localStorage.setItem(OPENS_KEY, String(opens));
    return opens >= OPENS_BEFORE_HINT;
  } catch {
    return false;
  }
}

/**
 * iOS has no install prompt, so nobody discovers Add to Home Screen on their
 * own, and the installed app is where the icon, haptics, badge, push and
 * full-screen layout all live. Shown once a returning visitor has opened the
 * site a few times in Safari, never when already installed, and never again
 * after it is dismissed.
 */
export function InstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowInstallHint());
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div
      className="fixed left-3 right-3 z-[80] pointer-events-none"
      // Rendered outside the App root, so `--kp-nav-h` is not in scope here;
      // sit above where the floating tab bar is when it is shown.
      style={{ bottom: `calc(env(safe-area-inset-bottom) + ${NAV_HEIGHT_PX}px + 8px)` }}
      role="status"
      aria-live="polite"
      data-testid="install-hint"
    >
      <div className="glass pointer-events-auto mx-auto flex max-w-lg items-start gap-3 rounded-2xl px-4 py-3">
        <Share className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Add KeyPerfect to your Home Screen</p>
          <p className="text-xs text-white/70">
            Tap the Share button, then <span className="font-medium text-white/90">Add to Home Screen</span>. You get a
            full-screen app with haptics and offline practice.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install hint"
          className="tap-target -mr-2 -mt-1 rounded-lg text-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
