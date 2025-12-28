import React from 'react';
import { Trophy, Target, Zap, Clock, TrendingUp, Home, RotateCcw, Award } from 'lucide-react';
import { GameResult } from '../types/gameModes';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { CircularProgress } from './ui/Progress';
import { XPBadge } from './ui/Badge';
import { StatCard } from './ui/StatCard';
import { ACHIEVEMENTS } from '../types/stats';

interface ResultScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function ResultScreen({ result, onPlayAgain, onHome }: ResultScreenProps) {
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
          <Zap className="w-6 h-6 text-yellow-400" aria-hidden="true" />
          <span className="text-3xl font-bold">{result.totalXPEarned}</span>
          <span className="text-xl text-white/60">XP</span>
        </div>
        <p className="text-sm text-white/60">Experience earned</p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon={<Target className="w-4 h-4" />}
          label="Correct"
          value={`${result.correctAnswers}/${result.totalQuestions}`}
          iconColor="text-green-400"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Best Streak"
          value={result.longestStreak}
          iconColor="text-orange-400"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Total Time"
          value={formatTime(result.totalTime)}
          iconColor="text-blue-400"
        />
        <StatCard
          icon={<Trophy className="w-4 h-4" />}
          label="Score"
          value={result.score}
          iconColor="text-amber-400"
        />
      </div>

      {/* New Achievements */}
      {newAchievements.length > 0 && (
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-yellow-400" aria-hidden="true" />
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

      {/* Action Buttons */}
      <div className="space-y-3">
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
