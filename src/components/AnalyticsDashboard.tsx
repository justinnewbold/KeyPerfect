import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Clock,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import {
  getUserStats,
  getChordStats,
  getScaleStats,
  getIntervalStats,
  getGameModeStats,
  getSessionHistory,
} from '../utils/storage';
import {
  DayBucket,
  TimeRange,
  accuracyImprovement,
  accuracySeries,
  bucketByDay,
  rangeDays,
} from '../utils/analytics';

interface DataPoint {
  label: string;
  value: number;
  color: string;
}

// Simple bar chart component
function BarChart({ data, maxValue }: { data: DataPoint[]; maxValue?: number }) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((point, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-white/60 w-16 truncate">{point.label}</span>
          <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(point.value / max) * 100}%`,
                backgroundColor: point.color,
              }}
            />
          </div>
          <span className="text-xs text-white/60 w-12 text-right">{point.value}</span>
        </div>
      ))}
    </div>
  );
}

// Line chart component (simplified SVG)
function LineChart({
  data,
  height = 120,
  color = '#8b5cf6',
}: {
  data: number[];
  height?: number;
  color?: string;
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-24 text-white/40 text-sm">
        Not enough data yet
      </div>
    );
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const width = 300;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + (1 - (value - min) / range) * chartHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Area fill
  const areaD = `M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line
          key={i}
          x1={padding}
          y1={padding + ratio * chartHeight}
          x2={width - padding}
          y2={padding + ratio * chartHeight}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}

      {/* Area fill with gradient */}
      <defs>
        <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGradient)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {data.map((value, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = padding + (1 - (value - min) / range) * chartHeight;
        return (
          <circle key={i} cx={x} cy={y} r="3" fill={color} stroke="white" strokeWidth="1" />
        );
      })}
    </svg>
  );
}

