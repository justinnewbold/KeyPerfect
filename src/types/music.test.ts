import { describe, it, expect } from 'vitest';
import {
  NOTE_NAMES,
  CHORD_TYPES,
  SCALE_TYPES,
  INTERVALS,
  PROGRESSIONS,
  INVERSIONS,
  getNoteFromMidi,
  getMidiFromNote,
  getNoteName,
} from './music';

describe('music types', () => {
  describe('NOTE_NAMES', () => {
    it('should have 12 notes', () => {
      expect(NOTE_NAMES).toHaveLength(12);
    });

    it('should start with C', () => {
      expect(NOTE_NAMES[0]).toBe('C');
    });

    it('should include all chromatic notes', () => {
      expect(NOTE_NAMES).toContain('C');
      expect(NOTE_NAMES).toContain('C#');
      expect(NOTE_NAMES).toContain('D');
      expect(NOTE_NAMES).toContain('F#');
      expect(NOTE_NAMES).toContain('B');
    });
  });

  describe('CHORD_TYPES', () => {
    it('should have basic chord types', () => {
      expect(CHORD_TYPES.major).toBeDefined();
      expect(CHORD_TYPES.minor).toBeDefined();
      expect(CHORD_TYPES.diminished).toBeDefined();
      expect(CHORD_TYPES.augmented).toBeDefined();
    });

    it('should have correct intervals for major chord', () => {
      expect(CHORD_TYPES.major.intervals).toEqual([0, 4, 7]);
    });

    it('should have correct intervals for minor chord', () => {
      expect(CHORD_TYPES.minor.intervals).toEqual([0, 3, 7]);
    });

    it('should have jazz chord types', () => {
      expect(CHORD_TYPES.major7).toBeDefined();
      expect(CHORD_TYPES.minor7).toBeDefined();
      expect(CHORD_TYPES.dominant7).toBeDefined();
      expect(CHORD_TYPES.half_diminished7).toBeDefined();
    });

    it('should have extended jazz chords', () => {
      expect(CHORD_TYPES.dominant9).toBeDefined();
      expect(CHORD_TYPES.dominant11).toBeDefined();
      expect(CHORD_TYPES.dominant13).toBeDefined();
    });

    it('should have altered dominant chords', () => {
      expect(CHORD_TYPES.dominant7sharp9).toBeDefined();
      expect(CHORD_TYPES.dominant7flat9).toBeDefined();
      expect(CHORD_TYPES.dominant7alt).toBeDefined();
    });

    it('should have genre tags for chords', () => {
      expect(CHORD_TYPES.major.genre).toBe('basic');
      expect(CHORD_TYPES.dominant7.genre).toBe('blues');
      expect(CHORD_TYPES.major7.genre).toBe('jazz');
    });
  });

  describe('SCALE_TYPES', () => {
    it('should have basic scale types', () => {
      expect(SCALE_TYPES.major).toBeDefined();
      expect(SCALE_TYPES.natural_minor).toBeDefined();
      expect(SCALE_TYPES.harmonic_minor).toBeDefined();
    });

    it('should have correct intervals for major scale', () => {
      expect(SCALE_TYPES.major.intervals).toEqual([0, 2, 4, 5, 7, 9, 11]);
    });

    it('should have bebop scales', () => {
      expect(SCALE_TYPES.bebop_dominant).toBeDefined();
      expect(SCALE_TYPES.bebop_major).toBeDefined();
      expect(SCALE_TYPES.bebop_minor).toBeDefined();
    });

    it('should have world scales', () => {
      expect(SCALE_TYPES.phrygian_dominant).toBeDefined();
      expect(SCALE_TYPES.hungarian_minor).toBeDefined();
      expect(SCALE_TYPES.japanese).toBeDefined();
    });

    it('should have symmetric scales', () => {
      expect(SCALE_TYPES.whole_tone).toBeDefined();
      expect(SCALE_TYPES.diminished_whole_half).toBeDefined();
    });

    it('should have genre tags for scales', () => {
      expect(SCALE_TYPES.major.genre).toBe('basic');
      expect(SCALE_TYPES.bebop_dominant.genre).toBe('jazz');
      expect(SCALE_TYPES.phrygian_dominant.genre).toBe('world');
    });
  });

  describe('INTERVALS', () => {
    it('should have all 13 intervals', () => {
      expect(Object.keys(INTERVALS)).toHaveLength(13);
    });

    it('should have correct semitones for common intervals', () => {
      expect(INTERVALS.unison.semitones).toBe(0);
      expect(INTERVALS.minor2.semitones).toBe(1);
      expect(INTERVALS.major3.semitones).toBe(4);
      expect(INTERVALS.perfect5.semitones).toBe(7);
      expect(INTERVALS.octave.semitones).toBe(12);
    });

    it('should have song associations', () => {
      expect(INTERVALS.perfect5.description).toContain('Star Wars');
      expect(INTERVALS.perfect4.description).toContain('Bride');
    });
  });

  describe('PROGRESSIONS', () => {
    it('should have classic progressions', () => {
      expect(PROGRESSIONS['I-IV-V-I']).toBeDefined();
      expect(PROGRESSIONS['I-V-vi-IV']).toBeDefined();
    });

    it('should have jazz progressions', () => {
      expect(PROGRESSIONS['ii-V-I']).toBeDefined();
      expect(PROGRESSIONS['ii-V-I-VI']).toBeDefined();
      expect(PROGRESSIONS['iii-VI-ii-V']).toBeDefined();
    });

    it('should have blues progressions', () => {
      expect(PROGRESSIONS['I7-IV7-V7']).toBeDefined();
    });

    it('should have genre tags', () => {
      expect(PROGRESSIONS['ii-V-I'].genre).toBe('jazz');
      expect(PROGRESSIONS['I-V-vi-IV'].genre).toBe('pop');
      expect(PROGRESSIONS['I-IV-V-I'].genre).toBe('classical');
    });
  });

  describe('INVERSIONS', () => {
    it('should have all inversion types', () => {
      expect(INVERSIONS.root).toBeDefined();
      expect(INVERSIONS.first).toBeDefined();
      expect(INVERSIONS.second).toBeDefined();
      expect(INVERSIONS.third).toBeDefined();
    });

    it('should have correct bass note indices', () => {
      expect(INVERSIONS.root.bassNote).toBe(0);
      expect(INVERSIONS.first.bassNote).toBe(1);
      expect(INVERSIONS.second.bassNote).toBe(2);
      expect(INVERSIONS.third.bassNote).toBe(3);
    });
  });

  describe('getNoteFromMidi', () => {
    it('should return correct note for middle C (MIDI 60)', () => {
      const note = getNoteFromMidi(60);
      expect(note.name).toBe('C');
      expect(note.octave).toBe(4);
      expect(note.midi).toBe(60);
    });

    it('should return correct note for A4 (MIDI 69)', () => {
      const note = getNoteFromMidi(69);
      expect(note.name).toBe('A');
      expect(note.octave).toBe(4);
      expect(note.frequency).toBeCloseTo(440, 1);
    });

    it('should handle sharps correctly', () => {
      const note = getNoteFromMidi(61); // C#4
      expect(note.name).toBe('C#');
    });
  });

  describe('getMidiFromNote', () => {
    it('should return 60 for C4', () => {
      expect(getMidiFromNote('C', 4)).toBe(60);
    });

    it('should return 69 for A4', () => {
      expect(getMidiFromNote('A', 4)).toBe(69);
    });

    it('should handle different octaves', () => {
      expect(getMidiFromNote('C', 3)).toBe(48);
      expect(getMidiFromNote('C', 5)).toBe(72);
    });
  });

  describe('getNoteName', () => {
    it('should return formatted note name', () => {
      expect(getNoteName(60)).toBe('C4');
      expect(getNoteName(69)).toBe('A4');
      expect(getNoteName(61)).toBe('C#4');
    });
  });
});
