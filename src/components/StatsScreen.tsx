import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  Clock,
  Award,
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Play,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Progress, CircularProgress } from './ui/Progress';
import { Badge, LevelBadge, XPBadge } from './ui/Badge';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import {
  getUserStats,
  getDailyStats,
  getChordStats,
  getScaleStats,
  getIntervalStats,
  getUnlockedAchievements,
  getGameModeStats,
  getPracticeInsights,
  getSessionHistory,
} from '../utils/storage';
import { getLevelFromXP, getXPProgress, ACHIEVEMENTS } from '../types/stats';
import { calculateWeakAreas, getDisplayName, formatTime } from '../utils/gameHelpers';
import { getWeakItems, ReviewItem } from '../utils/spacedRepetition';
import { GameModeType } from '../types/gameModes';

type TabType = 'overview' | 'accuracy' | 'achievements' | 'insights' | 'analytics';

interface StatsScreenProps {
  onStartGameMode?: (mode: GameModeType) => void;
}

export function StatsScreen({ onStartGameMode }: StatsScreenProps = {}) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const userStats = getUserStats();
  const dailyStats = getDailyStats();
  const chordStats = getChordStats();
  const scaleStats = getScaleStats();
  const intervalStats = getIntervalStats();
  const gameModeStats = getGameModeStats();
  const unlockedAchievements = getUnlockedAchievements();
  const practiceInsights = getPracticeInsights();
  const sessionHistory = getSessionHistory();
  const xpProgress = getXPProgress(userStats.totalXP);
  const userLevel = getLevelFromXP(userStats.totalXP);

  const accuracy = userStats.totalQuestionsAnswered > 0
    ? Math.round((userStats.totalCorrect / userStats.totalQuestionsAnswered) * 100)
    : 0;

  const weakAreas = calculateWeakAreas(chordStats, scaleStats, intervalStats);

  // SRS-derived weak items for drill recommendations
  const srsWeakItems = useMemo(() => getWeakItems(undefined, 5), []);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'accuracy', label: 'Accuracy', icon: <Target className="w-4 h-4" /> },
    { id: 'achievements', label: 'Badges', icon: <Award className="w-4 h-4" /> },
    { id: 'insights', label: 'Insights', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0f0c29] via-[#0f0c29] to-transparent pb-4 px-4 pt-6">
        <h1 className="text-2xl font-bold mb-4">Statistics</h1>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in">
            {/* Level Progress */}
            <Card className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <CircularProgress
                  value={xpProgress.percentage}
                  size={80}
                  strokeWidth={8}
                >
                  <LevelBadge level={userLevel} size="lg" />
                </CircularProgress>
                <div className="flex-1">
                  <h3 className="font-semibold">Level {userLevel}</h3>
                  <div className="text-sm text-white/60 mb-2">
                    {xpProgress.current}/{xpProgress.needed} XP
                  </div>
                  <Progress value={xpProgress.percentage} max={100} size="sm" />
                </div>
              </div>
              <div className="text-center">
                <XPBadge xp={userStats.totalXP} size="lg" />
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">Correct</span>
                </div>
                <div className="text-2xl font-bold">{userStats.totalCorrect}</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">Incorrect</span>
                </div>
                <div className="text-2xl font-bold">{userStats.totalIncorrect}</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2 text-orange-400">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm">Best Streak</span>
                </div>
                <div className="text-2xl font-bold">{userStats.longestStreak}</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2 text-blue-400">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">Daily Streak</span>
                </div>
                <div className="text-2xl font-bold">{dailyStats.currentStreak}</div>
              </Card>
            </div>

            {/* Sessions */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Sessions</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-400">{userStats.sessionsPlayed}</div>
                  <div className="text-sm text-white/60">Games Played</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {Math.round(userStats.totalPlayTime / 60)}
                  </div>
                  <div className="text-sm text-white/60">Minutes Played</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'accuracy' && (
          <div className="space-y-4 animate-in">
            {/* Overall Accuracy */}
            <Card className="p-6">
              <div className="flex justify-center mb-4">
                <CircularProgress
                  value={accuracy}
                  size={140}
                  strokeWidth={12}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold">{accuracy}%</div>
                    <div className="text-sm text-white/60">Overall</div>
                  </div>
                </CircularProgress>
              </div>
            </Card>

            {/* Chord Accuracy */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Chord Recognition</h3>
              <div className="space-y-2">
                {chordStats.slice(0, 6).map(stat => {
                  const acc = stat.attempts > 0 ? (stat.correct / stat.attempts) * 100 : 0;
                  return (
                    <div key={stat.chordType}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{getDisplayName(stat.chordType, 'chord')}</span>
                        <span className="text-white/60">{Math.round(acc)}%</span>
                      </div>
                      <Progress
                        value={acc}
                        max={100}
                        size="sm"
                        color={acc >= 70 ? 'green' : acc >= 50 ? 'amber' : 'red'}
                      />
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Scale Accuracy */}
            {scaleStats.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Scale Recognition</h3>
                <div className="space-y-2">
                  {scaleStats.slice(0, 6).map(stat => {
                    const acc = stat.attempts > 0 ? (stat.correct / stat.attempts) * 100 : 0;
                    return (
                      <div key={stat.scaleType}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{getDisplayName(stat.scaleType, 'scale')}</span>
                          <span className="text-white/60">{Math.round(acc)}%</span>
                        </div>
                        <Progress
                          value={acc}
                          max={100}
                          size="sm"
                          color={acc >= 70 ? 'green' : acc >= 50 ? 'amber' : 'red'}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-4 animate-in">
            {/* Progress */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Achievement Progress</h3>
                <Badge variant="purple">
                  {unlockedAchievements.length}/{ACHIEVEMENTS.length}
                </Badge>
              </div>
              <Progress
                value={unlockedAchievements.length}
                max={ACHIEVEMENTS.length}
                color="amber"
              />
            </Card>

            {/* Achievement Categories */}
            {['progress', 'streak', 'accuracy', 'mastery', 'challenge', 'special'].map(category => {
              const categoryAchievements = ACHIEVEMENTS.filter(a => a.category === category);
              const unlocked = categoryAchievements.filter(a =>
                unlockedAchievements.some(u => u.id === a.id)
              );

              return (
                <Card key={category} className="p-4">
                  <h3 className="font-semibold mb-3 capitalize">{category}</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {categoryAchievements.map(achievement => {
                      const isUnlocked = unlocked.some(u => u.id === achievement.id);
                      return (
                        <div
                          key={achievement.id}
                          className={`p-2 rounded-xl text-center ${
                            isUnlocked
                              ? 'bg-yellow-500/20 border border-yellow-500/30'
                              : 'bg-white/5 opacity-50'
                          }`}
                          title={achievement.description}
                        >
                          <span className="text-2xl">{achievement.icon}</span>
                          <p className="text-xs mt-1 truncate">{achievement.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4 animate-in">
            {/* Weekly Progress Chart */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Weekly Progress</h3>
              <div className="flex items-end gap-1 h-24 mb-2">
                {practiceInsights.weeklyProgress.map((day, i) => {
                  const maxXp = Math.max(...practiceInsights.weeklyProgress.map(d => d.xp), 1);
                  const height = day.xp > 0 ? Math.max((day.xp / maxXp) * 100, 10) : 4;
                  const dayName = new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).charAt(0);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t transition-all ${day.sessions > 0 ? 'bg-gradient-to-t from-purple-600 to-purple-400' : 'bg-white/10'}`}
                        style={{ height: `${height}%` }}
                        title={`${day.date}: ${day.sessions} sessions, ${day.xp} XP`}
                      />
                      <span className="text-xs text-white/40">{dayName}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-white/60">
                <span>{practiceInsights.practiceConsistency}/7 days practiced</span>
                <span>{practiceInsights.weeklyProgress.reduce((sum, d) => sum + d.xp, 0)} XP this week</span>
              </div>
            </Card>

            {/* Trend & Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className={`w-5 h-5 ${
                    practiceInsights.recentTrend === 'improving' ? 'text-green-400' :
                    practiceInsights.recentTrend === 'declining' ? 'text-red-400' : 'text-blue-400'
                  }`} />
                  <span className="text-sm text-white/60">Trend</span>
                </div>
                <div className={`text-lg font-bold capitalize ${
                  practiceInsights.recentTrend === 'improving' ? 'text-green-400' :
                  practiceInsights.recentTrend === 'declining' ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {practiceInsights.recentTrend}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm text-white/60">Practice Time</span>
                </div>
                <div className="text-lg font-bold">
                  {Math.round(practiceInsights.totalPracticeTime / 60)}m
                </div>
              </Card>
            </div>

            {/* Strongest & Weakest */}
            {(practiceInsights.strongestMode || practiceInsights.weakestMode) && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Mode Performance</h3>
                <div className="space-y-2">
                  {practiceInsights.strongestMode && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm">Strongest</span>
                      </div>
                      <Badge variant="success">{practiceInsights.strongestMode}</Badge>
                    </div>
                  )}
                  {practiceInsights.weakestMode && practiceInsights.weakestMode !== practiceInsights.strongestMode && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-sm">Needs Work</span>
                      </div>
                      <Badge variant="warning">{practiceInsights.weakestMode}</Badge>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Recent Sessions */}
            {sessionHistory.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Recent Sessions</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sessionHistory.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div>
                        <div className="text-sm font-medium capitalize">{session.mode}</div>
                        <div className="text-xs text-white/60">{session.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400">{Math.round(session.accuracy)}%</div>
                        <div className="text-xs text-white/60">+{session.xpEarned} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Weak Areas + Drill Recommendations */}
            {(weakAreas.length > 0 || srsWeakItems.length > 0) && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold">Focus Areas</h3>
                </div>
                <div className="space-y-3">
                  {srsWeakItems.slice(0, 3).map((item: ReviewItem, i: number) => {
                    const total = item.correct + item.incorrect;
                    const acc = total > 0 ? Math.round((item.correct / total) * 100) : 0;
                    const modeMap: Record<string, GameModeType> = { chord: 'chords', scale: 'scales', interval: 'intervals' };
                    const drillMode = modeMap[item.type];
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div>
                          <div className="font-medium capitalize">{item.value.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-white/60">{item.type} · {total} attempts · {acc}% accuracy</div>
                        </div>
                        {onStartGameMode && drillMode && (
                          <button
                            onClick={() => onStartGameMode(drillMode)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-300 hover:bg-purple-500/30 transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            Drill
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {weakAreas.slice(0, 3).map((area, i) => (
                    <div key={`wa-${i}`} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div>
                        <div className="font-medium">{area.name}</div>
                        <div className="text-xs text-white/60">{area.type} · {area.attempts} attempts</div>
                      </div>
                      <div className="font-bold text-amber-400">{Math.round(area.accuracy)}%</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recommendations */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Recommendations</h3>
              <div className="space-y-3">
                {practiceInsights.practiceConsistency < 3 && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm">
                      Practice more regularly! Aim for at least 3 days per week to build strong habits.
                    </p>
                  </div>
                )}
                {weakAreas.length > 0 ? (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm">
                      Focus on <span className="text-purple-300 font-medium">{weakAreas[0]?.name}</span> -
                      practice with targeted exercises to improve your recognition.
                    </p>
                  </div>
                ) : userStats.totalQuestionsAnswered < 50 ? (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm">
                      Keep practicing! Answer more questions to unlock personalized insights.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-sm">
                      Great job! Your accuracy is solid across all areas. Try advancing to higher levels.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-in">
            <AnalyticsDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
