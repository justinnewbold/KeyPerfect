import { ChordQuality, ScaleType, IntervalType, InversionType, ProgressionType } from './music';

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockRequirement: number; // XP required to unlock
  questionsToComplete: number;
  chords: ChordQuality[];
  scales: ScaleType[];
  intervals: IntervalType[];
  inversions: InversionType[];
  progressions: ProgressionType[];
  features: string[];
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Beginner Basics',
    description: 'Learn major and minor chords',
    icon: '🌱',
    color: 'from-green-400 to-emerald-500',
    unlockRequirement: 0,
    questionsToComplete: 20,
    chords: ['major', 'minor'],
    scales: ['major', 'natural_minor'],
    intervals: ['major3', 'perfect5', 'octave'],
    inversions: ['root'],
    progressions: [],
    features: ['Basic chord recognition', 'Simple scales'],
  },
  {
    id: 2,
    name: 'Building Foundations',
    description: 'Add diminished and augmented chords',
    icon: '🏗️',
    color: 'from-blue-400 to-cyan-500',
    unlockRequirement: 500,
    questionsToComplete: 25,
    chords: ['major', 'minor', 'diminished', 'augmented'],
    scales: ['major', 'natural_minor', 'pentatonic_major', 'pentatonic_minor'],
    intervals: ['minor2', 'major2', 'minor3', 'major3', 'perfect4', 'perfect5', 'octave'],
    inversions: ['root'],
    progressions: ['I-IV-V-I'],
    features: ['Extended chord vocabulary', 'Pentatonic scales', 'Basic progressions'],
  },
  {
    id: 3,
    name: 'Seventh Heaven',
    description: 'Explore 7th chords',
    icon: '🎵',
    color: 'from-purple-400 to-violet-500',
    unlockRequirement: 1500,
    questionsToComplete: 30,
    chords: ['major', 'minor', 'diminished', 'augmented', 'major7', 'minor7', 'dominant7'],
    scales: ['major', 'natural_minor', 'harmonic_minor', 'dorian'],
    intervals: ['minor2', 'major2', 'minor3', 'major3', 'perfect4', 'tritone', 'perfect5', 'minor6', 'major6', 'minor7', 'major7', 'octave'],
    inversions: ['root', 'first'],
    progressions: ['I-IV-V-I', 'I-V-vi-IV'],
    features: ['7th chord mastery', 'Harmonic minor', 'First inversions'],
  },
  {
    id: 4,
    name: 'Jazz Foundations',
    description: 'Jazz voicings and progressions',
    icon: '🎷',
    color: 'from-amber-400 to-orange-500',
    unlockRequirement: 3500,
    questionsToComplete: 35,
    chords: ['major', 'minor', 'diminished', 'augmented', 'major7', 'minor7', 'dominant7', 'half_diminished7', 'diminished7'],
    scales: ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor', 'dorian', 'mixolydian'],
    intervals: ['unison', 'minor2', 'major2', 'minor3', 'major3', 'perfect4', 'tritone', 'perfect5', 'minor6', 'major6', 'minor7', 'major7', 'octave'],
    inversions: ['root', 'first', 'second'],
    progressions: ['I-IV-V-I', 'I-V-vi-IV', 'ii-V-I', 'I-vi-IV-V'],
    features: ['ii-V-I mastery', 'Extended 7ths', 'Modal scales'],
  },
  {
    id: 5,
    name: 'Modal Explorer',
    description: 'All modes and inversions',
    icon: '🌈',
    color: 'from-pink-400 to-rose-500',
    unlockRequirement: 6000,
    questionsToComplete: 40,
    chords: ['major', 'minor', 'diminished', 'augmented', 'major7', 'minor7', 'dominant7', 'half_diminished7', 'diminished7', 'sus2', 'sus4'],
    scales: ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'],
    intervals: ['unison', 'minor2', 'major2', 'minor3', 'major3', 'perfect4', 'tritone', 'perfect5', 'minor6', 'major6', 'minor7', 'major7', 'octave'],
    inversions: ['root', 'first', 'second'],
    progressions: ['I-IV-V-I', 'I-V-vi-IV', 'ii-V-I', 'I-vi-IV-V', 'I-IV-vi-V', 'vi-IV-I-V'],
    features: ['All 7 modes', 'Suspended chords', 'All inversions'],
  },
  {
    id: 6,
    name: 'Extended Harmony',
    description: 'Add9, 9th chords and beyond',
    icon: '✨',
    color: 'from-indigo-400 to-blue-500',
    unlockRequirement: 10000,
    questionsToComplete: 45,
    chords: ['major', 'minor', 'diminished', 'augmented', 'major7', 'minor7', 'dominant7', 'half_diminished7', 'diminished7', 'sus2', 'sus4', 'add9', 'major9', 'minor9', 'dominant9', '6', 'minor6'],
    scales: ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'pentatonic_major', 'pentatonic_minor', 'blues', 'bebop_dominant'],
    intervals: ['unison', 'minor2', 'major2', 'minor3', 'major3', 'perfect4', 'tritone', 'perfect5', 'minor6', 'major6', 'minor7', 'major7', 'octave'],
    inversions: ['root', 'first', 'second', 'third'],
    progressions: ['I-IV-V-I', 'I-V-vi-IV', 'ii-V-I', 'I-vi-IV-V', 'I-IV-vi-V', 'vi-IV-I-V', 'I-V-IV-I', 'I-bVII-IV-I', 'ii-V-I-VI', 'I-VI-ii-V'],
    features: ['Extended chords', 'Bebop scales', 'Jazz progressions'],
  },
  {
    id: 7,
    name: 'Advanced Ear',
    description: 'Complex progressions and altered chords',
    icon: '👂',
    color: 'from-red-400 to-pink-500',
    unlockRequirement: 15000,
    questionsToComplete: 50,
    chords: ['major', 'minor', 'diminished', 'augmented', 'major7', 'minor7', 'dominant7', 'half_diminished7', 'diminished7', 'sus2', 'sus4', 'add9', 'major9', 'minor9', 'dominant9', '6', 'minor6', 'dominant7sharp9', 'dominant7flat9', 'minorMajor7', '69'],
    scales: ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'aeolian', 'pentatonic_major', 'pentatonic_minor', 'blues', 'chromatic', 'bebop_dominant', 'bebop_major', 'whole_tone', 'altered'],
    intervals: ['unison', 'minor2', 'major2', 'minor3', 'major3', 'perfect4', 'tritone', 'perfect5', 'minor6', 'major6', 'minor7', 'major7', 'octave'],
    inversions: ['root', 'first', 'second', 'third'],
    progressions: ['I-IV-V-I', 'I-V-vi-IV', 'ii-V-I', 'I-vi-IV-V', 'I-IV-vi-V', 'vi-IV-I-V', 'I-V-IV-I', 'I-bVII-IV-I', 'ii-V-I-VI', 'I-VI-ii-V', 'iii-VI-ii-V', 'ii-bII-I'],
    features: ['Altered dominants', 'Bebop scales', 'Advanced jazz'],
  },
  {
    id: 8,
    name: 'Master',
    description: 'Ultimate challenge - everything unlocked',
    icon: '👑',
    color: 'from-yellow-400 to-amber-500',
    unlockRequirement: 25000,
    questionsToComplete: 60,
    chords: ['major', 'minor', 'diminished', 'augmented', 'major7', 'minor7', 'dominant7', 'half_diminished7', 'diminished7', 'sus2', 'sus4', 'add9', 'major9', 'minor9', 'dominant9', 'dominant11', 'dominant13', '6', 'minor6', '69', 'dominant7sharp9', 'dominant7flat9', 'dominant7sharp5', 'dominant7flat5', 'minorMajor7', 'augmented7', 'dominant7sus4', 'dominant7alt'],
    scales: ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'aeolian', 'pentatonic_major', 'pentatonic_minor', 'blues', 'chromatic', 'bebop_dominant', 'bebop_major', 'bebop_minor', 'whole_tone', 'diminished_whole_half', 'diminished_half_whole', 'altered', 'lydian_dominant', 'phrygian_dominant', 'hungarian_minor'],
    intervals: ['unison', 'minor2', 'major2', 'minor3', 'major3', 'perfect4', 'tritone', 'perfect5', 'minor6', 'major6', 'minor7', 'major7', 'octave'],
    inversions: ['root', 'first', 'second', 'third'],
    progressions: ['I-IV-V-I', 'I-V-vi-IV', 'ii-V-I', 'I-vi-IV-V', 'I-IV-vi-V', 'vi-IV-I-V', 'I-V-IV-I', 'I-bVII-IV-I', 'ii-V-I-VI', 'I-VI-ii-V', 'iii-VI-ii-V', 'ii-bII-I', 'I-vi-ii-V', 'I-IV-iii-VI', 'I7-IV7-V7'],
    features: ['Everything unlocked', 'All jazz voicings', 'True mastery'],
  },
];

export function getLevelById(id: number): LevelConfig | undefined {
  return LEVELS.find(level => level.id === id);
}

export function getUnlockedLevels(totalXP: number): LevelConfig[] {
  return LEVELS.filter(level => totalXP >= level.unlockRequirement);
}

export function getNextLevel(currentLevelId: number): LevelConfig | undefined {
  const currentIndex = LEVELS.findIndex(level => level.id === currentLevelId);
  return LEVELS[currentIndex + 1];
}
