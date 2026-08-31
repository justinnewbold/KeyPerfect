import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnswerRecord } from '../types/gameModes';

// Every persistence call is mocked so the tests assert what awardSession
// writes, not what localStorage ends up holding. getUserStats/getDailyStats
// return fixed baselines so the additive maths is checkable.
const storage = {
  getUserStats: vi.fn(() => ({
    totalXP: 100,
    currentLevel: 1,
    totalQuestionsAnswered: 10,
    totalCorrect: 6,
    totalIncorrect: 4,
    currentStreak: 2,
    longestStreak: 3,
    totalPlayTime: 60,
    sessionsPlayed: 1,
    lastPlayedDate: '2026-01-01',
    joinedDate: '2026-01-01',
  })),
  getDailyStats: vi.fn(() => ({ currentStreak: 5 })),
  updateUserStats: vi.fn((u: Record<string, unknown>) => u),
  checkAndUpdateDailyStreak: vi.fn(),
  updateGameModeStats: vi.fn(),
  addSessionToHistory: vi.fn(),
  updateWeeklyGoalProgress: vi.fn(),
  checkAndUnlockAchievements: vi.fn((): { id: string }[] => []),
  getLevelProgress: vi.fn((): { levelId: number; questionsCompleted: number; bestScore: number; timesCompleted: number }[] => []),
  updateLevelProgress: vi.fn(),
  getMusicKeysProgress: vi.fn((): { levelId: number; questionsCompleted: number; bestScore: number; timesCompleted: number }[] => []),
  updateMusicKeysProgress: vi.fn(),
  getNotesProgress: vi.fn((): { levelId: number; questionsCompleted: number; bestScore: number; timesCompleted: number }[] => []),
  updateNotesProgress: vi.fn(),
};

vi.mock('./storage', () => storage);

const { awardSession } = await import('./sessionResults');

function answer(isCorrect: boolean, xpEarned = 20, questionType?: string): AnswerRecord {
  return {
    questionId: `q${Math.random()}`,
    userAnswer: 'a',
    correctAnswer: isCorrect ? 'a' : 'b',
    isCorrect,
    timeToAnswer: 1000,
    xpEarned,
    questionType,
  };
}

function session(overrides: Partial<Parameters<typeof awardSession>[0]> = {}) {
  return awardSession({
    mode: 'chords',
    answers: [answer(true), answer(false, 0), answer(true)],
    score: 40,
    totalTime: 30,
    totalQuestions: 3,
    level: 1,
    ...overrides,
  });
}

