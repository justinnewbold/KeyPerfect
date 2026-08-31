import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Volume2, Check, X, RotateCcw, ChevronRight, Trash2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { Badge, StreakBadge, XPBadge } from './ui/Badge';
import { PianoKeyboard } from './PianoKeyboard';
import { useAudio } from '../hooks/useAudio';
import { triggerHapticFeedback } from '../utils/haptics';
import { getNoteName } from '../types/music';
import { AnswerRecord, SessionSummary } from '../types/gameModes';
import { calculateQuestionXP } from '../types/stats';

interface MelodicDictationGameProps {
  /**
   * Called once when the last melody is graded. Carries the full answer
   * record rather than a score, so the caller can award XP through the same
   * path every other mode uses (utils/sessionResults.awardSession).
   */
  onComplete: (session: SessionSummary) => void;
  onExit: () => void;
}

interface MelodyQuestion {
  id: string;
  notes: number[];
  difficulty: number;
}

// Generate random melodies with musical constraints
function generateMelody(length: number, difficulty: number): number[] {
  const startNote = 60 + Math.floor(Math.random() * 12); // C4 to B4
  const melody: number[] = [startNote];

  // Interval pools based on difficulty
  const easyIntervals = [-2, -1, 1, 2, 3, 4, 5]; // Steps and small leaps
  const mediumIntervals = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7]; // Includes 5ths
  const hardIntervals = [-7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7, 12]; // Includes octave

  const intervals = difficulty < 2 ? easyIntervals : difficulty < 4 ? mediumIntervals : hardIntervals;

  for (let i = 1; i < length; i++) {
    const lastNote = melody[i - 1];
    const interval = intervals[Math.floor(Math.random() * intervals.length)];
    let newNote = lastNote + interval;

    // Keep notes in playable range (C4 to C6)
    while (newNote < 48 || newNote > 72) {
      const newInterval = intervals[Math.floor(Math.random() * intervals.length)];
      newNote = lastNote + newInterval;
    }

    melody.push(newNote);
  }

  return melody;
}

