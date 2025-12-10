import React from 'react';
import { Lock, Check, Star } from 'lucide-react';
import { LEVELS, LevelConfig } from '../types/levels';
import { Card } from './ui/Card';
import { Progress } from './ui/Progress';
import { Badge, LevelBadge } from './ui/Badge';
import { getUserStats, getLevelProgress } from '../utils/storage';

interface LevelSelectProps {
  onSelectLevel: (level: LevelConfig) => void;
  onBack: () => void;
}

export function LevelSelect({ onSelectLevel, onBack }: LevelSelectProps) {
  const userStats = getUserStats();
  const levelProgress = getLevelProgress();

  const isLevelUnlocked = (level: LevelConfig): boolean => {
    return userStats.totalXP >= level.unlockRequirement;
  };

  const getLevelProgressData = (levelId: number) => {
    return levelProgress.find(p => p.levelId === levelId);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0f0c29] via-[#0f0c29] to-transparent pb-4 px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold">Select Level</h1>
            <p className="text-sm text-white/60">Choose your challenge</p>
          </div>
        </div>

        {/* XP Progress */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <LevelBadge level={userStats.currentLevel} />
              <span className="text-sm text-white/60">Your Progress</span>
            </div>
            <span className="text-sm font-medium text-purple-400">
              {userStats.totalXP.toLocaleString()} XP
            </span>
          </div>
          <Progress value={userStats.totalXP} max={25000} color="purple" />
        </Card>
      </div>

      {/* Levels Grid */}
      <div className="px-4 space-y-3">
        {LEVELS.map(level => {
          const unlocked = isLevelUnlocked(level);
          const progress = getLevelProgressData(level.id);
          const isCompleted = progress && progress.timesCompleted > 0;

          return (
            <Card
              key={level.id}
              hover={unlocked}
              onClick={() => unlocked && onSelectLevel(level)}
              className={`p-4 ${!unlocked ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Level Icon */}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${level.color} shadow-lg`}
                >
                  {unlocked ? level.icon : <Lock className="w-6 h-6" />}
                </div>

                {/* Level Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Level {level.id}: {level.name}</h3>
                    {isCompleted && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <p className="text-sm text-white/60 mb-2">{level.description}</p>

                  {unlocked ? (
                    <div className="flex flex-wrap gap-1">
                      {level.features.slice(0, 2).map((feature, i) => (
                        <Badge key={i} variant="purple" size="sm">
                          {feature}
                        </Badge>
                      ))}
                      {level.features.length > 2 && (
                        <Badge variant="default" size="sm">
                          +{level.features.length - 2} more
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-amber-400">
                      <Star className="w-4 h-4" />
                      <span>Requires {level.unlockRequirement.toLocaleString()} XP</span>
                    </div>
                  )}
                </div>

                {/* Progress Indicator */}
                {unlocked && progress && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-400">
                      {Math.round((progress.questionsCompleted / level.questionsToComplete) * 100)}%
                    </div>
                    <div className="text-xs text-white/60">Complete</div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {unlocked && progress && (
                <div className="mt-3">
                  <Progress
                    value={progress.questionsCompleted}
                    max={level.questionsToComplete}
                    size="sm"
                    color="purple"
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
