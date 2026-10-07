/**
 * Dynamic Type for the web.
 *
 * iOS lets people pick a system text size, and native apps follow it. Safari
 * exposes the same size through the `-apple-system-body` font keyword: an
 * element styled `font: -apple-system-body` gets the user's chosen body size
 * (17px at the default "Large" setting). Measuring that once and publishing
 * the ratio as `--kp-dyn-scale` lets the root font size, and therefore every
 * rem-based Tailwind size in the app, follow the phone's setting with no
 * in-app picker. Browsers without the keyword get a scale of 1.
 *
 * The scale is clamped: iOS accessibility sizes run past 3x, which no phone
 * layout survives, and the Large Text accessibility toggle is a separate
 * multiplier on top of this one (see utils/accessibility.ts).
 */

const DEFAULT_BODY_PX = 17;
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.5;

export const DYNAMIC_TYPE_VAR = '--kp-dyn-scale';

function supportsSystemBodyFont(): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('font', '-apple-system-body');
}

/** The user's text-size preference as a multiple of the default. 1 elsewhere. */
export function measureDynamicTypeScale(): number {
  if (typeof document === 'undefined' || !document.body || !supportsSystemBodyFont()) return 1;

  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.font = '-apple-system-body';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.textContent = 'A';
  document.body.appendChild(probe);
  const px = parseFloat(getComputedStyle(probe).fontSize);
  probe.remove();

  if (!Number.isFinite(px) || px <= 0) return 1;
  const scale = px / DEFAULT_BODY_PX;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(scale * 100) / 100));
}

/** Measure and publish the scale. Returns what was applied. */
export function applyDynamicType(): number {
  const scale = measureDynamicTypeScale();
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty(DYNAMIC_TYPE_VAR, String(scale));
  }
  return scale;
}

/**
 * Re-measure whenever the app comes back to the foreground, which is when a
 * changed Settings > Text Size would show up. Returns a cleanup.
 */
export function watchDynamicType(): () => void {
  if (typeof document === 'undefined') return () => {};
  const onVisibility = () => {
    if (document.visibilityState === 'visible') applyDynamicType();
  };
  document.addEventListener('visibilitychange', onVisibility);
  return () => document.removeEventListener('visibilitychange', onVisibility);
}