export function MelodicDictationGame({ onComplete, onExit }: MelodicDictationGameProps) {
  const audio = useAudio();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalQuestions] = useState(8);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [userNotes, setUserNotes] = useState<number[]>([]);
  const [result, setResult] = useState<'correct' | 'partial' | 'incorrect' | null>(null);
  const [question, setQuestion] = useState<MelodyQuestion | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [showCorrectNotes, setShowCorrectNotes] = useState(false);
  const playTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Per-question outcomes, so the session can be awarded like any other mode.
  const answersRef = useRef<AnswerRecord[]>([]);
  const sessionStartRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());
  // endGame's endingRef equivalent: this screen owns its own once-only guard.
  const completedRef = useRef(false);

  const clearScheduledNotes = useCallback(() => {
    playTimeoutsRef.current.forEach(t => clearTimeout(t));
    playTimeoutsRef.current = [];
  }, []);

  // Generate a new question with progressive difficulty
  const generateQuestion = useCallback((index: number): MelodyQuestion => {
    const difficulty = Math.floor(index / 2) + 1;
    const length = Math.min(3 + Math.floor(index / 2), 6); // 3-6 notes

    return {
      id: `melody-${Date.now()}`,
      notes: generateMelody(length, difficulty),
      difficulty,
    };
  }, []);

  // Initialize first question
  useEffect(() => {
    setQuestion(generateQuestion(0));
  }, [generateQuestion]);

  // Play the melody
  const playMelody = useCallback(() => {
    if (!question) return;

    // Cancel any in-flight playback so re-tapping or auto-play after Next
    // doesn't stack overlapping schedules of the same melody.
    clearScheduledNotes();

    setHasPlayed(true);
    setCurrentNoteIndex(0);

    question.notes.forEach((note, index) => {
      const timeout = setTimeout(() => {
        audio.playNote(note, 0.4);
        setCurrentNoteIndex(index + 1);
      }, index * 600); // 600ms between notes
      playTimeoutsRef.current.push(timeout);
    });
  }, [question, audio, clearScheduledNotes]);

  // Stop in-flight playback when the component unmounts.
  useEffect(() => clearScheduledNotes, [clearScheduledNotes]);

  // Auto-play on new question
  useEffect(() => {
    if (question && !hasPlayed) {
      const timer = setTimeout(playMelody, 500);
      return () => clearTimeout(timer);
    }
  }, [question, hasPlayed, playMelody]);

  // Handle note played on keyboard
  const handleNotePlay = useCallback((midi: number) => {
    if (result) return;

    setUserNotes(prev => [...prev, midi]);
  }, [result]);

  // Check answer when user has entered enough notes
  useEffect(() => {
    if (!question || result) return;

    if (userNotes.length >= question.notes.length) {
      // Compare notes
      let correctCount = 0;
      for (let i = 0; i < question.notes.length; i++) {
        if (userNotes[i] === question.notes[i]) {
          correctCount++;
        }
      }

      const noteAccuracy = correctCount / question.notes.length;
      // Only a fully correct melody counts as correct. A half-right answer
      // still earns partial XP below, but must not inflate session accuracy
      // or extend the streak.
      const isCorrect = noteAccuracy === 1;

      // The shared XP formula, scaled by how much of the melody was right, so
      // a point here is worth what it is worth in any other mode. difficulty
      // is 1-4 here but calculateQuestionXP expects 0-1.
      const timeToAnswer = Date.now() - questionStartRef.current;
      const fullXP = calculateQuestionXP(true, streak, Math.min(question.difficulty / 4, 1));
      const xpEarned = isCorrect
        ? fullXP
        : noteAccuracy >= 0.5
        ? Math.floor(fullXP * noteAccuracy)
        : 0;

      answersRef.current.push({
        questionId: question.id,
        userAnswer: userNotes.slice(0, question.notes.length).join(','),
        correctAnswer: question.notes.join(','),
        isCorrect,
        timeToAnswer,
        xpEarned,
        questionType: 'melodic',
      });

      if (isCorrect) {
        setResult('correct');
        audio.playSuccess();
        triggerHapticFeedback('success');
        setScore(prev => prev + xpEarned);
        setStreak(prev => prev + 1);
      } else if (noteAccuracy >= 0.5) {
        setResult('partial');
        triggerHapticFeedback('light');
        setScore(prev => prev + xpEarned);
        setStreak(0);
      } else {
        setResult('incorrect');
        audio.playError();
        triggerHapticFeedback('error');
        setStreak(0);
      }

      setShowCorrectNotes(true);
    }
  }, [userNotes, question, result, audio, streak]);

  // Handle next question
  const handleNext = useCallback(() => {
    clearScheduledNotes();

    if (currentQuestion >= totalQuestions - 1) {
      // Accuracy is no longer derived from score against an "approximate max"
      // that needed clamping to stay under 100%; awardSession computes it
      // from the answer records instead.
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete({
        answers: answersRef.current,
        score,
        totalTime: (Date.now() - sessionStartRef.current) / 1000,
      });
      return;
    }

    const nextIndex = currentQuestion + 1;
    setCurrentQuestion(nextIndex);
    setUserNotes([]);
    setResult(null);
    setHasPlayed(false);
    questionStartRef.current = Date.now();
    setShowCorrectNotes(false);
    setCurrentNoteIndex(0);
    setQuestion(generateQuestion(nextIndex));
  }, [currentQuestion, totalQuestions, score, onComplete, generateQuestion, clearScheduledNotes]);

  // Clear user input
  const handleClear = useCallback(() => {
    setUserNotes([]);
  }, []);

  // Delete last note
  const handleDeleteLast = useCallback(() => {
    setUserNotes(prev => prev.slice(0, -1));
  }, []);

  if (!question) return <div>Loading...</div>;

  return (
    <div className="screen-root flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0f0c29] via-[#0f0c29] to-transparent pb-4 px-4 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <Progress value={currentQuestion + 1} max={totalQuestions} color="green" size="sm" />
          </div>
          <span className="text-sm text-white/60">
            {currentQuestion + 1}/{totalQuestions}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XPBadge xp={score} />
            {streak > 0 && <StreakBadge streak={streak} />}
          </div>
          <Badge variant="default" className="bg-teal-500/20 text-teal-300">
            Melodic Dictation
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 flex flex-col">
        <Card className="p-6 mb-4">
          <h2 className="text-xl font-semibold text-center mb-2">
            Transcribe the melody
          </h2>
          <p className="text-white/60 text-center text-sm mb-4">
            {question.notes.length} notes • Listen carefully and play them back
          </p>

          {/* Play Button */}
          <div className="flex justify-center">
            <button
              onClick={playMelody}
              disabled={audio.isPlaying}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                audio.isPlaying
                  ? 'bg-teal-500 animate-pulse'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600'
              }`}
            >
              {audio.isPlaying ? (
                <Volume2 className="w-6 h-6 animate-pulse" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>
          </div>

          {/* Playback Progress */}
          {audio.isPlaying && (
            <div className="flex justify-center gap-2 mt-4">
              {question.notes.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i < currentNoteIndex ? 'bg-teal-400' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </Card>

        {/* User Input Display */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Your answer:</span>
            <span className="text-sm text-white/60">
              {userNotes.length}/{question.notes.length} notes
            </span>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {userNotes.length === 0 ? (
              <span className="text-white/40 text-sm">Play notes on the keyboard...</span>
            ) : (
              userNotes.map((note, i) => {
                const isCorrect = showCorrectNotes && note === question.notes[i];
                const isWrong = showCorrectNotes && note !== question.notes[i];

                return (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded-lg text-sm font-mono ${
                      isCorrect
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : isWrong
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {getNoteName(note)}
                    {showCorrectNotes && isWrong && (
                      <span className="text-white/40 ml-1">→ {getNoteName(question.notes[i])}</span>
                    )}
                  </span>
                );
              })
            )}
          </div>

          {/* Control buttons */}
          {!result && userNotes.length > 0 && (
            <div className="flex gap-2 mt-3">
              <Button variant="secondary" size="sm" onClick={handleDeleteLast} icon={<Trash2 className="w-3 h-3" />}>
                Undo
              </Button>
              <Button variant="secondary" size="sm" onClick={handleClear} icon={<RotateCcw className="w-3 h-3" />}>
                Clear
              </Button>
            </div>
          )}
        </Card>

        {/* Piano Keyboard */}
        <div className="mb-4">
          <PianoKeyboard
            startNote={48}
            numOctaves={2}
            onNotePlay={handleNotePlay}
            disabled={!!result}
            showLabels={true}
          />
        </div>

        {/* Result Feedback */}
        {result && (
          <Card
            className={`p-4 ${
              result === 'correct'
                ? 'bg-green-500/20 border-green-500/30'
                : result === 'partial'
                ? 'bg-yellow-500/20 border-yellow-500/30'
                : 'bg-red-500/20 border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {result === 'correct' ? (
                <>
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-300">Perfect transcription!</span>
                </>
              ) : result === 'partial' ? (
                <>
                  <Check className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold text-yellow-300">Partially correct</span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 text-red-400" />
                  <span className="font-semibold text-red-300">Keep practicing!</span>
                </>
              )}
            </div>

            {/* Show correct melody */}
            <div className="mt-2 text-sm text-white/60">
              Correct melody:{' '}
              <span className="text-white font-mono">
                {question.notes.map(n => getNoteName(n)).join(' → ')}
              </span>
            </div>
          </Card>
        )}
      </div>

      {/* Bottom Action */}
      <div className="action-bar px-4 py-3 bg-gradient-to-t from-[#0f0c29] via-[#0f0c29] to-transparent">
        {result && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleNext}
            icon={<ChevronRight className="w-5 h-5" />}
          >
            {currentQuestion >= totalQuestions - 1 ? 'See Results' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  );
}
