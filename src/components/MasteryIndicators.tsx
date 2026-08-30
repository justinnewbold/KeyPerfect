import React, { useState } from 'react';
import { ChevronLeft, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { getChordStats, getScaleStats, getIntervalStats, getKeyStats, getNoteStats } from '../utils/storage';
import { CHORD_TYPES, SCALE_TYPES, INTERVALS, ChordQuality, ScaleType, IntervalType } from '../types/music';

interface MasteryIndicatorsProps {
  onBack: () => void;
}

type Category = 'chords' | 'scales' | 'intervals' | 'keys' | 'notes';

interface MasteryEntry {
  name: string;
  displayName: string;
  attempts: number;
  correct: number;
  accuracy: number;
  mastery: number; // 0-100 considering both accuracy and volume
  status: 'mastered' | 'learning' | 'struggling' | 'new';
}

function calculateMastery(attempts: number, correct: number): { mastery: number; status: MasteryEntry['status'] } {
  if (attempts === 0) return { mastery: 0, status: 'new' };
  const accuracy = correct / attempts;
  const confidence = Math.min(1, attempts / 20);
  const mastery = Math.round(accuracy * confidence * 100);

  if (mastery >= 80 && attempts >= 10) return { mastery, status: 'mastered' };
  if (accuracy >= 0.5) return { mastery, status: 'learning' };
  return { mastery, status: 'struggling' };
}

export function MasteryIndicators({ onBack }: MasteryIndicatorsProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('chords');

  const chordStats = getChordStats();
  const scaleStats = getScaleStats();
  const intervalStats = getIntervalStats();
  const keyStats = getKeyStats();
  const noteStats = getNoteStats();

  const getEntries = (): MasteryEntry[] => {
    switch (activeCategory) {
      case 'chords': {
        const allChords = Object.keys(CHORD_TYPES) as ChordQuality[];
        return allChords.map(chord => {
          const stat = chordStats.find(s => s.chordType === chord);
          const attempts = stat?.attempts || 0;
          const correct = stat?.correct || 0;
          const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
          const { mastery, status } = calculateMastery(attempts, correct);
          return {
            name: chord,
            displayName: CHORD_TYPES[chord].name,
            attempts,
            correct,
            accuracy,
            mastery,
            status,
          };
        });
      }
      case 'scales': {
        const allScales = Object.keys(SCALE_TYPES) as ScaleType[];
        return allScales.map(scale => {
          const stat = scaleStats.find(s => s.scaleType === scale);
          const attempts = stat?.attempts || 0;
          const correct = stat?.correct || 0;
          const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
          const { mastery, status } = calculateMastery(attempts, correct);
          return {
            name: scale,
            displayName: SCALE_TYPES[scale].name,
            attempts,
            correct,
            accuracy,
            mastery,
            status,
          };
        });
      }
      case 'intervals': {
        const allIntervals = Object.keys(INTERVALS) as IntervalType[];
        return allIntervals.map(interval => {
          const stat = intervalStats.find(s => s.intervalType === interval);
          const attempts = stat?.attempts || 0;
          const correct = stat?.correct || 0;
          const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
          const { mastery, status } = calculateMastery(attempts, correct);
          return {
            name: interval,
            displayName: INTERVALS[interval].name,
            attempts,
            correct,
            accuracy,
            mastery,
            status,
          };
        });
      }
      case 'keys':
        return keyStats.map(stat => {
          const accuracy = stat.attempts > 0 ? Math.round((stat.correct / stat.attempts) * 100) : 0;
          const { mastery, status } = calculateMastery(stat.attempts, stat.correct);
          return {
            name: stat.keyType,
            displayName: stat.keyType,
            attempts: stat.attempts,
            correct: stat.correct,
            accuracy,
            mastery,
            status,
          };
        });
      case 'notes':
        return noteStats.map(stat => {
          const accuracy = stat.attempts > 0 ? Math.round((stat.correct / stat.attempts) * 100) : 0;
          const { mastery, status } = calculateMastery(stat.attempts, stat.correct);
          return {
            name: stat.noteType,
            displayName: stat.noteType,
            attempts: stat.attempts,
            correct: stat.correct,
            accuracy,
            mastery,
            status,
          };
        });
    }
  };

  const entries = getEntries().sort((a, b) => {
    // Sort: struggling first, then learning, then new, then mastered
    const statusOrder = { struggling: 0, learning: 1, new: 2, mastered: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const masteredCount = entries.filter(e => e.status === 'mastered').length;
  const learningCount = entries.filter(e => e.status === 'learning').length;
  const strugglingCount = entries.filter(e => e.status === 'struggling').length;
  const newCount = entries.filter(e => e.status === 'new').length;

  const getStatusColor = (status: MasteryEntry['status']) => {
    switch (status) {
      case 'mastered': return 'text-green-400';
      case 'learning': return 'text-blue-400';
      case 'struggling': return 'text-red-400';
      case 'new': return 'text-white/40';
    }
  };

  const getStatusBadge = (status: MasteryEntry['status']) => {
    switch (status) {
      case 'mastered': return 'success';
      case 'learning': return 'info';
      case 'struggling': return 'danger';
      case 'new': return 'default';
    }
  };

  const categories: { id: Category; label: string; icon: string }[] = [
    { id: 'chords', label: 'Chords', icon: '🎹' },
    { id: 'scales', label: 'Scales', icon: '🎼' },
    { id: 'intervals', label: 'Intervals', icon: '📏' },
    { id: 'keys', label: 'Keys', icon: '🔑' },
    { id: 'notes', label: 'Notes', icon: '🎵' },
  ];

  return (
    <div className="screen-root px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Mastery</h1>
          <p className="text-sm text-white/60">Track your progress per topic</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <Card className="p-2 text-center">
          <div className="text-lg font-bold text-green-400">{masteredCount}</div>
          <div className="text-xs text-white/60">Mastered</div>
        </Card>
        <Card className="p-2 text-center">
          <div className="text-lg font-bold text-blue-400">{learningCount}</div>
          <div className="text-xs text-white/60">Learning</div>
        </Card>
        <Card className="p-2 text-center">
          <div className="text-lg font-bold text-red-400">{strugglingCount}</div>
          <div className="text-xs text-white/60">Struggling</div>
        </Card>
        <Card className="p-2 text-center">
          <div className="text-lg font-bold text-white/40">{newCount}</div>
          <div className="text-xs text-white/60">New</div>
        </Card>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            <span>{cat.icon}</span>
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Mastery List */}
      <div className="space-y-2">
        {entries.map(entry => (
          <Card key={entry.name} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {entry.status === 'mastered' && <Star className="w-4 h-4 text-green-400" />}
                {entry.status === 'struggling' && <AlertCircle className="w-4 h-4 text-red-400" />}
                {entry.status === 'learning' && <TrendingUp className="w-4 h-4 text-blue-400" />}
                <span className="font-medium text-sm">{entry.displayName}</span>
              </div>
              <div className="flex items-center gap-2">
                {entry.attempts > 0 && (
                  <span className="text-xs text-white/60">{entry.accuracy}% ({entry.attempts})</span>
                )}
                <Badge variant={getStatusBadge(entry.status) as any} size="sm">
                  {entry.status === 'new' ? 'New' : `${entry.mastery}%`}
                </Badge>
              </div>
            </div>
            <Progress
              value={entry.mastery}
              max={100}
              size="sm"
              color={entry.status === 'mastered' ? 'green' : entry.status === 'struggling' ? 'red' : entry.status === 'learning' ? 'blue' : 'amber'}
            />
          </Card>
        ))}
        {entries.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-white/60">No data yet. Start practicing to see your mastery progress!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
