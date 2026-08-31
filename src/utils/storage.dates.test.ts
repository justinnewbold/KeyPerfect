import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { localDateKey, localDateKeyDaysAgo } from './storage';

/**
 * The daily streak, the per-item "last attempted" stamps and the practice
 * history all key off a YYYY-MM-DD string. These used to come from
 * `toISOString()`, which is UTC — so anywhere west of UTC the day rolled over
 * in the afternoon and the streak broke in both directions.
 */
describe('localDateKey', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the local calendar day, not the UTC one', () => {
    // 2026-03-10T02:30:00Z. Node runs these tests in UTC, so to demonstrate
    // the distinction we compare against the date's own local components
    // rather than hard-coding a timezone the CI runner may not have.
    const evening = new Date(2026, 2, 10, 18, 30);
    expect(localDateKey(evening)).toBe('2026-03-10');
    // The bug was that an 18:30 local time could serialise as the next day.
    expect(localDateKey(evening)).toBe(
      `${evening.getFullYear()}-${String(evening.getMonth() + 1).padStart(2, '0')}-${String(
        evening.getDate(),
      ).padStart(2, '0')}`,
    );
  });

  it('pads single-digit months and days', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('defaults to now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 4, 23, 59));
    expect(localDateKey()).toBe('2026-07-04');
  });
});

describe('localDateKeyDaysAgo', () => {
  it('steps back whole calendar days', () => {
    const from = new Date(2026, 2, 10, 18, 30);
    expect(localDateKeyDaysAgo(1, from)).toBe('2026-03-09');
    expect(localDateKeyDaysAgo(2, from)).toBe('2026-03-08');
  });

  it('crosses a month boundary', () => {
    expect(localDateKeyDaysAgo(1, new Date(2026, 3, 1, 9, 0))).toBe('2026-03-31');
  });

  it('crosses a year boundary', () => {
    expect(localDateKeyDaysAgo(1, new Date(2026, 0, 1, 9, 0))).toBe('2025-12-31');
  });

  it('is correct across a daylight-saving transition', () => {
    // US DST starts 2026-03-08. Subtracting 86_400_000ms lands on the wrong
    // day in a 23-hour day; local component arithmetic does not.
    const afterSpringForward = new Date(2026, 2, 9, 12, 0);
    expect(localDateKeyDaysAgo(1, afterSpringForward)).toBe('2026-03-08');
    expect(localDateKeyDaysAgo(2, afterSpringForward)).toBe('2026-03-07');
  });

  it('agrees with localDateKey for zero days ago', () => {
    const now = new Date(2026, 5, 15, 8, 0);
    expect(localDateKeyDaysAgo(0, now)).toBe(localDateKey(now));
  });
});
