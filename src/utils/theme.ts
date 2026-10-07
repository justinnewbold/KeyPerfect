/**
 * Theme and glass-material application.
 *
 * Themes are applied as a `theme-*` class on <html>. `system` is not a class
 * of its own: it resolves to `dark` or `light` from `prefers-color-scheme` and
 * re-resolves when the OS flips, so the app follows the iPhone's appearance
 * schedule the way a native app does.
 *
 * Glass intensity mirrors the iOS 27 Liquid Glass slider (clear to tinted).
 * It is a `data-glass` attribute on <html>; globals.css maps it to the CSS
 * variables every glass surface reads.
 */

export type ThemeId = 'system' | 'dark' | 'purple' | 'blue' | 'light';
export type ResolvedTheme = Exclude<ThemeId, 'system'>;
export type GlassIntensity = 'clear' | 'balanced' | 'tinted';

export const THEME_CLASSES: readonly string[] = ['theme-dark', 'theme-purple', 'theme-blue', 'theme-light'];

/**
 * Colour behind the status bar / browser chrome for each theme. Matches the
 * first stop of each theme's body gradient in globals.css.
 */
const THEME_COLORS: Record<ResolvedTheme, string> = {
  dark: '#0f0c29',
  purple: '#1a0533',
  blue: '#0c1929',
  light: '#f0f0f5',
};

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
}

export function resolveTheme(theme: ThemeId): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

function setThemeColorMeta(color: string): void {
  if (typeof document === 'undefined') return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}

/** Apply a theme now. Safe to call repeatedly. Returns the resolved theme. */
export function applyTheme(theme: ThemeId): ResolvedTheme {
  const resolved = resolveTheme(theme);
  if (typeof document === 'undefined') return resolved;
  const root = document.documentElement;
  root.classList.remove(...THEME_CLASSES);
  root.classList.add(`theme-${resolved}`);
  root.dataset.theme = theme;
  // `color-scheme` tells WebKit which palette to use for native controls,
  // scrollbars and the keyboard accessory, so a light theme does not get dark
  // form controls and vice versa.
  root.style.colorScheme = resolved === 'light' ? 'light' : 'dark';
  setThemeColorMeta(THEME_COLORS[resolved]);
  return resolved;
}

/**
 * Follow OS appearance changes while the theme is `system`. Returns a cleanup
 * that removes the listener. A no-op (returning a no-op) for explicit themes.
 */
export function watchSystemTheme(theme: ThemeId): () => void {
  if (theme !== 'system') return () => {};
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const mql = window.matchMedia(DARK_SCHEME_QUERY);
  const onChange = () => applyTheme('system');
  // Safari < 14 only has addListener; everything current has addEventListener.
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }
  mql.addListener(onChange);
  return () => mql.removeListener(onChange);
}

export function applyGlassIntensity(level: GlassIntensity): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.glass = level;
}
