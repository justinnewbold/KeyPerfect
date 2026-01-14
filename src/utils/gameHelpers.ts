import {
  NOTE_NAMES,
  NoteName,
  ChordQuality,
  ScaleType,
  IntervalType,
  InversionType,
  ProgressionType,
  MusicKeyType,
  CHORD_TYPES,
  SCALE_TYPES,
  INTERVALS,
  PROGRESSIONS,
  MUSIC_KEYS,
  getMidiFromNote,
} from '../types/music';
import { LevelConfig } from '../types/levels';
import { MusicKeysLevelConfig } from '../types/musicKeysLevels';
import { NotesLevelConfig } from '../types/notesLevels';
import { GameQuestion, AudioQuestionData, GameModeType } from '../types/gameModes';

// Genre-specific content configurations
export const GENRE_CONTENT = {
  jazz: {
    chords: ['major7', 'minor7', 'dominant7', 'half_diminished7', 'diminished7', 'dominant9', 'major9', 'minor9', 'dominant11', 'dominant13', '6', 'minor6', '69', 'dominant7sharp9', 'dominant7flat9', 'minorMajor7', 'dominant7alt'] as ChordQuality[],
    scales: ['dorian', 'mixolydian', 'lydian', 'melodic_minor', 'bebop_dominant', 'bebop_major', 'whole_tone', 'altered', 'lydian_dominant'] as ScaleType[],
    progressions: ['ii-V-I', 'ii-V-I-VI', 'I-VI-ii-V', 'iii-VI-ii-V', 'I-vi-ii-V', 'ii-bII-I', 'I-IV-iii-VI'] as ProgressionType[],
  },
  classical: {
    chords: ['major', 'minor', 'diminished', 'augmented', 'major7', 'diminished7'] as ChordQuality[],
    scales: ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor'] as ScaleType[],
    progressions: ['I-IV-V-I', 'I-IV-V-V', 'I-ii-V-I', 'I-V-vi-iii'] as ProgressionType[],
  },
  blues: {
    chords: ['major', 'minor', 'dominant7', 'dominant9', 'dominant7sharp9'] as ChordQuality[],
    scales: ['blues', 'pentatonic_minor', 'pentatonic_major', 'mixolydian'] as ScaleType[],
    progressions: ['I-IV-I-V', 'I7-IV7-V7', 'I-bVII-IV-I'] as ProgressionType[],
  },
  pop: {
    chords: ['major', 'minor', 'sus2', 'sus4', 'add9', 'major7', 'minor7'] as ChordQuality[],
    scales: ['major', 'natural_minor', 'pentatonic_major', 'pentatonic_minor'] as ScaleType[],
    progressions: ['I-V-vi-IV', 'I-vi-IV-V', 'I-IV-vi-V', 'vi-IV-I-V'] as ProgressionType[],
  },
} as const;

// Random helpers
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate chord notes
export function getChordNotes(
  rootMidi: number,
  quality: ChordQuality,
  inversion: InversionType = 'root'
): number[] {
  const chordType = CHORD_TYPES[quality];
  let notes = chordType.intervals.map(interval => rootMidi + interval);

  // Apply inversion
  if (inversion !== 'root') {
    const inversionIndex =
      inversion === 'first' ? 1 :
      inversion === 'second' ? 2 : 3;

    for (let i = 0; i < inversionIndex && i < notes.length - 1; i++) {
      notes[i] += 12;
    }
    notes.sort((a, b) => a - b);
  }

  return notes;
}

// Generate scale notes
export function getScaleNotes(rootMidi: number, scaleType: ScaleType): number[] {
  const scale = SCALE_TYPES[scaleType];
  return scale.intervals.map(interval => rootMidi + interval);
}

// Generate interval notes
export function getIntervalNotes(rootMidi: number, intervalType: IntervalType): number[] {
  const interval = INTERVALS[intervalType];
  return [rootMidi, rootMidi + interval.semitones];
}

// Calculate difficulty modifier based on question progress
function getDifficultyModifier(questionIndex: number, totalQuestions: number): number {
  // Returns 0-1, where 0 is easiest and 1 is hardest
  return Math.min(1, questionIndex / Math.max(1, totalQuestions - 1));
}

// Apply difficulty curve to available options
function applyDifficultyCurve<T>(items: T[], questionIndex: number, totalQuestions: number): T[] {
  const difficulty = getDifficultyModifier(questionIndex, totalQuestions);

  // Early questions use fewer, easier options (first part of the array)
  // Later questions use all options
  const minItems = Math.min(2, items.length);
  const maxItems = items.length;
  const numItems = Math.floor(minItems + (maxItems - minItems) * difficulty);

  return items.slice(0, Math.max(minItems, numItems));
}

