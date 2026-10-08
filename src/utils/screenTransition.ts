/**
 * iOS-style navigation transitions on the View Transitions API.
 *
 * Drilling into a screen pushes the new one in from the right while the old
 * one slides a little way left and dims, and going back reverses it, the way
 * a UINavigationController does. Tab switches are left to the existing CSS
 * fade, because a view transition snapshots the tab bar and would hide its
 * sliding selection highlight.
 *
 * Browsers without `document.startViewTransition`, and anyone with reduced
 * motion on, get the plain state update.
 */
import { flushSync } from 'react-dom';

export type ScreenTransitionKind = 'push' | 'pop' | 'none';

/** Screens at the root of a tab: moving between two of them is a tab switch. */
const ROOT_SCREENS = new Set(['home', 'levelSelect', 'learn', 'tools', 'stats']);

/**
 * How a move from one screen to another should animate, absent an explicit
 * direction. Root to root is a tab switch; arriving at a root from anywhere
 * else is going back; everything else is drilling in.
 */
export function classifyScreenChange(from: string, to: string): ScreenTransitionKind {
  if (from === to) return 'none';
  const fromRoot = ROOT_SCREENS.has(from);
  const toRoot = ROOT_SCREENS.has(to);
  if (fromRoot && toRoot) return 'none';
  if (toRoot) return 'pop';
  return 'push';
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

export function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && typeof (document as ViewTransitionDocument).startViewTransition === 'function';
}

/**
 * Apply `update` inside a view transition of the given kind. Returns true
 * when a view transition ran, so the caller can skip its own CSS entrance
 * animation for this navigation.
 */
export function runScreenTransition(
  kind: ScreenTransitionKind,
  update: () => void,
  reducedMotion: boolean,
): boolean {
  const doc = document as ViewTransitionDocument;
  if (kind === 'none' || reducedMotion || !supportsViewTransitions()) {
    update();
    return false;
  }
  const root = document.documentElement;
  root.dataset.vt = kind;
  try {
    // The DOM must be updated synchronously inside the callback, or the
    // browser snapshots the old screen twice.
    const transition = doc.startViewTransition!(() => flushSync(update));
    transition.finished
      .catch(() => {
        /* skipped or aborted: the state update has already been applied */
      })
      .finally(() => {
        if (root.dataset.vt === kind) delete root.dataset.vt;
      });
    return true;
  } catch {
    delete root.dataset.vt;
    update();
    return false;
  }
}
