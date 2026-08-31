import { describe, it, expect } from 'vitest';
import { LEVELS, estimatedSessionXP, sessionsToUnlock, getUnlockedLevels } from './levels';

describe('level unlocking', () => {
  const level1 = LEVELS[0];
  const level2 = LEVELS[1];

  it('puts the second level within one session of the first', () => {
    // A new player who finishes their first full round should be able to see
    // where the next step is, not a row of padlocks with no sense of scale.
    expect(level2.unlockRequirement).toBeLessThanOrEqual(estimatedSessionXP(level1));
    expect(sessionsToUnlock(level2, 0, level1)).toBe(1);
  });

  it('counts sessions down as XP accumulates', () => {
    const start = sessionsToUnlock(LEVELS[3], 0, level1);
    const later = sessionsToUnlock(LEVELS[3], LEVELS[3].unlockRequirement / 2, level1);

    expect(start).toBeGreaterThan(0);
    expect(later).toBeLessThan(start);
  });

  it('reports nothing left to do for a level already unlocked', () => {
    expect(sessionsToUnlock(level2, level2.unlockRequirement, level1)).toBe(0);
    expect(sessionsToUnlock(level1, 0, level1)).toBe(0);
  });

  it('never estimates a fractional or zero session while XP is still owed', () => {
    // One XP short is still a session away, not "0 more sessions".
    expect(sessionsToUnlock(level2, level2.unlockRequirement - 1, level1)).toBe(1);
  });

  it('keeps the ladder monotonic', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].unlockRequirement).toBeGreaterThan(LEVELS[i - 1].unlockRequirement);
    }
  });

  it('unlocks exactly the levels a total covers', () => {
    expect(getUnlockedLevels(0).map(l => l.id)).toEqual([1]);
    expect(getUnlockedLevels(level2.unlockRequirement).map(l => l.id)).toEqual([1, 2]);
  });
});
