import {
  UserStats,
  LevelProgress,
  ChordStats,
  ScaleStats,
  IntervalStats,
  KeyStats,
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
  KEY_STATS: 'keyperfect_key_stats',
  NOTE_STATS: 'keyperfect_note_stats',
  MUSIC_KEYS_PROGRESS: 'keyperfect_music_keys_progress',
  NOTES_PROGRESS: 'keyperfect_notes_progress',
  DAILY_STATS: 'keyperfect_daily_stats',
  GAME_MODE_STATS: 'keyperfect_game_mode_stats',
  ACHIEVEMENTS: 'keyperfect_achievements',
  SETTINGS: 'keyperfect_settings',
  SESSION_HISTORY: 'keyperfect_session_history',
  USED_INSTRUMENTS: 'keyperfect_used_instruments',
  WEEKLY_GOALS: 'keyperfect_weekly_goals',
  STREAK_FREEZE: 'keyperfect_streak_freeze',
  SOCIAL_CHALLENGES: 'keyperfect_social_challenges',
  MASTERY_DATA: 'keyperfect_mastery_data',
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
  lastPreset?: PracticePresetId;
}

// Practice Presets
export type PracticePresetId = 'quick' | 'standard' | 'deep' | 'random';

export interface PracticePreset {
  id: PracticePresetId;
  name: string;
  description: string;
  icon: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'progressive';
  timeLimit?: number; // in seconds, undefined = no limit
  modes: ('chords' | 'scales' | 'intervals')[];
}

export const PRACTICE_PRESETS: Record<PracticePresetId, PracticePreset> = {
  quick: {
    id: 'quick',
    name: 'Quick Practice',
    description: '5 questions, easy difficulty',
    icon: '⚡',
    questionCount: 5,
    difficulty: 'easy',
    timeLimit: 120,
    modes: ['chords'],
  },
  standard: {
    id: 'standard',
    name: 'Standard Session',
    description: '10 questions, progressive difficulty',
    icon: '📚',
    questionCount: 10,
    difficulty: 'progressive',
    modes: ['chords', 'scales'],
  },
  deep: {
    id: 'deep',
    name: 'Deep Focus',
    description: '25 questions, harder content',
    icon: '🧠',
    questionCount: 25,
    difficulty: 'hard',
    modes: ['chords', 'scales', 'intervals'],
  },
  random: {
    id: 'random',
    name: 'Random Mix',
    description: 'All modes shuffled together',
    icon: '🎲',
    questionCount: 15,
    difficulty: 'progressive',
    modes: ['chords', 'scales', 'intervals'],
  },
};

