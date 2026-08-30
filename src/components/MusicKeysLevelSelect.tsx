import React from 'react';
import { Lock, Check, Star, Key } from 'lucide-react';
import { MUSIC_KEYS_LEVELS, MusicKeysLevelConfig } from '../types/musicKeysLevels';
import { Card } from './ui/Card';
import { Progress } from './ui/Progress';
import { Badge, LevelBadge } from './ui/Badge';
import { getUserStats, getMusicKeysProgress } from '../utils/storage';

interface MusicKeysLevelSelectProps {
  onSelectLevel: (level: MusicKeysLevelConfig) => void;
  onBack: () => void;
}

export function MusicKeysLevelSelect({ onSelectLevel, onBack }: MusicKeysLevelSelectProps) {
  const userStats = getUserStats();
  const levelProgress = getMusicKeysProgress();

  const isLevelUnlocked = (level: MusicKeysLevelConfig): boolean => {
    return userStats.totalXP >= level.unlockRequirement;
  };

  const getLevelProgressData = (levelId: number) => {
    return levelProgress.find(p => p.levelId === levelId);
  };

  return (
    <div className="screen-root">
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Key className="w-6 h-6 text-emerald-400" />
              Music Keys
            </h1>
            <p className="text-sm text-white/60">Master identifying musical keys by ear</p>
          </div>
        </div>

        {/* XP Progress */}
        <Card className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <LevelBadge level={userStats.currentLevel} />
              <span className="text-sm text-white/60">Your Progress</span>
            </div>
            <span className="text-sm font-medium text-emerald-400">
              {userStats.totalXP.toLocaleString()} XP
            </span>
          </div>
          <Progress value={userStats.totalXP} max={10000} color="green" />
        </Card>
      </div>

      {/* Info Card */}
      <div className="px-4 mb-4">
        <Card className="p-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
          <h3 className="font-semibold text-emerald-400 mb-2">About Music Keys</h3>
          <p className="text-sm text-white/70">
            Train your ear to recognize musical keys! Listen to scales, chords, or progressions
            and identify which key they're in. Progress from easy keys (C, G, F) to mastering
            the entire circle of fifths.
          </p>
        </Card>
      </div>

      {/* Levels Grid */}
      <div className="px-4 space-y-3">
        {MUSIC_KEYS_LEVELS.map(level => {
          const unlocked = isLevelUnlocked(level);
          const progress = getLevelProgressData(level.id);
          const isCompleted = progress && progress.timesCompleted > 0;

          return (
            <Card
              key={level.id}
              hover={unlocked}
              onClick={() => unlocked && onSelectLevel(level)}
              className={`p-4 ${!unlocked ? 'opacity-60' : ''} ${unlocked ? 'border-emerald-500/20 hover:border-emerald-500/40' : ''}`}
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
                        <Badge key={i} variant="purple" size="sm" className="bg-emerald-500/20 text-emerald-300">
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

                  {/* Keys Preview */}
                  {unlocked && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {level.availableKeys.slice(0, 6).map((key, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-white/10 rounded-full">
                          {key}
                        </span>
                      ))}
                      {level.availableKeys.length > 6 && (
                        <span className="px-2 py-0.5 text-xs bg-white/10 rounded-full">
                          +{level.availableKeys.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Indicator */}
                {unlocked && progress && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">
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
                    color="green"
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
