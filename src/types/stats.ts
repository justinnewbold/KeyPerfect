export interface UserStats {
  totalXP: number;
  currentLevel: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalIncorrect: number;
  currentStreak: number;
  longestStreak: number;
  totalPlayTime: number; // in seconds
  sessionsPlayed: number;
  lastPlayedDate: string;
  joinedDate: string;
}

export interface LevelProgress {
  levelId: number;
  questionsCompleted: number;
  questionsRequired: number;
  bestScore: number;
  timesCompleted: number;
  lastPlayedDate: string;
}

export interface ChordStats {
  chordType: string;
  attempts: number;
  correct: number;
  lastAttempted: string;
}

export interface ScaleStats {
  scaleType: string;
  attempts: number;
  correct: number;
  lastAttempted: string;
}

export interface IntervalStats {
  intervalType: string;
  attempts: number;
  correct: number;
  lastAttempted: string;
}

export interface DailyStats {
  lastPlayedDate: string;
  currentStreak: number;
  longestStreak: number;
  totalDaysPlayed: number;
  completed: boolean;
  todayScore: number;
  todayQuestions: number;
}

export interface GameModeStats {
  mode: string;
  timesPlayed: number;
  bestScore: number;
  totalScore: number;
  averageScore: number;
  bestTime: number; // For timed modes
  lastPlayedDate: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'progress' | 'streak' | 'accuracy' | 'mastery' | 'challenge' | 'special';
  requirement: number;
  xpReward: number;
  unlockedDate?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Progress achievements
  { id: 'first_correct', name: 'First Steps', description: 'Get your first correct answer', icon: '🎯', category: 'progress', requirement: 1, xpReward: 50 },
  { id: 'questions_100', name: 'Century', description: 'Answer 100 questions', icon: '💯', category: 'progress', requirement: 100, xpReward: 200 },
  { id: 'questions_500', name: 'Scholar', description: 'Answer 500 questions', icon: '📚', category: 'progress', requirement: 500, xpReward: 500 },
  { id: 'questions_1000', name: 'Expert', description: 'Answer 1000 questions', icon: '🎓', category: 'progress', requirement: 1000, xpReward: 1000 },
  { id: 'questions_5000', name: 'Master', description: 'Answer 5000 questions', icon: '👑', category: 'progress', requirement: 5000, xpReward: 2500 },

  // Streak achievements
  { id: 'streak_5', name: 'On Fire', description: 'Get a 5 answer streak', icon: '🔥', category: 'streak', requirement: 5, xpReward: 100 },
  { id: 'streak_10', name: 'Blazing', description: 'Get a 10 answer streak', icon: '⚡', category: 'streak', requirement: 10, xpReward: 250 },
  { id: 'streak_25', name: 'Unstoppable', description: 'Get a 25 answer streak', icon: '🌟', category: 'streak', requirement: 25, xpReward: 500 },
  { id: 'streak_50', name: 'Legendary', description: 'Get a 50 answer streak', icon: '🏆', category: 'streak', requirement: 50, xpReward: 1000 },

  // Daily streak achievements
  { id: 'daily_3', name: 'Consistent', description: 'Play 3 days in a row', icon: '📅', category: 'streak', requirement: 3, xpReward: 150 },
  { id: 'daily_7', name: 'Weekly Warrior', description: 'Play 7 days in a row', icon: '🗓️', category: 'streak', requirement: 7, xpReward: 350 },
  { id: 'daily_30', name: 'Monthly Master', description: 'Play 30 days in a row', icon: '🌙', category: 'streak', requirement: 30, xpReward: 1500 },

  // Accuracy achievements
  { id: 'accuracy_80', name: 'Accurate', description: 'Achieve 80% accuracy (50+ questions)', icon: '🎯', category: 'accuracy', requirement: 80, xpReward: 300 },
  { id: 'accuracy_90', name: 'Precise', description: 'Achieve 90% accuracy (100+ questions)', icon: '🏅', category: 'accuracy', requirement: 90, xpReward: 600 },
  { id: 'accuracy_95', name: 'Perfect Ear', description: 'Achieve 95% accuracy (200+ questions)', icon: '💎', category: 'accuracy', requirement: 95, xpReward: 1200 },

  // Mastery achievements
  { id: 'level_complete_1', name: 'Level 1 Complete', description: 'Complete Level 1', icon: '🌱', category: 'mastery', requirement: 1, xpReward: 200 },
  { id: 'level_complete_4', name: 'Jazz Initiate', description: 'Complete Level 4', icon: '🎷', category: 'mastery', requirement: 4, xpReward: 500 },
  { id: 'level_complete_8', name: 'Grand Master', description: 'Complete Level 8', icon: '👑', category: 'mastery', requirement: 8, xpReward: 2000 },

  // Challenge achievements
  { id: 'speed_run_perfect', name: 'Speed Demon', description: 'Perfect score in Speed Run', icon: '⚡', category: 'challenge', requirement: 1, xpReward: 500 },
  { id: 'survival_100', name: 'Survivor', description: 'Score 100 in Survival mode', icon: '💪', category: 'challenge', requirement: 100, xpReward: 750 },

  // Special achievements
  { id: 'night_owl', name: 'Night Owl', description: 'Practice after midnight', icon: '🦉', category: 'special', requirement: 1, xpReward: 100 },
  { id: 'early_bird', name: 'Early Bird', description: 'Practice before 6 AM', icon: '🐦', category: 'special', requirement: 1, xpReward: 100 },
  { id: 'all_instruments', name: 'Polyglot', description: 'Use all 10 instruments', icon: '🎹', category: 'special', requirement: 10, xpReward: 500 },
];

export interface AnalyticsData {
  weeklyProgress: number[];
  monthlyProgress: number[];
  weakAreas: WeakArea[];
  strongAreas: string[];
  recentSessions: SessionData[];
  performanceTrend: 'improving' | 'stable' | 'declining';
  suggestedFocus: string[];
}

export interface WeakArea {
  type: 'chord' | 'scale' | 'interval';
  name: string;
  accuracy: number;
  attempts: number;
}

export interface SessionData {
  date: string;
  mode: string;
  score: number;
  duration: number;
  questionsAnswered: number;
}

// XP calculation (reduced by 50% for faster progression)
export function calculateXPForLevel(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.5));
}

export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (xpNeeded <= totalXP) {
    xpNeeded += calculateXPForLevel(level);
    if (xpNeeded > totalXP) break;
    level++;
  }
  return level;
}

export function getXPProgress(totalXP: number): { current: number; needed: number; percentage: number } {
  const currentLevel = getLevelFromXP(totalXP);
  let xpAtCurrentLevel = 0;
  for (let i = 1; i < currentLevel; i++) {
    xpAtCurrentLevel += calculateXPForLevel(i);
  }
  const xpInCurrentLevel = totalXP - xpAtCurrentLevel;
  const xpNeededForNextLevel = calculateXPForLevel(currentLevel);
  return {
    current: xpInCurrentLevel,
    needed: xpNeededForNextLevel,
    percentage: Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100),
  };
}

export function calculateQuestionXP(correct: boolean, streak: number, difficulty: number): number {
  if (!correct) return 0;
  const baseXP = 10;
  const streakBonus = Math.min(streak, 10) * 2; // Max +20 from streak
  const difficultyBonus = difficulty * 5; // +5 per difficulty level
  return baseXP + streakBonus + difficultyBonus;
}
