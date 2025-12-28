import {
  UserStats,
  LevelProgress,
  ChordStats,
  ScaleStats,
  IntervalStats,
  DailyStats,
  GameModeStats,
  Achievement,
  ACHIEVEMENTS,
} from '../types/stats';
import { InstrumentType } from '../types/instruments';

const STORAGE_KEYS = {
  USER_STATS: 'keyperfect_user_stats',
  LEVEL_PROGRESS: 'keyperfect_level_progress',
  CHORD_STATS: 'keyperfect_chord_stats',
  SCALE_STATS: 'keyperfect_scale_stats',
  INTERVAL_STATS: 'keyperfect_interval_stats',
  DAILY_STATS: 'keyperfect_daily_stats',
  GAME_MODE_STATS: 'keyperfect_game_mode_stats',
  ACHIEVEMENTS: 'keyperfect_achievements',
  SETTINGS: 'keyperfect_settings',
} as const;

// Default values
function getDefaultUserStats(): UserStats {
  const today = new Date().toISOString().split('T')[0];
  return {
    totalXP: 0,
    currentLevel: 1,
    totalQuestionsAnswered: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalPlayTime: 0,
    sessionsPlayed: 0,
    lastPlayedDate: today,
    joinedDate: today,
  };
}

function getDefaultDailyStats(): DailyStats {
  return {
    lastPlayedDate: '',
    currentStreak: 0,
    longestStreak: 0,
    totalDaysPlayed: 0,
    completed: false,
    todayScore: 0,
    todayQuestions: 0,
  };
}

export interface AppSettings {
  instrument: InstrumentType;
  volume: number;
  soundEffects: boolean;
  autoAdvance: boolean;
  showHints: boolean;
  playMode: 'chord' | 'arpeggio';
  theme: 'dark' | 'light' | 'purple' | 'blue';
  notifications: boolean;
}

function getDefaultSettings(): AppSettings {
  return {
    instrument: 'piano',
    volume: 0.7,
    soundEffects: true,
    autoAdvance: true,
    showHints: true,
    playMode: 'chord',
    theme: 'dark',
    notifications: true,
  };
}

// Generic storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// User Stats
export function getUserStats(): UserStats {
  return getItem(STORAGE_KEYS.USER_STATS, getDefaultUserStats());
}

export function updateUserStats(updates: Partial<UserStats>): UserStats {
  const current = getUserStats();
  const updated = { ...current, ...updates };
  setItem(STORAGE_KEYS.USER_STATS, updated);
  return updated;
}

export function addXP(amount: number): UserStats {
  const stats = getUserStats();
  return updateUserStats({
    totalXP: stats.totalXP + amount,
  });
}

// Level Progress
export function getLevelProgress(): LevelProgress[] {
  return getItem(STORAGE_KEYS.LEVEL_PROGRESS, []);
}

export function updateLevelProgress(levelId: number, updates: Partial<LevelProgress>): LevelProgress[] {
  const progress = getLevelProgress();
  const index = progress.findIndex(p => p.levelId === levelId);

  if (index >= 0) {
    progress[index] = { ...progress[index], ...updates };
  } else {
    progress.push({
      levelId,
      questionsCompleted: 0,
      questionsRequired: 20,
      bestScore: 0,
      timesCompleted: 0,
      lastPlayedDate: new Date().toISOString().split('T')[0],
      ...updates,
    });
  }

  setItem(STORAGE_KEYS.LEVEL_PROGRESS, progress);
  return progress;
}

// Chord Stats
export function getChordStats(): ChordStats[] {
  return getItem(STORAGE_KEYS.CHORD_STATS, []);
}

export function updateChordStats(chordType: string, correct: boolean): ChordStats[] {
  const stats = getChordStats();
  const index = stats.findIndex(s => s.chordType === chordType);
  const today = new Date().toISOString().split('T')[0];

  if (index >= 0) {
    stats[index].attempts += 1;
    if (correct) stats[index].correct += 1;
    stats[index].lastAttempted = today;
  } else {
    stats.push({
      chordType,
      attempts: 1,
      correct: correct ? 1 : 0,
      lastAttempted: today,
    });
  }

  setItem(STORAGE_KEYS.CHORD_STATS, stats);
  return stats;
}

// Scale Stats
export function getScaleStats(): ScaleStats[] {
  return getItem(STORAGE_KEYS.SCALE_STATS, []);
}

export function updateScaleStats(scaleType: string, correct: boolean): ScaleStats[] {
  const stats = getScaleStats();
  const index = stats.findIndex(s => s.scaleType === scaleType);
  const today = new Date().toISOString().split('T')[0];

  if (index >= 0) {
    stats[index].attempts += 1;
    if (correct) stats[index].correct += 1;
    stats[index].lastAttempted = today;
  } else {
    stats.push({
      scaleType,
      attempts: 1,
      correct: correct ? 1 : 0,
      lastAttempted: today,
    });
  }

  setItem(STORAGE_KEYS.SCALE_STATS, stats);
  return stats;
}

