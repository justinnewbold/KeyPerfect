import React, { useState, useCallback } from 'react';
import { ArrowLeft, Play, Check, X, ChevronRight, RotateCcw } from 'lucide-react';
import { GameResult, AnswerRecord } from '../types/gameModes';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useAudio } from '../hooks/useAudio';
import { CHORD_TYPES, SCALE_TYPES, INTERVALS, INVERSIONS } from '../types/music';

interface MistakeReviewScreenProps {
  result: GameResult;
  onBack: () => void;
}

export function MistakeReviewScreen({ result, onBack }: MistakeReviewScreenProps) {
  const mistakes = result.answers.filter(a => !a.isCorrect);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audio = useAudio();

  const getDisplayName = (type: string, value: string): string => {
    if (type === 'chords') return CHORD_TYPES[value as keyof typeof CHORD_TYPES]?.name || value;
    if (type === 'scales') return SCALE_TYPES[value as keyof typeof SCALE_TYPES]?.name || value;
    if (type === 'intervals') return INTERVALS[value as keyof typeof INTERVALS]?.name || value;
    if (type === 'inversions') return INVERSIONS[value as keyof typeof INVERSIONS]?.name || value;
    return value;
  };

  const current = mistakes[currentIndex];

  if (mistakes.length === 0) {
    return (
      <div className="screen-root px-4 pt-8 animate-in">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">No Mistakes!</h1>
        </div>
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">Perfect Session</h2>
          <p className="text-white/60">You got every question right. Keep up the great work!</p>
          <Button variant="primary" className="mt-6" onClick={onBack}>
            Back to Results
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="screen-root px-4 pt-8 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Review Mistakes</h1>
          <p className="text-sm text-white/60">{currentIndex + 1} of {mistakes.length}</p>
        </div>
        <Badge variant="danger">{mistakes.length} wrong</Badge>
      </div>

      {/* Mistake Card */}
      <Card className="p-6 mb-6">
        <div className="text-center mb-6">
          <Badge variant="info" size="sm" className="mb-3">
            {current.questionType}
          </Badge>
          <h2 className="text-lg font-semibold">What was the correct answer?</h2>
        </div>

        {/* Your answer vs correct answer */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <X className="w-5 h-5 text-red-400 mx-auto mb-2" />
            <p className="text-xs text-white/60 mb-1">Your Answer</p>
            <p className="font-semibold text-red-300">
              {getDisplayName(current.questionType || '', current.userAnswer)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
            <Check className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <p className="text-xs text-white/60 mb-1">Correct Answer</p>
            <p className="font-semibold text-green-300">
              {getDisplayName(current.questionType || '', current.correctAnswer)}
            </p>
          </div>
        </div>

        {/* Response time */}
        <p className="text-center text-sm text-white/40">
          Response time: {(current.timeToAnswer / 1000).toFixed(1)}s
        </p>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        <Button
          variant="primary"
          fullWidth
          onClick={() => {
            if (currentIndex < mistakes.length - 1) {
              setCurrentIndex(currentIndex + 1);
            } else {
              onBack();
            }
          }}
          icon={currentIndex < mistakes.length - 1 ? <ChevronRight className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
        >
          {currentIndex < mistakes.length - 1 ? 'Next Mistake' : 'Back to Results'}
        </Button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {mistakes.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex ? 'bg-red-500 w-5' : i < currentIndex ? 'bg-red-500/50' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
