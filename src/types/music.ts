// Note types
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type Octave = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Note {
  name: NoteName;
  octave: Octave;
  midi: number;
  frequency: number;
}

// Chord types - Extended with Jazz & Advanced Harmony
export type ChordQuality =
  | 'major' | 'minor' | 'diminished' | 'augmented'
  | 'major7' | 'minor7' | 'dominant7' | 'diminished7' | 'half_diminished7'
  | 'sus2' | 'sus4' | 'add9' | 'major9' | 'minor9'
  // Extended Jazz Chords
  | 'dominant9' | 'dominant11' | 'dominant13'
  | 'major11' | 'major13' | 'minor11' | 'minor13'
  // Altered Dominants
  | 'dominant7sharp9' | 'dominant7flat9' | 'dominant7sharp5' | 'dominant7flat5'
  | 'dominant7sharp11' | 'dominant7alt'
  // Other Jazz Voicings
  | 'minorMajor7' | 'augmented7' | 'add11' | '6' | 'minor6'
  | 'dominant7sus4' | '69';

export interface ChordType {
  name: string;
  shortName: string;
  intervals: number[];
  description: string;
  genre?: 'basic' | 'jazz' | 'classical' | 'pop' | 'blues';
}

export const CHORD_TYPES: Record<ChordQuality, ChordType> = {
  // Basic Chords
  major: { name: 'Major', shortName: 'M', intervals: [0, 4, 7], description: 'Happy, bright sound', genre: 'basic' },
  minor: { name: 'Minor', shortName: 'm', intervals: [0, 3, 7], description: 'Sad, darker sound', genre: 'basic' },
  diminished: { name: 'Diminished', shortName: 'dim', intervals: [0, 3, 6], description: 'Tense, unstable', genre: 'basic' },
  augmented: { name: 'Augmented', shortName: 'aug', intervals: [0, 4, 8], description: 'Dreamy, suspended', genre: 'basic' },

  // 7th Chords
  major7: { name: 'Major 7th', shortName: 'Maj7', intervals: [0, 4, 7, 11], description: 'Dreamy, sophisticated', genre: 'jazz' },
  minor7: { name: 'Minor 7th', shortName: 'm7', intervals: [0, 3, 7, 10], description: 'Jazzy, mellow', genre: 'jazz' },
  dominant7: { name: 'Dominant 7th', shortName: '7', intervals: [0, 4, 7, 10], description: 'Bluesy, needs resolution', genre: 'blues' },
  diminished7: { name: 'Diminished 7th', shortName: 'dim7', intervals: [0, 3, 6, 9], description: 'Very tense, dramatic', genre: 'classical' },
  half_diminished7: { name: 'Half-Diminished', shortName: 'ø7', intervals: [0, 3, 6, 10], description: 'Jazzy tension', genre: 'jazz' },
  minorMajor7: { name: 'Minor Major 7th', shortName: 'mM7', intervals: [0, 3, 7, 11], description: 'Dark, mysterious', genre: 'jazz' },
  augmented7: { name: 'Augmented 7th', shortName: 'aug7', intervals: [0, 4, 8, 10], description: 'Whole-tone sound', genre: 'jazz' },

  // Suspended Chords
  sus2: { name: 'Suspended 2nd', shortName: 'sus2', intervals: [0, 2, 7], description: 'Open, ambiguous', genre: 'pop' },
  sus4: { name: 'Suspended 4th', shortName: 'sus4', intervals: [0, 5, 7], description: 'Anticipating, wants to resolve', genre: 'pop' },
  dominant7sus4: { name: 'Dominant 7sus4', shortName: '7sus4', intervals: [0, 5, 7, 10], description: 'Gospel, R&B sound', genre: 'jazz' },

  // Add Chords
  add9: { name: 'Add 9', shortName: 'add9', intervals: [0, 4, 7, 14], description: 'Rich, full sound', genre: 'pop' },
  add11: { name: 'Add 11', shortName: 'add11', intervals: [0, 4, 7, 17], description: 'Open, modern', genre: 'pop' },

  // 6th Chords
  '6': { name: 'Major 6th', shortName: '6', intervals: [0, 4, 7, 9], description: 'Vintage, swing feel', genre: 'jazz' },
  minor6: { name: 'Minor 6th', shortName: 'm6', intervals: [0, 3, 7, 9], description: 'Melancholy, bossa nova', genre: 'jazz' },
  '69': { name: '6/9', shortName: '6/9', intervals: [0, 4, 7, 9, 14], description: 'Rich, warm jazz ending', genre: 'jazz' },

  // 9th Chords
  major9: { name: 'Major 9th', shortName: 'Maj9', intervals: [0, 4, 7, 11, 14], description: 'Very jazzy, lush', genre: 'jazz' },
  minor9: { name: 'Minor 9th', shortName: 'm9', intervals: [0, 3, 7, 10, 14], description: 'Smooth, sophisticated', genre: 'jazz' },
  dominant9: { name: 'Dominant 9th', shortName: '9', intervals: [0, 4, 7, 10, 14], description: 'Funky, soul', genre: 'jazz' },

  // 11th Chords
  major11: { name: 'Major 11th', shortName: 'Maj11', intervals: [0, 4, 7, 11, 14, 17], description: 'Ethereal, modern jazz', genre: 'jazz' },
  minor11: { name: 'Minor 11th', shortName: 'm11', intervals: [0, 3, 7, 10, 14, 17], description: 'Modal jazz sound', genre: 'jazz' },
  dominant11: { name: 'Dominant 11th', shortName: '11', intervals: [0, 4, 7, 10, 14, 17], description: 'Suspension over dominant', genre: 'jazz' },

  // 13th Chords
  major13: { name: 'Major 13th', shortName: 'Maj13', intervals: [0, 4, 7, 11, 14, 21], description: 'Full orchestral jazz', genre: 'jazz' },
  minor13: { name: 'Minor 13th', shortName: 'm13', intervals: [0, 3, 7, 10, 14, 21], description: 'Rich minor color', genre: 'jazz' },
  dominant13: { name: 'Dominant 13th', shortName: '13', intervals: [0, 4, 7, 10, 14, 21], description: 'Big band jazz', genre: 'jazz' },

  // Altered Dominant Chords
  dominant7sharp9: { name: 'Dominant 7#9', shortName: '7#9', intervals: [0, 4, 7, 10, 15], description: 'Hendrix chord, bluesy', genre: 'blues' },
  dominant7flat9: { name: 'Dominant 7b9', shortName: '7b9', intervals: [0, 4, 7, 10, 13], description: 'Tension, bebop', genre: 'jazz' },
  dominant7sharp5: { name: 'Dominant 7#5', shortName: '7#5', intervals: [0, 4, 8, 10], description: 'Augmented dominant', genre: 'jazz' },
  dominant7flat5: { name: 'Dominant 7b5', shortName: '7b5', intervals: [0, 4, 6, 10], description: 'Tritone substitution', genre: 'jazz' },
  dominant7sharp11: { name: 'Dominant 7#11', shortName: '7#11', intervals: [0, 4, 7, 10, 18], description: 'Lydian dominant', genre: 'jazz' },
  dominant7alt: { name: 'Altered Dominant', shortName: '7alt', intervals: [0, 4, 8, 10, 13], description: 'Maximum tension', genre: 'jazz' },
};

