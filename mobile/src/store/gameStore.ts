/**
 * Game State Store
 *
 * Uses Zustand for state management
 * Persists data to AsyncStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types (shared with web app)
interface UserStats {
  totalXP: number;
  currentLevel: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalIncorrect: number;
  currentStreak: number;
  longestStreak: number;
  totalPlayTime: number;
  sessionsPlayed: number;
  lastPlayedDate: string;
  joinedDate: string;
}

interface GameState {
  mode: string;
  level: number;
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  streak: number;
  lives: number;
  timeRemaining: number;
  isComplete: boolean;
}

interface Settings {
  instrument: string;
  volume: number;
  soundEffects: boolean;
  hapticFeedback: boolean;
  theme: 'dark' | 'light' | 'purple' | 'blue';
  notifications: boolean;
}

interface AppState {
  // User stats
  userStats: UserStats;
  updateUserStats: (updates: Partial<UserStats>) => void;
  addXP: (amount: number) => void;

  // Game state
  gameState: GameState | null;
  startGame: (mode: string, level: number, totalQuestions: number) => void;
  submitAnswer: (isCorrect: boolean, xp: number) => void;
  nextQuestion: () => void;
  endGame: () => void;

  // Settings
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;

  // Achievements
  unlockedAchievements: string[];
  unlockAchievement: (id: string) => void;
}

const getDefaultUserStats = (): UserStats => {
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
};

const getDefaultSettings = (): Settings => ({
  instrument: 'piano',
  volume: 0.7,
  soundEffects: true,
  hapticFeedback: true,
  theme: 'dark',
  notifications: true,
});

export const useGameStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User stats
      userStats: getDefaultUserStats(),
      updateUserStats: (updates) =>
        set((state) => ({
          userStats: { ...state.userStats, ...updates },
        })),
      addXP: (amount) =>
        set((state) => ({
          userStats: {
            ...state.userStats,
            totalXP: state.userStats.totalXP + amount,
          },
        })),

      // Game state
      gameState: null,
      startGame: (mode, level, totalQuestions) =>
        set({
          gameState: {
            mode,
            level,
            currentQuestion: 0,
            totalQuestions,
            score: 0,
            streak: 0,
            lives: mode === 'survival' ? 3 : -1,
            timeRemaining: mode === 'speedrun' ? 60 : mode === 'timeattack' ? 30 : -1,
            isComplete: false,
          },
        }),
      submitAnswer: (isCorrect, xp) =>
        set((state) => {
          if (!state.gameState) return {};

          const newStreak = isCorrect ? state.gameState.streak + 1 : 0;
          const newLives = state.gameState.lives > 0 && !isCorrect
            ? state.gameState.lives - 1
            : state.gameState.lives;

          return {
            gameState: {
              ...state.gameState,
              score: state.gameState.score + (isCorrect ? xp : 0),
              streak: newStreak,
              lives: newLives,
              isComplete: newLives === 0,
            },
            userStats: {
              ...state.userStats,
              totalQuestionsAnswered: state.userStats.totalQuestionsAnswered + 1,
              totalCorrect: state.userStats.totalCorrect + (isCorrect ? 1 : 0),
              totalIncorrect: state.userStats.totalIncorrect + (isCorrect ? 0 : 1),
              currentStreak: newStreak,
              longestStreak: Math.max(state.userStats.longestStreak, newStreak),
              totalXP: state.userStats.totalXP + (isCorrect ? xp : 0),
            },
          };
        }),
      nextQuestion: () =>
        set((state) => {
          if (!state.gameState) return {};

          const nextQ = state.gameState.currentQuestion + 1;
          const isComplete = nextQ >= state.gameState.totalQuestions;

          return {
            gameState: {
              ...state.gameState,
              currentQuestion: nextQ,
              isComplete,
            },
          };
        }),
      endGame: () =>
        set((state) => ({
          gameState: state.gameState
            ? { ...state.gameState, isComplete: true }
            : null,
          userStats: {
            ...state.userStats,
            sessionsPlayed: state.userStats.sessionsPlayed + 1,
            lastPlayedDate: new Date().toISOString().split('T')[0],
          },
        })),

      // Settings
      settings: getDefaultSettings(),
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      // Achievements
      unlockedAchievements: [],
      unlockAchievement: (id) =>
        set((state) => ({
          unlockedAchievements: state.unlockedAchievements.includes(id)
            ? state.unlockedAchievements
            : [...state.unlockedAchievements, id],
        })),
    }),
    {
      name: 'keyperfect-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
