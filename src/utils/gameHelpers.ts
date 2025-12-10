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

// Generate questions for a level
export function generateQuestion(
  level: LevelConfig,
  mode: GameModeType,
  questionIndex: number
): GameQuestion {
  const id = `${mode}-${level.id}-${questionIndex}-${Date.now()}`;

  switch (mode) {
    case 'chords':
      return generateChordQuestion(id, level);
    case 'scales':
      return generateScaleQuestion(id, level);
    case 'intervals':
      return generateIntervalQuestion(id, level);
    case 'inversions':
      return generateInversionQuestion(id, level);
    case 'progressions':
      return generateProgressionQuestion(id, level);
    default:
      return generateChordQuestion(id, level);
  }
}

function generateChordQuestion(id: string, level: LevelConfig): GameQuestion {
  const rootNote = randomElement(NOTE_NAMES);
  const rootMidi = getMidiFromNote(rootNote, 4);
  const quality = randomElement(level.chords);
  const notes = getChordNotes(rootMidi, quality);

  const options = shuffleArray([
    quality,
    ...level.chords.filter(c => c !== quality).slice(0, 3),
  ]);

  return {
    id,
    type: 'chords',
    prompt: `What type of chord is this?`,
    correctAnswer: quality,
    options: options.slice(0, 4),
    audioData: {
      notes,
      rootNote: rootMidi,
      type: quality,
      playbackMode: 'chord',
      duration: 1.5,
    },
    difficulty: level.id,
    xpValue: 10 + level.id * 2,
  };
}

function generateScaleQuestion(id: string, level: LevelConfig): GameQuestion {
  const rootNote = randomElement(NOTE_NAMES);
  const rootMidi = getMidiFromNote(rootNote, 4);
  const scaleType = randomElement(level.scales);
  const notes = getScaleNotes(rootMidi, scaleType);

  const options = shuffleArray([
    scaleType,
    ...level.scales.filter(s => s !== scaleType).slice(0, 3),
  ]);

  return {
    id,
    type: 'scales',
    prompt: `What scale is this?`,
    correctAnswer: scaleType,
    options: options.slice(0, 4),
    audioData: {
      notes,
      rootNote: rootMidi,
      type: scaleType,
      playbackMode: 'scale',
      duration: 0.3,
    },
    difficulty: level.id,
    xpValue: 10 + level.id * 2,
  };
}

function generateIntervalQuestion(id: string, level: LevelConfig): GameQuestion {
  const rootNote = randomElement(NOTE_NAMES);
  const rootMidi = getMidiFromNote(rootNote, 4);
  const intervalType = randomElement(level.intervals);
  const notes = getIntervalNotes(rootMidi, intervalType);

  const options = shuffleArray([
    intervalType,
    ...level.intervals.filter(i => i !== intervalType).slice(0, 3),
  ]);

  return {
    id,
    type: 'intervals',
    prompt: `What interval is this?`,
    correctAnswer: intervalType,
    options: options.slice(0, 4),
    audioData: {
      notes,
      rootNote: rootMidi,
      type: intervalType,
      playbackMode: 'interval',
      duration: 1,
    },
    difficulty: level.id,
    xpValue: 10 + level.id * 2,
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

// Generate questions for a game session
export function generateGameQuestions(
  level: LevelConfig,
  mode: GameModeType,
  count: number
): GameQuestion[] {
  return Array.from({ length: count }, (_, i) =>
    generateQuestion(level, mode, i)
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
