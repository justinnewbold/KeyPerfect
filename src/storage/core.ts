// Core storage utilities and constants

export const STORAGE_KEYS = {
  USER_STATS: 'keyperfect_user_stats',
  LEVEL_PROGRESS: 'keyperfect_level_progress',
  CHORD_STATS: 'keyperfect_chord_stats',
  SCALE_STATS: 'keyperfect_scale_stats',
  INTERVAL_STATS: 'keyperfect_interval_stats',
  DAILY_STATS: 'keyperfect_daily_stats',
  GAME_MODE_STATS: 'keyperfect_game_mode_stats',
  ACHIEVEMENTS: 'keyperfect_achievements',
  SETTINGS: 'keyperfect_settings',
  SESSION_HISTORY: 'keyperfect_session_history',
  CUSTOM_PRESETS: 'keyperfect_custom_presets',
  GOALS: 'keyperfect_goals',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// Generic localStorage helpers
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

// Clear all app data
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeItem(key);
  });
}
