import { useState, useEffect, useCallback, createContext, useContext } from 'react';

// Accessibility settings interface
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderAnnouncements: boolean;
  keyboardNavigation: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReaderAnnouncements: true,
  keyboardNavigation: true,
  colorBlindMode: 'none',
};

const STORAGE_KEY = 'keyperfect_accessibility';

// Load settings from storage
export function loadAccessibilitySettings(): AccessibilitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading accessibility settings:', e);
  }
  return defaultSettings;
}

// Save settings to storage
export function saveAccessibilitySettings(settings: AccessibilitySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving accessibility settings:', e);
  }
}

// Apply settings to document
export function applyAccessibilitySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;

  // High contrast mode
  if (settings.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  // Large text
  if (settings.largeText) {
    root.classList.add('large-text');
  } else {
    root.classList.remove('large-text');
  }

  // Reduced motion
  if (settings.reducedMotion) {
    root.classList.add('reduced-motion');
  } else {
    root.classList.remove('reduced-motion');
  }

  // Color blind mode
  root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
  if (settings.colorBlindMode !== 'none') {
    root.classList.add(settings.colorBlindMode);
  }
}

// Screen reader announcement helper
let announcer: HTMLDivElement | null = null;

export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
  }

  announcer.setAttribute('aria-live', priority);

  // Clear and set message (needed for repeated announcements)
  announcer.textContent = '';
  setTimeout(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  }, 100);
}

// Announce game events
export function announceGameEvent(
  event: 'correct' | 'incorrect' | 'levelUp' | 'achievement' | 'gameOver',
  details?: string
) {
  const messages: Record<string, string> = {
    correct: details ? `Correct! ${details}` : 'Correct answer!',
    incorrect: details ? `Incorrect. ${details}` : 'Incorrect. Try again.',
    levelUp: details ? `Level up! ${details}` : 'Congratulations, you leveled up!',
    achievement: details ? `Achievement unlocked: ${details}` : 'Achievement unlocked!',
    gameOver: details ? `Game over. ${details}` : 'Game over.',
  };

  announce(messages[event] || event, event === 'incorrect' ? 'assertive' : 'polite');
}

// Focus management helpers
export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

// Skip to main content link
export function setupSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #6366f1;
    color: white;
    padding: 8px 16px;
    z-index: 100;
    transition: top 0.2s;
    border-radius: 0 0 8px 0;
  `;

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  document.body.insertBefore(skipLink, document.body.firstChild);
}

// React hook for accessibility settings
export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadAccessibilitySettings);

  useEffect(() => {
    // Check for system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;

    if (prefersReducedMotion && !settings.reducedMotion) {
      updateSetting('reducedMotion', true);
    }

    if (prefersHighContrast && !settings.highContrast) {
      updateSetting('highContrast', true);
    }
  }, []);

  useEffect(() => {
    applyAccessibilitySettings(settings);
    saveAccessibilitySettings(settings);
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
    announce,
    announceGameEvent,
  };
}

// Inject accessibility CSS into the document once
export function injectAccessibilityStyles() {
  if (!document.getElementById('keyperfect-a11y-styles')) {
    const style = document.createElement('style');
    style.id = 'keyperfect-a11y-styles';
    style.textContent = accessibilityStyles;
    document.head.appendChild(style);
  }

  // The .protanopia / .deuteranopia / .tritanopia classes resolve to
  // filter: url('#<name>-filter'), but those SVG filters were never
  // defined - so toggling color-blind mode added the class and did
  // nothing visible. Inject the matching <filter> elements once so the
  // CSS actually has something to point at. Matrices are the standard
  // dichromacy simulation values from the LMS-space transforms.
  if (!document.getElementById('keyperfect-a11y-filters')) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.id = 'keyperfect-a11y-filters';
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.cssText =
      'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';

    const matrices: Record<string, string> = {
      'protanopia-filter':
        '0.567 0.433 0     0 0 ' +
        '0.558 0.442 0     0 0 ' +
        '0     0.242 0.758 0 0 ' +
        '0     0     0     1 0',
      'deuteranopia-filter':
        '0.625 0.375 0   0 0 ' +
        '0.7   0.3   0   0 0 ' +
        '0     0.3   0.7 0 0 ' +
        '0     0     0   1 0',
      'tritanopia-filter':
        '0.95 0.05  0     0 0 ' +
        '0    0.433 0.567 0 0 ' +
        '0    0.475 0.525 0 0 ' +
        '0    0     0     1 0',
    };

    const defs = document.createElementNS(svgNS, 'defs');
    for (const [id, values] of Object.entries(matrices)) {
      const filter = document.createElementNS(svgNS, 'filter');
      filter.setAttribute('id', id);
      const matrix = document.createElementNS(svgNS, 'feColorMatrix');
      matrix.setAttribute('type', 'matrix');
      matrix.setAttribute('values', values);
      filter.appendChild(matrix);
      defs.appendChild(filter);
    }
    svg.appendChild(defs);
    document.body.appendChild(svg);
  }
}

// CSS to inject for accessibility modes
export const accessibilityStyles = `
  /* High Contrast Mode */
  .high-contrast {
    --bg-primary: #000000;
    --bg-secondary: #1a1a1a;
    --text-primary: #ffffff;
    --text-secondary: #e0e0e0;
    --accent-color: #00ff00;
    --border-color: #ffffff;
  }

  .high-contrast * {
    border-color: currentColor !important;
  }

  .high-contrast button,
  .high-contrast a {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  /* Large Text Mode */
  .large-text {
    font-size: 120%;
  }

  .large-text h1 { font-size: 2.5rem; }
  .large-text h2 { font-size: 2rem; }
  .large-text h3 { font-size: 1.5rem; }
  .large-text p, .large-text span { font-size: 1.2rem; }

  /* Reduced Motion */
  .reduced-motion *,
  .reduced-motion *::before,
  .reduced-motion *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Color Blind Modes */
  .protanopia {
    filter: url('#protanopia-filter');
  }

  .deuteranopia {
    filter: url('#deuteranopia-filter');
  }

  .tritanopia {
    filter: url('#tritanopia-filter');
  }

  /* Screen reader only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;
