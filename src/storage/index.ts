// Storage module index - re-exports for backward compatibility
// The original storage.ts is kept but imports are consolidated here

export * from './core';
export * from './settings';

// Re-export everything from the original storage.ts for backward compatibility
// This allows gradual migration without breaking existing imports
export {
  // Types
  type PracticePresetId,
  type BasePracticePreset,
  type PracticePreset,
  type PracticeSession,
  type PracticeInsights,
  type CustomPreset,
  type GoalType,
  type Goal,

  // Constants
  PRACTICE_PRESETS,

  // User Stats
  getUserStats,
  updateUserStats,
  addXP,

  // Level Progress
  getLevelProgress,
  updateLevelProgress,

  // Chord/Scale/Interval Stats
  getChordStats,
  updateChordStats,
  getScaleStats,
  updateScaleStats,
  getIntervalStats,
  updateIntervalStats,

  // Daily Stats
  getDailyStats,
  updateDailyStats,
  checkAndUpdateDailyStreak,

  // Game Mode Stats
  getGameModeStats,
  updateGameModeStats,

  // Session History
  getSessionHistory,
  addSessionToHistory,
  getPracticeInsights,

  // Custom Presets
  getCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
  updateCustomPreset,

  // Goals
  getGoals,
  updateGoalProgress,
  addCustomGoal,
  claimGoalReward,

  // Achievements
  getUnlockedAchievements,
  checkAndUnlockAchievements,
} from '../utils/storage';
