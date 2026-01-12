export type GameModeType =
  | 'chords' | 'scales' | 'intervals' | 'progressions'
  | 'inversions' | 'reverse' | 'melodic' | 'notereading' | 'rhythm'
  | 'harmony' | 'genre_jazz' | 'genre_classical' | 'genre_blues' | 'genre_pop';

export type ChallengeModeType =
  | 'daily' | 'speedrun' | 'survival' | 'timeattack';

export interface GameMode {
  id: GameModeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  instructions: string;
}

export interface ChallengeMode {
  id: ChallengeModeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  rules: string[];
}

export const GAME_MODES: Record<GameModeType, GameMode> = {
  chords: {
    id: 'chords',
    name: 'Chord Recognition',
    description: 'Identify chord types by ear',
    icon: '🎹',
    color: 'from-purple-500 to-indigo-600',
    instructions: 'Listen to the chord and select the correct chord type.',
  },
  scales: {
    id: 'scales',
    name: 'Scale Recognition',
    description: 'Identify scales and modes',
    icon: '🎼',
    color: 'from-blue-500 to-cyan-600',
    instructions: 'Listen to the scale and identify which scale type is being played.',
  },
  intervals: {
    id: 'intervals',
    name: 'Interval Training',
    description: 'Identify intervals between notes',
    icon: '📏',
    color: 'from-green-500 to-emerald-600',
    instructions: 'Two notes will be played. Identify the interval between them.',
  },
  progressions: {
    id: 'progressions',
    name: 'Chord Progressions',
    description: 'Identify common chord progressions',
    icon: '🔄',
    color: 'from-orange-500 to-amber-600',
    instructions: 'Listen to the chord progression and identify the pattern.',
  },
  inversions: {
    id: 'inversions',
    name: 'Chord Inversions',
    description: 'Identify root position and inversions',
    icon: '🔃',
    color: 'from-pink-500 to-rose-600',
    instructions: 'Identify whether the chord is in root position or an inversion.',
  },
  reverse: {
    id: 'reverse',
    name: 'Reverse Mode',
    description: 'Play the chord/scale you hear',
    icon: '🔙',
    color: 'from-violet-500 to-purple-600',
    instructions: 'Listen to the sound and play it back on the keyboard.',
  },
  melodic: {
    id: 'melodic',
    name: 'Melodic Dictation',
    description: 'Transcribe short melodies',
    icon: '📝',
    color: 'from-teal-500 to-cyan-600',
    instructions: 'Listen to the melody and play it back note by note.',
  },
  notereading: {
    id: 'notereading',
    name: 'Note Reading',
    description: 'Read notes on the staff',
    icon: '🎼',
    color: 'from-indigo-500 to-blue-600',
    instructions: 'Identify the note shown on the musical staff.',
  },
  rhythm: {
    id: 'rhythm',
    name: 'Rhythm Training',
    description: 'Identify rhythm patterns',
    icon: '🥁',
    color: 'from-rose-500 to-red-600',
    instructions: 'Listen to the rhythm pattern and identify its time signature or pattern type.',
  },
  harmony: {
    id: 'harmony',
    name: 'Voice Leading',
    description: 'Identify voice movements in harmony',
    icon: '🎭',
    color: 'from-amber-500 to-yellow-600',
    instructions: 'Listen to the chord progression and identify the voice leading or harmonic movement.',
  },
  genre_jazz: {
    id: 'genre_jazz',
    name: 'Jazz Training',
    description: 'Jazz-specific ear training',
    icon: '🎷',
    color: 'from-amber-500 to-orange-600',
    instructions: 'Practice with jazz chords, scales, and progressions.',
  },
  genre_classical: {
    id: 'genre_classical',
    name: 'Classical Training',
    description: 'Classical music ear training',
    icon: '🎻',
    color: 'from-purple-500 to-indigo-600',
    instructions: 'Practice with classical harmony and voice leading.',
  },
  genre_blues: {
    id: 'genre_blues',
    name: 'Blues Training',
    description: 'Blues-specific ear training',
    icon: '🎸',
    color: 'from-blue-500 to-indigo-600',
    instructions: 'Practice with blues chords, scales, and progressions.',
  },
  genre_pop: {
    id: 'genre_pop',
    name: 'Pop Training',
    description: 'Pop music ear training',
    icon: '🎤',
    color: 'from-pink-500 to-purple-600',
    instructions: 'Practice with common pop chord progressions and patterns.',
  },
};

export const CHALLENGE_MODES: Record<ChallengeModeType, ChallengeMode> = {
  daily: {
    id: 'daily',
    name: 'Daily Challenge',
    description: 'New challenge every day',
    icon: '📅',
    color: 'from-amber-500 to-orange-600',
    rules: [
      'One attempt per day',
      '10 questions',
      'Mixed content types',
      'Bonus XP for completion',
      'Maintains your daily streak',
    ],
  },
  speedrun: {
    id: 'speedrun',
    name: 'Speed Run',
    description: '60 seconds, max points',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-500',
    rules: [
      '60 second time limit',
      'Answer as many as you can',
      'Quick responses = more points',
      'Wrong answers lose time',
    ],
  },
  survival: {
    id: 'survival',
    name: 'Survival',
    description: '3 lives, how far can you go?',
    icon: '❤️',
    color: 'from-red-500 to-rose-600',
    rules: [
      'Start with 3 lives',
      'Wrong answer = lose a life',
      'Points increase with streak',
      'How long can you survive?',
    ],
  },
  timeattack: {
    id: 'timeattack',
    name: 'Time Attack',
    description: 'Beat the clock',
    icon: '⏱️',
    color: 'from-cyan-500 to-blue-600',
    rules: [
      'Start with 30 seconds',
      'Correct answers add time',
      'Wrong answers lose time',
      'Keep the clock running!',
    ],
  },
};

export interface GameQuestion {
  id: string;
  type: GameModeType;
  prompt: string;
  correctAnswer: string;
  options: string[];
  audioData: AudioQuestionData;
  difficulty: number;
  xpValue: number;
}

export interface AudioQuestionData {
  notes: number[]; // MIDI note numbers
  rootNote: number;
  type: string;
  playbackMode: 'chord' | 'arpeggio' | 'scale' | 'interval' | 'rhythm';
  duration: number;
  rhythmPattern?: number[]; // Beat timings for rhythm mode (in ms)
}

export interface GameState {
  mode: GameModeType | ChallengeModeType;
  level: number;
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  streak: number;
  lives: number;
  timeRemaining: number;
  questions: GameQuestion[];
  answers: AnswerRecord[];
  gameStartTime: number; // When the entire game started (for total time calculation)
  startTime: number; // When current question started (for response time)
  isComplete: boolean;
}

export interface AnswerRecord {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeToAnswer: number;
  xpEarned: number;
}

export interface GameResult {
  mode: GameModeType | ChallengeModeType;
  level: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  totalXPEarned: number;
  longestStreak: number;
  totalTime: number;
  averageResponseTime: number;
  newAchievements: string[];
  answers: AnswerRecord[];
}