// Practice Session History
export interface PracticeSession {
  id: string;
  date: string;
  mode: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  duration: number; // in seconds
  xpEarned: number;
  streak: number;
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

// Key Stats (Music Keys mode)
export function getKeyStats(): KeyStats[] {
  return getItem(STORAGE_KEYS.KEY_STATS, []);
}

export function updateKeyStats(keyType: string, correct: boolean): KeyStats[] {
  const stats = getKeyStats();
  const index = stats.findIndex(s => s.keyType === keyType);
  const today = new Date().toISOString().split('T')[0];

  if (index >= 0) {
    stats[index].attempts += 1;
    if (correct) stats[index].correct += 1;
    stats[index].lastAttempted = today;
  } else {
    stats.push({
      keyType,
      attempts: 1,
      correct: correct ? 1 : 0,
      lastAttempted: today,
    });
  }

  setItem(STORAGE_KEYS.KEY_STATS, stats);
  return stats;
}

// Music Keys Level Progress
export interface MusicKeysLevelProgress {
  levelId: number;
  questionsCompleted: number;
  questionsRequired: number;
  bestScore: number;
  timesCompleted: number;
  lastPlayedDate: string;
}

export function getMusicKeysProgress(): MusicKeysLevelProgress[] {
  return getItem(STORAGE_KEYS.MUSIC_KEYS_PROGRESS, []);
}

export function updateMusicKeysProgress(levelId: number, updates: Partial<MusicKeysLevelProgress>): MusicKeysLevelProgress[] {
  const progress = getMusicKeysProgress();
  const index = progress.findIndex(p => p.levelId === levelId);

  if (index >= 0) {
    progress[index] = { ...progress[index], ...updates };
  } else {
    progress.push({
      levelId,
      questionsCompleted: 0,
      questionsRequired: 15,
      bestScore: 0,
      timesCompleted: 0,
      lastPlayedDate: new Date().toISOString().split('T')[0],
      ...updates,
    });
  }

  setItem(STORAGE_KEYS.MUSIC_KEYS_PROGRESS, progress);
  return progress;
}

// Note Stats (Notes mode)
export interface NoteStats {
  noteType: string; // e.g., "C4", "F#3"
  attempts: number;
  correct: number;
  lastAttempted: string;
}

export function getNoteStats(): NoteStats[] {
  return getItem(STORAGE_KEYS.NOTE_STATS, []);
}

export function updateNoteStats(noteType: string, correct: boolean): NoteStats[] {
  const stats = getNoteStats();
  const index = stats.findIndex(s => s.noteType === noteType);
  const today = new Date().toISOString().split('T')[0];

  if (index >= 0) {
    stats[index].attempts += 1;
    if (correct) stats[index].correct += 1;
    stats[index].lastAttempted = today;
  } else {
    stats.push({
      noteType,
      attempts: 1,
      correct: correct ? 1 : 0,
      lastAttempted: today,
    });
  }

  setItem(STORAGE_KEYS.NOTE_STATS, stats);
  return stats;
}

// Notes Level Progress
export interface NotesLevelProgress {
  levelId: number;
  questionsCompleted: number;
  questionsRequired: number;
  bestScore: number;
  timesCompleted: number;
  lastPlayedDate: string;
}

export function getNotesProgress(): NotesLevelProgress[] {
  return getItem(STORAGE_KEYS.NOTES_PROGRESS, []);
}

export function updateNotesProgress(levelId: number, updates: Partial<NotesLevelProgress>): NotesLevelProgress[] {
  const progress = getNotesProgress();
  const index = progress.findIndex(p => p.levelId === levelId);

  if (index >= 0) {
    progress[index] = { ...progress[index], ...updates };
  } else {
    progress.push({
      levelId,
      questionsCompleted: 0,
      questionsRequired: 15,
      bestScore: 0,
      timesCompleted: 0,
      lastPlayedDate: new Date().toISOString().split('T')[0],
      ...updates,
    });
  }

  setItem(STORAGE_KEYS.NOTES_PROGRESS, progress);
  return progress;
}

// Helper: get the ISO date string for Monday of the current week
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split('T')[0];
}

// Weekly Goals
export interface WeeklyGoal {
  id: string;
  type: 'questions' | 'minutes' | 'accuracy' | 'streak';
  target: number;
  current: number;
  weekStart: string; // ISO date string of Monday
  completed: boolean;
  accuracySessions?: number; // number of sessions averaged for 'accuracy' type
}

export interface WeeklyGoalsData {
  goals: WeeklyGoal[];
  weekStart: string;
  totalWeeksCompleted: number;
}

export function getWeeklyGoals(): WeeklyGoalsData {
  const defaultData: WeeklyGoalsData = {
    goals: [],
    weekStart: getWeekStart(),
    totalWeeksCompleted: 0,
  };
  const data = getItem(STORAGE_KEYS.WEEKLY_GOALS, defaultData);
  // Reset if new week
  if (data.weekStart !== getWeekStart()) {
    const wasCompleted = data.goals.length > 0 && data.goals.every(g => g.completed);
    return {
      goals: data.goals.map(g => ({ ...g, current: 0, completed: false })),
      weekStart: getWeekStart(),
      totalWeeksCompleted: data.totalWeeksCompleted + (wasCompleted ? 1 : 0),
    };
  }
  return data;
}

