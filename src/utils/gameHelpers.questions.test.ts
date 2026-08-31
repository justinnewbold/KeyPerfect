import { describe, it, expect } from 'vitest';
import { generateQuestion, generateMusicKeyQuestions, getChordNotes } from './gameHelpers';
import { LEVELS } from '../types/levels';
import { MUSIC_KEYS_LEVELS } from '../types/musicKeysLevels';
import { MUSIC_KEYS } from '../types/music';

/**
 * Regression tests for questions that could not be answered correctly.
 *
 * Each generator is random, so every case runs many iterations rather than
 * one: a bug that shows up in a third of questions is still a bug, and a
 * single sample would miss it.
 */
const RUNS = 200;

const level = (id: number) => LEVELS.find(l => l.id === id)!;

describe('chord progressions play as a sequence', () => {
  // Flattening the chords into `notes` and handing them to playChord sounds
  // one twelve-note cluster, so every progression in a mode was identical
  // and the question could only be guessed.
  it('carries a chord sequence, not just a flattened cluster', () => {
    // Level 4 is the first with several progressions to choose between.
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion(level(4), 'progressions', i, RUNS);
      expect(q.audioData.chordSequence).toBeDefined();
      expect(q.audioData.chordSequence!.length).toBeGreaterThan(1);
    }
  });

  it('flattens to exactly the notes it sequences', () => {
    const q = generateQuestion(level(4), 'progressions', 0, RUNS);
    expect(q.audioData.chordSequence!.flat()).toEqual(q.audioData.notes);
  });

  it('does the same for genre and real-music progressions', () => {
    for (let i = 0; i < 50; i++) {
      for (const mode of ['genre_jazz', 'genre_blues', 'genre_pop', 'genre_classical'] as const) {
        const q = generateQuestion(level(4), mode, i, 50);
        // Genre questions are sometimes a single chord or scale; only the
        // progression ones need sequencing.
        if (q.type.startsWith('genre_') && q.audioData.chordSequence) {
          expect(q.audioData.chordSequence.length).toBeGreaterThan(1);
        }
      }
    }
  });
});

describe('inversion questions are decidable', () => {
  // getChordNotes silently produces a second inversion when asked for a
  // third on a triad, so "second" and "third" sounded identical and a
  // correct answer was marked wrong.
  it('never offers third inversion for a three-note chord', () => {
    for (const id of [6, 7, 8]) {
      for (let i = 0; i < RUNS; i++) {
        const q = generateQuestion(level(id), 'inversions', i, RUNS);
        const quality = q.audioData.type.split('-')[0];
        const chordSize = getChordNotes(60, quality as never).length;
        if (chordSize < 4) {
          expect(q.correctAnswer).not.toBe('third');
          expect(q.options).not.toContain('third');
        }
      }
    }
  });

  it('confirms the underlying collision the filter avoids', () => {
    // Documents *why* the filter exists: on a triad these are the same chord.
    const second = getChordNotes(60, 'major', 'second');
    const third = getChordNotes(60, 'major', 'third');
    expect(third).toEqual(second);
    // On a seventh chord they genuinely differ, which is why it stays offered.
    expect(getChordNotes(60, 'major7', 'third')).not.toEqual(
      getChordNotes(60, 'major7', 'second'),
    );
  });

  it('always offers at least two options, even at level 1', () => {
    // Levels 1-2 ship `inversions: ['root']`, which rendered one button that
    // was always the answer.
    for (const id of [1, 2, 3]) {
      for (let i = 0; i < 50; i++) {
        const q = generateQuestion(level(id), 'inversions', i, 50);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.options).toContain(q.correctAnswer);
        expect(new Set(q.options).size).toBe(q.options.length);
      }
    }
  });
});

describe('music key questions are decidable', () => {
  // F# and Gb are both stored as rootNote 'F#' major, so they generate
  // bit-identical audio; offering both made the question unanswerable.
  //
  // This has to go through generateMusicKeyQuestions with a real level:
  // generateQuestion('musickeys') passes a null level and falls back to a
  // default key set that contains no enharmonic pairs, so it could never
  // exercise the bug.
  const keyLevel = (id: number) => MUSIC_KEYS_LEVELS.find(l => l.id === id)!;

  it('levels 7 and 8 really do contain an enharmonic pair', () => {
    // Guards the test above from silently going vacuous if the level data
    // is ever changed.
    for (const id of [7, 8]) {
      const keys = keyLevel(id).availableKeys;
      expect(keys).toContain('F#');
      expect(keys).toContain('Gb');
      expect(MUSIC_KEYS['F#'].rootNote).toBe(MUSIC_KEYS['Gb'].rootNote);
      expect(MUSIC_KEYS['F#'].type).toBe(MUSIC_KEYS['Gb'].type);
    }
  });

  it('never offers two enharmonically identical keys together', () => {
    for (const id of [7, 8]) {
      for (const q of generateMusicKeyQuestions(keyLevel(id), RUNS)) {
        const sounding = q.options.map(k => {
          const data = MUSIC_KEYS[k as keyof typeof MUSIC_KEYS];
          return data ? `${data.rootNote}-${data.type}` : k;
        });
        expect(new Set(sounding).size).toBe(sounding.length);
      }
    }
  });

  it('still offers four options after the enharmonic filter', () => {
    for (const id of [7, 8]) {
      for (const q of generateMusicKeyQuestions(keyLevel(id), 50)) {
        expect(q.options).toHaveLength(4);
        expect(q.options).toContain(q.correctAnswer);
      }
    }
  });
});

describe('level content supports the options a mode needs', () => {
  it('level 1 chords really does only have two options', () => {
    // Documents why challenge modes are moved off level 1 in useGameState:
    // this is fine as a teaching ramp for level 1 itself, but it made every
    // challenge mode a coin flip.
    const q = generateQuestion(level(1), 'chords', 0, 20);
    expect(q.options.length).toBe(2);
  });

  it('level 2 has enough chords for four distinct options', () => {
    // The floor challenge modes are clamped to.
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(level(2), 'chords', i, 50);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
    }
  });
});
