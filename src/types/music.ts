// Note types
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type Octave = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Note {
  name: NoteName;
  octave: Octave;
  midi: number;
  frequency: number;
}

// Chord types
export type ChordQuality =
  | 'major' | 'minor' | 'diminished' | 'augmented'
  | 'major7' | 'minor7' | 'dominant7' | 'diminished7' | 'half_diminished7'
  | 'sus2' | 'sus4' | 'add9' | 'major9' | 'minor9';

export interface ChordType {
  name: string;
  shortName: string;
  intervals: number[];
  description: string;
}

export const CHORD_TYPES: Record<ChordQuality, ChordType> = {
  major: { name: 'Major', shortName: 'M', intervals: [0, 4, 7], description: 'Happy, bright sound' },
  minor: { name: 'Minor', shortName: 'm', intervals: [0, 3, 7], description: 'Sad, darker sound' },
  diminished: { name: 'Diminished', shortName: 'dim', intervals: [0, 3, 6], description: 'Tense, unstable' },
  augmented: { name: 'Augmented', shortName: 'aug', intervals: [0, 4, 8], description: 'Dreamy, suspended' },
  major7: { name: 'Major 7th', shortName: 'Maj7', intervals: [0, 4, 7, 11], description: 'Dreamy, sophisticated' },
  minor7: { name: 'Minor 7th', shortName: 'm7', intervals: [0, 3, 7, 10], description: 'Jazzy, mellow' },
  dominant7: { name: 'Dominant 7th', shortName: '7', intervals: [0, 4, 7, 10], description: 'Bluesy, needs resolution' },
  diminished7: { name: 'Diminished 7th', shortName: 'dim7', intervals: [0, 3, 6, 9], description: 'Very tense, dramatic' },
  half_diminished7: { name: 'Half-Diminished', shortName: 'ø7', intervals: [0, 3, 6, 10], description: 'Jazzy tension' },
  sus2: { name: 'Suspended 2nd', shortName: 'sus2', intervals: [0, 2, 7], description: 'Open, ambiguous' },
  sus4: { name: 'Suspended 4th', shortName: 'sus4', intervals: [0, 5, 7], description: 'Anticipating, wants to resolve' },
  add9: { name: 'Add 9', shortName: 'add9', intervals: [0, 4, 7, 14], description: 'Rich, full sound' },
  major9: { name: 'Major 9th', shortName: 'Maj9', intervals: [0, 4, 7, 11, 14], description: 'Very jazzy, lush' },
  minor9: { name: 'Minor 9th', shortName: 'm9', intervals: [0, 3, 7, 10, 14], description: 'Smooth, sophisticated' },
};

// Scale types
export type ScaleType =
  | 'major' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor'
  | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian' | 'aeolian'
  | 'pentatonic_major' | 'pentatonic_minor' | 'blues' | 'chromatic';

export interface Scale {
  name: string;
  intervals: number[];
  description: string;
  mood: string;
}

export const SCALE_TYPES: Record<ScaleType, Scale> = {
  major: { name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11], description: 'Happy, bright', mood: 'bright' },
  natural_minor: { name: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10], description: 'Sad, dark', mood: 'dark' },
  harmonic_minor: { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11], description: 'Eastern, dramatic', mood: 'exotic' },
  melodic_minor: { name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11], description: 'Jazz, complex', mood: 'jazzy' },
  dorian: { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10], description: 'Minor but brighter', mood: 'mellow' },
  phrygian: { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10], description: 'Spanish, exotic', mood: 'exotic' },
  lydian: { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11], description: 'Dreamy, floating', mood: 'dreamy' },
  mixolydian: { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10], description: 'Bluesy major', mood: 'bluesy' },
  locrian: { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10], description: 'Unstable, dark', mood: 'unstable' },
  aeolian: { name: 'Aeolian', intervals: [0, 2, 3, 5, 7, 8, 10], description: 'Natural minor', mood: 'dark' },
  pentatonic_major: { name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9], description: 'Simple, folk', mood: 'folk' },
  pentatonic_minor: { name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10], description: 'Rock, blues', mood: 'rock' },
  blues: { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10], description: 'Blues, soulful', mood: 'soulful' },
  chromatic: { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], description: 'All notes', mood: 'tense' },
};

// Interval types
export type IntervalType =
  | 'unison' | 'minor2' | 'major2' | 'minor3' | 'major3' | 'perfect4'
  | 'tritone' | 'perfect5' | 'minor6' | 'major6' | 'minor7' | 'major7' | 'octave';

export interface Interval {
  name: string;
  shortName: string;
  semitones: number;
  description: string;
}