export function setWeeklyGoals(goals: Omit<WeeklyGoal, 'id' | 'current' | 'completed' | 'weekStart'>[]): WeeklyGoalsData {
  const data = getWeeklyGoals();
  data.goals = goals.map((g, i) => ({
    ...g,
    id: `goal_${i}_${Date.now()}`,
    current: 0,
    completed: false,
    weekStart: getWeekStart(),
  }));
  data.weekStart = getWeekStart();
  setItem(STORAGE_KEYS.WEEKLY_GOALS, data);
  return data;
}

export function updateWeeklyGoalProgress(type: WeeklyGoal['type'], amount: number): WeeklyGoalsData {
  const data = getWeeklyGoals();
  data.goals = data.goals.map(goal => {
    if (goal.type === type) {
      let newCurrent: number;
      let updatedFields: Partial<WeeklyGoal> = {};
      if (type === 'accuracy') {
        // Average accuracy across all sessions this week
        const sessions = (goal.accuracySessions ?? 0) + 1;
        newCurrent = (goal.current * (sessions - 1) + amount) / sessions;
        updatedFields = { accuracySessions: sessions };
      } else {
        newCurrent = goal.current + amount;
      }
      return { ...goal, ...updatedFields, current: newCurrent, completed: newCurrent >= goal.target };
    }
    return goal;
  });
  setItem(STORAGE_KEYS.WEEKLY_GOALS, data);
  return data;
}

// Streak Freeze
export interface StreakFreezeData {
  freezesAvailable: number;
  freezesUsedThisWeek: number;
  lastFreezeDate: string;
  weekStart: string;
  autoFreezeEnabled: boolean;
}

export function getStreakFreezeData(): StreakFreezeData {
  const defaultData: StreakFreezeData = {
    freezesAvailable: 1,
    freezesUsedThisWeek: 0,
    lastFreezeDate: '',
    weekStart: getWeekStart(),
    autoFreezeEnabled: true,
  };
  const data = getItem(STORAGE_KEYS.STREAK_FREEZE, defaultData);
  // Reset weekly allowance
  if (data.weekStart !== getWeekStart()) {
    return { ...data, freezesUsedThisWeek: 0, freezesAvailable: 1, weekStart: getWeekStart() };
  }
  return data;
}

export function useStreakFreeze(): boolean {
  const data = getStreakFreezeData();
  if (data.freezesAvailable <= 0 || data.freezesUsedThisWeek >= 1) return false;
  const today = new Date().toISOString().split('T')[0];
  if (data.lastFreezeDate === today) return false;
  const updated: StreakFreezeData = {
    ...data,
    freezesAvailable: data.freezesAvailable - 1,
    freezesUsedThisWeek: data.freezesUsedThisWeek + 1,
    lastFreezeDate: today,
  };
  setItem(STORAGE_KEYS.STREAK_FREEZE, updated);
  return true;
}

export function updateStreakFreezeSettings(autoFreeze: boolean): void {
  const data = getStreakFreezeData();
  setItem(STORAGE_KEYS.STREAK_FREEZE, { ...data, autoFreezeEnabled: autoFreeze });
}

// Social Challenges
export interface SocialChallenge {
  id: string;
  creatorName: string;
  mode: string;
  level: number;
  questionSeed: number;
  questionCount: number;
  creatorScore: number;
  creatorAccuracy: number;
  createdDate: string;
  completed: boolean;
  playerScore?: number;
  playerAccuracy?: number;
}

export function getSocialChallenges(): SocialChallenge[] {
  return getItem(STORAGE_KEYS.SOCIAL_CHALLENGES, []);
}

export function createSocialChallenge(challenge: Omit<SocialChallenge, 'id' | 'completed'>): SocialChallenge {
  const challenges = getSocialChallenges();
  const newChallenge: SocialChallenge = {
    ...challenge,
    id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    completed: false,
  };
  challenges.push(newChallenge);
  setItem(STORAGE_KEYS.SOCIAL_CHALLENGES, challenges);
  return newChallenge;
}

