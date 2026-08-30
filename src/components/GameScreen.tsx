import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Volume2, Check, X, ChevronRight, Keyboard, Headphones, Usb } from 'lucide-react';
import { GameQuestion, AnswerRecord } from '../types/gameModes';
import { LevelConfig } from '../types/levels';
import { CHORD_TYPES, SCALE_TYPES, INTERVALS, INVERSIONS, NOTE_NAMES } from '../types/music';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { Badge, StreakBadge, XPBadge } from './ui/Badge';
import { useAudio } from '../hooks/useAudio';
import { useGameKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { triggerHapticFeedback } from '../utils/haptics';
import { getChordNotes, getScaleNotes } from '../utils/gameHelpers';
import { useMIDIInput } from '../utils/midiInput';

interface GameScreenProps {
  level: LevelConfig;
  question: GameQuestion;
  questionNumber: number;
  totalQuestions: number;
  score: number;
  streak: number;
  lives?: number;
  timeRemaining?: number;
  isPracticeMode?: boolean;
  onAnswer: (answer: string) => AnswerRecord;
  onNext: () => void;
  onExit: () => void;
}

export function GameScreen({
  level,
  question,
  questionNumber,
  totalQuestions,
  score,
  streak,
  lives,
  timeRemaining,
  isPracticeMode = false,
  onAnswer,
  onNext,
  onExit,
}: GameScreenProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerRecord | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [showCorrectFeedback, setShowCorrectFeedback] = useState(false);
  const audio = useAudio();
  const hasAutoPlayed = useRef(false);
  const feedbackTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setResult(null);
    setHasPlayed(false);
    setShowCorrectFeedback(false);
    hasAutoPlayed.current = false;
    // Clear any pending feedback audio timeouts from the previous question
    feedbackTimeouts.current.forEach(clearTimeout);
    feedbackTimeouts.current = [];
  }, [question.id]);

  // Cancel any pending audio timeouts (cadence chain, comparison, wrong-
  // answer feedback) when the component unmounts so audio doesn't keep
  // firing after the user navigates away from the game.
  useEffect(() => {
    return () => {
      feedbackTimeouts.current.forEach(clearTimeout);
      feedbackTimeouts.current = [];
    };
  }, []);

  // Play context notes (cadence) before the question if available. All
  // setTimeouts run through feedbackTimeouts so changing question or
  // unmounting cancels them - otherwise the cadence + main + comparison
  // chain (up to ~4s) would keep firing audio after the user moved on.
  const playContextThenAudio = useCallback((audioData: typeof question.audioData) => {
    const { notes, playbackMode, rhythmPattern, duration, contextNotes, comparisonNotes } = audioData;

    const playMain = () => {
      if (playbackMode === 'chord') {
        audio.playChord(notes);
      } else if (playbackMode === 'scale') {
        audio.playScale(notes);
      } else if (playbackMode === 'interval') {
        audio.playInterval(notes[0], notes[1]);
      } else if (playbackMode === 'rhythm' && rhythmPattern) {
        audio.playRhythmPattern(rhythmPattern, notes[0]);
      } else if (playbackMode === 'note') {
        audio.playNote(notes[0], duration);
      }

      // For comparison mode: play second sound after a pause
      if (comparisonNotes && comparisonNotes.length > 0) {
        const cmpTimeout = setTimeout(() => {
          if (playbackMode === 'chord') {
            audio.playChord(comparisonNotes);
          } else if (playbackMode === 'scale') {
            audio.playScale(comparisonNotes);
          }
        }, 2000);
        feedbackTimeouts.current.push(cmpTimeout);
      }
    };

    // Play context (cadence) first, then the main question. Split
    // contextNotes into 3-note chord chunks so a short reference like the
    // solfege Do (one note) doesn't sit in silence for 2.4s waiting for a
    // second chord that never comes.
    if (contextNotes && contextNotes.length > 0) {
      const CHUNK_SIZE = 3;
      const CHUNK_GAP_MS = 1200;
      const chunks: number[][] = [];
      for (let i = 0; i < contextNotes.length; i += CHUNK_SIZE) {
        const chunk = contextNotes.slice(i, i + CHUNK_SIZE);
        if (chunk.length > 0) chunks.push(chunk);
      }
      audio.playChord(chunks[0]);
      let delay = CHUNK_GAP_MS;
      for (let i = 1; i < chunks.length; i++) {
        const chunk = chunks[i];
        const t = setTimeout(() => audio.playChord(chunk), delay);
        feedbackTimeouts.current.push(t);
        delay += CHUNK_GAP_MS;
      }
      const mainT = setTimeout(playMain, delay);
      feedbackTimeouts.current.push(mainT);
    } else {
      playMain();
    }
  }, [audio]);

  const playQuestionAudio = useCallback(() => {
    playContextThenAudio(question.audioData);
    setHasPlayed(true);
  }, [question.audioData, playContextThenAudio]);

  // Play the correct answer audio for wrong answer feedback
  const playCorrectAnswerAudio = useCallback(() => {
    const { playbackMode, rootNote } = question.audioData;
    const correctAnswer = question.correctAnswer;

    // Try to generate the correct answer's audio
    try {
      if (question.type === 'chords' || question.type === 'comparison') {
        if (correctAnswer in CHORD_TYPES) {
          const correctNotes = getChordNotes(rootNote || 60, correctAnswer as keyof typeof CHORD_TYPES);
          audio.playChord(correctNotes);
        } else {
          playQuestionAudio();
        }
      } else if (question.type === 'scales') {
        if (correctAnswer in SCALE_TYPES) {
          const correctNotes = getScaleNotes(rootNote || 60, correctAnswer as keyof typeof SCALE_TYPES);
          audio.playScale(correctNotes);
        } else {
          playQuestionAudio();
        }
      } else if (question.type === 'intervals') {
        // correctAnswer is an IntervalType key like 'minor3' / 'perfect5',
        // not a number. parseInt(...) returned NaN, so the second note
        // played at NaN frequency and the user heard nothing useful as
        // 'correct answer' feedback. Read the semitone count from the
        // INTERVALS table instead.
        const interval = INTERVALS[correctAnswer as keyof typeof INTERVALS];
        if (interval) {
          audio.playInterval(rootNote || 60, (rootNote || 60) + interval.semitones);
        } else {
          playQuestionAudio();
        }
      } else {
        // For other types, just replay the question audio
        playQuestionAudio();
      }
    } catch {
      // Fallback: replay the question
      playQuestionAudio();
    }
  }, [question, audio, playQuestionAudio]);

  // Auto-play once on first load of each question
  useEffect(() => {
    if (hasAutoPlayed.current) return;

    const timer = setTimeout(() => {
      if (hasAutoPlayed.current) return;
      hasAutoPlayed.current = true;
      playContextThenAudio(question.audioData);
      setHasPlayed(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [question.id]); // Only depend on question.id to prevent re-triggering

  const handleAnswer = useCallback((answer: string) => {
    if (result) return;

    setSelectedAnswer(answer);
    const answerResult = onAnswer(answer);
    setResult(answerResult);

    if (answerResult.isCorrect) {
      audio.playSuccess();
      triggerHapticFeedback('success');
    } else {
      audio.playError();
      triggerHapticFeedback('error');
      // Wrong answer feedback: play the correct answer after a short delay
      setShowCorrectFeedback(true);
      const t1 = setTimeout(() => {
        playCorrectAnswerAudio();
        // Then replay the question so they can hear the difference
        const t2 = setTimeout(() => {
          playContextThenAudio(question.audioData);
        }, 2000);
        feedbackTimeouts.current.push(t2);
      }, 1000);
      feedbackTimeouts.current.push(t1);
    }
  }, [result, onAnswer, audio, playCorrectAnswerAudio, playContextThenAudio, question.audioData]);

  // Handle option selection by index (for keyboard shortcuts)
  const handleSelectOption = useCallback((index: number) => {
    if (index >= 0 && index < question.options.length) {
      handleAnswer(question.options[index]);
    }
  }, [question.options, handleAnswer]);

  // Keyboard shortcuts
  useGameKeyboardShortcuts({
    onSelectOption: handleSelectOption,
    onReplay: playQuestionAudio,
    onNext,
    onExit,
    hasResult: !!result,
    enabled: true,
  });

  // MIDI input: map note-on events to answer selection
  const handleMIDINoteOn = useCallback((note: number) => {
    if (result) return;

    // For notes/musickeys questions, match the note name to answer options
    if (question.type === 'notes' || question.type === 'musickeys') {
      const noteName = NOTE_NAMES[note % 12];
      const octave = Math.floor(note / 12) - 1;
      const fullName = `${noteName}${octave}`;
      // Try the exact note+octave first so an 'includeOctaveInAnswer'
      // notes question (options like ['C3', 'C4', 'D4']) doesn't always
      // pick whichever octave appears first in the list. Only fall back
      // to the bare note name for questions where options carry no
      // octave (Levels 1-3, music-keys) or when the played octave
      // simply isn't on offer.
      let optionIndex = question.options.findIndex(opt => opt === fullName);
      if (optionIndex < 0) {
        optionIndex = question.options.findIndex(opt =>
          opt === noteName || opt.startsWith(noteName)
        );
      }
      if (optionIndex >= 0) {
        handleAnswer(question.options[optionIndex]);
        return;
      }
    }

    // Generic: map MIDI notes C4-F4 (60-65) to options 0-5
    const optionIndex = note - 60;
    if (optionIndex >= 0 && optionIndex < question.options.length) {
      handleAnswer(question.options[optionIndex]);
    }
  }, [result, question, handleAnswer]);

  const midiCallbacks = useMemo(() => ({
    onNoteOn: handleMIDINoteOn,
  }), [handleMIDINoteOn]);

  const midiState = useMIDIInput(midiCallbacks);

  const getDisplayName = (value: string): string => {
    if (question.type === 'chords') {
      return CHORD_TYPES[value as keyof typeof CHORD_TYPES]?.name || value;
    }
    if (question.type === 'scales') {
      return SCALE_TYPES[value as keyof typeof SCALE_TYPES]?.name || value;
    }
    if (question.type === 'intervals') {
      return INTERVALS[value as keyof typeof INTERVALS]?.name || value;
    }
    if (question.type === 'inversions') {
      return INVERSIONS[value as keyof typeof INVERSIONS]?.name || value;
    }
    return value;
  };

  return (
    <div className="screen-root flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0f0c29] via-[#0f0c29] to-transparent pb-4 px-4 pt-4">
        {/* Progress Bar */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <Progress
              value={questionNumber}
              max={totalQuestions}
              color="purple"
              size="sm"
            />
          </div>
          <span className="text-sm text-white/60">
            {questionNumber}/{totalQuestions}
          </span>
        </div>

        {/* Score Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XPBadge xp={score} />
            {streak > 0 && <StreakBadge streak={streak} />}
          </div>
          <div className="flex items-center gap-2">
            {lives !== undefined && lives > 0 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: lives }).map((_, i) => (
                  <span key={i} className="text-red-500">❤️</span>
                ))}
              </div>
            )}
            {timeRemaining !== undefined && (
              <Badge variant={timeRemaining < 10 ? 'danger' : 'default'}>
                ⏱️ {timeRemaining}s
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 flex flex-col">
        {/* Level Info */}
        <div className="text-center mb-6">
          {isPracticeMode ? (
            <Badge variant="default" size="sm">
              Practice Mode (No XP)
            </Badge>
          ) : (
            <Badge variant="purple" size="sm">
              Level {level.id}: {level.name}
            </Badge>
          )}
        </div>

        {/* Question */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-center mb-4">
            {question.prompt}
          </h2>

          {/* Play Button */}
          <div className="flex justify-center">
            <button
              onClick={() => { triggerHapticFeedback('light'); playQuestionAudio(); }}
              disabled={audio.isPlaying}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                audio.isPlaying
                  ? 'bg-purple-500 animate-pulse'
                  : hasPlayed
                  ? 'bg-white/20 hover:bg-white/30'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30'
              }`}
            >
              {audio.isPlaying ? (
                <Volume2 className="w-8 h-8 animate-pulse" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>
          </div>

          {!hasPlayed && (
            <p className="text-center text-sm text-white/60 mt-3">
              Tap to play the sound
            </p>
          )}
        </Card>

        {/* Answer Options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = result && option === question.correctAnswer;
            const isWrong = result && isSelected && !result.isCorrect;

            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={!!result}
                className={`p-4 rounded-xl border-2 text-center font-medium transition-all duration-200 relative ${
                  isCorrect
                    ? 'bg-green-500/20 border-green-500 text-green-300'
                    : isWrong
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : isSelected
                    ? 'bg-purple-500/20 border-purple-500'
                    : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30'
                } ${result ? 'cursor-default' : 'active:scale-95'}`}
              >
                {/* Keyboard hint */}
                {!result && (
                  <span className="absolute top-1 left-2 text-xs text-white/40 hidden sm:block">
                    {index + 1}
                  </span>
                )}
                <div className="flex items-center justify-center gap-2">
                  {isCorrect && <Check className="w-5 h-5" />}
                  {isWrong && <X className="w-5 h-5" />}
                  <span>{getDisplayName(option)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Input hints */}
        <div className="hidden sm:flex items-center justify-center gap-2 text-xs text-white/40 mb-4">
          <Keyboard className="w-3 h-3" />
          <span>Press 1-4 to answer, R to replay, Space/Enter for next</span>
        </div>
        {midiState.isConnected && (
          <div className="flex items-center justify-center gap-2 text-xs text-green-400/70 mb-4">
            <Usb className="w-3 h-3" />
            <span>MIDI: {midiState.deviceName} (play C4-F4 to select)</span>
          </div>
        )}

        {/* Result Feedback */}
        {result && (
          <Card
            className={`p-4 mb-6 ${
              result.isCorrect ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {result.isCorrect ? (
                    <>
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="font-semibold text-green-300">Correct!</span>
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5 text-red-400" />
                      <span className="font-semibold text-red-300">Incorrect</span>
                    </>
                  )}
                </div>
                {!result.isCorrect && (
                  <div>
                    <p className="text-sm text-white/60">
                      The answer was: <span className="text-white">{getDisplayName(question.correctAnswer)}</span>
                    </p>
                    {showCorrectFeedback && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-amber-300/80">
                        <Headphones className="w-3 h-3" />
                        <span>Playing correct answer, then your question again...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {result.isCorrect && !isPracticeMode && (
                <div className="text-right">
                  <span className="text-lg font-bold text-green-300">+{result.xpEarned}</span>
                  <span className="text-sm text-green-300/60 ml-1">XP</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Sticky Bottom */}
      <div className="action-bar px-4 py-3 bg-gradient-to-t from-[#0f0c29] via-[#0f0c29] to-transparent">
        {result && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onNext}
            icon={<ChevronRight className="w-5 h-5" />}
          >
            {questionNumber >= totalQuestions ? 'See Results' : 'Next Question'}
          </Button>
        )}
      </div>
    </div>
  );
}
