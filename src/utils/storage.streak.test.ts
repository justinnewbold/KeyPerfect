import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  checkAndUpdateDailyStreak,
  updateDailyStats,
  getStreakFreezeData,
  localDateKey,
  localDateKeyDaysAgo,
  setWeeklyGoals,
  updateWeeklyGoalProgress,
  getWeeklyGoals,
} = await import('./storage');

/** Put the streak in a known state without going through a whole session. */
function seed(lastPlayedDate: string, currentStreak: number) {
  updateDailyStats({ lastPlayedDate, currentStreak });
}

describe('daily streak', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('extends when the previous session was yesterday', () => {
    seed(localDateKeyDaysAgo(1), 4);
    expect(checkAndUpdateDailyStreak().currentStreak).toBe(5);
  });

  it('is idempotent within the same day', () => {
    seed(localDateKeyDaysAgo(1), 4);
    expect(checkAndUpdateDailyStreak().currentStreak).toBe(5);
    expect(checkAndUpdateDailyStreak().currentStreak).toBe(5);
    expect(checkAndUpdateDailyStreak().currentStreak).toBe(5);
  });

  it('survives two sessions on consecutive evenings', () => {
    // The UTC bug: at UTC-7, Monday 10am and Tuesday 6pm stamped as Monday
    // and Wednesday, so a genuine two-day streak reset to 1.
    vi.useFakeTimers();

    vi.setSystemTime(new Date(2026, 2, 9, 10, 0)); // Monday morning
    seed(localDateKeyDaysAgo(1), 1);
    const monday = checkAndUpdateDailyStreak().currentStreak;

    vi.setSystemTime(new Date(2026, 2, 10, 18, 30)); // Tuesday evening
    const tuesday = checkAndUpdateDailyStreak().currentStreak;

    expect(tuesday).toBe(monday + 1);
  });

  it('bridges exactly one missed day with a freeze', () => {
    seed(localDateKeyDaysAgo(2), 9);
    expect(getStreakFreezeData().freezesAvailable).toBe(1);
    expect(checkAndUpdateDailyStreak().currentStreak).toBe(10);
    expect(getStreakFreezeData().freezesAvailable).toBe(0);
  });

  it('does not bridge a larger gap', () => {
    // The freeze used to cover any gap, so a once-a-week player accumulated
    // a "30 day streak" and a six-month absence resumed the old streak + 1.
    seed(localDateKeyDaysAgo(7), 30);
    expect(checkAndUpdateDailyStreak().currentStreak).toBe(1);
  });

  it('does not bridge a gap of months', () => {
    seed(localDateKeyDaysAgo(180), 30);
    expect(checkAndUpdateDailyStreak().currentStreak).toBe(1);
  });

  it('does not spend a freeze on a brand-new user', () => {
    // A new user's lastPlayedDate is '', which used to take the freeze
    // branch and burn the weekly allowance for no benefit — the streak is 1
    // either way.
    expect(checkAndUpdateDailyStreak().currentStreak).toBe(1);
    expect(getStreakFreezeData().freezesAvailable).toBe(1);
  });

  it('records today as the last played date', () => {
    seed(localDateKeyDaysAgo(1), 1);
    expect(checkAndUpdateDailyStreak().lastPlayedDate).toBe(localDateKey());
  });
});

describe('weekly goals', () => {
  /** Force the stored goals into a previous week so the next read rolls over. */
  function ageToLastWeek() {
    const raw = JSON.parse(localStorage.getItem('keyperfect_weekly_goals')!);
    raw.weekStart = '1999-01-04';
    localStorage.setItem('keyperfect_weekly_goals', JSON.stringify(raw));
  }

  it('averages accuracy across the sessions in the current week', () => {
    setWeeklyGoals([{ type: 'accuracy', target: 80 }]);
    updateWeeklyGoalProgress('accuracy', 100);
    updateWeeklyGoalProgress('accuracy', 60);
    const goal = getWeeklyGoals().goals[0];
    expect(goal.current).toBeCloseTo(80, 5);
  });

  it('does not carry last week session count into the new week', () => {
    // The rollover reset `current` but preserved `accuracySessions`, so a new
    // week averaged its first score against the old divisor: with 20 carried
    // over, a 100% session computed (0 * 20 + 100) / 21 ≈ 5 and the goal
    // could never be completed again.
    setWeeklyGoals([{ type: 'accuracy', target: 80 }]);
    for (let i = 0; i < 20; i++) updateWeeklyGoalProgress('accuracy', 90);
    ageToLastWeek();

    updateWeeklyGoalProgress('accuracy', 100);
    const goal = getWeeklyGoals().goals[0];
    expect(goal.current).toBeCloseTo(100, 5);
    expect(goal.completed).toBe(true);
  });

  it('resets counting goals on rollover', () => {
    setWeeklyGoals([{ type: 'questions', target: 50 }]);
    updateWeeklyGoalProgress('questions', 40);
    ageToLastWeek();

    updateWeeklyGoalProgress('questions', 5);
    expect(getWeeklyGoals().goals[0].current).toBe(5);
  });

  it('treats the streak goal as a high-water mark, not a sum', () => {
    setWeeklyGoals([{ type: 'streak', target: 10 }]);
    updateWeeklyGoalProgress('streak', 7);
    updateWeeklyGoalProgress('streak', 3);
    expect(getWeeklyGoals().goals[0].current).toBe(7);
  });
});
