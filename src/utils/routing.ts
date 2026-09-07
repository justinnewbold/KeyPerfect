/**
 * Hash routing for the screens a URL can meaningfully name.
 *
 * Hash rather than path: the app is served as a single static `index.html`
 * with no rewrite rules, so `/#/tools` survives a refresh where `/tools`
 * would 404 before the app ever loads.
 *
 * Screens that carry required runtime state — a game in progress, a result,
 * a mistake review — are deliberately absent. There is no honest URL for
 * "question 7 of a round you are no longer in", so each maps to the screen a
 * player would want to land on instead.
 */

/** Screen name (as used by App's state) → URL slug. */
export const ROUTABLE_SCREENS = {
  home: 'home',
  levelSelect: 'play',
  practice: 'practice',
  musicKeysSelect: 'music-keys',
  notesSelect: 'notes',
  learn: 'learn',
  tools: 'tools',
  stats: 'stats',
  settings: 'settings',
  tutorial: 'tutorial',
  guidedLessons: 'lessons',
  comparison: 'compare',
  weeklyGoals: 'goals',
  mastery: 'mastery',
  socialChallenges: 'challenges',
  intervalSinging: 'sing-intervals',
  progressionDictation: 'progression-dictation',
  circleOfFifths: 'circle-of-fifths',
  reverseMode: 'reverse',
  melodicDictation: 'melodic-dictation',
} as const;

export type RoutableScreen = keyof typeof ROUTABLE_SCREENS;

/**
 * Where a refresh should land for a screen that cannot be addressed. A round
 * in progress returns to the ladder it was started from, so the player is one
 * tap from where they were rather than back at square one.
 */
const FALLBACK_FOR_UNROUTABLE: Record<string, RoutableScreen> = {
  game: 'levelSelect',
  musicKeysGame: 'musicKeysSelect',
  notesGame: 'notesSelect',
  result: 'home',
  mistakeReview: 'home',
};

const SLUG_TO_SCREEN: Record<string, RoutableScreen> = Object.fromEntries(
  Object.entries(ROUTABLE_SCREENS).map(([screen, slug]) => [slug, screen as RoutableScreen]),
) as Record<string, RoutableScreen>;

export function isRoutable(screen: string): screen is RoutableScreen {
  return screen in ROUTABLE_SCREENS;
}

/** The slug a screen should show in the URL, including its fallback. */
export function slugForScreen(screen: string): string | null {
  if (isRoutable(screen)) return ROUTABLE_SCREENS[screen];
  const fallback = FALLBACK_FOR_UNROUTABLE[screen];
  return fallback ? ROUTABLE_SCREENS[fallback] : null;
}

/**
 * Parse a `location.hash` into a screen name. Accepts `#play`, `#/play` and
 * `#/play/` alike, and ignores anything it does not recognise so a stale or
 * hand-edited URL degrades to the app's normal landing screen.
 */
export function screenFromHash(hash: string): RoutableScreen | null {
  const slug = hash.trim().replace(/^#\/?/, '').replace(/\/+$/, '').trim().toLowerCase();
  if (!slug) return null;
  return SLUG_TO_SCREEN[slug] ?? null;
}

export function hashForScreen(screen: string): string | null {
  const slug = slugForScreen(screen);
  return slug ? `#/${slug}` : null;
}