// Donut chart component
function DonutChart({
  data,
  size = 120,
}: {
  data: DataPoint[];
  size?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {data.map((point, i) => {
          const strokeDasharray = (point.value / total) * circumference;
          const strokeDashoffset = -cumulativeOffset;
          cumulativeOffset += strokeDasharray;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={point.color}
              strokeWidth="12"
              strokeDasharray={`${strokeDasharray} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-xs text-white/60">Total</div>
        </div>
      </div>
    </div>
  );
}

// Weekly activity heatmap. Takes dated buckets rather than a bare number[]:
// the labels used to be a hard-coded Mon-Sun, so whatever the first value
// happened to be was captioned "Mon" regardless of the actual day.
function WeeklyHeatmap({ data }: { data: DayBucket[] }) {
  const max = Math.max(...data.map(d => d.questions), 1);

  return (
    <div className="flex gap-1">
      {data.map(day => {
        const opacity = 0.2 + (day.questions / max) * 0.8;

        return (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-lg transition-all"
              style={{
                backgroundColor: `rgba(139, 92, 246, ${day.questions > 0 ? opacity : 0.06})`,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              title={`${day.label} ${day.date}: ${day.questions} questions`}
            />
            <span className="text-xs text-white/40">{day.label[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const sessionHistory = getSessionHistory();
  const userStats = getUserStats();
  const chordStats = getChordStats();
  const scaleStats = getScaleStats();
  const intervalStats = getIntervalStats();
  const gameModeStats = getGameModeStats();

  // Calculate metrics
  const accuracy = userStats.totalQuestionsAnswered > 0
    ? Math.round((userStats.totalCorrect / userStats.totalQuestionsAnswered) * 100)
    : 0;

  // Both of these used to be Math.random(). A user with no sessions at all was
  // shown a full week of invented history that reshuffled on every mount, and
  // the improvement badge beside the real accuracy number was derived from it.
  // They now come from the session history the app already persists.
  const trendDays = useMemo(() => rangeDays(timeRange, sessionHistory), [timeRange, sessionHistory]);

  const trendBuckets = useMemo(
    () => bucketByDay(sessionHistory, trendDays),
    [sessionHistory, trendDays]
  );

  const accuracyTrend = useMemo(() => accuracySeries(trendBuckets), [trendBuckets]);

  // The heatmap is always the last seven days, whatever the trend range is.
  const weeklyActivity = useMemo(() => bucketByDay(sessionHistory, 7), [sessionHistory]);

  // Chord performance data
  const chordData: DataPoint[] = useMemo(() => {
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    return chordStats
      .filter(s => s.attempts > 0)
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 5)
      .map((stat, i) => ({
        label: stat.chordType,
        value: stat.attempts > 0 ? Math.round((stat.correct / stat.attempts) * 100) : 0,
        color: colors[i % colors.length],
      }));
  }, [chordStats]);

  // Game mode distribution
  const modeData: DataPoint[] = useMemo(() => {
    const modes: Record<string, { color: string; label: string }> = {
      chords: { color: '#8b5cf6', label: 'Chords' },
      scales: { color: '#06b6d4', label: 'Scales' },
      intervals: { color: '#10b981', label: 'Intervals' },
      daily: { color: '#f59e0b', label: 'Daily' },
    };

    return gameModeStats
      .filter(stats => stats.timesPlayed > 0)
      .map(stats => ({
        label: modes[stats.mode]?.label || stats.mode,
        value: stats.timesPlayed,
        color: modes[stats.mode]?.color || '#888',
      }));
  }, [gameModeStats]);

  const improvement = useMemo(() => accuracyImprovement(accuracyTrend), [accuracyTrend]);

  return (
    <div className="screen-root px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {(['week', 'month', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                timeRange === range
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {range === 'week' ? '7D' : range === 'month' ? '30D' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/60">Accuracy</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{accuracy}%</span>
            {improvement !== 0 && (
              <span
                data-testid="accuracy-improvement"
                className={`text-xs flex items-center ${improvement > 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {improvement > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(improvement)}%
              </span>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white/60">Total Practice</span>
          </div>
          <div className="text-2xl font-bold">{userStats.totalQuestionsAnswered}</div>
          <div className="text-xs text-white/60">questions answered</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-white/60">Streak</span>
          </div>
          <div className="text-2xl font-bold">{userStats.currentStreak}</div>
          <div className="text-xs text-white/60">days in a row</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white/60">Best Streak</span>
          </div>
          <div className="text-2xl font-bold">{userStats.longestStreak}</div>
          <div className="text-xs text-white/60">correct in a row</div>
        </Card>
      </div>

      {/* Accuracy Trend */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">Accuracy Trend</h3>
        </div>
        {accuracyTrend.length > 0 ? (
          <>
            <LineChart data={accuracyTrend} color="#8b5cf6" />
            <div className="flex justify-between mt-2 text-xs text-white/40">
              <span>{trendBuckets[0]?.date}</span>
              <span>Today</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-24 text-white/40 text-sm text-center px-4">
            No sessions in this range yet — finish a round and your accuracy
            will show up here.
          </div>
        )}
      </Card>

      {/* Weekly Activity */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">Weekly Activity</h3>
        </div>
        <div className="flex justify-center">
          <WeeklyHeatmap data={weeklyActivity} />
        </div>
      </Card>

      {/* Performance by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Chord Performance */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">Chord Accuracy</h3>
          </div>
          {chordData.length > 0 ? (
            <BarChart data={chordData} maxValue={100} />
          ) : (
            <div className="text-center text-white/40 py-4">No data yet</div>
          )}
        </Card>

        {/* Mode Distribution */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold">Practice Distribution</h3>
          </div>
          {modeData.length > 0 ? (
            <div className="flex items-center justify-center gap-6">
              <DonutChart data={modeData} />
              <div className="space-y-2">
                {modeData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-sm text-white/60">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-white/40 py-4">No data yet</div>
          )}
        </Card>
      </div>

      {/* Insights */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold">Insights</h3>
        </div>
        <div className="space-y-3">
          {accuracy > 80 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="text-lg">🎯</span>
              <div>
                <div className="font-medium text-green-300">Excellent Accuracy!</div>
                <div className="text-sm text-white/60">
                  Your {accuracy}% accuracy is above average. Keep it up!
                </div>
              </div>
            </div>
          )}

          {userStats.currentStreak >= 7 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <span className="text-lg">🔥</span>
              <div>
                <div className="font-medium text-orange-300">On Fire!</div>
                <div className="text-sm text-white/60">
                  You've practiced {userStats.currentStreak} days in a row. Amazing dedication!
                </div>
              </div>
            </div>
          )}

          {chordStats.some(s => s.attempts >= 5 && s.correct / s.attempts < 0.6) && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <span className="text-lg">💡</span>
              <div>
                <div className="font-medium text-yellow-300">Practice Tip</div>
                <div className="text-sm text-white/60">
                  Some chord types need more practice. Try focused drills in Practice Mode!
                </div>
              </div>
            </div>
          )}

          {userStats.totalQuestionsAnswered < 50 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <span className="text-lg">🚀</span>
              <div>
                <div className="font-medium text-purple-300">Getting Started</div>
                <div className="text-sm text-white/60">
                  Complete more practice sessions to unlock detailed insights!
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