// Scale types - Extended with Jazz & World Scales
export type ScaleType =
  | 'major' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor'
  | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian' | 'aeolian'
  | 'pentatonic_major' | 'pentatonic_minor' | 'blues' | 'chromatic'
  // Jazz Scales
  | 'bebop_dominant' | 'bebop_major' | 'bebop_minor' | 'bebop_dorian'
  | 'whole_tone' | 'diminished_whole_half' | 'diminished_half_whole'
  | 'altered' | 'lydian_dominant' | 'super_locrian'
  // World & Exotic Scales
  | 'phrygian_dominant' | 'hungarian_minor' | 'double_harmonic'
  | 'japanese' | 'egyptian' | 'hirajoshi';

export interface Scale {
  name: string;
  intervals: number[];
  description: string;
  mood: string;
  genre?: 'basic' | 'jazz' | 'classical' | 'world' | 'blues';
}

export const SCALE_TYPES: Record<ScaleType, Scale> = {
  // Basic Modes
  major: { name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11], description: 'Happy, bright', mood: 'bright', genre: 'basic' },
  natural_minor: { name: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10], description: 'Sad, dark', mood: 'dark', genre: 'basic' },
  harmonic_minor: { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11], description: 'Eastern, dramatic', mood: 'exotic', genre: 'classical' },
  melodic_minor: { name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11], description: 'Jazz, complex', mood: 'jazzy', genre: 'jazz' },
  dorian: { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10], description: 'Minor but brighter', mood: 'mellow', genre: 'jazz' },
  phrygian: { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10], description: 'Spanish, exotic', mood: 'exotic', genre: 'world' },
  lydian: { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11], description: 'Dreamy, floating', mood: 'dreamy', genre: 'jazz' },
  mixolydian: { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10], description: 'Bluesy major', mood: 'bluesy', genre: 'blues' },
  locrian: { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10], description: 'Unstable, dark', mood: 'unstable', genre: 'jazz' },
  aeolian: { name: 'Aeolian', intervals: [0, 2, 3, 5, 7, 8, 10], description: 'Natural minor', mood: 'dark', genre: 'basic' },

  // Pentatonic & Blues
  pentatonic_major: { name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9], description: 'Simple, folk', mood: 'folk', genre: 'basic' },
  pentatonic_minor: { name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10], description: 'Rock, blues', mood: 'rock', genre: 'blues' },
  blues: { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10], description: 'Blues, soulful', mood: 'soulful', genre: 'blues' },
  chromatic: { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], description: 'All notes', mood: 'tense', genre: 'basic' },

  // Bebop Scales
  bebop_dominant: { name: 'Bebop Dominant', intervals: [0, 2, 4, 5, 7, 9, 10, 11], description: 'Classic bebop sound', mood: 'jazzy', genre: 'jazz' },
  bebop_major: { name: 'Bebop Major', intervals: [0, 2, 4, 5, 7, 8, 9, 11], description: 'Major with passing tone', mood: 'jazzy', genre: 'jazz' },
  bebop_minor: { name: 'Bebop Minor', intervals: [0, 2, 3, 5, 7, 8, 9, 10], description: 'Minor bebop lines', mood: 'jazzy', genre: 'jazz' },
  bebop_dorian: { name: 'Bebop Dorian', intervals: [0, 2, 3, 4, 5, 7, 9, 10], description: 'Dorian with passing tone', mood: 'jazzy', genre: 'jazz' },

  // Symmetric Scales
  whole_tone: { name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10], description: 'Dreamy, augmented feel', mood: 'dreamy', genre: 'jazz' },
  diminished_whole_half: { name: 'Diminished (W-H)', intervals: [0, 2, 3, 5, 6, 8, 9, 11], description: 'Over diminished chords', mood: 'tense', genre: 'jazz' },
  diminished_half_whole: { name: 'Diminished (H-W)', intervals: [0, 1, 3, 4, 6, 7, 9, 10], description: 'Over dominant 7b9', mood: 'tense', genre: 'jazz' },

  // Melodic Minor Modes
  altered: { name: 'Altered (Super Locrian)', intervals: [0, 1, 3, 4, 6, 8, 10], description: 'For altered dominants', mood: 'tense', genre: 'jazz' },
  lydian_dominant: { name: 'Lydian Dominant', intervals: [0, 2, 4, 6, 7, 9, 10], description: 'Lydian with b7', mood: 'bright', genre: 'jazz' },
  super_locrian: { name: 'Super Locrian', intervals: [0, 1, 3, 4, 6, 8, 10], description: '7th mode of melodic minor', mood: 'tense', genre: 'jazz' },

  // World & Exotic Scales
  phrygian_dominant: { name: 'Phrygian Dominant', intervals: [0, 1, 4, 5, 7, 8, 10], description: 'Spanish/Flamenco', mood: 'exotic', genre: 'world' },
  hungarian_minor: { name: 'Hungarian Minor', intervals: [0, 2, 3, 6, 7, 8, 11], description: 'Gypsy, romantic', mood: 'exotic', genre: 'world' },
  double_harmonic: { name: 'Double Harmonic', intervals: [0, 1, 4, 5, 7, 8, 11], description: 'Byzantine, Arabic', mood: 'exotic', genre: 'world' },
  japanese: { name: 'Japanese (In Sen)', intervals: [0, 1, 5, 7, 10], description: 'Traditional Japanese', mood: 'exotic', genre: 'world' },
  egyptian: { name: 'Egyptian', intervals: [0, 2, 5, 7, 10], description: 'Ancient, suspended', mood: 'exotic', genre: 'world' },
  hirajoshi: { name: 'Hirajoshi', intervals: [0, 2, 3, 7, 8], description: 'Japanese pentatonic', mood: 'exotic', genre: 'world' },
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

