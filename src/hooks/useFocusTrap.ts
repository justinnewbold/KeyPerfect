import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface FocusTrapOptions {
  enabled?: boolean;
  /** Called on Escape. Omit to leave Escape to the caller. */
  onEscape?: () => void;
}

/**
 * Keeps Tab inside a modal surface and hands focus back to whatever opened it.
 *
 * Without this, Tab walks straight out of a dialog into the page behind it —
 * which for a full-screen sheet means focus lands on controls the user cannot
 * see and cannot get back from without a mouse.
 */
export function useFocusTrap<T extends HTMLElement>({ enabled = true, onEscape }: FocusTrapOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus the panel itself rather than its first control: landing on
    // "close" is a good way to dismiss a dialog by accident.
    if (!node.contains(document.activeElement)) {
      node.focus({ preventScroll: true });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
      );
      if (focusable.length === 0) {
        e.preventDefault();
        node.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (active === first || active === node || !node.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', handleKeyDown);
    return () => {
      node.removeEventListener('keydown', handleKeyDown);
      // Only restore if focus is still somewhere inside the closing dialog;
      // otherwise the user has already moved on and we'd yank them back.
      if (previouslyFocused?.isConnected && (!document.activeElement || node.contains(document.activeElement))) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [enabled, onEscape]);

  return ref;
}
