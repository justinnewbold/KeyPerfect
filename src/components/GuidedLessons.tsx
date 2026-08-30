import React, { useState, useMemo } from 'react';
import { BookOpen, Play, ChevronRight, ChevronLeft, Volume2, Check } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { useAudio } from '../hooks/useAudio';
import {
  CHORD_TYPES,
  SCALE_TYPES,
  INTERVALS,
  ChordQuality,
  ScaleType,
  IntervalType,
  getMidiFromNote,
  NOTE_NAMES,
} from '../types/music';
import {
  getChordNotes,
  getScaleNotes,
  getIntervalNotes,
  randomElement,
} from '../utils/gameHelpers';

interface GuidedLessonsProps {
  onBack: () => void;
  onStartPractice: (mode: string) => void;
}

interface Lesson {
  id: string;
  title: string;
  category: 'chords' | 'scales' | 'intervals';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: LessonStep[];
}

interface LessonStep {
  type: 'explain' | 'listen' | 'compare' | 'quiz';
  title: string;
  content: string;
  audioExample?: { notes: number[]; playbackMode: 'chord' | 'scale' | 'interval' };
  comparisonAudio?: { notes: number[]; playbackMode: 'chord' | 'scale' | 'interval'; label: string };
  quizOptions?: string[];
  quizAnswer?: string;
}

// ---------------------------------------------------------------------------
// Lesson definitions
// ---------------------------------------------------------------------------