export const INTERVALS: Record<IntervalType, Interval> = {
  unison: { name: 'Unison', shortName: 'P1', semitones: 0, description: 'Same note' },
  minor2: { name: 'Minor 2nd', shortName: 'm2', semitones: 1, description: 'Jaws theme' },
  major2: { name: 'Major 2nd', shortName: 'M2', semitones: 2, description: 'Happy Birthday' },
  minor3: { name: 'Minor 3rd', shortName: 'm3', semitones: 3, description: 'Greensleeves' },
  major3: { name: 'Major 3rd', shortName: 'M3', semitones: 4, description: 'Oh When the Saints' },
  perfect4: { name: 'Perfect 4th', shortName: 'P4', semitones: 5, description: 'Here Comes the Bride' },
  tritone: { name: 'Tritone', shortName: 'TT', semitones: 6, description: 'The Simpsons' },
  perfect5: { name: 'Perfect 5th', shortName: 'P5', semitones: 7, description: 'Star Wars' },
  minor6: { name: 'Minor 6th', shortName: 'm6', semitones: 8, description: 'The Entertainer' },
  major6: { name: 'Major 6th', shortName: 'M6', semitones: 9, description: 'My Bonnie' },
  minor7: { name: 'Minor 7th', shortName: 'm7', semitones: 10, description: 'Star Trek theme' },
  major7: { name: 'Major 7th', shortName: 'M7', semitones: 11, description: 'Take On Me' },
  octave: { name: 'Octave', shortName: 'P8', semitones: 12, description: 'Somewhere Over the Rainbow' },
};

// Chord inversion types
export type InversionType = 'root' | 'first' | 'second' | 'third';

export interface Inversion {
  name: string;
  description: string;
  bassNote: number; // Index of the bass note (0 = root, 1 = 3rd, etc.)
}

export const INVERSIONS: Record<InversionType, Inversion> = {
  root: { name: 'Root Position', description: 'Root in bass', bassNote: 0 },
  first: { name: 'First Inversion', description: '3rd in bass', bassNote: 1 },
  second: { name: 'Second Inversion', description: '5th in bass', bassNote: 2 },
  third: { name: 'Third Inversion', description: '7th in bass (7th chords only)', bassNote: 3 },
};

// Chord progression types
export type ProgressionType =
  | 'I-IV-V-I' | 'I-V-vi-IV' | 'ii-V-I' | 'I-vi-IV-V' | 'I-IV-vi-V'
  | 'vi-IV-I-V' | 'I-V-IV-I' | 'I-bVII-IV-I';

export interface Progression {
  name: string;
  numerals: string[];
  description: string;
  genre: string;
}

export const PROGRESSIONS: Record<ProgressionType, Progression> = {
  'I-IV-V-I': { name: 'Classic', numerals: ['I', 'IV', 'V', 'I'], description: 'Traditional resolution', genre: 'Classical' },
  'I-V-vi-IV': { name: 'Pop Progression', numerals: ['I', 'V', 'vi', 'IV'], description: 'Most popular progression', genre: 'Pop' },
  'ii-V-I': { name: 'Jazz Standard', numerals: ['ii', 'V', 'I'], description: 'Jazz fundamental', genre: 'Jazz' },
  'I-vi-IV-V': { name: '50s Progression', numerals: ['I', 'vi', 'IV', 'V'], description: 'Doo-wop style', genre: 'Oldies' },
  'I-IV-vi-V': { name: 'Modern Pop', numerals: ['I', 'IV', 'vi', 'V'], description: 'Contemporary pop', genre: 'Pop' },
  'vi-IV-I-V': { name: 'Sensitive', numerals: ['vi', 'IV', 'I', 'V'], description: 'Emotional, minor start', genre: 'Pop' },
  'I-V-IV-I': { name: 'Rock Classic', numerals: ['I', 'V', 'IV', 'I'], description: 'Rock anthem', genre: 'Rock' },
  'I-bVII-IV-I': { name: 'Modal Rock', numerals: ['I', 'bVII', 'IV', 'I'], description: 'Mixolydian feel', genre: 'Rock' },
};

// Note constants
export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function getNoteFromMidi(midi: number): Note {
  const name = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1 as Octave;
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  return { name, octave, midi, frequency };
}

export function getMidiFromNote(name: NoteName, octave: Octave): number {
  return (octave + 1) * 12 + NOTE_NAMES.indexOf(name);
}

export function getNoteName(midi: number): string {
  const note = getNoteFromMidi(midi);
  return `${note.name}${note.octave}`;
}
