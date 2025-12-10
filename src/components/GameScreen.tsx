import React, { useState, useEffect, useCallback } from 'react';
import { Play, Volume2, Check, X, ChevronRight } from 'lucide-react';
import { GameQuestion, AnswerRecord } from '../types/gameModes';
import { LevelConfig } from '../types/levels';
import { CHORD_TYPES, SCALE_TYPES, INTERVALS, INVERSIONS } from '../types/music';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { Badge, StreakBadge, XPBadge } from './ui/Badge';
import { useAudio } from '../hooks/useAudio';

interface GameScreenProps {
  level: LevelConfig;
  question: GameQuestion;
  questionNumber: number;
  totalQuestions: number;
  score: number;
  streak: number;
  lives?: number;
  timeRemaining?: number;
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
  onAnswer,
  onNext,
  onExit,
}: GameScreenProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerRecord | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const audio = useAudio();

  // Play audio when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setResult(null);
    setHasPlayed(false);
  }, [question.id]);

  const playQuestionAudio = useCallback(() => {
    const { notes, playbackMode } = question.audioData;

    if (playbackMode === 'chord') {
      audio.playChord(notes);
    } else if (playbackMode === 'scale') {
      audio.playScale(notes);
    } else if (playbackMode === 'interval') {
      audio.playInterval(notes[0], notes[1]);
    }

    setHasPlayed(true);
  }, [question, audio]);

  // Auto-play on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      playQuestionAudio();
    }, 500);
    return () => clearTimeout(timer);
  }, [question.id]);

  const handleAnswer = (answer: string) => {
    if (result) return;

    setSelectedAnswer(answer);
    const answerResult = onAnswer(answer);
    setResult(answerResult);

    if (answerResult.isCorrect) {
      audio.playSuccess();
    } else {
      audio.playError();
    }
  };

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
    <div className="min-h-screen pb-24 flex flex-col">
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
          <Badge variant="purple" size="sm">
            Level {level.id}: {level.name}
          </Badge>
        </div>

        {/* Question */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-center mb-4">
            {question.prompt}
          </h2>

          {/* Play Button */}
          <div className="flex justify-center">
            <button
              onClick={playQuestionAudio}
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
          {question.options.map(option => {
            const isSelected = selectedAnswer === option;
            const isCorrect = result && option === question.correctAnswer;
            const isWrong = result && isSelected && !result.isCorrect;

            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={!!result}
                className={`p-4 rounded-xl border-2 text-center font-medium transition-all duration-200 ${
                  isCorrect
                    ? 'bg-green-500/20 border-green-500 text-green-300'
                    : isWrong
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : isSelected
                    ? 'bg-purple-500/20 border-purple-500'
                    : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30'
                } ${result ? 'cursor-default' : 'active:scale-95'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isCorrect && <Check className="w-5 h-5" />}
                  {isWrong && <X className="w-5 h-5" />}
                  <span>{getDisplayName(option)}</span>
                </div>
              </button>
            );
          })}
        </div>

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
                  <p className="text-sm text-white/60">
                    The answer was: <span className="text-white">{getDisplayName(question.correctAnswer)}</span>
                  </p>
                )}
              </div>
              {result.isCorrect && (
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
      <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-gradient-to-t from-[#0f0c29] via-[#0f0c29] to-transparent">
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
