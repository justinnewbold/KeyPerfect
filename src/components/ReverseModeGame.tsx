import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Volume2, Check, X, RotateCcw, ChevronRight } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { Badge, StreakBadge, XPBadge } from './ui/Badge';
import { PianoKeyboard } from './PianoKeyboard';
import { useAudio } from '../hooks/useAudio';
import { triggerHapticFeedback } from '../utils/haptics';
import { getChordNotes } from '../utils/gameHelpers';
import { CHORD_TYPES, ChordQuality, NOTE_NAMES, getMidiFromNote, NoteName } from '../types/music';
import { AnswerRecord, SessionSummary } from '../types/gameModes';
import { calculateQuestionXP } from '../types/stats';
import { updateChordStats } from '../utils/storage';
import { updateReviewItem } from '../utils/spacedRepetition';

interface ReverseModeGameProps {
  /**
   * Called once when the last question is answered. Carries the full answer
   * record rather than a score, so the caller can award XP through the same
   * path every other mode uses (utils/sessionResults.awardSession).
   */
  onComplete: (session: SessionSummary) => void;
  onExit: () => void;
}

interface ReverseQuestion {
  id: string;
  targetNotes: number[];
  chordType: ChordQuality;
  rootNote: NoteName;
  /** 0-1, feeds the shared XP formula. */
  difficulty: number;
}

// Triads the player is asked to reproduce, with the difficulty each carries
// into calculateQuestionXP so a diminished chord is worth more than a major.
const CHORD_DIFFICULTY: Record<string, number> = {
  major: 0.3,
  minor: 0.3,
  diminished: 0.6,
  augmented: 0.6,
};

