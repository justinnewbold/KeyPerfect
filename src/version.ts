/**
 * Single source of truth for the app version.
 *
 * It was previously a literal in the About card and nowhere else, so nothing
 * else — the data export in particular — could state which build wrote it.
 * Keep this in step with package.json.
 */
export const APP_VERSION = '14.0.0';
