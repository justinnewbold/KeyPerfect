import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Play,
  Zap,
  Calendar,
  Heart,
  Timer,
  ChevronRight,
  Key,
  Music,
  ChevronDown,
  BookOpen,
  ArrowLeftRight,
  Target,
  Star,
  Users,
  Shield,
  Mic,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Progress, CircularProgress } from './ui/Progress';
import { Badge, LevelBadge, XPBadge, StreakBadge } from './ui/Badge';
import { getUserStats, getDailyStats, getUnlockedAchievements, PRACTICE_PRESETS, PracticePresetId, updateSettings, getSettings, trackInstrumentUsage, getWeeklyGoals, getStreakFreezeData, getMusicKeysProgress, getNotesProgress } from '../utils/storage';
import { MUSIC_KEYS_LEVELS } from '../types/musicKeysLevels';
import { NOTES_LEVELS } from '../types/notesLevels';
import { getLevelFromXP, getXPProgress, ACHIEVEMENTS } from '../types/stats';
import { LEVELS, getUnlockedLevels } from '../types/levels';
import { GAME_MODES, CHALLENGE_MODES, GameModeType, ChallengeModeType } from '../types/gameModes';
import { InstrumentType, INSTRUMENTS, getInstrumentList } from '../types/instruments';
import { useAudio } from '../hooks/useAudio';

interface HomeScreenProps {
  onStartLevel: () => void;
  onStartChallenge: (mode: ChallengeModeType) => void;
  onStartGameMode: (mode: GameModeType) => void;
  onStartPreset?: (presetId: PracticePresetId) => void;
  onStartMusicKeys?: () => void;
  onStartNotes?: () => void;
  onOpenGuidedLessons?: () => void;
  onOpenComparison?: () => void;
  onOpenWeeklyGoals?: () => void;
  onOpenMastery?: () => void;
  onOpenSocialChallenges?: () => void;
  onOpenIntervalSinging?: () => void;
  onOpenProgressionDictation?: () => void;
  onOpenFocusAreas?: () => void;
}