// Generate questions for a level with progressive difficulty
export function generateQuestion(
  level: LevelConfig,
  mode: GameModeType,
  questionIndex: number,
  totalQuestions: number = 20
): GameQuestion {
  const id = `${mode}-${level.id}-${questionIndex}-${Date.now()}`;
  const difficultyModifier = getDifficultyModifier(questionIndex, totalQuestions);

  switch (mode) {
    case 'chords':
      return generateChordQuestion(id, level, difficultyModifier);
    case 'scales':
      return generateScaleQuestion(id, level, difficultyModifier);
    case 'intervals':
      return generateIntervalQuestion(id, level, difficultyModifier);
    case 'inversions':
      return generateInversionQuestion(id, level);
    case 'progressions':
      return generateProgressionQuestion(id, level);
    case 'notereading':
      return generateNoteReadingQuestion(id, level, difficultyModifier);
    case 'rhythm':
      return generateRhythmQuestion(id, level, difficultyModifier);
    case 'harmony':
      return generateHarmonyQuestion(id, level, difficultyModifier);
    case 'genre_jazz':
      return generateGenreQuestion(id, 'jazz', difficultyModifier);
    case 'genre_classical':
      return generateGenreQuestion(id, 'classical', difficultyModifier);
    case 'genre_blues':
      return generateGenreQuestion(id, 'blues', difficultyModifier);
    case 'genre_pop':
      return generateGenreQuestion(id, 'pop', difficultyModifier);
    case 'musickeys':
      // Music keys uses its own level config, fallback to basic keys
      return generateMusicKeyQuestion(id, null, difficultyModifier);
    case 'notes':
      // Notes uses its own level config, fallback to basic notes
      return generateNoteQuestion(id, null, difficultyModifier);
    default:
      return generateChordQuestion(id, level, difficultyModifier);
  }
}