describe('awardSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.getUserStats.mockReturnValue({
      totalXP: 100,
      currentLevel: 1,
      totalQuestionsAnswered: 10,
      totalCorrect: 6,
      totalIncorrect: 4,
      currentStreak: 2,
      longestStreak: 3,
      totalPlayTime: 60,
      sessionsPlayed: 1,
      lastPlayedDate: '2026-01-01',
      joinedDate: '2026-01-01',
    });
    storage.getDailyStats.mockReturnValue({ currentStreak: 5 });
    storage.checkAndUnlockAchievements.mockReturnValue([]);
    storage.getLevelProgress.mockReturnValue([]);
    storage.getMusicKeysProgress.mockReturnValue([]);
    storage.getNotesProgress.mockReturnValue([]);
  });

  describe('result computation', () => {
    it('sums XP from the answers', () => {
      expect(session().totalXPEarned).toBe(40);
    });

    it('reports accuracy as correct over answered, not derived from score', () => {
      const result = session({ score: 9999 });
      expect(result.correctAnswers).toBe(2);
      expect(result.totalQuestions).toBe(3);
      expect(result.accuracy).toBeCloseTo(66.667, 2);
    });

    it('never exceeds 100% accuracy however high the score', () => {
      const result = session({ answers: [answer(true), answer(true)], score: 100000 });
      expect(result.accuracy).toBe(100);
    });

    it('reports the longest run of correct answers, not the final run', () => {
      const result = session({
        answers: [answer(true), answer(true), answer(true), answer(false), answer(true)],
      });
      expect(result.longestStreak).toBe(3);
    });

    it('handles a session with no answers without dividing by zero', () => {
      const result = session({ answers: [] });
      expect(result.accuracy).toBe(0);
      expect(result.averageResponseTime).toBe(30);
    });

    it('groups the category breakdown by question type, falling back to mode', () => {
      // The mode differs from the answers' questionType so the fallback is
      // actually distinguishable: two typed answers group under 'chords', the
      // untyped one under the mode.
      const result = session({
        mode: 'intervals',
        answers: [answer(true, 20, 'chords'), answer(false, 0, 'chords'), answer(true, 20)],
      });
      const byCategory = Object.fromEntries(result.categoryBreakdown.map(c => [c.category, c]));
      expect(byCategory.chords).toMatchObject({ correct: 1, total: 2, accuracy: 50 });
      expect(byCategory.intervals).toMatchObject({ correct: 1, total: 1, accuracy: 100 });
    });
  });

  describe('persistence', () => {
    it('adds XP and counts on top of the existing stats', () => {
      session();
      expect(storage.updateUserStats).toHaveBeenCalledWith(
        expect.objectContaining({
          totalXP: 140,
          totalQuestionsAnswered: 13,
          totalCorrect: 8,
          totalIncorrect: 5,
          sessionsPlayed: 2,
          totalPlayTime: 90,
        }),
      );
    });

    it('syncs currentStreak to the daily streak, not the in-session run', () => {
      session();
      expect(storage.updateUserStats).toHaveBeenCalledWith(
        expect.objectContaining({ currentStreak: 5 }),
      );
    });

    it('keeps the previous longest streak when this session was worse', () => {
      session({ answers: [answer(true), answer(false, 0)] });
      expect(storage.updateUserStats).toHaveBeenCalledWith(
        expect.objectContaining({ longestStreak: 3 }),
      );
    });

    it('records the daily streak, history and weekly goals', () => {
      session();
      expect(storage.checkAndUpdateDailyStreak).toHaveBeenCalled();
      expect(storage.addSessionToHistory).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'chords', correctAnswers: 2, xpEarned: 40 }),
      );
      expect(storage.updateWeeklyGoalProgress).toHaveBeenCalledWith('questions', 3);
      expect(storage.updateGameModeStats).toHaveBeenCalledWith('chords', 40, 30);
    });

    it('does not touch the daily streak when nothing was answered', () => {
      session({ answers: [] });
      expect(storage.checkAndUpdateDailyStreak).not.toHaveBeenCalled();
      expect(storage.updateWeeklyGoalProgress).not.toHaveBeenCalled();
    });
  });

  describe('practice mode', () => {
    it('persists nothing at all', () => {
      session({ isPracticeMode: true });
      expect(storage.updateUserStats).not.toHaveBeenCalled();
      expect(storage.checkAndUpdateDailyStreak).not.toHaveBeenCalled();
      expect(storage.addSessionToHistory).not.toHaveBeenCalled();
      expect(storage.updateGameModeStats).not.toHaveBeenCalled();
      expect(storage.updateWeeklyGoalProgress).not.toHaveBeenCalled();
      expect(storage.updateLevelProgress).not.toHaveBeenCalled();
      expect(storage.checkAndUnlockAchievements).not.toHaveBeenCalled();
    });

    it('still returns a complete result so the summary screen works', () => {
      const result = session({ isPracticeMode: true });
      expect(result.totalXPEarned).toBe(40);
      expect(result.accuracy).toBeCloseTo(66.667, 2);
      expect(result.newAchievements).toEqual([]);
    });
  });

  describe('level progress', () => {
    it('writes level progress for a normal levelled mode', () => {
      session({ mode: 'chords', level: 1 });
      expect(storage.updateLevelProgress).toHaveBeenCalled();
    });

    it('skips level progress entirely when the mode has no level', () => {
      // Reverse Mode and Melodic Dictation have no level; writing progress
      // would inflate level 1's completion percentage.
      const result = session({ mode: 'reverse', level: undefined });
      expect(storage.updateLevelProgress).not.toHaveBeenCalled();
      expect(storage.updateMusicKeysProgress).not.toHaveBeenCalled();
      expect(storage.updateNotesProgress).not.toHaveBeenCalled();
      expect(result.level).toBe(0);
    });

    it('skips level progress for challenge modes', () => {
      session({ mode: 'speedrun', level: 1 });
      expect(storage.updateLevelProgress).not.toHaveBeenCalled();
    });

    it('routes music keys and notes to their own progress stores', () => {
      session({ mode: 'musickeys', level: 2 });
      expect(storage.updateMusicKeysProgress).toHaveBeenCalled();
      expect(storage.updateLevelProgress).not.toHaveBeenCalled();

      vi.clearAllMocks();
      storage.getNotesProgress.mockReturnValue([]);
      storage.getUserStats.mockReturnValue({
        totalXP: 0, currentLevel: 1, totalQuestionsAnswered: 0, totalCorrect: 0,
        totalIncorrect: 0, currentStreak: 0, longestStreak: 0, totalPlayTime: 0,
        sessionsPlayed: 0, lastPlayedDate: '', joinedDate: '',
      });
      storage.getDailyStats.mockReturnValue({ currentStreak: 0 });
      session({ mode: 'notes', level: 2 });
      expect(storage.updateNotesProgress).toHaveBeenCalled();
    });
  });

  it('reports newly unlocked achievements by id', () => {
    storage.checkAndUnlockAchievements.mockReturnValue([{ id: 'first_win' }, { id: 'streak_5' }]);
    expect(session().newAchievements).toEqual(['first_win', 'streak_5']);
  });
});
