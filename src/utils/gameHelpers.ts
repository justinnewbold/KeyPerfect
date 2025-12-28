import {
  NOTE_NAMES,
  NoteName,
  ChordQuality,
  ScaleType,
  IntervalType,
  InversionType,
  ProgressionType,
  CHORD_TYPES,
  SCALE_TYPES,
  INTERVALS,
  getMidiFromNote,
} from '../types/music';
import { LevelConfig } from '../types/levels';
import { GameQuestion, AudioQuestionData, GameModeType } from '../types/gameModes';

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

  // Ensure we have at least 4 options - use all available chords from the level
  const otherChords = level.chords.filter(c => c !== quality);
  // If we don't have enough options, just use what we have (minimum 2 options)
  const allOptions = shuffleArray([quality, ...otherChords]);

  // Adjust duration based on difficulty (harder = shorter playback)
  const baseDuration = 1.5;
  const duration = baseDuration - (difficultyModifier * 0.5); // 1.5s to 1.0s

  return {
    id,
    type: 'chords',
    prompt: `What type of chord is this?`,
    correctAnswer: quality,
    options: allOptions.slice(0, Math.min(4, allOptions.length)),
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

  // Ensure we have at least 4 options - use all available scales from the level
  const otherScales = level.scales.filter(s => s !== scaleType);
  // If we don't have enough options, just use what we have (minimum 2 options)
  const allOptions = shuffleArray([scaleType, ...otherScales]);

  // Adjust note delay based on difficulty (harder = faster playback)
  const baseDelay = 0.35;
  const noteDelay = baseDelay - (difficultyModifier * 0.15); // 0.35s to 0.2s per note

  return {
    id,
    type: 'scales',
    prompt: `What scale is this?`,
    correctAnswer: scaleType,
    options: allOptions.slice(0, Math.min(4, allOptions.length)),
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

  // Ensure we have at least 4 options - use all available intervals from the level
  const otherIntervals = level.intervals.filter(i => i !== intervalType);
  // If we don't have enough options, just use what we have (minimum 2 options)
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
    options: allOptions.slice(0, Math.min(4, allOptions.length)),
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
