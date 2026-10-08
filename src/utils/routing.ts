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
  const [slug] = hashSegments(hash);
  if (!slug) return null;
  return SLUG_TO_SCREEN[slug] ?? null;
}

function hashSegments(hash: string): string[] {
  const path = hash.trim().replace(/^#\/?/, '').replace(/\/+$/, '').trim().toLowerCase();
  return path ? path.split('/') : [];
}

/*
 * Deep links that do something rather than just show a screen, for Siri
 * Shortcuts ("Open URL") and Home Screen bookmarks:
 *
 *   #/tools/tuner        open Tools on the tuner
 *   #/tools/metronome    open Tools on the metronome
 *   #/tools/sing-back    open Tools on sing-back
 *   #/start/quick        start a practice preset straight away
 *                        (quick, standard, deep, random)
 *
 * In the native port these become App Intents with the same names, so a
 * Shortcut built against the web app keeps its meaning.
 */
export const TOOL_SLUGS = {
  tuner: 'tuner',
  metronome: 'metronome',
  'sing-back': 'singback',
} as const;

export type DeepLinkTool = (typeof TOOL_SLUGS)[keyof typeof TOOL_SLUGS];

export const PRESET_SLUGS = ['quick', 'standard', 'deep', 'random'] as const;
export type DeepLinkPreset = (typeof PRESET_SLUGS)[number];

export type DeepLink =
  | { kind: 'tool'; tool: DeepLinkTool }
  | { kind: 'start'; preset: DeepLinkPreset };

/** An action link in the hash, or null for a plain screen link or nothing. */
export function deepLinkFromHash(hash: string): DeepLink | null {
  const [first, second] = hashSegments(hash);
  if (first === 'tools' && second && second in TOOL_SLUGS) {
    return { kind: 'tool', tool: TOOL_SLUGS[second as keyof typeof TOOL_SLUGS] };
  }
  if (first === 'start' && second && (PRESET_SLUGS as readonly string[]).includes(second)) {
    return { kind: 'start', preset: second as DeepLinkPreset };
  }
  return null;
}

export function hashForScreen(screen: string): string | null {
  const slug = slugForScreen(screen);
  return slug ? `#/${slug}` : null;
}
