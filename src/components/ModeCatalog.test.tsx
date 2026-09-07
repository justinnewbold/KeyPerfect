import { describe, it, expect } from 'vitest';
import { matchesQuery } from './ModeCatalog';

describe('matchesQuery', () => {
  const freePlay = 'free play explore chords piano keyboard sandbox untimed';
  const timeAttack = 'time attack timed beat the clock fast';

  it('matches everything when the query is blank', () => {
    expect(matchesQuery(freePlay, '')).toBe(true);
    expect(matchesQuery(freePlay, '   ')).toBe(true);
  });

  it('matches on a word prefix', () => {
    expect(matchesQuery(freePlay, 'chord')).toBe(true);
    expect(matchesQuery(freePlay, 'pian')).toBe(true);
  });

  it('does not match mid-word', () => {
    // A plain substring test made a search for "timed" return the untimed tile.
    expect(matchesQuery(freePlay, 'timed')).toBe(false);
    expect(matchesQuery(timeAttack, 'timed')).toBe(true);
  });

  it('narrows as terms are added', () => {
    expect(matchesQuery(timeAttack, 'fast')).toBe(true);
    expect(matchesQuery(timeAttack, 'fast clock')).toBe(true);
    expect(matchesQuery(timeAttack, 'fast piano')).toBe(false);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(matchesQuery(timeAttack, '  TIME  ')).toBe(true);
  });

  it('treats regex metacharacters as literal text', () => {
    expect(matchesQuery(timeAttack, '(')).toBe(false);
    expect(matchesQuery('7th chords', '7th')).toBe(true);
  });
});
