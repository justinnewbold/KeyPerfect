import { MusicKeyType } from './music';

export interface MusicKeysLevelConfig {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockRequirement: number; // XP required to unlock
  questionsToComplete: number;
  availableKeys: MusicKeyType[];
  includeMinor: boolean;
  playbackType: 'scale' | 'chords' | 'progression' | 'mixed';
  features: string[];
}

export const MUSIC_KEYS_LEVELS: MusicKeysLevelConfig[] = [
  {
    id: 1,
    name: 'Natural Keys',
    description: 'Learn C, G, and F major - the foundation',
    icon: '🌱',
    color: 'from-green-400 to-emerald-500',
    unlockRequirement: 0,
    questionsToComplete: 15,
    availableKeys: ['C', 'G', 'F'],
    includeMinor: false,
    playbackType: 'scale',
    features: ['Major keys only', 'No sharps or 1 sharp/flat', 'Scale playback'],
  },
  {
    id: 2,
    name: 'Sharp Keys',
    description: 'Add D and A major - popular guitar keys',
    icon: '♯',
    color: 'from-blue-400 to-cyan-500',
    unlockRequirement: 300,
    questionsToComplete: 18,
    availableKeys: ['C', 'G', 'F', 'D', 'A'],
    includeMinor: false,
    playbackType: 'scale',
    features: ['Up to 3 sharps', 'Guitar-friendly keys', 'Scale playback'],
  },
  {
    id: 3,
    name: 'Flat Keys',
    description: 'Introduce Bb and Eb - jazz essentials',
    icon: '♭',
    color: 'from-purple-400 to-violet-500',
    unlockRequirement: 800,
    questionsToComplete: 20,
    availableKeys: ['C', 'G', 'F', 'D', 'A', 'Bb', 'Eb'],
    includeMinor: false,
    playbackType: 'scale',
    features: ['Sharps and flats', 'Jazz keys introduced', 'Scale playback'],
  },
  {
    id: 4,
    name: 'Relative Minors',
    description: 'Learn Am, Em, Dm - natural minor keys',
    icon: '🌙',
    color: 'from-indigo-400 to-purple-500',
    unlockRequirement: 1500,
    questionsToComplete: 22,
    availableKeys: ['C', 'G', 'F', 'D', 'A', 'Am', 'Em', 'Dm'],
    includeMinor: true,
    playbackType: 'scale',
    features: ['Major and minor keys', 'Easy relative minors', 'Identify key quality'],
  },
  {
    id: 5,
    name: 'Chord Recognition',
    description: 'Identify keys from chord progressions',
    icon: '🎹',
    color: 'from-amber-400 to-orange-500',
    unlockRequirement: 2500,
    questionsToComplete: 25,
    availableKeys: ['C', 'G', 'F', 'D', 'A', 'Bb', 'Eb', 'Am', 'Em', 'Dm', 'Bm', 'Gm'],
    includeMinor: true,
    playbackType: 'chords',
    features: ['Chord-based identification', 'I-IV-V patterns', 'Common progressions'],
  },
  {
    id: 6,
    name: 'Extended Keys',
    description: 'Add E, B, Ab - more sharps and flats',
    icon: '🔥',
    color: 'from-red-400 to-rose-500',
    unlockRequirement: 4000,
    questionsToComplete: 28,
    availableKeys: ['C', 'G', 'F', 'D', 'A', 'E', 'B', 'Bb', 'Eb', 'Ab', 'Am', 'Em', 'Dm', 'Bm', 'F#m', 'Cm'],
    includeMinor: true,
    playbackType: 'mixed',
    features: ['4-5 sharps/flats', 'All common keys', 'Mixed playback types'],
  },
  {
    id: 7,
    name: 'All Major Keys',
    description: 'Complete circle of fifths - major keys',
    icon: '⭕',
    color: 'from-pink-400 to-fuchsia-500',
    unlockRequirement: 6000,
    questionsToComplete: 30,
    availableKeys: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Gb', 'F', 'Bb', 'Eb', 'Ab', 'Db'],
    includeMinor: false,
    playbackType: 'mixed',
    features: ['All 12 major keys', 'Enharmonic keys', 'Circle of fifths mastery'],
  },
  {
    id: 8,
    name: 'Key Master',
    description: 'All keys, all formats - ultimate challenge',
    icon: '👑',
    color: 'from-yellow-400 to-amber-500',
    unlockRequirement: 10000,
    questionsToComplete: 35,
    availableKeys: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Gb', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm'],
    includeMinor: true,
    playbackType: 'mixed',
    features: ['All major and minor keys', 'Progression identification', 'True key mastery'],
  },
];

export function getMusicKeysLevelById(id: number): MusicKeysLevelConfig | undefined {
  return MUSIC_KEYS_LEVELS.find(level => level.id === id);
}

export function getUnlockedMusicKeysLevels(totalXP: number): MusicKeysLevelConfig[] {
  return MUSIC_KEYS_LEVELS.filter(level => totalXP >= level.unlockRequirement);
}

export function getNextMusicKeysLevel(currentLevelId: number): MusicKeysLevelConfig | undefined {
  const currentIndex = MUSIC_KEYS_LEVELS.findIndex(level => level.id === currentLevelId);
  return MUSIC_KEYS_LEVELS[currentIndex + 1];
}
