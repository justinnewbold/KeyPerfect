import React, { useState, useEffect } from 'react';
import { Trophy, Target, Zap, Clock, TrendingUp, Home, RotateCcw, Award, ChevronRight, Lock, AlertCircle } from 'lucide-react';
import { GameResult } from '../types/gameModes';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Progress, CircularProgress } from './ui/Progress';
import { Badge, XPBadge } from './ui/Badge';
import { ACHIEVEMENTS } from '../types/stats';
import { LEVELS, getNextLevel, LevelConfig } from '../types/levels';
import { getUserStats } from '../utils/storage';
import { Confetti } from './Confetti';
import { triggerHapticFeedback } from '../utils/haptics';

interface ResultScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  onHome: () => void;
  onNextLevel?: (levelId: number) => void;
  onReviewMistakes?: () => void;
}

export function ResultScreen({ result, onPlayAgain, onHome, onNextLevel, onReviewMistakes }: ResultScreenProps) {
  const userStats = getUserStats();
  const currentLevel = LEVELS.find(l => l.id === result.level);
  const nextLevel = result.level ? getNextLevel(result.level) : undefined;

  // Check if user can access next level (has enough XP after this game)
  const totalXPAfterGame = userStats.totalXP; // Already updated by the time we get here
  const canAccessNextLevel = nextLevel ? totalXPAfterGame >= nextLevel.unlockRequirement : false;
  const xpNeededForNextLevel = nextLevel ? Math.max(0, nextLevel.unlockRequirement - totalXPAfterGame) : 0;

  // Confetti for perfect or S-grade performance
  const showConfetti = result.accuracy >= 95 || result.newAchievements.length > 0;
  const mistakeCount = result.answers.filter(a => !a.isCorrect).length;

  // Haptic feedback on result screen mount
  useEffect(() => {
    if (result.newAchievements.length > 0) {
      triggerHapticFeedback('success');
    } else if (result.accuracy >= 95) {
      triggerHapticFeedback('success');
    }
  }, []);

  const getGrade = (accuracy: number): { grade: string; color: string; message: string } => {
    if (accuracy >= 95) return { grade: 'S', color: 'text-yellow-400', message: 'Perfect!' };
    if (accuracy >= 90) return { grade: 'A+', color: 'text-green-400', message: 'Excellent!' };
    if (accuracy >= 80) return { grade: 'A', color: 'text-green-400', message: 'Great job!' };
    if (accuracy >= 70) return { grade: 'B', color: 'text-blue-400', message: 'Good work!' };
    if (accuracy >= 60) return { grade: 'C', color: 'text-amber-400', message: 'Keep practicing!' };
    return { grade: 'D', color: 'text-red-400', message: 'Room for improvement' };
  };

  const grade = getGrade(result.accuracy);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const newAchievements = result.newAchievements
    .map(id => ACHIEVEMENTS.find(a => a.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen pb-24 px-4 pt-8 animate-in">
      {/* Celebration confetti for perfect/S-grade or achievements */}
      <Confetti active={showConfetti} />

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Game Complete!</h1>
        <p className="text-white/60">{grade.message}</p>
      </div>

      {/* Score Circle */}
      <div className="flex justify-center mb-8">
        <CircularProgress
          value={result.accuracy}
          max={100}
          size={160}
          strokeWidth={12}
        >
          <div className="text-center">
            <div className={`text-4xl font-bold ${grade.color}`}>
              {grade.grade}
            </div>
            <div className="text-sm text-white/60">
              {Math.round(result.accuracy)}%
            </div>
          </div>
        </CircularProgress>
      </div>

      {/* XP Earned */}
      <Card className="p-6 mb-6 text-center bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          <span className="text-3xl font-bold">{result.totalXPEarned}</span>
          <span className="text-xl text-white/60">XP</span>
        </div>
        <p className="text-sm text-white/60">Experience earned</p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white/60">Correct</span>
          </div>
          <div className="text-2xl font-bold">
            {result.correctAnswers}/{result.totalQuestions}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-white/60">Best Streak</span>
          </div>
          <div className="text-2xl font-bold">
            {result.longestStreak}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-white/60">Total Time</span>
          </div>
          <div className="text-2xl font-bold">
            {formatTime(result.totalTime)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-white/60">Score</span>
          </div>
          <div className="text-2xl font-bold">
            {result.score}
          </div>
        </Card>
      </div>

      {/* New Achievements */}
      {newAchievements.length > 0 && (
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold">New Achievements!</h3>
          </div>
          <div className="space-y-2">
            {newAchievements.map(achievement => achievement && (
              <div
                key={achievement.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
              >
                <span className="text-2xl">{achievement.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{achievement.name}</div>
                  <div className="text-sm text-white/60">{achievement.description}</div>
                </div>
                <XPBadge xp={achievement.xpReward} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Answer Summary */}
      <Card className="p-4 mb-6">
        <h3 className="font-semibold mb-3">Answer Summary</h3>
        <div className="flex gap-1">
          {result.answers.map((answer, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full ${
                answer.isCorrect ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={answer.isCorrect ? 'Correct' : 'Incorrect'}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/60">
          <span>Start</span>
          <span>Finish</span>
        </div>
      </Card>

      {/* Category Breakdown - Session Summary */}
      {result.categoryBreakdown && result.categoryBreakdown.length > 0 && (
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-3">Category Breakdown</h3>
          <div className="space-y-3">
            {result.categoryBreakdown.map((cat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize">{cat.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">{cat.correct}/{cat.total}</span>
                    <span className={`text-sm font-bold ${
                      cat.accuracy >= 80 ? 'text-green-400' :
                      cat.accuracy >= 60 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {Math.round(cat.accuracy)}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={cat.accuracy}
                  max={100}
                  size="sm"
                  color={cat.accuracy >= 80 ? 'green' : cat.accuracy >= 60 ? 'amber' : 'red'}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Next Level Prompt */}
      {nextLevel && onNextLevel && (
        <Card className={`p-4 mb-6 ${canAccessNextLevel ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30' : 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-500/30'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${nextLevel.color} flex items-center justify-center`}>
              {canAccessNextLevel ? (
                <span className="text-2xl">{nextLevel.icon}</span>
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">
                {canAccessNextLevel ? 'Continue to Next Level?' : 'Next Level Locked'}
              </h4>
              <p className="text-sm text-white/60">
                {canAccessNextLevel
                  ? `Level ${nextLevel.id}: ${nextLevel.name}`
                  : `Need ${xpNeededForNextLevel.toLocaleString()} more XP to unlock`
                }
              </p>
            </div>
            {canAccessNextLevel && (
              <ChevronRight className="w-5 h-5 text-white/40" />
            )}
          </div>
          {canAccessNextLevel ? (
            <Button
              variant="primary"
              size="md"
              fullWidth
              className="mt-4"
              onClick={() => onNextLevel(nextLevel.id)}
              icon={<ChevronRight className="w-5 h-5" />}
            >
              Start Level {nextLevel.id}
            </Button>
          ) : (
            <div className="mt-4">
              <Progress
                value={totalXPAfterGame}
                max={nextLevel.unlockRequirement}
                size="sm"
                color="purple"
              />
              <p className="text-xs text-white/60 mt-2 text-center">
                {totalXPAfterGame.toLocaleString()} / {nextLevel.unlockRequirement.toLocaleString()} XP
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {mistakeCount > 0 && onReviewMistakes && (
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onClick={onReviewMistakes}
            icon={<AlertCircle className="w-5 h-5" />}
          >
            Review {mistakeCount} Mistake{mistakeCount !== 1 ? 's' : ''}
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onPlayAgain}
          icon={<RotateCcw className="w-5 h-5" />}
        >
          Play Again
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onHome}
          icon={<Home className="w-5 h-5" />}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
