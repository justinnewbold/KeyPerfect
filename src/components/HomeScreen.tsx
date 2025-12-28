import React from 'react';
import {
  Play,
  Zap,
  Calendar,
  Heart,
  Timer,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Progress, CircularProgress } from './ui/Progress';
import { Badge, LevelBadge, XPBadge, StreakBadge } from './ui/Badge';
import { getUserStats, getDailyStats, getUnlockedAchievements, PRACTICE_PRESETS, PracticePresetId, updateSettings } from '../utils/storage';
import { getLevelFromXP, getXPProgress, ACHIEVEMENTS } from '../types/stats';
import { GAME_MODES, CHALLENGE_MODES, GameModeType, ChallengeModeType } from '../types/gameModes';
import { getPracticeRecommendation, getLearningProgress } from '../utils/spacedRepetition';

interface HomeScreenProps {
  onStartLevel: () => void;
  onStartChallenge: (mode: ChallengeModeType) => void;
  onStartGameMode: (mode: GameModeType) => void;
  onStartPreset?: (presetId: PracticePresetId) => void;
}

export function HomeScreen({ onStartLevel, onStartChallenge, onStartGameMode, onStartPreset }: HomeScreenProps) {
  const userStats = getUserStats();
  const dailyStats = getDailyStats();
  const unlockedAchievements = getUnlockedAchievements();
  const xpProgress = getXPProgress(userStats.totalXP);
  const userLevel = getLevelFromXP(userStats.totalXP);
  const recommendation = getPracticeRecommendation();
  const learningProgress = getLearningProgress();

  const today = new Date().toISOString().split('T')[0];
  const canPlayDaily = dailyStats.lastPlayedDate !== today || !dailyStats.completed;

  const accuracy = userStats.totalQuestionsAnswered > 0
    ? Math.round((userStats.totalCorrect / userStats.totalQuestionsAnswered) * 100)
    : 0;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0f0c29] via-[#0f0c29] to-transparent pb-4 px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold gradient-text">KeyPerfect</h1>
            <p className="text-sm text-white/60">Master your musical ear</p>
          </div>
          <div className="flex items-center gap-2">
            {dailyStats.currentStreak > 0 && (
              <StreakBadge streak={dailyStats.currentStreak} />
            )}
          </div>
        </div>

        {/* XP Progress Card */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <CircularProgress
              value={xpProgress.percentage}
              max={100}
              size={70}
              strokeWidth={6}
            >
              <LevelBadge level={userLevel} size="md" />
            </CircularProgress>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white/60">Level {userLevel}</span>
                <XPBadge xp={userStats.totalXP} size="sm" />
              </div>
              <Progress
                value={xpProgress.current}
                max={xpProgress.needed}
                size="sm"
                color="purple"
              />
              <p className="text-xs text-white/60 mt-1">
                {xpProgress.current}/{xpProgress.needed} XP to next level
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="px-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-xl font-bold text-green-400">{accuracy}%</div>
            <div className="text-xs text-white/60">Accuracy</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl font-bold text-purple-400">{userStats.totalQuestionsAnswered}</div>
            <div className="text-xs text-white/60">Questions</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl font-bold text-amber-400">{unlockedAchievements.length}</div>
            <div className="text-xs text-white/60">Achievements</div>
          </Card>
        </div>

        {/* Main Play Button */}
        <Card
          hover
          onClick={onStartLevel}
          className="p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Play className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Start Training</h3>
              <p className="text-sm text-white/60">Progressive levels to master ear training</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/40" />
          </div>
        </Card>

        {/* Smart Practice Recommendation */}
        {userStats.totalQuestionsAnswered >= 10 && (
          <Card
            hover
            onClick={() => onStartGameMode(recommendation.type === 'chord' ? 'chords' : recommendation.type === 'scale' ? 'scales' : 'intervals')}
            className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">Smart Practice</h4>
                  <Badge variant="info" size="sm">AI</Badge>
                </div>
                <p className="text-xs text-white/60">{recommendation.reason}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/40" />
            </div>
            {learningProgress.struggling > 0 && (
              <div className="mt-3 flex gap-2 text-xs">
                <Badge variant="success" size="sm">{learningProgress.mastered} mastered</Badge>
                <Badge variant="purple" size="sm">{learningProgress.learning} learning</Badge>
                <Badge variant="warning" size="sm">{learningProgress.struggling} need work</Badge>
              </div>
            )}
          </Card>
        )}

        {/* Practice Presets */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Quick Start</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(PRACTICE_PRESETS).map(preset => (
              <Card
                key={preset.id}
                hover
                onClick={() => {
                  updateSettings({ lastPreset: preset.id });
                  if (onStartPreset) {
                    onStartPreset(preset.id);
                  } else {
                    // Fallback: start with first mode in preset
                    onStartGameMode(preset.modes[0]);
                  }
                }}
                className="p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{preset.icon}</span>
                  <h4 className="font-semibold text-sm">{preset.name}</h4>
                </div>
                <p className="text-xs text-white/60">{preset.description}</p>
                {preset.timeLimit && (
                  <Badge variant="info" size="sm" className="mt-2">
                    {Math.floor(preset.timeLimit / 60)}m limit
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Challenge Modes */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Challenge Modes</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Daily Challenge */}
            <Card
              hover={canPlayDaily}
              onClick={() => canPlayDaily && onStartChallenge('daily')}
              className={`p-4 ${!canPlayDaily ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold">Daily</h4>
                  {!canPlayDaily && (
                    <Badge variant="success" size="sm">Completed</Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-white/60">New challenge every day</p>
            </Card>

            {/* Speed Run */}
            <Card
              hover
              onClick={() => onStartChallenge('speedrun')}
              className="p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="font-semibold">Speed Run</h4>
              </div>
              <p className="text-xs text-white/60">60 seconds, max points</p>
            </Card>

            {/* Survival */}
            <Card
              hover
              onClick={() => onStartChallenge('survival')}
              className="p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <h4 className="font-semibold">Survival</h4>
              </div>
              <p className="text-xs text-white/60">3 lives, how far can you go?</p>
            </Card>

            {/* Time Attack */}
            <Card
              hover
              onClick={() => onStartChallenge('timeattack')}
              className="p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Timer className="w-5 h-5" />
                </div>
                <h4 className="font-semibold">Time Attack</h4>
              </div>
              <p className="text-xs text-white/60">Beat the clock</p>
            </Card>
          </div>
        </div>

        {/* Training Modes */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Training Modes</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(GAME_MODES).map(mode => (
              <Card
                key={mode.id}
                hover
                onClick={() => onStartGameMode(mode.id)}
                className="p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                    <span className="text-lg">{mode.icon}</span>
                  </div>
                  <h4 className="font-semibold text-sm">{mode.name}</h4>
                </div>
                <p className="text-xs text-white/60 line-clamp-2">{mode.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Achievements */}
        {unlockedAchievements.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Recent Achievements</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {unlockedAchievements.slice(-4).reverse().map(achievement => (
                <Card key={achievement.id} className="p-3 min-w-[140px] flex-shrink-0">
                  <div className="text-center">
                    <span className="text-3xl">{achievement.icon}</span>
                    <p className="text-sm font-medium mt-1">{achievement.name}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
