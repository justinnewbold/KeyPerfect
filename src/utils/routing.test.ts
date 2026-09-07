import { describe, it, expect } from 'vitest';
import { screenFromHash, hashForScreen, slugForScreen, isRoutable, ROUTABLE_SCREENS } from './routing';

describe('routing', () => {
  it('round-trips every routable screen', () => {
    for (const screen of Object.keys(ROUTABLE_SCREENS)) {
      const hash = hashForScreen(screen)!;
      expect(hash, screen).toBeTruthy();
      expect(screenFromHash(hash), screen).toBe(screen);
    }
  });

  it('accepts the hash forms a user might actually paste', () => {
    expect(screenFromHash('#/tools')).toBe('tools');
    expect(screenFromHash('#tools')).toBe('tools');
    expect(screenFromHash('#/tools/')).toBe('tools');
    expect(screenFromHash('#/TOOLS')).toBe('tools');
    expect(screenFromHash('  #/tools  ')).toBe('tools');
  });

  it('ignores an empty or unrecognised hash instead of breaking', () => {
    expect(screenFromHash('')).toBeNull();
    expect(screenFromHash('#')).toBeNull();
    expect(screenFromHash('#/')).toBeNull();
    expect(screenFromHash('#/not-a-screen')).toBeNull();
    expect(screenFromHash('#/../../etc/passwd')).toBeNull();
  });

  it('gives a mid-round refresh the ladder it was started from', () => {
    // There is no honest URL for "question 7 of a round you left", so the
    // fallback is one tap from where the player was.
    expect(slugForScreen('game')).toBe('play');
    expect(slugForScreen('musicKeysGame')).toBe('music-keys');
    expect(slugForScreen('notesGame')).toBe('notes');
    expect(slugForScreen('result')).toBe('home');
    expect(slugForScreen('mistakeReview')).toBe('home');
  });

  it('knows which screens are addressable', () => {
    expect(isRoutable('tools')).toBe(true);
    expect(isRoutable('game')).toBe(false);
    expect(isRoutable('result')).toBe(false);
  });

  it('has no duplicate slugs', () => {
    const slugs = Object.values(ROUTABLE_SCREENS);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