// Interval Stats
export function getIntervalStats(): IntervalStats[] {
  return getItem(STORAGE_KEYS.INTERVAL_STATS, []);
}

export function updateIntervalStats(intervalType: string, correct: boolean): IntervalStats[] {
  const stats = getIntervalStats();
  const index = stats.findIndex(s => s.intervalType === intervalType);
  const today = new Date().toISOString().split('T')[0];

  if (index >= 0) {
    stats[index].attempts += 1;
    if (correct) stats[index].correct += 1;
    stats[index].lastAttempted = today;
  } else {
    stats.push({
      intervalType,
      attempts: 1,
      correct: correct ? 1 : 0,
      lastAttempted: today,
    });
  }

  setItem(STORAGE_KEYS.INTERVAL_STATS, stats);
  return stats;
}

// Daily Stats
export function getDailyStats(): DailyStats {
  return getItem(STORAGE_KEYS.DAILY_STATS, getDefaultDailyStats());
}

export function updateDailyStats(updates: Partial<DailyStats>): DailyStats {
  const current = getDailyStats();
  const updated = { ...current, ...updates };
  setItem(STORAGE_KEYS.DAILY_STATS, updated);
  return updated;
}

export function checkAndUpdateDailyStreak(): DailyStats {
  const stats = getDailyStats();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (stats.lastPlayedDate === today) {
    return stats; // Already played today
  }

  let newStreak = stats.currentStreak;
  if (stats.lastPlayedDate === yesterday) {
    newStreak += 1; // Continue streak
  } else if (stats.lastPlayedDate !== today) {
    newStreak = 1; // Start new streak
  }

  return updateDailyStats({
    lastPlayedDate: today,
    currentStreak: newStreak,
    longestStreak: Math.max(stats.longestStreak, newStreak),
    totalDaysPlayed: stats.totalDaysPlayed + 1,
    completed: false,
    todayScore: 0,
    todayQuestions: 0,
  });
}

// Game Mode Stats
export function getGameModeStats(): GameModeStats[] {
  return getItem(STORAGE_KEYS.GAME_MODE_STATS, []);
}

export function updateGameModeStats(mode: string, score: number, time?: number): GameModeStats[] {
  const stats = getGameModeStats();
  const index = stats.findIndex(s => s.mode === mode);
  const today = new Date().toISOString().split('T')[0];

  if (index >= 0) {
    const existing = stats[index];
    stats[index] = {
      ...existing,
      timesPlayed: existing.timesPlayed + 1,
      bestScore: Math.max(existing.bestScore, score),
      totalScore: existing.totalScore + score,
      averageScore: Math.round((existing.totalScore + score) / (existing.timesPlayed + 1)),
      bestTime: time ? Math.min(existing.bestTime || Infinity, time) : existing.bestTime,
      lastPlayedDate: today,
    };
  } else {
    stats.push({
      mode,
      timesPlayed: 1,
      bestScore: score,
      totalScore: score,
      averageScore: score,
      bestTime: time || 0,
      lastPlayedDate: today,
    });
  }

  setItem(STORAGE_KEYS.GAME_MODE_STATS, stats);
  return stats;
}

// Achievements
interface StoredAchievement {
  id: string;
  unlockedDate: string;
}

export function getUnlockedAchievements(): Achievement[] {
  // Try to get achievements with dates first (new format)
  const unlockedWithDates = getItem<StoredAchievement[]>('keyperfect_achievements_with_dates', []);
  const unlockedIds = getItem<string[]>(STORAGE_KEYS.ACHIEVEMENTS, []);

  return ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id)).map(a => {
    const storedData = unlockedWithDates.find(s => s.id === a.id);
    return {
      ...a,
      unlockedDate: storedData?.unlockedDate,
    };
  });
}

