import React, { useState, useMemo } from 'react';
import { Trophy, Medal, Crown, User, Calendar, TrendingUp, ArrowLeft } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { generateLeaderboard, LeaderboardEntry, getUsername, setUsername } from '../utils/social';

type LeaderboardTab = 'daily' | 'weekly' | 'allTime';

interface LeaderboardProps {
  onBack?: () => void;
}

export function Leaderboard({ onBack }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('daily');
  const [username, setUsernameState] = useState(getUsername());
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(username);

  const leaderboard = useMemo(() => generateLeaderboard('daily'), []);

  const currentBoard = leaderboard[activeTab];

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUsername(tempName.trim());
      setUsernameState(tempName.trim());
    }
    setEditingName(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-white/40">{rank}</span>;
    }
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-purple-500/20 border-purple-500/30';
    switch (rank) {
      case 1:
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 2:
        return 'bg-gray-500/10 border-gray-500/20';
      case 3:
        return 'bg-amber-500/10 border-amber-500/20';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h1 className="text-2xl font-bold">Leaderboard</h1>
      </div>

      {/* Username Card */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-purple-400" />
            </div>
            {editingName ? (
              <input
                type="text"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                className="bg-white/10 rounded-lg px-3 py-1 text-white outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
                maxLength={20}
              />
            ) : (
              <div>
                <div className="font-semibold">{username}</div>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Edit name
                </button>
              </div>
            )}
          </div>
          <Badge variant="purple">You</Badge>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {([
          { id: 'daily', label: 'Today', icon: <Calendar className="w-4 h-4" /> },
          { id: 'weekly', label: 'This Week', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'allTime', label: 'All Time', icon: <Trophy className="w-4 h-4" /> },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {tab.icon}
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {currentBoard.map((entry) => (
          <Card
            key={`${entry.rank}-${entry.username}`}
            className={`p-3 border ${getRankBg(entry.rank, entry.isCurrentUser || false)}`}
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="w-8 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium truncate ${entry.isCurrentUser ? 'text-purple-300' : ''}`}>
                    {entry.username}
                  </span>
                  {entry.isCurrentUser && (
                    <Badge variant="purple" size="sm">You</Badge>
                  )}
                </div>
                <div className="text-xs text-white/40">
                  {Math.round(entry.accuracy)}% accuracy
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className={`font-bold ${
                  entry.rank === 1 ? 'text-yellow-400' :
                  entry.rank === 2 ? 'text-gray-300' :
                  entry.rank === 3 ? 'text-amber-500' :
                  'text-white'
                }`}>
                  {entry.score.toLocaleString()}
                </div>
                <div className="text-xs text-white/40">points</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info */}
      <div className="mt-6 text-center text-sm text-white/40">
        <p>Play more to climb the leaderboard!</p>
        <p className="mt-1">Leaderboard resets daily at midnight</p>
      </div>
    </div>
  );
}