export function completeSocialChallenge(id: string, score: number, accuracy: number): void {
  const challenges = getSocialChallenges();
  const index = challenges.findIndex(c => c.id === id);
  if (index >= 0) {
    challenges[index] = { ...challenges[index], completed: true, playerScore: score, playerAccuracy: accuracy };
    setItem(STORAGE_KEYS.SOCIAL_CHALLENGES, challenges);
  }
}

// Mastery Data
export interface MasteryItem {
  type: 'chord' | 'scale' | 'interval' | 'key' | 'note';
  value: string;
  attempts: number;
  correct: number;
  masteryLevel: number; // 0-100
  lastPracticed: string;
}

export function getMasteryData(): MasteryItem[] {
  return getItem(STORAGE_KEYS.MASTERY_DATA, []);
}

export function updateMasteryItem(type: MasteryItem['type'], value: string, isCorrect: boolean): MasteryItem {
  const data = getMasteryData();
  const today = new Date().toISOString().split('T')[0];
  let item = data.find(d => d.type === type && d.value === value);

  if (!item) {
    item = { type, value, attempts: 0, correct: 0, masteryLevel: 0, lastPracticed: today };
    data.push(item);
  }

  item.attempts++;
  if (isCorrect) item.correct++;
  item.lastPracticed = today;

  // Calculate mastery level (weighted recent accuracy with minimum attempts)
  const accuracy = item.attempts > 0 ? item.correct / item.attempts : 0;
  const confidence = Math.min(1, item.attempts / 20); // Need 20 attempts for full confidence
  item.masteryLevel = Math.round(accuracy * confidence * 100);

  setItem(STORAGE_KEYS.MASTERY_DATA, data);
  return item;
}