export function checkAndUnlockAchievements(stats: UserStats): Achievement[] {
  const unlocked = getItem<string[]>(STORAGE_KEYS.ACHIEVEMENTS, []);
  const unlockedWithDates = getItem<StoredAchievement[]>('keyperfect_achievements_with_dates', []);
  const newlyUnlocked: Achievement[] = [];
  const today = new Date().toISOString().split('T')[0];

  ACHIEVEMENTS.forEach(achievement => {
    if (unlocked.includes(achievement.id)) return;

    let shouldUnlock = false;

    switch (achievement.category) {
      case 'progress':
        if (achievement.id === 'first_correct' && stats.totalCorrect >= 1) shouldUnlock = true;
        if (achievement.id === 'questions_100' && stats.totalQuestionsAnswered >= 100) shouldUnlock = true;
        if (achievement.id === 'questions_500' && stats.totalQuestionsAnswered >= 500) shouldUnlock = true;
        if (achievement.id === 'questions_1000' && stats.totalQuestionsAnswered >= 1000) shouldUnlock = true;
        if (achievement.id === 'questions_5000' && stats.totalQuestionsAnswered >= 5000) shouldUnlock = true;
        break;

      case 'streak':
        if (achievement.id === 'streak_5' && stats.longestStreak >= 5) shouldUnlock = true;
        if (achievement.id === 'streak_10' && stats.longestStreak >= 10) shouldUnlock = true;
        if (achievement.id === 'streak_25' && stats.longestStreak >= 25) shouldUnlock = true;
        if (achievement.id === 'streak_50' && stats.longestStreak >= 50) shouldUnlock = true;
        break;

      case 'accuracy':
        const accuracy = stats.totalQuestionsAnswered > 0
          ? (stats.totalCorrect / stats.totalQuestionsAnswered) * 100
          : 0;
        if (achievement.id === 'accuracy_80' && accuracy >= 80 && stats.totalQuestionsAnswered >= 50) shouldUnlock = true;
        if (achievement.id === 'accuracy_90' && accuracy >= 90 && stats.totalQuestionsAnswered >= 100) shouldUnlock = true;
        if (achievement.id === 'accuracy_95' && accuracy >= 95 && stats.totalQuestionsAnswered >= 200) shouldUnlock = true;
        break;

      case 'special':
        const hour = new Date().getHours();
        if (achievement.id === 'night_owl' && hour >= 0 && hour < 5) shouldUnlock = true;
        if (achievement.id === 'early_bird' && hour >= 5 && hour < 6) shouldUnlock = true;
        break;
    }

    if (shouldUnlock) {
      unlocked.push(achievement.id);
      unlockedWithDates.push({ id: achievement.id, unlockedDate: today });
      newlyUnlocked.push({ ...achievement, unlockedDate: today });
    }
  });

  if (newlyUnlocked.length > 0) {
    setItem(STORAGE_KEYS.ACHIEVEMENTS, unlocked);
    setItem('keyperfect_achievements_with_dates', unlockedWithDates);
  }

  return newlyUnlocked;
}

// Settings
export function getSettings(): AppSettings {
  return getItem(STORAGE_KEYS.SETTINGS, getDefaultSettings());
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...updates };
  setItem(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

// Reset all data
export function resetAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Export data
export function exportData(): string {
  const data = {
    userStats: getUserStats(),
    levelProgress: getLevelProgress(),
    chordStats: getChordStats(),
    scaleStats: getScaleStats(),
    intervalStats: getIntervalStats(),
    dailyStats: getDailyStats(),
    gameModeStats: getGameModeStats(),
    achievements: getItem<string[]>(STORAGE_KEYS.ACHIEVEMENTS, []),
    settings: getSettings(),
    srsData: getItem('keyperfect_srs', {}),
    exportDate: new Date().toISOString(),
    version: '2.0', // Backup version for compatibility
  };
  return JSON.stringify(data, null, 2);
}

// Download backup as file
export function downloadBackup(): void {
  const data = exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `keyperfect-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import data
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);

    if (data.userStats) setItem(STORAGE_KEYS.USER_STATS, data.userStats);
    if (data.levelProgress) setItem(STORAGE_KEYS.LEVEL_PROGRESS, data.levelProgress);
    if (data.chordStats) setItem(STORAGE_KEYS.CHORD_STATS, data.chordStats);
    if (data.scaleStats) setItem(STORAGE_KEYS.SCALE_STATS, data.scaleStats);
    if (data.intervalStats) setItem(STORAGE_KEYS.INTERVAL_STATS, data.intervalStats);
    if (data.dailyStats) setItem(STORAGE_KEYS.DAILY_STATS, data.dailyStats);
    if (data.gameModeStats) setItem(STORAGE_KEYS.GAME_MODE_STATS, data.gameModeStats);
    if (data.achievements) setItem(STORAGE_KEYS.ACHIEVEMENTS, data.achievements);
    if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
    if (data.srsData) setItem('keyperfect_srs', data.srsData);

    return true;
  } catch {
    return false;
  }
}

// Get backup info for display
export function getBackupInfo(): { lastBackup: string | null; dataSize: number } {
  const data = exportData();
  return {
    lastBackup: localStorage.getItem('keyperfect_last_backup'),
    dataSize: new Blob([data]).size,
  };
}

// Mark backup as complete
export function markBackupComplete(): void {
  localStorage.setItem('keyperfect_last_backup', new Date().toISOString());
}