function generateChordQuestion(id: string, level: LevelConfig, difficultyModifier: number = 0.5): GameQuestion {
  const rootNote = randomElement(NOTE_NAMES);

  // Vary octave based on difficulty (harder = wider range)
  const octaveVariation = difficultyModifier > 0.5 ? randomInt(-1, 1) : 0;
  const rootMidi = getMidiFromNote(rootNote, (4 + octaveVariation) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
  const quality = randomElement(level.chords);
  const notes = getChordNotes(rootMidi, quality);

  // Get unique options from level chords (no duplicates)
  const otherChords = level.chords.filter(c => c !== quality);
  const allOptions = shuffleArray([quality, ...otherChords]);

  // Adjust duration based on difficulty (harder = shorter playback)
  const baseDuration = 1.5;
  const duration = baseDuration - (difficultyModifier * 0.5); // 1.5s to 1.0s

  return {
    id,
    type: 'chords',
    prompt: `What type of chord is this?`,
    correctAnswer: quality,
    options: allOptions.slice(0, 4),
    audioData: {
      notes,
      rootNote: rootMidi,
      type: quality,
      playbackMode: 'chord',
      duration,
    },
    difficulty: level.id,
    xpValue: 10 + level.id * 2 + Math.floor(difficultyModifier * 5),
  };
}

function generateScaleQuestion(id: string, level: LevelConfig, difficultyModifier: number = 0.5): GameQuestion {
  const rootNote = randomElement(NOTE_NAMES);

  // Vary octave based on difficulty
  const octaveVariation = difficultyModifier > 0.5 ? randomInt(-1, 1) : 0;
  const rootMidi = getMidiFromNote(rootNote, (4 + octaveVariation) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
  const scaleType = randomElement(level.scales);
  const notes = getScaleNotes(rootMidi, scaleType);

  // Get unique options from level scales (no duplicates)
  const otherScales = level.scales.filter(s => s !== scaleType);
  const allOptions = shuffleArray([scaleType, ...otherScales]);

  // Adjust note delay based on difficulty (harder = faster playback)
  const baseDelay = 0.35;
  const noteDelay = baseDelay - (difficultyModifier * 0.15); // 0.35s to 0.2s per note

  return {
    id,
    type: 'scales',
    prompt: `What scale is this?`,
    correctAnswer: scaleType,
    options: allOptions.slice(0, 4),
    audioData: {
      notes,
      rootNote: rootMidi,
      type: scaleType,
      playbackMode: 'scale',
      duration: noteDelay,
    },
    difficulty: level.id,
    xpValue: 10 + level.id * 2 + Math.floor(difficultyModifier * 5),
  };
}

function generateIntervalQuestion(id: string, level: LevelConfig, difficultyModifier: number = 0.5): GameQuestion {
  const rootNote = randomElement(NOTE_NAMES);

  // Vary octave based on difficulty
  const octaveVariation = difficultyModifier > 0.5 ? randomInt(-1, 1) : 0;
  const rootMidi = getMidiFromNote(rootNote, (4 + octaveVariation) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
  const intervalType = randomElement(level.intervals);
  const notes = getIntervalNotes(rootMidi, intervalType);

  // Get unique options from level intervals (no duplicates)
  const otherIntervals = level.intervals.filter(i => i !== intervalType);
  const allOptions = shuffleArray([intervalType, ...otherIntervals]);

  // At higher difficulty, play notes simultaneously instead of sequentially
  const playSimultaneously = difficultyModifier > 0.7;

  return {
    id,
    type: 'intervals',
    prompt: playSimultaneously
      ? `What interval is this? (played together)`
      : `What interval is this?`,
    correctAnswer: intervalType,
    options: allOptions.slice(0, 4),
    audioData: {
      notes,
      rootNote: rootMidi,
      type: intervalType,
      playbackMode: 'interval',
      duration: 1 - (difficultyModifier * 0.3), // 1s to 0.7s
    },
    difficulty: level.id,
    xpValue: 10 + level.id * 2 + Math.floor(difficultyModifier * 5),
  };
}

function generateInversionQuestion(id: string, level: LevelConfig): GameQuestion {
  const rootNote = randomElement(NOTE_NAMES);
  const rootMidi = getMidiFromNote(rootNote, 4);
  const quality = randomElement(level.chords.filter(c =>
    !c.includes('sus') && !c.includes('add')
  ));
  const inversion = randomElement(level.inversions);
  const notes = getChordNotes(rootMidi, quality, inversion);

  const options = shuffleArray(level.inversions);

  return {
    id,
    type: 'inversions',
    prompt: `What inversion is this ${CHORD_TYPES[quality].name} chord?`,
    correctAnswer: inversion,
    options: options.slice(0, 4),
    audioData: {
      notes,
      rootNote: rootMidi,
      type: `${quality}-${inversion}`,
      playbackMode: 'chord',
      duration: 1.5,
    },
    difficulty: level.id,
    xpValue: 15 + level.id * 2,
  };
}

function generateProgressionQuestion(id: string, level: LevelConfig): GameQuestion {
  const progression = randomElement(level.progressions);
  const rootNote = randomElement(NOTE_NAMES);
  const rootMidi = getMidiFromNote(rootNote, 4);

  // Generate chord notes for the progression
  const chordMidis = getProgressionChords(rootMidi, progression);
  const notes = chordMidis.flat();

  const options = shuffleArray(level.progressions);

  return {
    id,
    type: 'progressions',
    prompt: `What chord progression is this?`,
    correctAnswer: progression,
    options: options.slice(0, 4),
    audioData: {
      notes,
      rootNote: rootMidi,
      type: progression,
      playbackMode: 'chord',
      duration: 1,
    },
    difficulty: level.id,
    xpValue: 20 + level.id * 2,
  };
}

// Get chord notes for a progression
function getProgressionChords(rootMidi: number, progression: ProgressionType): number[][] {
  const numerals = progression.split('-');
  const majorScale = [0, 2, 4, 5, 7, 9, 11];

  return numerals.map(numeral => {
    const isMinor = numeral === numeral.toLowerCase() && numeral !== 'I' && numeral !== 'IV' && numeral !== 'V';
    let degree = 0;

    switch (numeral.replace('b', '').toUpperCase()) {
      case 'I': degree = 0; break;
      case 'II': degree = 1; break;
      case 'III': degree = 2; break;
      case 'IV': degree = 3; break;
      case 'V': degree = 4; break;
      case 'VI': degree = 5; break;
      case 'VII': degree = 6; break;
      case 'BVII': degree = 6; break;
    }

    const chordRoot = rootMidi + majorScale[degree];
    const isFlat = numeral.includes('b');
    const adjustedRoot = isFlat ? chordRoot - 1 : chordRoot;

    if (isMinor || numeral === 'ii' || numeral === 'iii' || numeral === 'vi') {
      return getChordNotes(adjustedRoot, 'minor');
    }
    return getChordNotes(adjustedRoot, 'major');
  });
}

function generateNoteReadingQuestion(id: string, level: LevelConfig, difficultyModifier: number = 0.5): GameQuestion {
  // Notes available based on difficulty
  const trebleNotes = [
    { note: 'C4', midi: 60 }, { note: 'D4', midi: 62 }, { note: 'E4', midi: 64 },
    { note: 'F4', midi: 65 }, { note: 'G4', midi: 67 }, { note: 'A4', midi: 69 },
    { note: 'B4', midi: 71 }, { note: 'C5', midi: 72 }, { note: 'D5', midi: 74 },
    { note: 'E5', midi: 76 }, { note: 'F5', midi: 77 }, { note: 'G5', midi: 79 },
  ];

  // More notes at higher difficulty
  const availableNotes = difficultyModifier < 0.3
    ? trebleNotes.slice(0, 7) // C4-B4 for beginners
    : difficultyModifier < 0.6
    ? trebleNotes.slice(0, 10) // C4-E5 for intermediate
    : trebleNotes; // All notes for advanced

  const selectedNote = randomElement(availableNotes);
  const noteNameOnly = selectedNote.note.replace(/[0-9]/g, '');

  // Generate options (other note names without octave)
  const allNoteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const otherNotes = allNoteNames.filter(n => n !== noteNameOnly);
  const wrongOptions = shuffleArray(otherNotes).slice(0, 3);
  const allOptions = shuffleArray([noteNameOnly, ...wrongOptions]);

  return {
    id,
    type: 'notereading',
    prompt: 'What note is shown on the staff?',
    correctAnswer: noteNameOnly,
    options: allOptions,
    audioData: {
      notes: [selectedNote.midi],
      rootNote: selectedNote.midi,
      type: selectedNote.note, // Full note name with octave for staff display
      playbackMode: 'chord',
      duration: 1,
    },
    difficulty: level.id,
    xpValue: 10 + level.id * 2 + Math.floor(difficultyModifier * 5),
  };
}

// Rhythm patterns with their beat timings (in beats, where 1 = quarter note)
const RHYTHM_PATTERNS = {
  'quarter-notes': { name: 'Quarter Notes', pattern: [1, 1, 1, 1], beats: 4 },
  'half-notes': { name: 'Half Notes', pattern: [2, 2], beats: 4 },
  'eighth-notes': { name: 'Eighth Notes', pattern: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], beats: 4 },
  'dotted-quarter': { name: 'Dotted Quarter', pattern: [1.5, 0.5, 1.5, 0.5], beats: 4 },
  'syncopated': { name: 'Syncopated', pattern: [0.5, 1, 0.5, 1, 1], beats: 4 },
  'triplets': { name: 'Triplets', pattern: [0.33, 0.33, 0.34, 0.33, 0.33, 0.34, 1, 1], beats: 4 },
  'mixed-simple': { name: 'Mixed Simple', pattern: [1, 0.5, 0.5, 1, 1], beats: 4 },
  'mixed-complex': { name: 'Mixed Complex', pattern: [0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5], beats: 4 },
};

function generateRhythmQuestion(id: string, level: LevelConfig, difficultyModifier: number = 0.5): GameQuestion {
  // Available patterns based on difficulty
  const allPatterns = Object.keys(RHYTHM_PATTERNS);
  const easyPatterns = ['quarter-notes', 'half-notes', 'eighth-notes'];
  const mediumPatterns = [...easyPatterns, 'dotted-quarter', 'mixed-simple'];
  const hardPatterns = allPatterns;

  const availablePatterns = difficultyModifier < 0.3
    ? easyPatterns
    : difficultyModifier < 0.6
    ? mediumPatterns
    : hardPatterns;

  const patternKey = randomElement(availablePatterns);
  const pattern = RHYTHM_PATTERNS[patternKey as keyof typeof RHYTHM_PATTERNS];

  // Convert pattern to milliseconds (at 120 BPM, 1 beat = 500ms)
  const bpm = 120;
  const msPerBeat = 60000 / bpm;
  const rhythmPattern = pattern.pattern.map(beat => Math.round(beat * msPerBeat));

  // Generate options
  const otherPatterns = availablePatterns.filter(p => p !== patternKey);
  const wrongOptions = shuffleArray(otherPatterns).slice(0, 3).map(
    p => RHYTHM_PATTERNS[p as keyof typeof RHYTHM_PATTERNS].name
  );
  const allOptions = shuffleArray([pattern.name, ...wrongOptions]);

  return {
    id,
    type: 'rhythm',
    prompt: 'What rhythm pattern do you hear?',
    correctAnswer: pattern.name,
    options: allOptions.slice(0, Math.min(4, allOptions.length)),
    audioData: {
      notes: [60], // Use middle C for the click
      rootNote: 60,
      type: patternKey,
      playbackMode: 'rhythm',
      duration: (pattern.beats * msPerBeat) / 1000,
      rhythmPattern,
    },
    difficulty: level.id,
    xpValue: 10 + level.id * 2 + Math.floor(difficultyModifier * 5),
  };
}

// Harmony/Voice Leading question types
const VOICE_LEADING_TYPES = [
  { name: 'Parallel Motion', description: 'Voices move in same direction by same interval' },
  { name: 'Contrary Motion', description: 'Voices move in opposite directions' },
  { name: 'Oblique Motion', description: 'One voice stays, other moves' },
  { name: 'Similar Motion', description: 'Voices move in same direction by different intervals' },
];

const CADENCE_TYPES = [
  { name: 'Perfect Authentic', pattern: 'V-I', description: 'Strongest resolution' },
  { name: 'Imperfect Authentic', pattern: 'V-I (inverted)', description: 'Softer resolution' },
  { name: 'Half Cadence', pattern: 'any-V', description: 'Unresolved, pauses on V' },
  { name: 'Plagal Cadence', pattern: 'IV-I', description: 'Amen cadence' },
  { name: 'Deceptive Cadence', pattern: 'V-vi', description: 'Unexpected resolution' },
];

function generateHarmonyQuestion(id: string, level: LevelConfig, difficultyModifier: number = 0.5): GameQuestion {
  const rootNote = randomElement(NOTE_NAMES);
  const rootMidi = getMidiFromNote(rootNote, 4);

  // Randomly choose between cadence identification and voice leading
  const questionType = Math.random() > 0.5 ? 'cadence' : 'voiceLeading';

  if (questionType === 'cadence') {
    const cadence = randomElement(CADENCE_TYPES);
    const otherCadences = CADENCE_TYPES.filter(c => c.name !== cadence.name);
    const options = shuffleArray([cadence.name, ...otherCadences.map(c => c.name)]).slice(0, 4);

    // Generate chord notes for the cadence
    let notes: number[] = [];
    if (cadence.pattern === 'V-I') {
      const vChord = getChordNotes(rootMidi + 7, 'major');
      const iChord = getChordNotes(rootMidi, 'major');
      notes = [...vChord, ...iChord];
    } else if (cadence.pattern === 'IV-I') {
      const ivChord = getChordNotes(rootMidi + 5, 'major');
      const iChord = getChordNotes(rootMidi, 'major');
      notes = [...ivChord, ...iChord];
    } else if (cadence.pattern === 'V-vi') {
      const vChord = getChordNotes(rootMidi + 7, 'major');
      const viChord = getChordNotes(rootMidi + 9, 'minor');
      notes = [...vChord, ...viChord];
    } else {
      const anyChord = getChordNotes(rootMidi, 'major');
      const vChord = getChordNotes(rootMidi + 7, 'major');
      notes = [...anyChord, ...vChord];
    }

    return {
      id,
      type: 'harmony',
      prompt: 'What type of cadence do you hear?',
      correctAnswer: cadence.name,
      options,
      audioData: {
        notes,
        rootNote: rootMidi,
        type: cadence.name,
        playbackMode: 'chord',
        duration: 1.5,
      },
      difficulty: level.id,
      xpValue: 15 + level.id * 2 + Math.floor(difficultyModifier * 5),
    };
  } else {
    const voiceLeading = randomElement(VOICE_LEADING_TYPES);
    const otherTypes = VOICE_LEADING_TYPES.filter(v => v.name !== voiceLeading.name);
    const options = shuffleArray([voiceLeading.name, ...otherTypes.map(v => v.name)]).slice(0, 4);

    // Generate two chords demonstrating the voice leading
    const chord1 = getChordNotes(rootMidi, 'major');
    let chord2: number[];

    if (voiceLeading.name === 'Parallel Motion') {
      chord2 = chord1.map(n => n + 2); // Move all voices up by whole step
    } else if (voiceLeading.name === 'Contrary Motion') {
      chord2 = [chord1[0] - 2, chord1[1], chord1[2] + 2]; // Bass down, treble up
    } else if (voiceLeading.name === 'Oblique Motion') {
      chord2 = [chord1[0], chord1[1] + 1, chord1[2] + 2]; // Bass stays
    } else {
      chord2 = [chord1[0] + 2, chord1[1] + 1, chord1[2] + 4]; // Same direction, different intervals
    }

    return {
      id,
      type: 'harmony',
      prompt: 'What type of voice leading do you hear?',
      correctAnswer: voiceLeading.name,
      options,
      audioData: {
        notes: [...chord1, ...chord2],
        rootNote: rootMidi,
        type: voiceLeading.name,
        playbackMode: 'chord',
        duration: 1.5,
      },
      difficulty: level.id,
      xpValue: 15 + level.id * 2 + Math.floor(difficultyModifier * 5),
    };
  }
}

function generateGenreQuestion(
  id: string,
  genre: 'jazz' | 'classical' | 'blues' | 'pop',
  difficultyModifier: number = 0.5
): GameQuestion {
  const content = GENRE_CONTENT[genre];
  const rootNote = randomElement(NOTE_NAMES);
  const rootMidi = getMidiFromNote(rootNote, 4);

  // Randomly choose content type: chord, scale, or progression
  const contentTypes = ['chord', 'scale', 'progression'];
  const selectedType = randomElement(contentTypes);

  if (selectedType === 'chord') {
    const chord = randomElement(content.chords);
    const notes = getChordNotes(rootMidi, chord);
    const otherChords = content.chords.filter(c => c !== chord);
    const options = shuffleArray([chord, ...otherChords]).slice(0, 4);

    return {
      id,
      type: `genre_${genre}` as GameModeType,
      prompt: `What ${genre} chord is this?`,
      correctAnswer: chord,
      options,
      audioData: {
        notes,
        rootNote: rootMidi,
        type: chord,
        playbackMode: 'chord',
        duration: 1.5,
      },
      difficulty: 1,
      xpValue: 12 + Math.floor(difficultyModifier * 8),
    };
  } else if (selectedType === 'scale') {
    const scale = randomElement(content.scales);
    const notes = getScaleNotes(rootMidi, scale);
    const otherScales = content.scales.filter(s => s !== scale);
    const options = shuffleArray([scale, ...otherScales]).slice(0, 4);

    return {
      id,
      type: `genre_${genre}` as GameModeType,
      prompt: `What ${genre} scale is this?`,
      correctAnswer: scale,
      options,
      audioData: {
        notes,
        rootNote: rootMidi,
        type: scale,
        playbackMode: 'scale',
        duration: 0.3,
      },
      difficulty: 1,
      xpValue: 12 + Math.floor(difficultyModifier * 8),
    };
  } else {
    const progression = randomElement(content.progressions);
    const progressionData = PROGRESSIONS[progression];
    const chordMidis = getProgressionChords(rootMidi, progression);
    const notes = chordMidis.flat();
    const otherProgressions = content.progressions.filter(p => p !== progression);
    const options = shuffleArray([progression, ...otherProgressions]).slice(0, 4);

    return {
      id,
      type: `genre_${genre}` as GameModeType,
      prompt: `What ${genre} progression is this?`,
      correctAnswer: progression,
      options,
      audioData: {
        notes,
        rootNote: rootMidi,
        type: progression,
        playbackMode: 'chord',
        duration: 1,
      },
      difficulty: 1,
      xpValue: 15 + Math.floor(difficultyModifier * 10),
    };
  }
}

// Generate Music Key question
function generateMusicKeyQuestion(
  id: string,
  keyLevel: MusicKeysLevelConfig | null,
  difficultyModifier: number = 0.5
): GameQuestion {
  // Default keys if no level provided (basic major keys)
  const defaultKeys: MusicKeyType[] = ['C', 'G', 'F', 'D', 'A', 'Am', 'Em', 'Dm'];
  const availableKeys = keyLevel?.availableKeys || defaultKeys;
  const playbackType = keyLevel?.playbackType || 'scale';

  // Select a random key
  const selectedKey = randomElement(availableKeys);
  const keyData = MUSIC_KEYS[selectedKey];

  // Get root MIDI note (octave 4)
  const rootMidi = getMidiFromNote(keyData.rootNote, 4);

  // Generate notes based on playback type
  let notes: number[] = [];
  let actualPlaybackMode: 'scale' | 'chord' | 'arpeggio' = 'scale';

  const effectivePlaybackType = playbackType === 'mixed'
    ? randomElement(['scale', 'chords', 'progression'] as const)
    : playbackType;

  if (effectivePlaybackType === 'scale') {
    // Play the scale
    const scaleIntervals = keyData.type === 'major'
      ? [0, 2, 4, 5, 7, 9, 11, 12] // Major scale + octave
      : [0, 2, 3, 5, 7, 8, 10, 12]; // Natural minor scale + octave
    notes = scaleIntervals.map(interval => rootMidi + interval);
    actualPlaybackMode = 'scale';
  } else if (effectivePlaybackType === 'chords') {
    // Play I-IV-V chord pattern in the key
    const majorScale = [0, 2, 4, 5, 7, 9, 11];
    const iChord = [rootMidi, rootMidi + 4, rootMidi + 7]; // I chord
    const ivChord = [rootMidi + 5, rootMidi + 9, rootMidi + 12]; // IV chord
    const vChord = [rootMidi + 7, rootMidi + 11, rootMidi + 14]; // V chord

    if (keyData.type === 'minor') {
      // Adjust for minor: i-iv-v
      iChord[1] = rootMidi + 3; // Minor third
      ivChord[1] = rootMidi + 8; // Minor iv
    }

    notes = [...iChord, ...ivChord, ...vChord, ...iChord];
    actualPlaybackMode = 'chord';
  } else {
    // Play a simple progression
    const majorScale = [0, 2, 4, 5, 7, 9, 11];
    if (keyData.type === 'major') {
      // I-V-vi-IV progression
      const iChord = getChordNotes(rootMidi, 'major');
      const vChord = getChordNotes(rootMidi + 7, 'major');
      const viChord = getChordNotes(rootMidi + 9, 'minor');
      const ivChord = getChordNotes(rootMidi + 5, 'major');
      notes = [...iChord, ...vChord, ...viChord, ...ivChord];
    } else {
      // i-VI-III-VII for minor
      const iChord = getChordNotes(rootMidi, 'minor');
      const viChord = getChordNotes(rootMidi + 8, 'major');
      const iiiChord = getChordNotes(rootMidi + 3, 'major');
      const viiChord = getChordNotes(rootMidi + 10, 'major');
      notes = [...iChord, ...viChord, ...iiiChord, ...viiChord];
    }
    actualPlaybackMode = 'chord';
  }

  // Generate options (other keys from available set)
  const otherKeys = availableKeys.filter(k => k !== selectedKey);
  const wrongOptions = shuffleArray(otherKeys).slice(0, 3);
  const allOptions = shuffleArray([selectedKey, ...wrongOptions]);

  // Calculate XP based on level difficulty
  const levelId = keyLevel?.id || 1;
  const baseXP = 15 + levelId * 3;

  // Create prompt based on playback type
  let prompt = 'What key is this?';
  if (effectivePlaybackType === 'scale') {
    prompt = 'What key is this scale in?';
  } else if (effectivePlaybackType === 'chords') {
    prompt = 'What key are these chords in?';
  } else {
    prompt = 'What key is this progression in?';
  }

  return {
    id,
    type: 'musickeys',
    prompt,
    correctAnswer: selectedKey,
    options: allOptions.slice(0, 4),
    audioData: {
      notes,
      rootNote: rootMidi,
      type: selectedKey,
      playbackMode: actualPlaybackMode,
      duration: effectivePlaybackType === 'scale' ? 0.3 : 1.2,
    },
    difficulty: levelId,
    xpValue: baseXP + Math.floor(difficultyModifier * 10),
  };
}

// Generate Music Key questions for a specific level
export function generateMusicKeyQuestions(
  keyLevel: MusicKeysLevelConfig,
  count: number
): GameQuestion[] {
  return Array.from({ length: count }, (_, i) => {
    const difficultyModifier = i / Math.max(1, count - 1);
    const id = `musickeys-${keyLevel.id}-${i}-${Date.now()}`;
    return generateMusicKeyQuestion(id, keyLevel, difficultyModifier);
  });
}

// Generate Note question for ear training
function generateNoteQuestion(
  id: string,
  notesLevel: NotesLevelConfig | null,
  difficultyModifier: number = 0.5
): GameQuestion {
  // Default configuration if no level provided
  const defaultNotes: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const defaultOctaveRange: [number, number] = [4, 4];
  const defaultIncludeOctave = false;

  const availableNotes = notesLevel?.availableNotes || defaultNotes;
  const octaveRange = notesLevel?.octaveRange || defaultOctaveRange;
  const includeOctaveInAnswer = notesLevel?.includeOctaveInAnswer ?? defaultIncludeOctave;

  // Select a random note
  const selectedNote = randomElement(availableNotes);

  // Select a random octave within the range
  const octave = randomInt(octaveRange[0], octaveRange[1]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

  // Get MIDI note number
  const midi = getMidiFromNote(selectedNote, octave);

  // Create the answer string (with or without octave)
  const correctAnswer = includeOctaveInAnswer ? `${selectedNote}${octave}` : selectedNote;

  // Generate wrong options (at least 3 more for 4 total options)
  let wrongOptions: string[] = [];

  if (includeOctaveInAnswer) {
    // When including octave, generate options with different notes and/or octaves
    const otherNotes = availableNotes.filter(n => n !== selectedNote);

    // Add same note in different octaves
    for (let o = octaveRange[0]; o <= octaveRange[1]; o++) {
      if (o !== octave) {
        wrongOptions.push(`${selectedNote}${o}`);
      }
    }

    // Add different notes in same octave
    for (const note of shuffleArray(otherNotes).slice(0, 4)) {
      wrongOptions.push(`${note}${octave}`);
    }

    // Add some different notes in different octaves for variety
    for (const note of shuffleArray(otherNotes).slice(0, 3)) {
      const randomOctave = randomInt(octaveRange[0], octaveRange[1]);
      if (`${note}${randomOctave}` !== correctAnswer) {
        wrongOptions.push(`${note}${randomOctave}`);
      }
    }
  } else {
    // Simple case: just different note names
    wrongOptions = availableNotes.filter(n => n !== selectedNote);
  }

  // Remove duplicates and limit to 3 wrong options
  wrongOptions = [...new Set(wrongOptions)].filter(opt => opt !== correctAnswer);
  wrongOptions = shuffleArray(wrongOptions).slice(0, 3);

  // Ensure we have exactly 4 options
  while (wrongOptions.length < 3) {
    const fallbackNote = randomElement(availableNotes);
    const fallbackOctave = randomInt(octaveRange[0], octaveRange[1]);
    const fallbackAnswer = includeOctaveInAnswer ? `${fallbackNote}${fallbackOctave}` : fallbackNote;
    if (fallbackAnswer !== correctAnswer && !wrongOptions.includes(fallbackAnswer)) {
      wrongOptions.push(fallbackAnswer);
    }
  }

  // Shuffle all options
  const allOptions = shuffleArray([correctAnswer, ...wrongOptions]);

  // Calculate XP based on level difficulty
  const levelId = notesLevel?.id || 1;
  const baseXP = 12 + levelId * 2;

  // Create prompt
  const prompt = includeOctaveInAnswer
    ? 'What note is this? (include octave)'
    : 'What note is this?';

  return {
    id,
    type: 'notes',
    prompt,
    correctAnswer,
    options: allOptions.slice(0, 4),
    audioData: {
      notes: [midi],
      rootNote: midi,
      type: correctAnswer,
      playbackMode: 'note',
      duration: 1.5,
    },
    difficulty: levelId,
    xpValue: baseXP + Math.floor(difficultyModifier * 8),
  };
}

// Generate Note questions for a specific level
export function generateNoteQuestions(
  notesLevel: NotesLevelConfig,
  count: number
): GameQuestion[] {
  return Array.from({ length: count }, (_, i) => {
    const difficultyModifier = i / Math.max(1, count - 1);
    const id = `notes-${notesLevel.id}-${i}-${Date.now()}`;
    return generateNoteQuestion(id, notesLevel, difficultyModifier);
  });
}

// Generate questions for a game session with progressive difficulty
export function generateGameQuestions(
  level: LevelConfig,
  mode: GameModeType,
  count: number
): GameQuestion[] {
  return Array.from({ length: count }, (_, i) =>
    generateQuestion(level, mode, i, count)
  );
}

// Format time as mm:ss
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format large numbers
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

// Get display name for chord/scale/interval types
export function getDisplayName(type: string, category: 'chord' | 'scale' | 'interval' | 'inversion'): string {
  switch (category) {
    case 'chord':
      return CHORD_TYPES[type as ChordQuality]?.name || type;
    case 'scale':
      return SCALE_TYPES[type as ScaleType]?.name || type;
    case 'interval':
      return INTERVALS[type as IntervalType]?.name || type;
    case 'inversion':
      return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    default:
      return type;
  }
}

// Calculate weak areas based on stats
export function calculateWeakAreas(
  chordStats: { chordType: string; attempts: number; correct: number }[],
  scaleStats: { scaleType: string; attempts: number; correct: number }[],
  intervalStats: { intervalType: string; attempts: number; correct: number }[]
): { type: 'chord' | 'scale' | 'interval'; name: string; accuracy: number; attempts: number }[] {
  const weakAreas: { type: 'chord' | 'scale' | 'interval'; name: string; accuracy: number; attempts: number }[] = [];

  chordStats.forEach(stat => {
    if (stat.attempts >= 5) {
      const accuracy = (stat.correct / stat.attempts) * 100;
      if (accuracy < 70) {
        weakAreas.push({
          type: 'chord',
          name: getDisplayName(stat.chordType, 'chord'),
          accuracy,
          attempts: stat.attempts,
        });
      }
    }
  });

  scaleStats.forEach(stat => {
    if (stat.attempts >= 5) {
      const accuracy = (stat.correct / stat.attempts) * 100;
      if (accuracy < 70) {
        weakAreas.push({
          type: 'scale',
          name: getDisplayName(stat.scaleType, 'scale'),
          accuracy,
          attempts: stat.attempts,
        });
      }
    }
  });

  intervalStats.forEach(stat => {
    if (stat.attempts >= 5) {
      const accuracy = (stat.correct / stat.attempts) * 100;
      if (accuracy < 70) {
        weakAreas.push({
          type: 'interval',
          name: getDisplayName(stat.intervalType, 'interval'),
          accuracy,
          attempts: stat.attempts,
        });
      }
    }
  });

  return weakAreas.sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
}