export function ReverseModeGame({ onComplete, onExit }: ReverseModeGameProps) {
  const audio = useAudio();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalQuestions] = useState(10);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [playedNotes, setPlayedNotes] = useState<number[]>([]);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [question, setQuestion] = useState<ReverseQuestion | null>(null);
  // Per-question outcomes, so the session can be awarded like any other mode.
  const answersRef = useRef<AnswerRecord[]>([]);
  const sessionStartRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());
  // endGame's endingRef equivalent: this screen owns its own once-only guard.
  const completedRef = useRef(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Generate a new question
  const generateQuestion = useCallback((): ReverseQuestion => {
    const chords: ChordQuality[] = ['major', 'minor', 'diminished', 'augmented'];
    const chordType = chords[Math.floor(Math.random() * chords.length)];
    const rootNote = NOTE_NAMES[Math.floor(Math.random() * NOTE_NAMES.length)];
    const rootMidi = getMidiFromNote(rootNote, 4);
    const notes = getChordNotes(rootMidi, chordType);

    return {
      id: `reverse-${Date.now()}`,
      targetNotes: notes,
      chordType,
      rootNote,
      difficulty: CHORD_DIFFICULTY[chordType] ?? 0.3,
    };
  }, []);

  // Initialize first question
  useEffect(() => {
    setQuestion(generateQuestion());
  }, [generateQuestion]);

  // Play the target chord
  const playTargetChord = useCallback(() => {
    if (!question) return;
    audio.playChord(question.targetNotes);
    setHasPlayed(true);
  }, [question, audio]);

  // Auto-play on new question
  useEffect(() => {
    if (question && !hasPlayed) {
      const timer = setTimeout(() => {
        playTargetChord();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [question, hasPlayed, playTargetChord]);

  // Handle note played on keyboard
  const handleNotePlay = useCallback((midi: number) => {
    if (result) return;

    setPlayedNotes(prev => {
      // Don't add duplicate notes
      if (prev.includes(midi)) return prev;
      return [...prev, midi];
    });
  }, [result]);

  // Check if played notes match target
  const checkAnswer = useCallback(() => {
    if (!question || playedNotes.length === 0) return;
    // `result` is state, so a second auto-check firing in the same tick would
    // otherwise record this question twice.
    if (answersRef.current.some(a => a.questionId === question.id)) return;

    // Normalize notes to pitch classes (0-11) for comparison
    const targetPitchClasses = question.targetNotes.map(n => n % 12).sort((a, b) => a - b);
    const playedPitchClasses = playedNotes.map(n => n % 12).sort((a, b) => a - b);

    // Check if all target pitch classes are present
    const isCorrect =
      targetPitchClasses.length === playedPitchClasses.length &&
      targetPitchClasses.every((pc, i) => pc === playedPitchClasses[i]);

    setResult(isCorrect ? 'correct' : 'incorrect');

    // Same XP formula as every hook-driven mode, so a point earned here is
    // worth what it is worth anywhere else.
    const timeToAnswer = Date.now() - questionStartRef.current;
    const xpEarned = calculateQuestionXP(isCorrect, streak, question.difficulty);

    answersRef.current.push({
      questionId: question.id,
      userAnswer: playedPitchClasses.join(','),
      correctAnswer: targetPitchClasses.join(','),
      isCorrect,
      timeToAnswer,
      xpEarned,
      questionType: 'chords',
    });

    // Per-item stats and spaced repetition, which awardSession does not cover
    // -- this mirrors what useGameState.submitAnswer does per answer.
    updateChordStats(question.chordType, isCorrect);
    updateReviewItem('chord', question.chordType, isCorrect, timeToAnswer, streak);

    if (isCorrect) {
      audio.playSuccess();
      triggerHapticFeedback('success');
      setScore(prev => prev + xpEarned);
      setStreak(prev => prev + 1);
    } else {
      audio.playError();
      triggerHapticFeedback('error');
      setStreak(0);
    }
  }, [question, playedNotes, audio, streak]);

  // Auto-check when enough notes are played
  useEffect(() => {
    if (question && playedNotes.length >= question.targetNotes.length && !result) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        checkAnswer();
      }, 500);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [playedNotes, question, result, checkAnswer]);

  // Handle next question
  const handleNext = useCallback(() => {
    if (currentQuestion >= totalQuestions - 1) {
      // Accuracy is no longer derived from score. It used to be
      // score / (totalQuestions * 15), which streak bonuses pushed past 100%;
      // awardSession computes it from the answer records instead.
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete({
        answers: answersRef.current,
        score,
        totalTime: (Date.now() - sessionStartRef.current) / 1000,
      });
      return;
    }

    setCurrentQuestion(prev => prev + 1);
    setPlayedNotes([]);
    setResult(null);
    setHasPlayed(false);
    setShowHint(false);
    setQuestion(generateQuestion());
    questionStartRef.current = Date.now();
  }, [currentQuestion, totalQuestions, score, onComplete, generateQuestion]);

  // Reset current attempt
  const handleReset = useCallback(() => {
    setPlayedNotes([]);
    setResult(null);
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
            <Progress value={currentQuestion + 1} max={totalQuestions} color="purple" size="sm" />
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
          <Badge variant="purple">Reverse Mode</Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 flex flex-col">
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-center mb-2">
            Play the chord you hear
          </h2>
          <p className="text-white/60 text-center text-sm mb-4">
            Use the keyboard below to recreate the chord
          </p>

          {/* Play Button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={playTargetChord}
              disabled={audio.isPlaying}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                audio.isPlaying
                  ? 'bg-purple-500 animate-pulse'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              }`}
            >
              {audio.isPlaying ? (
                <Volume2 className="w-6 h-6 animate-pulse" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>
          </div>

          {/* Hint Toggle */}
          <div className="text-center">
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              {showHint ? 'Hide hint' : 'Show hint'}
            </button>
            {showHint && (
              <p className="text-sm text-white/60 mt-2">
                Chord: {CHORD_TYPES[question.chordType].name} starting on {question.rootNote}
              </p>
            )}
          </div>
        </Card>

        {/* Notes Played Indicator */}
        <div className="flex justify-center gap-2 mb-4">
          {question.targetNotes.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                playedNotes[i] !== undefined
                  ? result === 'correct'
                    ? 'bg-green-500'
                    : result === 'incorrect'
                    ? 'bg-red-500'
                    : 'bg-purple-500'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Piano Keyboard */}
        <div className="mb-6">
          <PianoKeyboard
            startNote={48}
            numOctaves={2}
            onNotePlay={handleNotePlay}
            playedNotes={playedNotes}
            highlightNotes={result ? question.targetNotes : []}
            disabled={!!result}
          />
        </div>

        {/* Result Feedback */}
        {result && (
          <Card
            className={`p-4 mb-6 ${
              result === 'correct' ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result === 'correct' ? (
                  <>
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-green-300">Perfect!</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-red-400" />
                    <span className="font-semibold text-red-300">Not quite</span>
                  </>
                )}
              </div>
              <span className="text-sm text-white/60">
                {CHORD_TYPES[question.chordType].name} chord
              </span>
            </div>
          </Card>
        )}

        {/* Reset Button */}
        {!result && playedNotes.length > 0 && (
          <div className="flex justify-center mb-4">
            <Button variant="secondary" onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />}>
              Reset
            </Button>
          </div>
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
