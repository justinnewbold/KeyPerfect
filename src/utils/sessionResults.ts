import {
  AnswerRecord,
  ChallengeModeType,
  GameModeType,
  GameResult,
} from '../types/gameModes';
import { LEVELS } from '../types/levels';
import { getLevelFromXP } from '../types/stats';
import {
  addSessionToHistory,
  checkAndUnlockAchievements,
  checkAndUpdateDailyStreak,
  getDailyStats,
  getLevelProgress,
  getMusicKeysProgress,
  getNotesProgress,
  getUserStats,
  updateGameModeStats,
  updateLevelProgress,
  updateMusicKeysProgress,
  updateNotesProgress,
  updateUserStats,
  updateWeeklyGoalProgress,
  localDateKey,
} from './storage';

export interface SessionInput {
  mode: GameModeType | ChallengeModeType;
  answers: AnswerRecord[];
  /** The mode's own score, which is not necessarily the sum of xpEarned. */
  score: number;
  /** Elapsed session time in seconds. */
  totalTime: number;
  /** Target question count, used to decide whether the session was finished. */
  totalQuestions: number;
  /**
   * Omit for modes that don't map to a level. Level progress is then skipped,
   * which is what keeps a standalone mode from writing bogus level-1 progress
   * and inflating the LevelSelect percentages.
   */
  level?: number;
  /** Survival's lives, which also mark a session as finished when exhausted. */
  lives?: number;
  isPracticeMode?: boolean;
  /**
   * Set when the player chose to stop before the session was over. The
   * session is still awarded — they answered those questions — but the
   * result is reported as an early exit rather than a completed run, so the
   * results screen doesn't congratulate someone on "completing" a level they
   * walked out of after five questions.
   */
  endedEarly?: boolean;
}

/**
 * Award and persist a completed session, and build its GameResult.
 *
 * This is the single place the app turns a finished session into XP, stats,
 * streaks, level progress, history, weekly-goal progress and achievements. It
 * lives outside useGameState so that screens which generate their own
 * questions (Reverse Mode, Melodic Dictation) can award identically to the
 * modes driven by that hook, rather than silently awarding nothing.
 *
 * It does NOT record per-item stats (updateChordStats, updateReviewItem and
 * friends). Those are per-answer and belong to whatever grades each question —
 * useGameState.submitAnswer for hook-driven modes, the screen itself for
 * standalone ones.
 *
 * Callers are responsible for calling this exactly once per session.
 */
