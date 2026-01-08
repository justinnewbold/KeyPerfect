import { describe, it, expect } from 'vitest';
import {
  randomInt,
  randomElement,
  shuffleArray,
  getChordNotes,
  getScaleNotes,
  getIntervalNotes,
  formatTime,
  formatNumber,
  getDisplayName,
  GENRE_CONTENT,
} from './gameHelpers';

describe('gameHelpers', () => {
  describe('randomInt', () => {
    it('should return a number within the range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(1, 10);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(10);
      }
    });

    it('should return the same number when min equals max', () => {
      expect(randomInt(5, 5)).toBe(5);
    });
  });

  describe('randomElement', () => {
    it('should return an element from the array', () => {
      const arr = ['a', 'b', 'c'];
      for (let i = 0; i < 50; i++) {
        expect(arr).toContain(randomElement(arr));
      }
    });
  });

  describe('shuffleArray', () => {
    it('should return an array with the same elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(arr);
      expect(shuffled).toHaveLength(arr.length);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it('should not modify the original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffleArray(arr);
      expect(arr).toEqual(original);
    });
  });

  describe('getChordNotes', () => {
    it('should return correct notes for major chord', () => {
      const notes = getChordNotes(60, 'major'); // C4
      expect(notes).toEqual([60, 64, 67]); // C, E, G
    });

    it('should return correct notes for minor chord', () => {
      const notes = getChordNotes(60, 'minor'); // C4
      expect(notes).toEqual([60, 63, 67]); // C, Eb, G
    });

    it('should return correct notes for diminished chord', () => {
      const notes = getChordNotes(60, 'diminished'); // C4
      expect(notes).toEqual([60, 63, 66]); // C, Eb, Gb
    });

    it('should return correct notes for augmented chord', () => {
      const notes = getChordNotes(60, 'augmented'); // C4
      expect(notes).toEqual([60, 64, 68]); // C, E, G#
    });

    it('should return correct notes for dominant7 chord', () => {
      const notes = getChordNotes(60, 'dominant7'); // C4
      expect(notes).toEqual([60, 64, 67, 70]); // C, E, G, Bb
    });

    it('should handle first inversion', () => {
      const notes = getChordNotes(60, 'major', 'first');
      expect(notes).toHaveLength(3);
      expect(Math.min(...notes)).toBe(64); // E is now the bass
    });

    it('should handle second inversion', () => {
      const notes = getChordNotes(60, 'major', 'second');
      expect(notes).toHaveLength(3);
      expect(Math.min(...notes)).toBe(67); // G is now the bass
    });
  });

  describe('getScaleNotes', () => {
    it('should return correct notes for major scale', () => {
      const notes = getScaleNotes(60, 'major'); // C major
      expect(notes).toEqual([60, 62, 64, 65, 67, 69, 71]); // C, D, E, F, G, A, B
    });

    it('should return correct notes for natural minor scale', () => {
      const notes = getScaleNotes(60, 'natural_minor'); // C natural minor
      expect(notes).toEqual([60, 62, 63, 65, 67, 68, 70]); // C, D, Eb, F, G, Ab, Bb
    });

    it('should return correct notes for pentatonic major', () => {
      const notes = getScaleNotes(60, 'pentatonic_major');
      expect(notes).toEqual([60, 62, 64, 67, 69]); // C, D, E, G, A
    });

    it('should return correct notes for blues scale', () => {
      const notes = getScaleNotes(60, 'blues');
      expect(notes).toEqual([60, 63, 65, 66, 67, 70]); // C, Eb, F, F#, G, Bb
    });
  });

  describe('getIntervalNotes', () => {
    it('should return correct notes for unison', () => {
      const notes = getIntervalNotes(60, 'unison');
      expect(notes).toEqual([60, 60]);
    });

    it('should return correct notes for perfect fifth', () => {
      const notes = getIntervalNotes(60, 'perfect5');
      expect(notes).toEqual([60, 67]);
    });

    it('should return correct notes for octave', () => {
      const notes = getIntervalNotes(60, 'octave');
      expect(notes).toEqual([60, 72]);
    });

    it('should return correct notes for tritone', () => {
      const notes = getIntervalNotes(60, 'tritone');
      expect(notes).toEqual([60, 66]);
    });
  });

  describe('formatTime', () => {
    it('should format seconds correctly', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(125)).toBe('2:05');
    });
  });

  describe('formatNumber', () => {
    it('should format small numbers without suffix', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatNumber(1000)).toBe('1.0K');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(10000)).toBe('10.0K');
    });

    it('should format millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(2500000)).toBe('2.5M');
    });
  });

  describe('getDisplayName', () => {
    it('should return chord display name', () => {
      expect(getDisplayName('major', 'chord')).toBe('Major');
      expect(getDisplayName('minor7', 'chord')).toBe('Minor 7th');
    });

    it('should return scale display name', () => {
      expect(getDisplayName('major', 'scale')).toBe('Major (Ionian)');
      expect(getDisplayName('blues', 'scale')).toBe('Blues');
    });

    it('should return interval display name', () => {
      expect(getDisplayName('perfect5', 'interval')).toBe('Perfect 5th');
      expect(getDisplayName('tritone', 'interval')).toBe('Tritone');
    });
  });

  describe('GENRE_CONTENT', () => {
    it('should have jazz content defined', () => {
      expect(GENRE_CONTENT.jazz).toBeDefined();
      expect(GENRE_CONTENT.jazz.chords.length).toBeGreaterThan(0);
      expect(GENRE_CONTENT.jazz.scales.length).toBeGreaterThan(0);
      expect(GENRE_CONTENT.jazz.progressions.length).toBeGreaterThan(0);
    });

    it('should have blues content defined', () => {
      expect(GENRE_CONTENT.blues).toBeDefined();
      expect(GENRE_CONTENT.blues.chords).toContain('dominant7');
    });

    it('should have pop content defined', () => {
      expect(GENRE_CONTENT.pop).toBeDefined();
      expect(GENRE_CONTENT.pop.chords).toContain('major');
      expect(GENRE_CONTENT.pop.chords).toContain('minor');
    });

    it('should have classical content defined', () => {
      expect(GENRE_CONTENT.classical).toBeDefined();
      expect(GENRE_CONTENT.classical.progressions).toContain('I-IV-V-I');
    });
  });
});