export function getMasteryByType(type: MasteryItem['type']): MasteryItem[] {
  return getMasteryData().filter(d => d.type === type);
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
  } else {
    // lastPlayedDate is neither today nor yesterday — streak is broken
    // Check if auto-freeze is enabled and a freeze is available
    const freezeData = getStreakFreezeData();
    if (freezeData.autoFreezeEnabled && useStreakFreeze()) {
      newStreak += 1; // Streak preserved by freeze
    } else {
      newStreak = 1; // Start new streak
    }
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

// Session History
const MAX_SESSION_HISTORY = 50; // Keep last 50 sessions

export function getSessionHistory(): PracticeSession[] {
  return getItem(STORAGE_KEYS.SESSION_HISTORY, []);
}

export function addSessionToHistory(session: Omit<PracticeSession, 'id'>): PracticeSession[] {
  const history = getSessionHistory();
  const newSession: PracticeSession = {
    ...session,
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  // Add to beginning, limit to max
  const updated = [newSession, ...history].slice(0, MAX_SESSION_HISTORY);
  setItem(STORAGE_KEYS.SESSION_HISTORY, updated);
  return updated;
}

// Practice Insights derived from session history
export interface PracticeInsights {
  totalSessions: number;
  totalPracticeTime: number; // in seconds
  averageAccuracy: number;
  bestStreak: number;
  weeklyProgress: {
    date: string;
    sessions: number;
    accuracy: number;
    xp: number;
  }[];
  recentTrend: 'improving' | 'steady' | 'declining';
  strongestMode: string | null;
  weakestMode: string | null;
  practiceConsistency: number; // days practiced in last 7 days
}

export function getPracticeInsights(): PracticeInsights {
  const history = getSessionHistory();
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Calculate total stats
  const totalSessions = history.length;
  const totalPracticeTime = history.reduce((sum, s) => sum + s.duration, 0);
  const averageAccuracy = totalSessions > 0
    ? history.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions
    : 0;
  const bestStreak = Math.max(0, ...history.map(s => s.streak));

  // Calculate weekly progress (last 7 days)
  const weeklyProgress: PracticeInsights['weeklyProgress'] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const daySessions = history.filter(s => s.date === dateStr);
    weeklyProgress.push({
      date: dateStr,
      sessions: daySessions.length,
      accuracy: daySessions.length > 0
        ? daySessions.reduce((sum, s) => sum + s.accuracy, 0) / daySessions.length
        : 0,
      xp: daySessions.reduce((sum, s) => sum + s.xpEarned, 0),
    });
  }

  // Calculate trend (compare first half vs second half of recent sessions)
  let recentTrend: PracticeInsights['recentTrend'] = 'steady';
  if (history.length >= 6) {
    const recent = history.slice(0, 3);
    const older = history.slice(3, 6);
    const recentAvg = recent.reduce((sum, s) => sum + s.accuracy, 0) / 3;
    const olderAvg = older.reduce((sum, s) => sum + s.accuracy, 0) / 3;
    if (recentAvg > olderAvg + 5) recentTrend = 'improving';
    else if (recentAvg < olderAvg - 5) recentTrend = 'declining';
  }

  // Find strongest and weakest modes
  const modeStats = new Map<string, { total: number; correct: number }>();
  history.forEach(s => {
    const current = modeStats.get(s.mode) || { total: 0, correct: 0 };
    current.total += s.totalQuestions;
    current.correct += s.correctAnswers;
    modeStats.set(s.mode, current);
  });

  let strongestMode: string | null = null;
  let weakestMode: string | null = null;
  let highestAccuracy = 0;
  let lowestAccuracy = 100;

  modeStats.forEach((stats, mode) => {
    if (stats.total >= 5) { // Minimum 5 questions to count
      const acc = (stats.correct / stats.total) * 100;
      if (acc > highestAccuracy) {
        highestAccuracy = acc;
        strongestMode = mode;
      }
      if (acc < lowestAccuracy) {
        lowestAccuracy = acc;
        weakestMode = mode;
      }
    }
  });

  // Calculate practice consistency (unique days in last 7)
  const recentSessions = history.filter(s => new Date(s.date) >= oneWeekAgo);
  const uniqueDays = new Set(recentSessions.map(s => s.date)).size;

  return {
    totalSessions,
    totalPracticeTime,
    averageAccuracy: Math.round(averageAccuracy * 10) / 10,
    bestStreak,
    weeklyProgress,
    recentTrend,
    strongestMode,
    weakestMode,
    practiceConsistency: uniqueDays,
  };
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

      case 'streak': {
        // In-session answer streaks
        if (achievement.id === 'streak_5' && stats.longestStreak >= 5) shouldUnlock = true;
        if (achievement.id === 'streak_10' && stats.longestStreak >= 10) shouldUnlock = true;
        if (achievement.id === 'streak_25' && stats.longestStreak >= 25) shouldUnlock = true;
        if (achievement.id === 'streak_50' && stats.longestStreak >= 50) shouldUnlock = true;
        // Daily login streaks
        const dailyStats = getDailyStats();
        if (achievement.id === 'daily_3' && dailyStats.currentStreak >= 3) shouldUnlock = true;
        if (achievement.id === 'daily_7' && dailyStats.currentStreak >= 7) shouldUnlock = true;
        if (achievement.id === 'daily_30' && dailyStats.currentStreak >= 30) shouldUnlock = true;
        break;
      }

      case 'accuracy':
        const accuracy = stats.totalQuestionsAnswered > 0
          ? (stats.totalCorrect / stats.totalQuestionsAnswered) * 100
          : 0;
        if (achievement.id === 'accuracy_80' && accuracy >= 80 && stats.totalQuestionsAnswered >= 50) shouldUnlock = true;
        if (achievement.id === 'accuracy_90' && accuracy >= 90 && stats.totalQuestionsAnswered >= 100) shouldUnlock = true;
        if (achievement.id === 'accuracy_95' && accuracy >= 95 && stats.totalQuestionsAnswered >= 200) shouldUnlock = true;
        break;

      case 'mastery': {
        const levelProgress = getLevelProgress();
        if (achievement.id === 'level_complete_1' && levelProgress.some(p => p.levelId === 1 && p.timesCompleted > 0)) shouldUnlock = true;
        if (achievement.id === 'level_complete_4' && levelProgress.some(p => p.levelId === 4 && p.timesCompleted > 0)) shouldUnlock = true;
        if (achievement.id === 'level_complete_8' && levelProgress.some(p => p.levelId === 8 && p.timesCompleted > 0)) shouldUnlock = true;
        break;
      }

      case 'challenge': {
        const modeStats = getGameModeStats();
        const speedrunStats = modeStats.find(s => s.mode === 'speedrun');
        const survivalStats = modeStats.find(s => s.mode === 'survival');
        if (achievement.id === 'speed_run_perfect' && speedrunStats && speedrunStats.bestScore >= 100) shouldUnlock = true;
        if (achievement.id === 'survival_100' && survivalStats && survivalStats.bestScore >= 100) shouldUnlock = true;
        break;
      }

      case 'special':
        const hour = new Date().getHours();
        if (achievement.id === 'night_owl' && hour >= 0 && hour < 5) shouldUnlock = true;
        if (achievement.id === 'early_bird' && hour >= 5 && hour < 8) shouldUnlock = true;
        if (achievement.id === 'all_instruments') {
          const usedInstruments = getUsedInstruments();
          if (usedInstruments.length >= achievement.requirement) shouldUnlock = true;
        }
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

// Instrument usage tracking
export function getUsedInstruments(): InstrumentType[] {
  return getItem<InstrumentType[]>(STORAGE_KEYS.USED_INSTRUMENTS, []);
}

export function trackInstrumentUsage(instrument: InstrumentType): InstrumentType[] {
  const used = getUsedInstruments();
  if (!used.includes(instrument)) {
    used.push(instrument);
    setItem(STORAGE_KEYS.USED_INSTRUMENTS, used);
  }
  return used;
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
    keyStats: getKeyStats(),
    noteStats: getNoteStats(),
    musicKeysProgress: getMusicKeysProgress(),
    notesProgress: getNotesProgress(),
    dailyStats: getDailyStats(),
    gameModeStats: getGameModeStats(),
    achievements: getItem<string[]>(STORAGE_KEYS.ACHIEVEMENTS, []),
    settings: getSettings(),
    sessionHistory: getSessionHistory(),
    usedInstruments: getUsedInstruments(),
    weeklyGoals: getWeeklyGoals(),
    streakFreeze: getStreakFreezeData(),
    socialChallenges: getSocialChallenges(),
    masteryData: getMasteryData(),
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
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
    if (data.keyStats) setItem(STORAGE_KEYS.KEY_STATS, data.keyStats);
    if (data.noteStats) setItem(STORAGE_KEYS.NOTE_STATS, data.noteStats);
    if (data.musicKeysProgress) setItem(STORAGE_KEYS.MUSIC_KEYS_PROGRESS, data.musicKeysProgress);
    if (data.notesProgress) setItem(STORAGE_KEYS.NOTES_PROGRESS, data.notesProgress);
    if (data.dailyStats) setItem(STORAGE_KEYS.DAILY_STATS, data.dailyStats);
    if (data.gameModeStats) setItem(STORAGE_KEYS.GAME_MODE_STATS, data.gameModeStats);
    if (data.achievements) setItem(STORAGE_KEYS.ACHIEVEMENTS, data.achievements);
    if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
    if (data.sessionHistory) setItem(STORAGE_KEYS.SESSION_HISTORY, data.sessionHistory);
    if (data.usedInstruments) setItem(STORAGE_KEYS.USED_INSTRUMENTS, data.usedInstruments);
    if (data.weeklyGoals) setItem(STORAGE_KEYS.WEEKLY_GOALS, data.weeklyGoals);
    if (data.streakFreeze) setItem(STORAGE_KEYS.STREAK_FREEZE, data.streakFreeze);
    if (data.socialChallenges) setItem(STORAGE_KEYS.SOCIAL_CHALLENGES, data.socialChallenges);
    if (data.masteryData) setItem(STORAGE_KEYS.MASTERY_DATA, data.masteryData);

    return true;
  } catch {
    return false;
  }
}