// Chord progression types - Extended with Jazz & Genre-Specific
export type ProgressionType =
  | 'I-IV-V-I' | 'I-V-vi-IV' | 'ii-V-I' | 'I-vi-IV-V' | 'I-IV-vi-V'
  | 'vi-IV-I-V' | 'I-V-IV-I' | 'I-bVII-IV-I'
  // Jazz Progressions
  | 'ii-V-I-VI' | 'I-VI-ii-V' | 'iii-VI-ii-V'
  | 'I-vi-ii-V' | 'ii-bII-I' | 'I-IV-iii-VI'
  // Blues Progressions
  | 'I-I-I-I' | 'I-IV-I-V' | 'I7-IV7-V7'
  // Classical Progressions
  | 'I-IV-V-V' | 'I-ii-V-I' | 'I-V-vi-iii'
  // Modern & Neo-Soul
  | 'IVmaj7-V7-iii7-vi7' | 'ii7-V7-Imaj7-IVmaj7';

export interface Progression {
  name: string;
  numerals: string[];
  description: string;
  genre: 'classical' | 'pop' | 'jazz' | 'blues' | 'rock';
}

export const PROGRESSIONS: Record<ProgressionType, Progression> = {
  // Classical & Basic
  'I-IV-V-I': { name: 'Classic', numerals: ['I', 'IV', 'V', 'I'], description: 'Traditional resolution', genre: 'classical' },
  'I-IV-V-V': { name: 'Half Cadence', numerals: ['I', 'IV', 'V', 'V'], description: 'Unresolved tension', genre: 'classical' },
  'I-ii-V-I': { name: 'Classical ii-V', numerals: ['I', 'ii', 'V', 'I'], description: 'Strong classical feel', genre: 'classical' },
  'I-V-vi-iii': { name: 'Descending', numerals: ['I', 'V', 'vi', 'iii'], description: 'Circle of fifths descent', genre: 'classical' },

  // Pop Progressions
  'I-V-vi-IV': { name: 'Pop Progression', numerals: ['I', 'V', 'vi', 'IV'], description: 'Most popular progression', genre: 'pop' },
  'I-vi-IV-V': { name: '50s Progression', numerals: ['I', 'vi', 'IV', 'V'], description: 'Doo-wop style', genre: 'pop' },
  'I-IV-vi-V': { name: 'Modern Pop', numerals: ['I', 'IV', 'vi', 'V'], description: 'Contemporary pop', genre: 'pop' },
  'vi-IV-I-V': { name: 'Sensitive', numerals: ['vi', 'IV', 'I', 'V'], description: 'Emotional, minor start', genre: 'pop' },

  // Rock Progressions
  'I-V-IV-I': { name: 'Rock Classic', numerals: ['I', 'V', 'IV', 'I'], description: 'Rock anthem', genre: 'rock' },
  'I-bVII-IV-I': { name: 'Modal Rock', numerals: ['I', 'bVII', 'IV', 'I'], description: 'Mixolydian feel', genre: 'rock' },

  // Jazz Progressions
  'ii-V-I': { name: 'Jazz ii-V-I', numerals: ['ii', 'V', 'I'], description: 'Jazz fundamental', genre: 'jazz' },
  'ii-V-I-VI': { name: 'Turnaround', numerals: ['ii', 'V', 'I', 'VI'], description: 'Classic jazz turnaround', genre: 'jazz' },
  'I-VI-ii-V': { name: 'Rhythm Changes', numerals: ['I', 'VI', 'ii', 'V'], description: 'I Got Rhythm pattern', genre: 'jazz' },
  'iii-VI-ii-V': { name: 'Extended Turnaround', numerals: ['iii', 'VI', 'ii', 'V'], description: 'Bebop turnaround', genre: 'jazz' },
  'I-vi-ii-V': { name: 'Standard Turnaround', numerals: ['I', 'vi', 'ii', 'V'], description: 'Jazz standard ending', genre: 'jazz' },
  'ii-bII-I': { name: 'Tritone Sub', numerals: ['ii', 'bII', 'I'], description: 'Tritone substitution', genre: 'jazz' },
  'I-IV-iii-VI': { name: 'Backdoor', numerals: ['I', 'IV', 'iii', 'VI'], description: 'Backdoor progression', genre: 'jazz' },
  'IVmaj7-V7-iii7-vi7': { name: 'Neo-Soul', numerals: ['IVmaj7', 'V7', 'iii7', 'vi7'], description: 'Modern R&B/Neo-soul', genre: 'jazz' },
  'ii7-V7-Imaj7-IVmaj7': { name: 'Jazz Ballad', numerals: ['ii7', 'V7', 'Imaj7', 'IVmaj7'], description: 'Smooth jazz ballad', genre: 'jazz' },

  // Blues Progressions
  'I-I-I-I': { name: 'Blues Intro', numerals: ['I', 'I', 'I', 'I'], description: 'First 4 bars of blues', genre: 'blues' },
  'I-IV-I-V': { name: 'Blues Turnaround', numerals: ['I', 'IV', 'I', 'V'], description: 'Quick change blues', genre: 'blues' },
  'I7-IV7-V7': { name: '12-Bar Essence', numerals: ['I7', 'IV7', 'V7'], description: 'Essential blues chords', genre: 'blues' },
};

