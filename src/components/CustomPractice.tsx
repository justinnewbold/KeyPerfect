import React, { useState, useCallback, useEffect } from 'react';
import {
  Play,
  Settings,
  Target,
  Brain,
  ChevronRight,
  X,
  Check,
  Volume2,
  Music,
  Sliders,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { GameScreen } from './GameScreen';
import { CHORD_TYPES, SCALE_TYPES, INTERVALS, ChordQuality, ScaleType, IntervalType } from '../types/music';
import { LevelConfig, LEVELS } from '../types/levels';
import { GameQuestion, AnswerRecord, GameResult } from '../types/gameModes';
import { generateAdaptivePractice, getPracticeRecommendation, updateReviewItem, getLearningProgress } from '../utils/spacedRepetition';
import { useGameState } from '../hooks/useGameState';
import { generateQuestion } from '../utils/gameHelpers';

type PracticeType = 'chord' | 'scale' | 'interval' | 'mixed';

interface PracticeConfig {
  type: PracticeType;
  selectedChords: ChordQuality[];
  selectedScales: ScaleType[];
  selectedIntervals: IntervalType[];
  questionCount: number;
  useAdaptive: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  playbackSpeed: 'slow' | 'normal' | 'fast';
}

const defaultConfig: PracticeConfig = {
  type: 'chord',
  selectedChords: ['major', 'minor'],
  selectedScales: ['major', 'natural_minor'],
  selectedIntervals: ['major3', 'perfect5', 'octave'],
  questionCount: 10,
  useAdaptive: true,
  difficulty: 'medium',
  playbackSpeed: 'normal',
};

export function CustomPractice({ onBack }: { onBack: () => void }) {
  const [config, setConfig] = useState<PracticeConfig>(defaultConfig);
  const [showConfig, setShowConfig] = useState(true);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);

  const recommendation = getPracticeRecommendation();
  const progress = getLearningProgress();

  const {
    gameState,
    startGame,
    submitAnswer,
    nextQuestion,
    endGame,
  } = useGameState();

  // Start practice session
  const handleStartPractice = useCallback(() => {
    setShowConfig(false);
    setIsPracticing(true);

    // Use appropriate level based on difficulty
    const levelId = config.difficulty === 'easy' ? 1 : config.difficulty === 'medium' ? 3 : 5;
    startGame(config.type === 'mixed' ? 'chords' : `${config.type}s` as any, levelId);
  }, [config, startGame]);

  // Handle answer with SRS update
  const handleAnswer = useCallback((answer: string): AnswerRecord => {
    const record = submitAnswer(answer);

    // Update spaced repetition data. The SRS layer only models the three
    // singular item types — map question.type accordingly and skip modes
    // it doesn't track instead of writing under a mismatched key.
    if (gameState) {
      const question = gameState.questions[gameState.currentQuestion];
      const srsType =
        question.type === 'chords' ? 'chord' :
        question.type === 'scales' ? 'scale' :
        question.type === 'intervals' ? 'interval' :
        null;
      if (srsType) {
        updateReviewItem(
          srsType,
          question.correctAnswer,
          record.isCorrect,
          record.timeToAnswer,
          gameState.streak
        );
      }
    }

    return record;
  }, [submitAnswer, gameState]);

  // Handle practice complete
  const handlePracticeComplete = useCallback(() => {
    const result = endGame();
    setGameResult(result);
    setIsPracticing(false);
  }, [endGame]);

  // Handle next question
  const handleNext = useCallback(() => {
    if (!gameState) return;

    if (gameState.currentQuestion >= gameState.totalQuestions - 1 || gameState.isComplete) {
      handlePracticeComplete();
    } else {
      nextQuestion();
    }
  }, [gameState, nextQuestion, handlePracticeComplete]);

  // Reset and show config
  const handleReset = useCallback(() => {
    setShowConfig(true);
    setGameResult(null);
    setIsPracticing(false);
  }, []);

  // Use adaptive recommendation
  const handleUseRecommendation = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      type: recommendation.type,
      useAdaptive: true,
    }));
  }, [recommendation]);

  // Toggle item selection
  const toggleChord = (chord: ChordQuality) => {
    setConfig(prev => ({
      ...prev,
      selectedChords: prev.selectedChords.includes(chord)
        ? prev.selectedChords.filter(c => c !== chord)
        : [...prev.selectedChords, chord],
    }));
  };

  const toggleScale = (scale: ScaleType) => {
    setConfig(prev => ({
      ...prev,
      selectedScales: prev.selectedScales.includes(scale)
        ? prev.selectedScales.filter(s => s !== scale)
        : [...prev.selectedScales, scale],
    }));
  };

  const toggleInterval = (interval: IntervalType) => {
    setConfig(prev => ({
      ...prev,
      selectedIntervals: prev.selectedIntervals.includes(interval)
        ? prev.selectedIntervals.filter(i => i !== interval)
        : [...prev.selectedIntervals, interval],
    }));
  };

  // Render practice session
  if (isPracticing && gameState) {
    const level = LEVELS.find(l => l.id === gameState.level) || LEVELS[0];

    return (
      <GameScreen
        level={level}
        question={gameState.questions[gameState.currentQuestion]}
        questionNumber={gameState.currentQuestion + 1}
        totalQuestions={gameState.totalQuestions}
        score={gameState.score}
        streak={gameState.streak}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onExit={handleReset}
      />
    );
  }

  // Render results
  if (gameResult) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-6">
        <Card className="p-6 text-center">
          <div className="text-6xl mb-4">
            {gameResult.accuracy >= 90 ? '🏆' : gameResult.accuracy >= 70 ? '🌟' : '💪'}
          </div>
          <h2 className="text-2xl font-bold mb-2">Practice Complete!</h2>

          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold text-purple-400">{Math.round(gameResult.accuracy)}%</div>
              <div className="text-sm text-white/60">Accuracy</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-400">{gameResult.correctAnswers}</div>
              <div className="text-sm text-white/60">Correct</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold text-orange-400">{gameResult.longestStreak}</div>
              <div className="text-sm text-white/60">Best Streak</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold text-cyan-400">+{gameResult.totalXPEarned}</div>
              <div className="text-sm text-white/60">XP Earned</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={handleReset}>
              New Practice
            </Button>
            <Button variant="primary" fullWidth onClick={onBack}>
              Back Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render configuration screen
  return (
    <div className="min-h-screen pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20">
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Custom Practice</h1>
      </div>

      {/* Learning Progress */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">Your Progress</h3>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-green-400">{progress.mastered}</div>
            <div className="text-xs text-white/60">Mastered</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400">{progress.learning}</div>
            <div className="text-xs text-white/60">Learning</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400">{progress.struggling}</div>
            <div className="text-xs text-white/60">Struggling</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white/60">{progress.new}</div>
            <div className="text-xs text-white/60">New</div>
          </div>
        </div>
      </Card>

      {/* Recommendation */}
      <Card className="p-4 mb-4 bg-purple-500/10 border-purple-500/20">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-purple-400 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-purple-300">Recommended Practice</div>
            <div className="text-sm text-white/60 mb-2">{recommendation.reason}</div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUseRecommendation}
            >
              Practice {recommendation.type}s
            </Button>
          </div>
        </div>
      </Card>

      {/* Practice Type */}
      <Card className="p-4 mb-4">
        <h3 className="font-semibold mb-3">Practice Type</h3>
        <div className="grid grid-cols-4 gap-2">
          {(['chord', 'scale', 'interval', 'mixed'] as const).map(type => (
            <button
              key={type}
              onClick={() => setConfig(prev => ({ ...prev, type }))}
              className={`p-3 rounded-xl text-center transition-all ${
                config.type === type
                  ? 'bg-purple-500/30 border-2 border-purple-500'
                  : 'bg-white/10 border-2 border-transparent hover:bg-white/20'
              }`}
            >
              <span className="text-lg">
                {type === 'chord' ? '🎹' : type === 'scale' ? '🎼' : type === 'interval' ? '📏' : '🎯'}
              </span>
              <div className="text-xs mt-1 capitalize">{type}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Content Selection */}
      {config.type === 'chord' && (
        <Card className="p-4 mb-4">
          <h3 className="font-semibold mb-3">Select Chords</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CHORD_TYPES) as ChordQuality[]).map(chord => (
              <button
                key={chord}
                onClick={() => toggleChord(chord)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  config.selectedChords.includes(chord)
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {CHORD_TYPES[chord].name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {config.type === 'scale' && (
        <Card className="p-4 mb-4">
          <h3 className="font-semibold mb-3">Select Scales</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SCALE_TYPES) as ScaleType[]).slice(0, 10).map(scale => (
              <button
                key={scale}
                onClick={() => toggleScale(scale)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  config.selectedScales.includes(scale)
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {SCALE_TYPES[scale].name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {config.type === 'interval' && (
        <Card className="p-4 mb-4">
          <h3 className="font-semibold mb-3">Select Intervals</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(INTERVALS) as IntervalType[]).map(interval => (
              <button
                key={interval}
                onClick={() => toggleInterval(interval)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  config.selectedIntervals.includes(interval)
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {INTERVALS[interval].name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Settings */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-5 h-5 text-white/60" />
          <h3 className="font-semibold">Settings</h3>
        </div>

        {/* Question Count */}
        <div className="mb-4">
          <label className="text-sm text-white/60 mb-2 block">Questions: {config.questionCount}</label>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            value={config.questionCount}
            onChange={e => setConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Difficulty */}
        <div className="mb-4">
          <label className="text-sm text-white/60 mb-2 block">Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'medium', 'hard'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => setConfig(prev => ({ ...prev, difficulty: diff }))}
                className={`py-2 rounded-lg text-sm capitalize transition-all ${
                  config.difficulty === diff
                    ? 'bg-purple-500/30 border border-purple-500'
                    : 'bg-white/10 border border-transparent hover:bg-white/20'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Adaptive Toggle */}
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-purple-400" />
            <div>
              <div className="font-medium">Adaptive Learning</div>
              <div className="text-xs text-white/60">Focus on weak areas</div>
            </div>
          </div>
          <button
            onClick={() => setConfig(prev => ({ ...prev, useAdaptive: !prev.useAdaptive }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              config.useAdaptive ? 'bg-purple-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                config.useAdaptive ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </Card>

      {/* Start Button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleStartPractice}
        icon={<Play className="w-5 h-5" />}
      >
        Start Practice
      </Button>
    </div>
  );
}
