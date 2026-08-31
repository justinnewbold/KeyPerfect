import { PracticeSession, localDateKey, localDateKeyDaysAgo } from './storage';

export type TimeRange = 'week' | 'month' | 'all';

/** How many days back each range covers. 'all' spans the stored history. */
const RANGE_DAYS: Record<Exclude<TimeRange, 'all'>, number> = { week: 7, month: 30 };

/** The widest 'all' window worth plotting; beyond this the chart is a smear. */
const MAX_ALL_DAYS = 90;

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface DayBucket {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  /** Three-letter weekday name for that date. */
  label: string;
  questions: number;
  correct: number;
  /**
   * Questions-weighted accuracy for the day, or null when nothing was played.
   * Null rather than 0 so an unplayed day reads as a gap, not as a bad day.
   */
  accuracy: number | null;
}

/** How many days `range` should cover, given the history available. */
export function rangeDays(range: TimeRange, sessions: PracticeSession[], now = new Date()): number {
  if (range !== 'all') return RANGE_DAYS[range];
  if (sessions.length === 0) return RANGE_DAYS.week;

  const today = localDateKey(now);
  const oldest = sessions.reduce((min, s) => (s.date && s.date < min ? s.date : min), today);
  for (let days = 1; days <= MAX_ALL_DAYS; days++) {
    if (localDateKeyDaysAgo(days - 1, now) <= oldest) return days;
  }
  return MAX_ALL_DAYS;
}

/**
 * One bucket per calendar day over the last `days`, oldest first, including
 * days with no sessions.
 *
 * Accuracy is weighted by questions rather than averaged across sessions, so a
 * 1-question session cannot swing a day the way a 50-question one does.
 */
export function bucketByDay(
  sessions: PracticeSession[],
  days: number,
  now = new Date()
): DayBucket[] {
  const byDate = new Map<string, { questions: number; correct: number }>();
  for (const session of sessions) {
    const entry = byDate.get(session.date) || { questions: 0, correct: 0 };
    entry.questions += session.totalQuestions;
    entry.correct += session.correctAnswers;
    byDate.set(session.date, entry);
  }

  const buckets: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = localDateKeyDaysAgo(i, now);
    const totals = byDate.get(date) || { questions: 0, correct: 0 };
    buckets.push({
      date,
      // Parsed as local midnight, matching how localDateKey built the string.
      label: WEEKDAY_LABELS[new Date(`${date}T00:00:00`).getDay()],
      questions: totals.questions,
      correct: totals.correct,
      accuracy: totals.questions > 0 ? (totals.correct / totals.questions) * 100 : null,
    });
  }
  return buckets;
}

/**
 * Accuracy for each day that was actually played, oldest first.
 *
 * Unplayed days are dropped rather than plotted as zero: a rest day is not a
 * 0% day, and drawing it as one turns every gap into a crash in the line.
 */
export function accuracySeries(buckets: DayBucket[]): number[] {
  return buckets.filter(b => b.accuracy !== null).map(b => Math.round(b.accuracy!));
}

/**
 * Change in accuracy across the range, in points. Zero unless there are at
 * least two played days to compare — with one session there is no trend, and
 * reporting one is how the old code showed a confident "+12%" to a user who
 * had answered nothing at all.
 */
export function accuracyImprovement(series: number[]): number {
  if (series.length < 2) return 0;
  return Math.round(series[series.length - 1] - series[0]);
}
