import { NoteName } from './music';

export interface NotesLevelConfig {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockRequirement: number; // XP required to unlock
  questionsToComplete: number;
  availableNotes: NoteName[];
  octaveRange: [number, number]; // [minOctave, maxOctave]
  includeOctaveInAnswer: boolean; // Whether answers show octave (e.g., "C4" vs "C")
  features: string[];
}

export const NOTES_LEVELS: NotesLevelConfig[] = [
  {
    id: 1,
    name: 'Natural Notes',
    description: 'Learn C, D, E, F, G, A, B - the white keys',
    icon: '🎹',
    color: 'from-sky-400 to-blue-500',
    unlockRequirement: 0,
    questionsToComplete: 15,
    availableNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    octaveRange: [4, 4],
    includeOctaveInAnswer: false,
    features: ['Natural notes only', 'Single octave', 'No sharps/flats'],
  },
  {
    id: 2,
    name: 'Adding Sharps',
    description: 'Introduce C#, F#, and G# - common sharp notes',
    icon: '♯',
    color: 'from-violet-400 to-purple-500',
    unlockRequirement: 200,
    questionsToComplete: 18,
    availableNotes: ['C', 'C#', 'D', 'E', 'F', 'F#', 'G', 'G#', 'A', 'B'],
    octaveRange: [4, 4],
    includeOctaveInAnswer: false,
    features: ['Adding sharps', 'Single octave', '10 notes total'],
  },
  {
    id: 3,
    name: 'All 12 Notes',
    description: 'Master all chromatic notes in one octave',
    icon: '🎼',
    color: 'from-emerald-400 to-teal-500',
    unlockRequirement: 500,
    questionsToComplete: 20,
    availableNotes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    octaveRange: [4, 4],
    includeOctaveInAnswer: false,
    features: ['All 12 chromatic notes', 'Single octave', 'Full note mastery'],
  },
  {
    id: 4,
    name: 'Two Octaves',
    description: 'Expand to octaves 3 and 4',
    icon: '📈',
    color: 'from-amber-400 to-orange-500',
    unlockRequirement: 1000,
    questionsToComplete: 22,
    availableNotes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    octaveRange: [3, 4],
    includeOctaveInAnswer: true,
    features: ['All 12 notes', 'Two octaves (3-4)', 'Octave identification'],
  },
  {
    id: 5,
    name: 'Three Octaves',
    description: 'Expand your range to octaves 3, 4, and 5',
    icon: '🎯',
    color: 'from-rose-400 to-pink-500',
    unlockRequirement: 1800,
    questionsToComplete: 25,
    availableNotes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    octaveRange: [3, 5],
    includeOctaveInAnswer: true,
    features: ['All 12 notes', 'Three octaves (3-5)', 'Wider range'],
  },
  {
    id: 6,
    name: 'Extended Range',
    description: 'Full piano range from octave 2 to 6',
    icon: '🎹',
    color: 'from-indigo-400 to-violet-500',
    unlockRequirement: 3000,
    questionsToComplete: 28,
    availableNotes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    octaveRange: [2, 6],
    includeOctaveInAnswer: true,
    features: ['All 12 notes', 'Five octaves (2-6)', 'Extended range'],
  },
  {
    id: 7,
    name: 'Perfect Pitch Training',
    description: 'Random notes across full range - no reference',
    icon: '👂',
    color: 'from-cyan-400 to-teal-500',
    unlockRequirement: 5000,
    questionsToComplete: 30,
    availableNotes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    octaveRange: [2, 6],
    includeOctaveInAnswer: true,
    features: ['Perfect pitch focus', 'Random octaves', 'Advanced training'],
  },
  {
    id: 8,
    name: 'Note Master',
    description: 'Ultimate challenge - all notes, full range, fast pace',
    icon: '👑',
    color: 'from-yellow-400 to-amber-500',
    unlockRequirement: 8000,
    questionsToComplete: 35,
    availableNotes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    octaveRange: [1, 7],
    includeOctaveInAnswer: true,
    features: ['All notes', 'Full piano range (1-7)', 'True note mastery'],
  },
];

export function getNotesLevelById(id: number): NotesLevelConfig | undefined {
  return NOTES_LEVELS.find(level => level.id === id);
}

export function getUnlockedNotesLevels(totalXP: number): NotesLevelConfig[] {
  return NOTES_LEVELS.filter(level => totalXP >= level.unlockRequirement);
}

export function getNextNotesLevel(currentLevelId: number): NotesLevelConfig | undefined {
  const currentIndex = NOTES_LEVELS.findIndex(level => level.id === currentLevelId);
  return NOTES_LEVELS[currentIndex + 1];
}