const LESSONS: Lesson[] = [
  // 1. Major vs Minor Chords
  {
    id: 'major-vs-minor',
    title: 'Major vs Minor Chords',
    category: 'chords',
    difficulty: 'beginner',
    steps: [
      {
        type: 'explain',
        title: 'The Major Chord',
        content:
          'A major chord sounds bright and happy. It\'s built with intervals: Root, Major 3rd, Perfect 5th. The distance from the root to the 3rd is 4 semitones, and from the 3rd to the 5th is 3 semitones.',
      },
      {
        type: 'listen',
        title: 'Hear a C Major Chord',
        content:
          'Listen to a C major chord. Notice its bright, uplifting quality. This is the most fundamental chord in Western music.',
        audioExample: { notes: [60, 64, 67], playbackMode: 'chord' },
      },
      {
        type: 'explain',
        title: 'The Minor Chord',
        content:
          'A minor chord sounds darker and sadder. The 3rd is lowered by one semitone compared to major. So the distance from root to 3rd is 3 semitones, and from 3rd to 5th is 4 semitones.',
      },
      {
        type: 'listen',
        title: 'Hear a C Minor Chord',
        content:
          'Listen to a C minor chord. Notice how it has a darker, more melancholic quality compared to the major chord you heard before.',
        audioExample: { notes: [60, 63, 67], playbackMode: 'chord' },
      },
      {
        type: 'compare',
        title: 'Compare Major and Minor',
        content:
          'Play both chords side by side. Notice how the minor chord has a darker quality? The only difference is one note — the 3rd — lowered by a single semitone.',
        audioExample: { notes: [60, 64, 67], playbackMode: 'chord' },
        comparisonAudio: { notes: [60, 63, 67], playbackMode: 'chord', label: 'C Minor' },
      },
      {
        type: 'quiz',
        title: 'Test Your Ears',
        content: 'Listen to the chord. Is it major or minor?',
        quizOptions: ['major', 'minor'],
        quizAnswer: '', // filled dynamically
      },
    ],
  },

  // 2. Understanding 7th Chords
  {
    id: 'seventh-chords',
    title: 'Understanding 7th Chords',
    category: 'chords',
    difficulty: 'intermediate',
    steps: [
      {
        type: 'explain',
        title: 'What Are 7th Chords?',
        content:
          'Seventh chords add a 4th note on top of a triad. They create richer, more colorful sounds used extensively in jazz, pop, and R&B. The three main types are Major 7th, Dominant 7th, and Minor 7th.',
      },
      {
        type: 'listen',
        title: 'Major 7th Chord',
        content:
          'The Major 7th chord (Maj7) has a dreamy, sophisticated sound. It is built: Root, Major 3rd, Perfect 5th, Major 7th. The top note is just one semitone below the octave.',
        audioExample: { notes: [60, 64, 67, 71], playbackMode: 'chord' },
      },
      {
        type: 'listen',
        title: 'Dominant 7th Chord',
        content:
          'The Dominant 7th chord (7) has a bluesy, tension-filled sound that wants to resolve. It replaces the major 7th with a minor 7th interval, creating an audible push toward resolution.',
        audioExample: { notes: [60, 64, 67, 70], playbackMode: 'chord' },
      },
      {
        type: 'listen',
        title: 'Minor 7th Chord',
        content:
          'The Minor 7th chord (m7) combines a minor triad with a minor 7th on top. It sounds jazzy, mellow, and smooth — a staple of jazz and neo-soul.',
        audioExample: { notes: [60, 63, 67, 70], playbackMode: 'chord' },
      },
      {
        type: 'compare',
        title: 'Maj7 vs Dominant 7',
        content:
          'Compare the Major 7th and Dominant 7th side by side. The Major 7th sounds dreamy and resolved, while the Dominant 7th has more tension and wants to move somewhere.',
        audioExample: { notes: [60, 64, 67, 71], playbackMode: 'chord' },
        comparisonAudio: { notes: [60, 64, 67, 70], playbackMode: 'chord', label: 'Dominant 7' },
      },
      {
        type: 'quiz',
        title: 'Identify the 7th Chord',
        content: 'Listen to the chord. Which type of 7th chord is it?',
        quizOptions: ['major7', 'dominant7', 'minor7'],
        quizAnswer: '',
      },
    ],
  },

  // 3. The Major Scale
  {
    id: 'major-scale',
    title: 'The Major Scale',
    category: 'scales',
    difficulty: 'beginner',
    steps: [
      {
        type: 'explain',
        title: 'Building the Major Scale',
        content:
          'The major scale is the foundation of Western music. It follows a specific pattern of whole steps (W) and half steps (H): W-W-H-W-W-W-H. This pattern always produces that familiar "Do Re Mi" sound.',
      },
      {
        type: 'listen',
        title: 'C Major Scale',
        content:
          'Listen to the C major scale ascending. All the white keys on a piano from C to C form this scale. It sounds bright, stable, and resolved.',
        audioExample: { notes: [60, 62, 64, 65, 67, 69, 71, 72], playbackMode: 'scale' },
      },
      {
        type: 'explain',
        title: 'Scale Degrees',
        content:
          'Each note in the scale has a name: Tonic (1st), Supertonic (2nd), Mediant (3rd), Subdominant (4th), Dominant (5th), Submediant (6th), Leading Tone (7th). The tonic and dominant are the most important — they define the key.',
      },
      {
        type: 'listen',
        title: 'G Major Scale',
        content:
          'Here is a G major scale. Notice it sounds exactly like the C major scale but starting on a different note. The pattern of whole and half steps is the same.',
        audioExample: { notes: [67, 69, 71, 72, 74, 76, 78, 79], playbackMode: 'scale' },
      },
      {
        type: 'compare',
        title: 'Major vs Natural Minor',
        content:
          'Compare the major scale to the natural minor scale. The minor scale lowers the 3rd, 6th, and 7th degrees, giving it a darker, sadder character.',
        audioExample: { notes: [60, 62, 64, 65, 67, 69, 71, 72], playbackMode: 'scale' },
        comparisonAudio: { notes: [60, 62, 63, 65, 67, 68, 70, 72], playbackMode: 'scale', label: 'C Natural Minor' },
      },
      {
        type: 'quiz',
        title: 'Major or Minor?',
        content: 'Listen to the scale. Is it major or natural minor?',
        quizOptions: ['major', 'natural_minor'],
        quizAnswer: '',
      },
    ],
  },

  // 4. Hearing Intervals
  {
    id: 'hearing-intervals',
    title: 'Hearing Intervals',
    category: 'intervals',
    difficulty: 'beginner',
    steps: [
      {
        type: 'explain',
        title: 'What Is an Interval?',
        content:
          'An interval is the distance between two notes, measured in semitones (half steps). Learning to recognize intervals by ear is one of the most valuable skills in music. Many musicians associate intervals with familiar song openings.',
      },
      {
        type: 'listen',
        title: 'Minor 2nd (1 semitone)',
        content:
          'The minor 2nd is the smallest interval — just one semitone apart. It sounds tense and dissonant. Think of the opening of "Jaws."',
        audioExample: { notes: [60, 61], playbackMode: 'interval' },
      },
      {
        type: 'listen',
        title: 'Major 2nd (2 semitones)',
        content:
          'The major 2nd is a whole step — two semitones. It sounds more open and is the first step of a major scale. Think of "Happy Birthday" (Hap-py).',
        audioExample: { notes: [60, 62], playbackMode: 'interval' },
      },
      {
        type: 'listen',
        title: 'Minor 3rd (3 semitones)',
        content:
          'The minor 3rd gives a sad, melancholic feeling. It defines the character of a minor chord. Think of "Greensleeves" or a minor chord arpeggio.',
        audioExample: { notes: [60, 63], playbackMode: 'interval' },
      },
      {
        type: 'listen',
        title: 'Major 3rd (4 semitones)',
        content:
          'The major 3rd is bright and happy — the signature of a major chord. Think of "Oh When the Saints Go Marching In."',
        audioExample: { notes: [60, 64], playbackMode: 'interval' },
      },
      {
        type: 'compare',
        title: 'Minor 3rd vs Major 3rd',
        content:
          'Compare the minor 3rd and major 3rd. This single semitone difference is what makes a chord sound minor or major. Train your ear to hear this distinction.',
        audioExample: { notes: [60, 63], playbackMode: 'interval' },
        comparisonAudio: { notes: [60, 64], playbackMode: 'interval', label: 'Major 3rd' },
      },
      {
        type: 'quiz',
        title: 'Name That Interval',
        content: 'Listen to the interval. Which one is it?',
        quizOptions: ['minor2', 'major2', 'minor3', 'major3'],
        quizAnswer: '',
      },
    ],
  },

  // 5. Diminished & Augmented
  {
    id: 'dim-and-aug',
    title: 'Diminished & Augmented',
    category: 'chords',
    difficulty: 'intermediate',
    steps: [
      {
        type: 'explain',
        title: 'Beyond Major and Minor',
        content:
          'Diminished and augmented chords alter the 5th of the chord, creating unstable, attention-grabbing sounds. They are used as passing chords, for dramatic effect, and as a way to add tension before resolving.',
      },
      {
        type: 'listen',
        title: 'Diminished Chord',
        content:
          'The diminished chord lowers both the 3rd and the 5th, creating a very tense, unstable sound. It sounds dark and wants to resolve. Used heavily in classical and film music for suspense.',
        audioExample: { notes: [60, 63, 66], playbackMode: 'chord' },
      },
      {
        type: 'listen',
        title: 'Augmented Chord',
        content:
          'The augmented chord raises the 5th by one semitone. It has a dreamy, floating, unresolved quality. Think of it as "major but strange." It appears in impressionist music and The Beatles.',
        audioExample: { notes: [60, 64, 68], playbackMode: 'chord' },
      },
      {
        type: 'compare',
        title: 'Diminished vs Augmented',
        content:
          'Compare these two altered chords. The diminished sounds tight and tense, while the augmented sounds open and dreamy. Both are symmetrical chords — their intervals repeat evenly.',
        audioExample: { notes: [60, 63, 66], playbackMode: 'chord' },
        comparisonAudio: { notes: [60, 64, 68], playbackMode: 'chord', label: 'Augmented' },
      },
      {
        type: 'quiz',
        title: 'Identify the Chord Quality',
        content: 'Listen to the chord. Is it major, minor, diminished, or augmented?',
        quizOptions: ['major', 'minor', 'diminished', 'augmented'],
        quizAnswer: '',
      },
    ],
  },

  // 6. Modal Scales: Dorian & Mixolydian
  {
    id: 'dorian-mixolydian',
    title: 'Modal Scales: Dorian & Mixolydian',
    category: 'scales',
    difficulty: 'intermediate',
    steps: [
      {
        type: 'explain',
        title: 'What Are Modes?',
        content:
          'Modes are scales derived from the major scale by starting on a different degree. Dorian starts on the 2nd degree and Mixolydian starts on the 5th degree. Each mode has its own unique mood and color.',
      },
      {
        type: 'listen',
        title: 'Dorian Mode',
        content:
          'Dorian is like a natural minor scale with a raised 6th. It sounds minor but with a brighter, jazzier character. Think of "So What" by Miles Davis or the verse of "Scarborough Fair."',
        audioExample: { notes: [60, 62, 63, 65, 67, 69, 70, 72], playbackMode: 'scale' },
      },
      {
        type: 'listen',
        title: 'Mixolydian Mode',
        content:
          'Mixolydian is like a major scale with a lowered 7th. It sounds major but with a bluesy, rock edge. Think of "Norwegian Wood" by The Beatles or classic blues-rock riffs.',
        audioExample: { notes: [60, 62, 64, 65, 67, 69, 70, 72], playbackMode: 'scale' },
      },
      {
        type: 'compare',
        title: 'Dorian vs Natural Minor',
        content:
          'Compare Dorian to the natural minor scale. The only difference is the raised 6th in Dorian, which gives it a lighter, less dark quality.',
        audioExample: { notes: [60, 62, 63, 65, 67, 69, 70, 72], playbackMode: 'scale' },
        comparisonAudio: { notes: [60, 62, 63, 65, 67, 68, 70, 72], playbackMode: 'scale', label: 'Natural Minor' },
      },
      {
        type: 'compare',
        title: 'Mixolydian vs Major',
        content:
          'Compare Mixolydian to the major scale. The only difference is the lowered 7th in Mixolydian, giving it that bluesy pull instead of the leading-tone resolution.',
        audioExample: { notes: [60, 62, 64, 65, 67, 69, 70, 72], playbackMode: 'scale' },
        comparisonAudio: { notes: [60, 62, 64, 65, 67, 69, 71, 72], playbackMode: 'scale', label: 'Major' },
      },
      {
        type: 'quiz',
        title: 'Which Mode?',
        content: 'Listen to the scale. Is it Dorian, Mixolydian, major, or natural minor?',
        quizOptions: ['dorian', 'mixolydian', 'major', 'natural_minor'],
        quizAnswer: '',
      },
    ],
  },

  // 7. Jazz Chords: The ii-V-I
  {
    id: 'jazz-ii-v-i',
    title: 'Jazz Chords: The ii-V-I',
    category: 'chords',
    difficulty: 'advanced',
    steps: [
      {
        type: 'explain',
        title: 'The Most Important Jazz Progression',
        content:
          'The ii-V-I progression is the backbone of jazz harmony. In the key of C, it is Dm7 - G7 - Cmaj7. It creates a powerful sense of motion and resolution that appears in virtually every jazz standard.',
      },
      {
        type: 'listen',
        title: 'The ii Chord (Dm7)',
        content:
          'The ii chord is a minor 7th chord built on the 2nd degree. In the key of C, this is Dm7. It sets up the tension by establishing a minor quality with a soft 7th.',
        audioExample: { notes: [62, 65, 69, 72], playbackMode: 'chord' },
      },
      {
        type: 'listen',
        title: 'The V Chord (G7)',
        content:
          'The V chord is a dominant 7th built on the 5th degree. In the key of C, this is G7. The dominant 7th has the strongest pull toward resolution in all of music — it demands to go home.',
        audioExample: { notes: [67, 71, 74, 77], playbackMode: 'chord' },
      },
      {
        type: 'listen',
        title: 'The I Chord (Cmaj7)',
        content:
          'The I chord is a major 7th chord built on the tonic. In the key of C, this is Cmaj7. After the tension of the V chord, arriving here feels like coming home. The dreamy major 7th adds sophistication.',
        audioExample: { notes: [60, 64, 67, 71], playbackMode: 'chord' },
      },
      {
        type: 'listen',
        title: 'The Full ii-V-I',
        content:
          'Now hear all three chords played in sequence: Dm7 - G7 - Cmaj7. Notice the smooth voice leading and the sense of tension building then releasing. This is the sound of jazz.',
        audioExample: { notes: [62, 65, 69, 72, 67, 71, 74, 77, 60, 64, 67, 71], playbackMode: 'chord' },
      },
      {
        type: 'quiz',
        title: 'Identify the Jazz Chord',
        content: 'Listen to the chord. Which role does it play in a ii-V-I?',
        quizOptions: ['minor7', 'dominant7', 'major7'],
        quizAnswer: '',
      },
    ],
  },

  // 8. Tritone & Perfect Intervals
  {
    id: 'tritone-perfect-intervals',
    title: 'Tritone & Perfect Intervals',
    category: 'intervals',
    difficulty: 'intermediate',
    steps: [
      {
        type: 'explain',
        title: 'The Perfect Intervals',
        content:
          'Perfect 4th and Perfect 5th are called "perfect" because they sound very consonant and stable. They form the structural backbone of chords and keys. The Perfect 5th is the interval that defines the Circle of Fifths.',
      },
      {
        type: 'listen',
        title: 'Perfect 4th (5 semitones)',
        content:
          'The Perfect 4th sounds open and expectant, like a question. Think of "Here Comes the Bride" or the opening of "Amazing Grace." It appears in suspended chords.',
        audioExample: { notes: [60, 65], playbackMode: 'interval' },
      },
      {
        type: 'listen',
        title: 'Perfect 5th (7 semitones)',
        content:
          'The Perfect 5th sounds powerful and stable — like a hero\'s fanfare. Think of "Star Wars" (first two notes) or a power chord on guitar. It is the most consonant interval after the octave and unison.',
        audioExample: { notes: [60, 67], playbackMode: 'interval' },
      },
      {
        type: 'explain',
        title: 'The Tritone: The Devil\'s Interval',
        content:
          'The tritone (6 semitones) splits the octave exactly in half. In the Middle Ages it was called "diabolus in musica" (the devil in music) because of its dissonant, unresolved sound. Today it is essential for blues, jazz, and creating tension.',
      },
      {
        type: 'listen',
        title: 'Tritone (6 semitones)',
        content:
          'Listen to the tritone. It sounds restless and unstable — it desperately wants to resolve. Think of "The Simpsons" theme or the opening of "Maria" from West Side Story.',
        audioExample: { notes: [60, 66], playbackMode: 'interval' },
      },
      {
        type: 'compare',
        title: 'Perfect 4th vs Perfect 5th',
        content:
          'Compare the Perfect 4th and Perfect 5th. They are inversions of each other — a P4 going up is the same as a P5 going down. The 5th sounds more resolved while the 4th sounds more open.',
        audioExample: { notes: [60, 65], playbackMode: 'interval' },
        comparisonAudio: { notes: [60, 67], playbackMode: 'interval', label: 'Perfect 5th' },
      },
      {
        type: 'quiz',
        title: 'Name the Interval',
        content: 'Listen to the interval. Is it a Perfect 4th, Tritone, or Perfect 5th?',
        quizOptions: ['perfect4', 'tritone', 'perfect5'],
        quizAnswer: '',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers for dynamic quiz generation
// ---------------------------------------------------------------------------

function generateQuizAudio(
  lesson: Lesson,
  step: LessonStep,
): { notes: number[]; playbackMode: 'chord' | 'scale' | 'interval'; answer: string } {
  const options = step.quizOptions || [];

  // Pick a random answer from the available options
  const answer = randomElement(options);

  // Pick a random root in octave 4 so each quiz attempt sounds different
  const rootNote = randomElement(NOTE_NAMES);
  const rootMidi = getMidiFromNote(rootNote, 4);

  let notes: number[] = [];
  let playbackMode: 'chord' | 'scale' | 'interval' = 'chord';

  switch (lesson.category) {
    case 'chords': {
      const quality = answer as ChordQuality;
      notes = getChordNotes(rootMidi, quality);
      playbackMode = 'chord';
      break;
    }
    case 'scales': {
      const scaleType = answer as ScaleType;
      notes = getScaleNotes(rootMidi, scaleType);
      playbackMode = 'scale';
      break;
    }
    case 'intervals': {
      const intervalType = answer as IntervalType;
      notes = getIntervalNotes(rootMidi, intervalType);
      playbackMode = 'interval';
      break;
    }
  }

  return { notes, playbackMode, answer };
}

// ---------------------------------------------------------------------------
// Difficulty badge helper
// ---------------------------------------------------------------------------

function difficultyVariant(d: Lesson['difficulty']): 'success' | 'warning' | 'danger' {
  switch (d) {
    case 'beginner':
      return 'success';
    case 'intermediate':
      return 'warning';
    case 'advanced':
      return 'danger';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GuidedLessons({ onBack, onStartPractice }: GuidedLessonsProps) {
  const audio = useAudio();

  // Which lesson is active (null = show lesson list)
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Quiz state
  const [quizAudioData, setQuizAudioData] = useState<{
    notes: number[];
    playbackMode: 'chord' | 'scale' | 'interval';
    answer: string;
  } | null>(null);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'chords' | 'scales' | 'intervals'>('all');

  const activeLesson = useMemo(
    () => LESSONS.find((l) => l.id === activeLessonId) ?? null,
    [activeLessonId],
  );

  const filteredLessons = useMemo(
    () => (categoryFilter === 'all' ? LESSONS : LESSONS.filter((l) => l.category === categoryFilter)),
    [categoryFilter],
  );

  // ---- Navigation helpers ----

  function openLesson(lessonId: string) {
    setActiveLessonId(lessonId);
    setCurrentStepIndex(0);
    resetQuiz();
  }

  function closeLesson() {
    setActiveLessonId(null);
    setCurrentStepIndex(0);
    resetQuiz();
  }

  function goNextStep() {
    if (!activeLesson) return;
    if (currentStepIndex < activeLesson.steps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
      resetQuiz();
    }
  }

  function goPrevStep() {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
      resetQuiz();
    }
  }

  function resetQuiz() {
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
    setQuizAudioData(null);
  }

  // ---- Audio helpers ----

  function playAudioExample(example: { notes: number[]; playbackMode: 'chord' | 'scale' | 'interval' }) {
    switch (example.playbackMode) {
      case 'chord':
        audio.playChord(example.notes);
        break;
      case 'scale':
        audio.playScale(example.notes);
        break;
      case 'interval':
        if (example.notes.length >= 2) {
          audio.playInterval(example.notes[0], example.notes[1]);
        }
        break;
    }
  }

  function playQuizAudio() {
    if (!activeLesson) return;
    const step = activeLesson.steps[currentStepIndex];

    // Generate fresh quiz data if not yet created
    let data = quizAudioData;
    if (!data) {
      data = generateQuizAudio(activeLesson, step);
      setQuizAudioData(data);
    }

    playAudioExample({ notes: data.notes, playbackMode: data.playbackMode });
  }

  function handleQuizSelect(option: string) {
    if (quizSubmitted) return;
    setSelectedQuizAnswer(option);
  }

  function handleQuizSubmit() {
    if (!quizAudioData || !selectedQuizAnswer) return;
    setQuizSubmitted(true);
    if (selectedQuizAnswer === quizAudioData.answer) {
      audio.playSuccess();
    } else {
      audio.playError();
    }
  }

  // ---- Get display name for quiz options ----

  function getOptionDisplayName(option: string, category: 'chords' | 'scales' | 'intervals'): string {
    switch (category) {
      case 'chords':
        return CHORD_TYPES[option as ChordQuality]?.name ?? option;
      case 'scales':
        return SCALE_TYPES[option as ScaleType]?.name ?? option;
      case 'intervals':
        return INTERVALS[option as IntervalType]?.name ?? option;
    }
  }

  // ===================== RENDER =====================

  // ------- Lesson list view -------
  if (!activeLesson) {
    return (
      <div className="screen-root">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0f0c29] via-[#0f0c29] to-transparent pb-4 px-4 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Guided Lessons
              </h1>
              <p className="text-sm text-white/60">Learn music theory step by step</p>
            </div>
          </div>

          {/* Category filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {(['all', 'chords', 'scales', 'intervals'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm ${
                  categoryFilter === cat
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Lesson cards */}
        <div className="px-4 space-y-3 animate-in">
          {filteredLessons.map((lesson) => (
            <Card
              key={lesson.id}
              hover
              onClick={() => openLesson(lesson.id)}
              className="p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold truncate">{lesson.title}</h3>
                    <Badge variant={difficultyVariant(lesson.difficulty)} size="sm">
                      {lesson.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/60">
                    {lesson.steps.length} steps &middot; {lesson.category}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ------- Lesson player view -------
  const step = activeLesson.steps[currentStepIndex];
  const isLastStep = currentStepIndex === activeLesson.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;
  const progressValue = ((currentStepIndex + 1) / activeLesson.steps.length) * 100;

  return (
    <div className="screen-root">
      {/* Lesson header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0f0c29] via-[#0f0c29] to-transparent pb-4 px-4 pt-6">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={closeLesson}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{activeLesson.title}</h2>
            <p className="text-xs text-white/60">
              Step {currentStepIndex + 1} of {activeLesson.steps.length}
            </p>
          </div>
          <Badge variant={difficultyVariant(activeLesson.difficulty)} size="sm">
            {activeLesson.difficulty}
          </Badge>
        </div>

        {/* Progress bar */}
        <Progress value={progressValue} max={100} size="sm" color="purple" />
      </div>

      {/* Step content */}
      <div className="px-4 space-y-4 animate-in">
        {/* Step type indicator */}
        <div className="flex items-center gap-2">
          <Badge
            variant={
              step.type === 'explain'
                ? 'info'
                : step.type === 'listen'
                ? 'purple'
                : step.type === 'compare'
                ? 'warning'
                : 'success'
            }
            size="sm"
          >
            {step.type === 'explain' && 'Theory'}
            {step.type === 'listen' && 'Listen'}
            {step.type === 'compare' && 'Compare'}
            {step.type === 'quiz' && 'Quiz'}
          </Badge>
          <span className="text-sm text-white/60">{step.title}</span>
        </div>

        {/* ---- Explain step ---- */}
        {step.type === 'explain' && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {step.title}
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">{step.content}</p>
          </Card>
        )}

        {/* ---- Listen step ---- */}
        {step.type === 'listen' && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {step.title}
            </h3>
            <p className="text-sm text-white/80 leading-relaxed mb-5">{step.content}</p>

            {step.audioExample && (
              <button
                onClick={() => playAudioExample(step.audioExample!)}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
              >
                <Play className="w-6 h-6 text-purple-400" />
                <span className="font-medium text-purple-300">Play Example</span>
              </button>
            )}
          </Card>
        )}

        {/* ---- Compare step ---- */}
        {step.type === 'compare' && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {step.title}
            </h3>
            <p className="text-sm text-white/80 leading-relaxed mb-5">{step.content}</p>

            <div className="grid grid-cols-2 gap-3">
              {step.audioExample && (
                <button
                  onClick={() => playAudioExample(step.audioExample!)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
                >
                  <Volume2 className="w-6 h-6 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">Play A</span>
                </button>
              )}
              {step.comparisonAudio && (
                <button
                  onClick={() =>
                    playAudioExample({
                      notes: step.comparisonAudio!.notes,
                      playbackMode: step.comparisonAudio!.playbackMode,
                    })
                  }
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-pink-500/20 border border-pink-500/30 hover:bg-pink-500/30 transition-all"
                >
                  <Volume2 className="w-6 h-6 text-pink-400" />
                  <span className="text-sm font-medium text-pink-300">
                    Play B ({step.comparisonAudio.label})
                  </span>
                </button>
              )}
            </div>
          </Card>
        )}

        {/* ---- Quiz step ---- */}
        {step.type === 'quiz' && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {step.title}
            </h3>
            <p className="text-sm text-white/80 leading-relaxed mb-5">{step.content}</p>

            {/* Play button */}
            <button
              onClick={playQuizAudio}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all mb-5"
            >
              <Play className="w-6 h-6 text-purple-400" />
              <span className="font-medium text-purple-300">
                {quizAudioData ? 'Play Again' : 'Play'}
              </span>
            </button>

            {/* Answer options */}
            {quizAudioData && (
              <div className="space-y-2 mb-4">
                {(step.quizOptions || []).map((option) => {
                  const isSelected = selectedQuizAnswer === option;
                  const isCorrect = quizAudioData.answer === option;
                  let optionClasses =
                    'w-full text-left p-3 rounded-xl border transition-all text-sm font-medium ';

                  if (quizSubmitted) {
                    if (isCorrect) {
                      optionClasses +=
                        'bg-green-500/20 border-green-500/40 text-green-300';
                    } else if (isSelected && !isCorrect) {
                      optionClasses +=
                        'bg-red-500/20 border-red-500/40 text-red-300';
                    } else {
                      optionClasses += 'bg-white/5 border-white/10 text-white/40';
                    }
                  } else {
                    if (isSelected) {
                      optionClasses +=
                        'bg-purple-500/20 border-purple-500/40 text-purple-300';
                    } else {
                      optionClasses +=
                        'bg-white/5 border-white/20 text-white/80 hover:bg-white/10';
                    }
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => handleQuizSelect(option)}
                      disabled={quizSubmitted}
                      className={optionClasses}
                    >
                      <div className="flex items-center justify-between">
                        <span>{getOptionDisplayName(option, activeLesson.category)}</span>
                        {quizSubmitted && isCorrect && (
                          <Check className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Submit / result */}
            {quizAudioData && !quizSubmitted && (
              <Button
                variant="primary"
                fullWidth
                disabled={!selectedQuizAnswer}
                onClick={handleQuizSubmit}
              >
                Check Answer
              </Button>
            )}

            {quizSubmitted && (
              <div
                className={`p-3 rounded-xl text-sm font-medium ${
                  selectedQuizAnswer === quizAudioData?.answer
                    ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                    : 'bg-red-500/20 border border-red-500/30 text-red-300'
                }`}
              >
                {selectedQuizAnswer === quizAudioData?.answer
                  ? 'Correct! Great ear!'
                  : `Not quite. The correct answer was ${getOptionDisplayName(
                      quizAudioData?.answer ?? '',
                      activeLesson.category,
                    )}.`}
              </div>
            )}
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={goPrevStep}
            disabled={isFirstStep}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          <div className="flex-1" />

          {isLastStep ? (
            <Button
              variant="success"
              onClick={() => onStartPractice(activeLesson.category)}
              icon={<Play className="w-4 h-4" />}
            >
              Start Practice
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={goNextStep}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
