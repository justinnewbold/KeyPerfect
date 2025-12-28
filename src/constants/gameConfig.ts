// Centralized game configuration constants
// This file contains magic numbers extracted from across the codebase

export const GAME_CONFIG = {
  // Question counts for different modes
  QUESTIONS: {
    DAILY_CHALLENGE: 10,
    SPEED_RUN_MAX: 50,
    SURVIVAL_MAX: 100,
    QUICK_PRACTICE: 5,
    STANDARD_PRACTICE: 10,
    DEEP_PRACTICE: 25,
    RANDOM_PRACTICE: 15,
    REVERSE_MODE: 10,
    MELODIC_DICTATION: 8,
  },

  // Time limits in seconds
  TIME_LIMITS: {
    QUICK_PRACTICE: 120,
    SPEED_RUN: 60,
    TIME_ATTACK_START: 30,
    TIME_ATTACK_CORRECT_BONUS: 5,
    TIME_ATTACK_WRONG_PENALTY: 3,
  },

  // XP and scoring
  XP: {
    BASE_QUESTION: 10,
    PERFECT_BONUS: 50,
    STREAK_MULTIPLIER: 2,
    DIFFICULTY_MULTIPLIER: 5,
    DAILY_COMPLETION_BONUS: 100,
  },

  // Lives for survival mode
  LIVES: {
    SURVIVAL_START: 3,
  },

  // Audio settings
  AUDIO: {
    DEFAULT_BPM: 120,
    MIN_BPM: 30,
    MAX_BPM: 300,
    DEFAULT_MIDI_NOTE: 60, // C4
    NOTE_DURATION_MS: 400,
    MELODY_NOTE_SPACING_MS: 600,
  },

  // Note ranges
  NOTES: {
    DEFAULT_OCTAVE: 4,
    MIN_MIDI: 48, // C3
    MAX_MIDI: 72, // C5
    MELODY_START_MIN: 60, // C4
    MELODY_START_MAX: 71, // B4
  },

  // Streak thresholds
  STREAKS: {
    ON_FIRE: 5,
    BLAZING: 10,
    UNSTOPPABLE: 25,
    LEGENDARY: 50,
  },

  // Accuracy thresholds (percentages)
  ACCURACY: {
    GRADE_A: 90,
    GRADE_B: 80,
    GRADE_C: 60,
    GRADE_D: 40,
    TUNER_PERFECT: 5,
    TUNER_GOOD: 15,
  },

  // Level system
  LEVELS: {
    MAX_LEVEL: 8,
    BASE_XP_PER_LEVEL: 500,
  },

  // Goals
  GOALS: {
    WEEKLY_SESSIONS_TARGET: 5,
    WEEKLY_ACCURACY_TARGET: 80,
    MIN_QUESTIONS_FOR_ACCURACY: 20,
    SKILL_MASTERY_THRESHOLD: 85,
  },

  // UI timings in milliseconds
  UI: {
    AUTO_PLAY_DELAY: 500,
    ANSWER_CHECK_DELAY: 500,
    ANIMATION_DURATION: 200,
    TOAST_DURATION: 3000,
  },
} as const;

// Type helper for accessing config values
export type GameConfig = typeof GAME_CONFIG;