// Music Key types for key identification training
export type MusicKeyType =
  | 'C' | 'G' | 'D' | 'A' | 'E' | 'B' | 'F#' | 'Gb'
  | 'F' | 'Bb' | 'Eb' | 'Ab' | 'Db'
  | 'Am' | 'Em' | 'Bm' | 'F#m' | 'C#m' | 'G#m'
  | 'Dm' | 'Gm' | 'Cm' | 'Fm' | 'Bbm' | 'Ebm';

export interface MusicKey {
  name: string;
  shortName: string;
  type: 'major' | 'minor';
  sharpsFlats: number; // positive = sharps, negative = flats
  relativeKey: string; // relative major or minor
  rootNote: NoteName;
  scaleNotes: NoteName[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  description: string;
}

export const MUSIC_KEYS: Record<MusicKeyType, MusicKey> = {
  // Major Keys - Easy (0-1 sharps/flats)
  'C': {
    name: 'C Major',
    shortName: 'C',
    type: 'major',
    sharpsFlats: 0,
    relativeKey: 'Am',
    rootNote: 'C',
    scaleNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    difficulty: 'easy',
    description: 'No sharps or flats - the natural key',
  },
  'G': {
    name: 'G Major',
    shortName: 'G',
    type: 'major',
    sharpsFlats: 1,
    relativeKey: 'Em',
    rootNote: 'G',
    scaleNotes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    difficulty: 'easy',
    description: 'One sharp (F#) - guitar-friendly key',
  },
  'F': {
    name: 'F Major',
    shortName: 'F',
    type: 'major',
    sharpsFlats: -1,
    relativeKey: 'Dm',
    rootNote: 'F',
    scaleNotes: ['F', 'G', 'A', 'A#', 'C', 'D', 'E'],
    difficulty: 'easy',
    description: 'One flat (Bb) - warm, mellow key',
  },

  // Major Keys - Medium (2-3 sharps/flats)
  'D': {
    name: 'D Major',
    shortName: 'D',
    type: 'major',
    sharpsFlats: 2,
    relativeKey: 'Bm',
    rootNote: 'D',
    scaleNotes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    difficulty: 'medium',
    description: 'Two sharps - bright, popular guitar key',
  },
  'A': {
    name: 'A Major',
    shortName: 'A',
    type: 'major',
    sharpsFlats: 3,
    relativeKey: 'F#m',
    rootNote: 'A',
    scaleNotes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    difficulty: 'medium',
    description: 'Three sharps - energetic rock key',
  },
  'Bb': {
    name: 'Bb Major',
    shortName: 'Bb',
    type: 'major',
    sharpsFlats: -2,
    relativeKey: 'Gm',
    rootNote: 'A#',
    scaleNotes: ['A#', 'C', 'D', 'D#', 'F', 'G', 'A'],
    difficulty: 'medium',
    description: 'Two flats - common jazz/brass key',
  },
  'Eb': {
    name: 'Eb Major',
    shortName: 'Eb',
    type: 'major',
    sharpsFlats: -3,
    relativeKey: 'Cm',
    rootNote: 'D#',
    scaleNotes: ['D#', 'F', 'G', 'G#', 'A#', 'C', 'D'],
    difficulty: 'medium',
    description: 'Three flats - classic jazz key',
  },

  // Major Keys - Hard (4-5 sharps/flats)
  'E': {
    name: 'E Major',
    shortName: 'E',
    type: 'major',
    sharpsFlats: 4,
    relativeKey: 'C#m',
    rootNote: 'E',
    scaleNotes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
    difficulty: 'hard',
    description: 'Four sharps - powerful guitar key',
  },
  'B': {
    name: 'B Major',
    shortName: 'B',
    type: 'major',
    sharpsFlats: 5,
    relativeKey: 'G#m',
    rootNote: 'B',
    scaleNotes: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
    difficulty: 'hard',
    description: 'Five sharps - challenging key',
  },
  'Ab': {
    name: 'Ab Major',
    shortName: 'Ab',
    type: 'major',
    sharpsFlats: -4,
    relativeKey: 'Fm',
    rootNote: 'G#',
    scaleNotes: ['G#', 'A#', 'C', 'C#', 'D#', 'F', 'G'],
    difficulty: 'hard',
    description: 'Four flats - romantic, expressive key',
  },
  'Db': {
    name: 'Db Major',
    shortName: 'Db',
    type: 'major',
    sharpsFlats: -5,
    relativeKey: 'Bbm',
    rootNote: 'C#',
    scaleNotes: ['C#', 'D#', 'F', 'F#', 'G#', 'A#', 'C'],
    difficulty: 'hard',
    description: 'Five flats - rich, dramatic key',
  },

  // Major Keys - Expert (6 sharps/flats)
  'F#': {
    name: 'F# Major',
    shortName: 'F#',
    type: 'major',
    sharpsFlats: 6,
    relativeKey: 'D#m',
    rootNote: 'F#',
    scaleNotes: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'F'],
    difficulty: 'expert',
    description: 'Six sharps - enharmonic with Gb',
  },
  'Gb': {
    name: 'Gb Major',
    shortName: 'Gb',
    type: 'major',
    sharpsFlats: -6,
    relativeKey: 'Ebm',
    rootNote: 'F#',
    scaleNotes: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'F'],
    difficulty: 'expert',
    description: 'Six flats - enharmonic with F#',
  },

  // Minor Keys - Easy
  'Am': {
    name: 'A Minor',
    shortName: 'Am',
    type: 'minor',
    sharpsFlats: 0,
    relativeKey: 'C',
    rootNote: 'A',
    scaleNotes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    difficulty: 'easy',
    description: 'Natural minor - no sharps or flats',
  },
  'Em': {
    name: 'E Minor',
    shortName: 'Em',
    type: 'minor',
    sharpsFlats: 1,
    relativeKey: 'G',
    rootNote: 'E',
    scaleNotes: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    difficulty: 'easy',
    description: 'One sharp - popular guitar minor key',
  },
  'Dm': {
    name: 'D Minor',
    shortName: 'Dm',
    type: 'minor',
    sharpsFlats: -1,
    relativeKey: 'F',
    rootNote: 'D',
    scaleNotes: ['D', 'E', 'F', 'G', 'A', 'A#', 'C'],
    difficulty: 'easy',
    description: 'One flat - melancholic key',
  },

  // Minor Keys - Medium
  'Bm': {
    name: 'B Minor',
    shortName: 'Bm',
    type: 'minor',
    sharpsFlats: 2,
    relativeKey: 'D',
    rootNote: 'B',
    scaleNotes: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
    difficulty: 'medium',
    description: 'Two sharps - dramatic minor key',
  },
  'F#m': {
    name: 'F# Minor',
    shortName: 'F#m',
    type: 'minor',
    sharpsFlats: 3,
    relativeKey: 'A',
    rootNote: 'F#',
    scaleNotes: ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
    difficulty: 'medium',
    description: 'Three sharps - introspective key',
  },
  'Gm': {
    name: 'G Minor',
    shortName: 'Gm',
    type: 'minor',
    sharpsFlats: -2,
    relativeKey: 'Bb',
    rootNote: 'G',
    scaleNotes: ['G', 'A', 'A#', 'C', 'D', 'D#', 'F'],
    difficulty: 'medium',
    description: 'Two flats - classical minor key',
  },
  'Cm': {
    name: 'C Minor',
    shortName: 'Cm',
    type: 'minor',
    sharpsFlats: -3,
    relativeKey: 'Eb',
    rootNote: 'C',
    scaleNotes: ['C', 'D', 'D#', 'F', 'G', 'G#', 'A#'],
    difficulty: 'medium',
    description: 'Three flats - Beethovens favorite',
  },

  // Minor Keys - Hard
  'C#m': {
    name: 'C# Minor',
    shortName: 'C#m',
    type: 'minor',
    sharpsFlats: 4,
    relativeKey: 'E',
    rootNote: 'C#',
    scaleNotes: ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
    difficulty: 'hard',
    description: 'Four sharps - emotional key',
  },
  'G#m': {
    name: 'G# Minor',
    shortName: 'G#m',
    type: 'minor',
    sharpsFlats: 5,
    relativeKey: 'B',
    rootNote: 'G#',
    scaleNotes: ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
    difficulty: 'hard',
    description: 'Five sharps - challenging minor',
  },
  'Fm': {
    name: 'F Minor',
    shortName: 'Fm',
    type: 'minor',
    sharpsFlats: -4,
    relativeKey: 'Ab',
    rootNote: 'F',
    scaleNotes: ['F', 'G', 'G#', 'A#', 'C', 'C#', 'D#'],
    difficulty: 'hard',
    description: 'Four flats - deeply expressive',
  },
  'Bbm': {
    name: 'Bb Minor',
    shortName: 'Bbm',
    type: 'minor',
    sharpsFlats: -5,
    relativeKey: 'Db',
    rootNote: 'A#',
    scaleNotes: ['A#', 'C', 'C#', 'D#', 'F', 'F#', 'G#'],
    difficulty: 'hard',
    description: 'Five flats - dark and intense',
  },

  // Minor Keys - Expert
  'Ebm': {
    name: 'Eb Minor',
    shortName: 'Ebm',
    type: 'minor',
    sharpsFlats: -6,
    relativeKey: 'Gb',
    rootNote: 'D#',
    scaleNotes: ['D#', 'F', 'F#', 'G#', 'A#', 'B', 'C#'],
    difficulty: 'expert',
    description: 'Six flats - extremely challenging',
  },
};

// Helper to get keys by difficulty
export function getKeysByDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): MusicKeyType[] {
  return (Object.keys(MUSIC_KEYS) as MusicKeyType[]).filter(
    key => MUSIC_KEYS[key].difficulty === difficulty
  );
}

// Helper to get major keys only
export function getMajorKeys(): MusicKeyType[] {
  return (Object.keys(MUSIC_KEYS) as MusicKeyType[]).filter(
    key => MUSIC_KEYS[key].type === 'major'
  );
}

// Helper to get minor keys only
export function getMinorKeys(): MusicKeyType[] {
  return (Object.keys(MUSIC_KEYS) as MusicKeyType[]).filter(
    key => MUSIC_KEYS[key].type === 'minor'
  );
}

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