export function awardSession(input: SessionInput): GameResult {
  const {
    mode,
    answers,
    score,
    totalTime,
    totalQuestions,
    level,
    lives = 0,
    isPracticeMode = false,
    endedEarly = false,
  } = input;

  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const totalXPEarned = answers.reduce((sum, a) => sum + a.xpEarned, 0);
  const accuracy = answers.length > 0 ? (correctAnswers / answers.length) * 100 : 0;

  // Calculate longest streak from answers
  let longestStreak = 0;
  let runningStreak = 0;
  answers.forEach(a => {
    if (a.isCorrect) {
      runningStreak++;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  });

  // Practice Mode advertises 'No XP' on the GameScreen badge - honour
  // that by skipping the persistence side effects entirely. The result
  // is still computed and shown on the result screen, but XP, level
  // progress, game-mode stats, session history, weekly goals, and
  // achievement unlocks all stay untouched.
  const isPractice = isPracticeMode;

  // Mark today as played for the daily login streak. Previously this
  // only fired when the user started the Daily Challenge mode (see
  // App.tsx handleStartChallenge), so a player who practised Chords
  // every day and never opened the Daily Challenge tile kept the
  // 'Play X days in a row' achievements at zero. Calling it here is
  // idempotent within the same UTC day so the existing daily-mode
  // call still works fine.
  if (!isPractice && answers.length > 0) {
    checkAndUpdateDailyStreak();
  }

  // Update user stats.
  // currentStreak reflects daily play streak (see AnalyticsDashboard "days in a row"),
  // so keep it synced with DailyStats rather than the per-session answer streak.
  const userStats = getUserStats();
  const dailyStats = getDailyStats();
  const updatedStats = isPractice
    ? userStats
    : updateUserStats({
        totalXP: userStats.totalXP + totalXPEarned,
        totalQuestionsAnswered: userStats.totalQuestionsAnswered + answers.length,
        totalCorrect: userStats.totalCorrect + correctAnswers,
        totalIncorrect: userStats.totalIncorrect + (answers.length - correctAnswers),
        currentStreak: dailyStats.currentStreak,
        longestStreak: Math.max(userStats.longestStreak, longestStreak),
        currentLevel: getLevelFromXP(userStats.totalXP + totalXPEarned),
        // sessionsPlayed and totalPlayTime are read by StatsScreen (Games Played
        // / Minutes Played); without bumping them here they sat at 0 forever.
        sessionsPlayed: userStats.sessionsPlayed + 1,
        totalPlayTime: userStats.totalPlayTime + totalTime,
        lastPlayedDate: localDateKey(),
      });

  // Update level progress. Take the max of the existing high-water mark
  // and this session, and bump timesCompleted whenever the player actually
  // played through the whole level (rather than rage-quitting). Without
  // this, bestScore / questionsCompleted regressed on every session and
  // timesCompleted never left zero - so the level-complete check marks,
  // 'X / N levels' counters, and level_complete_* achievements all
  // stayed dark even after finishing a level cleanly.
  const finishedFullSession =
    !endedEarly && (answers.length >= totalQuestions || (mode === 'survival' && lives <= 0));

  if (!isPractice) {
    // A mode without a level (Reverse Mode, Melodic Dictation) has no level
    // progress to write; see SessionInput.level.
    if (level === undefined) {
      // nothing to record
    } else if (mode === 'musickeys') {
      const prev = getMusicKeysProgress().find(p => p.levelId === level);
      updateMusicKeysProgress(level, {
        questionsCompleted: Math.max(prev?.questionsCompleted ?? 0, correctAnswers),
        bestScore: Math.max(prev?.bestScore ?? 0, score),
        timesCompleted: (prev?.timesCompleted ?? 0) + (finishedFullSession ? 1 : 0),
      });
    } else if (mode === 'notes') {
      const prev = getNotesProgress().find(p => p.levelId === level);
      updateNotesProgress(level, {
        questionsCompleted: Math.max(prev?.questionsCompleted ?? 0, correctAnswers),
        bestScore: Math.max(prev?.bestScore ?? 0, score),
        timesCompleted: (prev?.timesCompleted ?? 0) + (finishedFullSession ? 1 : 0),
      });
    } else {
      // Challenge modes (daily / speedrun / survival / timeattack) all
      // run on level=1 with overridden totalQuestions (10 / 50 / 100), so
      // their correctAnswers regularly exceeds level 1's questionsToComplete
      // (20). Writing those into LEVEL_PROGRESS made the LevelSelect
      // percentage shoot past 100% (e.g. 50/20 = 250%) and inflated
      // timesCompleted with sessions that weren't actually that level.
      const isChallengeMode =
        mode === 'daily' ||
        mode === 'speedrun' ||
        mode === 'survival' ||
        mode === 'timeattack';
      if (!isChallengeMode) {
        const levelConfig = LEVELS.find(l => l.id === level);
        if (levelConfig) {
          const prev = getLevelProgress().find(p => p.levelId === level);
          const cap = levelConfig.questionsToComplete;
          updateLevelProgress(level, {
            questionsCompleted: Math.min(
              cap,
              Math.max(prev?.questionsCompleted ?? 0, correctAnswers)
            ),
            bestScore: Math.max(prev?.bestScore ?? 0, score),
            timesCompleted: (prev?.timesCompleted ?? 0) + (finishedFullSession ? 1 : 0),
          });
        }
      }
    }

    // Update game mode stats
    updateGameModeStats(mode, score, totalTime);

    // Save session to history
    addSessionToHistory({
      date: localDateKey(),
      mode,
      score,
      totalQuestions: answers.length,
      correctAnswers,
      accuracy,
      duration: Math.round(totalTime),
      xpEarned: totalXPEarned,
      streak: longestStreak,
    });

    // Update weekly goal progress. Without this, updateWeeklyGoalProgress
    // was never called from anywhere, so a goal set in the Weekly Goals UI
    // sat at 0 / target forever and totalWeeksCompleted never increased.
    if (answers.length > 0) {
      updateWeeklyGoalProgress('questions', answers.length);
      updateWeeklyGoalProgress('minutes', totalTime / 60);
      updateWeeklyGoalProgress('accuracy', accuracy);
      updateWeeklyGoalProgress('streak', longestStreak);
    }
  }

  // Check for new achievements (no-op in practice mode since stats
  // didn't change, but keep the call to keep the result shape stable).
  const newAchievements = isPractice ? [] : checkAndUnlockAchievements(updatedStats);

  /*
   * Pay out the achievements that just unlocked.
   *
   * Every achievement carries an xpReward and the results screen prints it
   * next to the badge ("First Steps +50"), but nothing ever added it to the
   * player's total — so an unlock that advertised +150 XP moved the counter
   * by zero, and the number on the screen was simply untrue. Award it here,
   * once, in the same place the unlock is recorded.
   */
  const achievementXP = newAchievements.reduce((sum, a) => sum + (a.xpReward || 0), 0);
  if (achievementXP > 0) {
    const withAchievements = updatedStats.totalXP + achievementXP;
    updateUserStats({
      totalXP: withAchievements,
      currentLevel: getLevelFromXP(withAchievements),
    });
  }

  // Build category breakdown for session summary
  const categoryMap = new Map<string, { correct: number; total: number }>();
  for (const answer of answers) {
    const cat = answer.questionType || mode;
    const entry = categoryMap.get(cat) || { correct: 0, total: 0 };
    entry.total++;
    if (answer.isCorrect) entry.correct++;
    categoryMap.set(cat, entry);
  }
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    correct: data.correct,
    total: data.total,
    accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
  }));

  return {
    mode,
    // Modes without a level report 0; ResultScreen's next-level unlock is
    // optional and those screens don't pass onNextLevel.
    level: level ?? 0,
    score,
    /*
     * A timed mode is over when its clock is, however many questions that
     * turned out to be — Speed Run's 50 is a ceiling, not a target — so
     * running it to the buzzer counts as completed. Everything else has to
     * reach its last question (or, in Survival, lose its last life).
     */
    completed:
      finishedFullSession ||
      (!endedEarly && (mode === 'speedrun' || mode === 'timeattack')),
    /** How long the session was meant to run, for "5 of 20" reporting. */
    plannedQuestions: totalQuestions,
    totalQuestions: answers.length,
    correctAnswers,
    accuracy,
    totalXPEarned,
    achievementXP,
    longestStreak,
    totalTime,
    averageResponseTime: totalTime / Math.max(1, answers.length),
    newAchievements: newAchievements.map(a => a.id),
    answers,
    categoryBreakdown,
  };
}