export function HomeScreen({ onStartLevel, onStartChallenge, onStartGameMode, onStartPreset, onStartMusicKeys, onStartNotes, onOpenGuidedLessons, onOpenComparison, onOpenWeeklyGoals, onOpenMastery, onOpenSocialChallenges, onOpenIntervalSinging, onOpenProgressionDictation, onOpenFocusAreas }: HomeScreenProps) {
  const userStats = getUserStats();
  const dailyStats = getDailyStats();
  const unlockedAchievements = getUnlockedAchievements();
  const xpProgress = getXPProgress(userStats.totalXP);
  const userLevel = getLevelFromXP(userStats.totalXP);
  const audio = useAudio();

  const [currentInstrument, setCurrentInstrument] = useState<InstrumentType>(getSettings().instrument);
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false);
  const instruments = getInstrumentList();
  const instrumentDropdownRef = useRef<HTMLDivElement>(null);

  // Close instrument dropdown when clicking outside
  useEffect(() => {
    if (!showInstrumentDropdown) return;
    const handler = (e: MouseEvent) => {
      if (instrumentDropdownRef.current && !instrumentDropdownRef.current.contains(e.target as Node)) {
        setShowInstrumentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showInstrumentDropdown]);

  const handleInstrumentChange = useCallback((instrument: InstrumentType) => {
    setCurrentInstrument(instrument);
    updateSettings({ instrument });
    trackInstrumentUsage(instrument);
    audio.setInstrument(instrument);
    audio.playChord([60, 64, 67]);
    setShowInstrumentDropdown(false);
  }, [audio]);

  const today = new Date().toISOString().split('T')[0];
  const canPlayDaily = dailyStats.lastPlayedDate !== today || !dailyStats.completed;

  const accuracy = userStats.totalQuestionsAnswered > 0
    ? Math.round((userStats.totalCorrect / userStats.totalQuestionsAnswered) * 100)
    : 0;

  const musicKeysProgress = getMusicKeysProgress();
  const notesProgress = getNotesProgress();
  const musicKeysCompleted = musicKeysProgress.filter(p => p.timesCompleted > 0).length;
  const notesCompleted = notesProgress.filter(p => p.timesCompleted > 0).length;

  const chordLevelsUnlocked = getUnlockedLevels(userStats.totalXP).length;
  const streakFreezeData = getStreakFreezeData();

  const weeklyGoalsData = getWeeklyGoals();
  const goalsCompleted = weeklyGoalsData.goals.filter(g => g.completed).length;
  const goalsTotal = weeklyGoalsData.goals.length;

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
            {streakFreezeData.freezesAvailable > 0 && (
              <Badge variant="info" size="sm" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Freeze
              </Badge>
            )}
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
        {/* Instrument Selector */}
        <div className="relative" ref={instrumentDropdownRef}>
          <button
            onClick={() => setShowInstrumentDropdown(!showInstrumentDropdown)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{INSTRUMENTS[currentInstrument].icon}</span>
              <div className="text-left">
                <div className="text-sm font-medium">{INSTRUMENTS[currentInstrument].name}</div>
                <div className="text-xs text-white/60">Tap to change instrument</div>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${showInstrumentDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showInstrumentDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/20 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
              {instruments.map(inst => (
                <button
                  key={inst.id}
                  onClick={() => handleInstrumentChange(inst.id)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-white/10 transition-colors ${
                    currentInstrument === inst.id ? 'bg-purple-500/20' : ''
                  }`}
                >
                  <span className="text-xl">{inst.icon}</span>
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium">{inst.name}</div>
                    <div className="text-xs text-white/60">{inst.description}</div>
                  </div>
                  {currentInstrument === inst.id && (
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

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

        {/* Weekly Goals strip — only shown when goals are configured */}
        {goalsTotal > 0 && (
          <button
            onClick={onOpenWeeklyGoals}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Target className="w-4 h-4 text-green-400" />
              <span>Weekly Goals</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={goalsCompleted} max={goalsTotal} size="sm" color="green" />
              <span className="text-xs text-white/50 w-10 text-right">{goalsCompleted}/{goalsTotal}</span>
            </div>
          </button>
        )}

        {/* Main Play Buttons - Two Card Layout */}
        <div className="grid grid-cols-1 gap-3">
          {/* Chord Training */}
          <Card
            hover
            onClick={onStartLevel}
            className="p-5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Play className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Chord Training</h3>
                <p className="text-sm text-white/60">Master chord recognition</p>
                {chordLevelsUnlocked > 1 && (
                  <div className="mt-2">
                    <Progress value={chordLevelsUnlocked} max={LEVELS.length} size="sm" color="purple" />
                    <p className="text-xs text-white/50 mt-1">{chordLevelsUnlocked}/{LEVELS.length} levels unlocked</p>
                  </div>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-white/40" />
            </div>
          </Card>

          {/* Music Keys - NEW PROMINENT SECTION */}
          <Card
            hover
            onClick={onStartMusicKeys}
            className="p-5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Key className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Music Keys</h3>
                <p className="text-sm text-white/60">Identify keys by ear (E, A, G, D, B, F...)</p>
                {musicKeysCompleted > 0 && (
                  <div className="mt-2">
                    <Progress value={musicKeysCompleted} max={MUSIC_KEYS_LEVELS.length} size="sm" color="green" />
                    <p className="text-xs text-white/50 mt-1">{musicKeysCompleted}/{MUSIC_KEYS_LEVELS.length} levels</p>
                  </div>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-white/40" />
            </div>
          </Card>

          {/* Notes - INDIVIDUAL NOTE IDENTIFICATION */}
          <Card
            hover
            onClick={onStartNotes}
            className="p-5 bg-gradient-to-r from-sky-500/20 to-blue-500/20 border-sky-500/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Music className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Notes</h3>
                <p className="text-sm text-white/60">Identify individual notes (C, D, E, F#...)</p>
                {notesCompleted > 0 && (
                  <div className="mt-2">
                    <Progress value={notesCompleted} max={NOTES_LEVELS.length} size="sm" color="purple" />
                    <p className="text-xs text-white/50 mt-1">{notesCompleted}/{NOTES_LEVELS.length} levels</p>
                  </div>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-white/40" />
            </div>
          </Card>
        </div>

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

        {/* New Features: Learning & Tools */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Learn & Improve</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Guided Lessons */}
            <Card
              hover
              onClick={onOpenGuidedLessons}
              className="p-4 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm">Guided Lessons</h4>
              </div>
              <p className="text-xs text-white/60">Learn what to listen for</p>
            </Card>

            {/* Comparison Mode */}
            <Card
              hover
              onClick={onOpenComparison}
              className="p-4 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border-teal-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm">Compare Sounds</h4>
              </div>
              <p className="text-xs text-white/60">Side-by-side listening</p>
            </Card>

            {/* Mastery Indicators */}
            <Card
              hover
              onClick={onOpenMastery}
              className="p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                  <Star className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm">Mastery</h4>
              </div>
              <p className="text-xs text-white/60">Per-topic progress</p>
            </Card>

            {/* Weekly Goals */}
            <Card
              hover
              onClick={onOpenWeeklyGoals}
              className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm">Weekly Goals</h4>
              </div>
              <p className="text-xs text-white/60">Set practice targets</p>
            </Card>

            {/* Social Challenges */}
            <Card
              hover
              onClick={onOpenSocialChallenges}
              className="p-4 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Challenges</h4>
                  <Badge variant="info" size="sm">Local only</Badge>
                </div>
              </div>
              <p className="text-xs text-white/60">Share codes, play same seed</p>
            </Card>

            {/* Practice Mode (No Stakes) */}
            <Card
              hover
              onClick={() => onStartGameMode('practice')}
              className="p-4 bg-gradient-to-br from-gray-500/10 to-slate-500/10 border-gray-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm">Practice Mode</h4>
              </div>
              <p className="text-xs text-white/60">No XP, no pressure</p>
            </Card>

            {/* Interval Singing */}
            <Card
              hover
              onClick={onOpenIntervalSinging}
              className="p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm">Sing Intervals</h4>
              </div>
              <p className="text-xs text-white/60">Match pitches with your voice</p>
            </Card>

            {/* Chord Progression Dictation */}
            <Card
              hover
              onClick={onOpenProgressionDictation}
              className="p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm">Progressions</h4>
              </div>
              <p className="text-xs text-white/60">Identify chord progressions</p>
            </Card>

            {/* Focus Areas / Review Weak Spots */}
            <Card
              hover
              onClick={onOpenFocusAreas}
              className="p-4 bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm">Focus Areas</h4>
              </div>
              <p className="text-xs text-white/60">Drill your weak spots</p>
            </Card>
          </div>
        </div>

        {/* Training Modes */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Training Modes</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(GAME_MODES).filter(mode =>
              !['practice', 'comparison', 'musickeys', 'notes'].includes(mode.id)
            ).map(mode => (
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
