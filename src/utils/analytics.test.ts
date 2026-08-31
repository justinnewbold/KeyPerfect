import { describe, it, expect } from 'vitest';
import {
  accuracyImprovement,
  accuracySeries,
  bucketByDay,
  rangeDays,
} from './analytics';
import { PracticeSession, localDateKey, localDateKeyDaysAgo } from './storage';

const NOW = new Date(2026, 2, 10, 12, 0); // Tuesday 2026-03-10

function session(daysAgo: number, totalQuestions: number, correctAnswers: number): PracticeSession {
  return {
    id: `s${daysAgo}-${totalQuestions}`,
    date: localDateKeyDaysAgo(daysAgo, NOW),
    mode: 'chords',
    score: 0,
    totalQuestions,
    correctAnswers,
    accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
    duration: 60,
    xpEarned: 0,
    streak: 0,
  };
}

describe('bucketByDay', () => {
  it('returns one bucket per day, oldest first, ending today', () => {
    const buckets = bucketByDay([], 7, NOW);
    expect(buckets).toHaveLength(7);
    expect(buckets[0].date).toBe(localDateKeyDaysAgo(6, NOW));
    expect(buckets[6].date).toBe(localDateKey(NOW));
  });

  it('leaves unplayed days as null accuracy rather than zero', () => {
    // Plotting a rest day as 0% turns every gap into a crash in the line.
    const buckets = bucketByDay([session(0, 10, 8)], 3, NOW);
    expect(buckets.map(b => b.accuracy)).toEqual([null, null, 80]);
    expect(buckets.map(b => b.questions)).toEqual([0, 0, 10]);
  });

  it('weights a day by questions, not by session count', () => {
    // A 1-question session must not swing the day the way a 50-question one
    // does: 49/50 plus 0/1 is 96%, not the 50% a per-session mean would give.
    const buckets = bucketByDay([session(0, 50, 49), session(0, 1, 0)], 1, NOW);
    expect(buckets[0].questions).toBe(51);
    expect(buckets[0].accuracy).toBeCloseTo((49 / 51) * 100, 5);
  });

  it('labels each day with its real weekday', () => {
    // The heatmap used a hard-coded Mon-Sun, so the first value was captioned
    // "Mon" whatever day it actually was.
    const buckets = bucketByDay([], 3, NOW);
    expect(buckets.map(b => b.label)).toEqual(['Sun', 'Mon', 'Tue']);
  });

  it('ignores sessions outside the window', () => {
    const buckets = bucketByDay([session(30, 10, 10)], 7, NOW);
    expect(buckets.every(b => b.questions === 0)).toBe(true);
  });
});

describe('accuracySeries', () => {
  it('drops unplayed days', () => {
    const buckets = bucketByDay([session(4, 10, 5), session(0, 10, 9)], 7, NOW);
    expect(accuracySeries(buckets)).toEqual([50, 90]);
  });

  it('is empty for a user with no sessions', () => {
    expect(accuracySeries(bucketByDay([], 7, NOW))).toEqual([]);
  });
});

describe('accuracyImprovement', () => {
  it('reports the change across the range', () => {
    expect(accuracyImprovement([50, 70, 80])).toBe(30);
    expect(accuracyImprovement([80, 60])).toBe(-20);
  });

  it('reports nothing when there is nothing to compare', () => {
    // The badge sat beside the real accuracy number and was computed from a
    // fabricated series, so a user with zero sessions was shown a confident
    // improvement percentage.
    expect(accuracyImprovement([])).toBe(0);
    expect(accuracyImprovement([90])).toBe(0);
  });
});

describe('rangeDays', () => {
  it('covers a fixed window for week and month', () => {
    expect(rangeDays('week', [], NOW)).toBe(7);
    expect(rangeDays('month', [], NOW)).toBe(30);
  });

  it('spans the stored history for all', () => {
    // The 7D/30D/All buttons wrote timeRange and nothing ever read it, so all
    // three rendered the same chart.
    expect(rangeDays('all', [session(20, 5, 5)], NOW)).toBe(21);
  });

  it('caps a very long history', () => {
    expect(rangeDays('all', [session(400, 5, 5)], NOW)).toBe(90);
  });

  it('falls back to a week with no history', () => {
    expect(rangeDays('all', [], NOW)).toBe(7);
  });
});
