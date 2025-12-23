import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                       event.code.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Pre-defined keyboard shortcuts for game screen
export function useGameKeyboardShortcuts(
  options: {
    onSelectOption?: (index: number) => void;
    onReplay?: () => void;
    onNext?: () => void;
    onExit?: () => void;
    hasResult?: boolean;
    enabled?: boolean;
  }
) {
  const { onSelectOption, onReplay, onNext, onExit, hasResult, enabled = true } = options;

  const shortcuts: KeyboardShortcut[] = [];

  // Number keys 1-4 for options
  if (onSelectOption && !hasResult) {
    for (let i = 1; i <= 4; i++) {
      shortcuts.push({
        key: i.toString(),
        action: () => onSelectOption(i - 1),
        description: `Select option ${i}`,
      });
    }
  }

  // R to replay audio
  if (onReplay) {
    shortcuts.push({
      key: 'r',
      action: onReplay,
      description: 'Replay audio',
    });
  }

  // Space or Enter to continue
  if (onNext && hasResult) {
    shortcuts.push({
      key: ' ',
      action: onNext,
      description: 'Next question',
    });
    shortcuts.push({
      key: 'Enter',
      action: onNext,
      description: 'Next question',
    });
  }

  // Escape to exit
  if (onExit) {
    shortcuts.push({
      key: 'Escape',
      action: onExit,
      description: 'Exit game',
    });
  }

  useKeyboardShortcuts(shortcuts, enabled);

  return shortcuts;
}

// Get keyboard shortcut hint text
export function getShortcutHint(key: string, ctrl?: boolean, shift?: boolean, alt?: boolean): string {
  const parts: string[] = [];
  if (ctrl) parts.push('Ctrl');
  if (shift) parts.push('Shift');
  if (alt) parts.push('Alt');
  parts.push(key.toUpperCase());
  return parts.join('+');
}
