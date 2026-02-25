import React, { useState, useCallback } from 'react';
import { Users, Copy, Check, ChevronLeft, Trophy, Plus, Share2, Swords } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { getSocialChallenges, createSocialChallenge, SocialChallenge } from '../utils/storage';
import { getUsername, setUsername as saveUsername } from '../utils/social';
import { getUserStats } from '../utils/storage';

interface SocialChallengesProps {
  onBack: () => void;
  onStartChallenge: (challenge: SocialChallenge) => void;
}

export function SocialChallenges({ onBack, onStartChallenge }: SocialChallengesProps) {
  const [challenges, setChallenges] = useState<SocialChallenge[]>(getSocialChallenges());
  const [showCreate, setShowCreate] = useState(false);
  const [username, setUsernameState] = useState(getUsername());
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(username);
  const [copied, setCopied] = useState<string | null>(null);
  const [newChallengeMode, setNewChallengeMode] = useState<'chords' | 'scales' | 'intervals'>('chords');
  const [newChallengeCount, setNewChallengeCount] = useState(10);

  const userStats = getUserStats();

  const handleSaveName = useCallback(() => {
    if (nameInput.trim()) {
      saveUsername(nameInput.trim());
      setUsernameState(nameInput.trim());
      setEditingName(false);
    }
  }, [nameInput]);

  const handleCreateChallenge = useCallback(() => {
    const seed = Math.floor(Math.random() * 1000000);
    const challenge = createSocialChallenge({
      creatorName: username,
      mode: newChallengeMode,
      level: 1,
      questionSeed: seed,
      questionCount: newChallengeCount,
      creatorScore: 0,
      creatorAccuracy: 0,
      createdDate: new Date().toISOString().split('T')[0],
    });
    setChallenges(getSocialChallenges());
    setShowCreate(false);
  }, [username, newChallengeMode, newChallengeCount]);

  const handleCopyChallenge = useCallback(async (challenge: SocialChallenge) => {
    const shareText = `Challenge me on KeyPerfect!\nMode: ${challenge.mode}\nQuestions: ${challenge.questionCount}\nCode: ${challenge.id.slice(-8).toUpperCase()}\n#KeyPerfect`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(challenge.id);
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      // Fallback
    }
  }, []);

  const activeChallenges = challenges.filter(c => !c.completed);
  const completedChallenges = challenges.filter(c => c.completed);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Challenges</h1>
          <p className="text-sm text-white/60">Challenge friends and compete</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>
          New
        </Button>
      </div>

      {/* Username */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-400" />
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm w-32"
                  maxLength={20}
                  autoFocus
                />
                <button onClick={handleSaveName} className="p-1 rounded bg-green-500/20 text-green-400">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <span className="font-semibold">{username}</span>
                <button
                  onClick={() => setEditingName(true)}
                  className="ml-2 text-xs text-purple-400 hover:text-purple-300"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
          <Badge variant="purple">Level {userStats.currentLevel}</Badge>
        </div>
      </Card>

      {/* Create Challenge Modal */}
      {showCreate && (
        <Card className="p-6 mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <h3 className="font-bold text-lg mb-4">Create Challenge</h3>

          <div className="mb-4">
            <label className="text-sm text-white/60 mb-2 block">Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['chords', 'scales', 'intervals'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setNewChallengeMode(mode)}
                  className={`p-2 rounded-xl text-sm font-medium transition-all ${
                    newChallengeMode === mode
                      ? 'bg-purple-500/30 border border-purple-500'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm text-white/60 mb-2 block">Questions</label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map(count => (
                <button
                  key={count}
                  onClick={() => setNewChallengeCount(count)}
                  className={`p-2 rounded-xl text-sm font-medium transition-all ${
                    newChallengeCount === count
                      ? 'bg-purple-500/30 border border-purple-500'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" fullWidth onClick={handleCreateChallenge} icon={<Swords className="w-4 h-4" />}>
              Create
            </Button>
          </div>
        </Card>
      )}

      {/* Active Challenges */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Active Challenges</h2>
        {activeChallenges.length === 0 ? (
          <Card className="p-6 text-center">
            <Swords className="w-10 h-10 mx-auto text-white/30 mb-3" />
            <p className="text-sm text-white/60">No active challenges. Create one to share with friends!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeChallenges.map(challenge => (
              <Card key={challenge.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold capitalize">{challenge.mode}</h4>
                    <p className="text-xs text-white/60">
                      {challenge.questionCount} questions | Created by {challenge.creatorName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyChallenge(challenge)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                      title="Share challenge"
                    >
                      {copied === challenge.id ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                    </button>
                    <Button variant="primary" size="sm" onClick={() => onStartChallenge(challenge)}>
                      Play
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-white/40 font-mono">
                  Code: {challenge.id.slice(-8).toUpperCase()}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Completed</h2>
          <div className="space-y-3">
            {completedChallenges.map(challenge => (
              <Card key={challenge.id} className="p-4 opacity-75">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold capitalize">{challenge.mode}</h4>
                    <p className="text-xs text-white/60">{challenge.createdDate}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="font-bold">{challenge.playerScore}</span>
                    </div>
                    <p className="text-xs text-white/60">{Math.round(challenge.playerAccuracy || 0)}% accuracy</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
