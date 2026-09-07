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
  RefreshCw,
  Piano,
  Settings,
} from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Progress, CircularProgress } from './ui/Progress';
import { Badge, LevelBadge, XPBadge, StreakBadge } from './ui/Badge';
import { getUserStats, getDailyStats, getUnlockedAchievements, PRACTICE_PRESETS, PracticePresetId, updateSettings, getSettings, trackInstrumentUsage, getWeeklyGoals, getStreakFreezeData, getMusicKeysProgress, getNotesProgress, localDateKey } from '../utils/storage';
import { MUSIC_KEYS_LEVELS } from '../types/musicKeysLevels';
import { NOTES_LEVELS } from '../types/notesLevels';
import { getLevelFromXP, getXPProgress, ACHIEVEMENTS } from '../types/stats';
import { LEVELS, LevelConfig, getUnlockedLevels } from '../types/levels';
import { GAME_MODES, CHALLENGE_MODES, GameModeType, ChallengeModeType } from '../types/gameModes';
import { InstrumentType, INSTRUMENTS, getInstrumentList } from '../types/instruments';
import { useAudio } from '../hooks/useAudio';
import { playChord as playChordRaw } from '../utils/audioEngine';
import { ModeQueryProvider, ModeSection, ModeTile, matchesQuery } from './ModeCatalog';

interface HomeScreenProps {
  /** Opens the level ladder. */
  onStartLevel: () => void;
  /** Starts a level directly, for Home's single primary call to action. */
  onStartRecommendedLevel?: (level: LevelConfig) => void;
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
  onOpenCircleOfFifths?: () => void;
  onOpenFreePlay?: () => void;
  onOpenSettings?: () => void;
}

export function HomeScreen({ onStartLevel, onStartRecommendedLevel, onStartChallenge, onStartGameMode, onStartPreset, onStartMusicKeys, onStartNotes, onOpenGuidedLessons, onOpenComparison, onOpenWeeklyGoals, onOpenMastery, onOpenSocialChallenges, onOpenIntervalSinging, onOpenProgressionDictation, onOpenFocusAreas, onOpenCircleOfFifths, onOpenFreePlay, onOpenSettings }: HomeScreenProps) {
  const userStats = getUserStats();
  const dailyStats = getDailyStats();
  const unlockedAchievements = getUnlockedAchievements();
  const xpProgress = getXPProgress(userStats.totalXP);
  const userLevel = getLevelFromXP(userStats.totalXP);
  const audio = useAudio();

  const [currentInstrument, setCurrentInstrument] = useState<InstrumentType>(getSettings().instrument);
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false);
  const [showAllModes, setShowAllModes] = useState(() => getSettings().homeModesExpanded === true);
  const [modeQuery, setModeQuery] = useState('');

  /*
   * Every keyword string the catalogue can match, so "no results" is only ever
   * shown when nothing at all matched — including the two data-driven grids.
   */
  const catalogKeywords = [
    'chord training chords recognition ladder levels ear training beginner medium',
    'music keys key identification ear training e a g d b f intermediate',
    'notes note identification single notes pitch c d e f sharp beginner',
    'daily challenge new every day short quick mixed',
    'speed run speedrun 60 seconds fast timed one minute hard',
    'survival 3 lives endless streak hard long',
    'time attack timed beat the clock fast',
    'guided lessons learn theory tutorial what to listen for beginner',
    'compare sounds comparison side by side listening ear training beginner',
    'mastery per topic progress stats review',
    'weekly goals practice targets streak habit',
    'challenges social friends share code seed compete',
    'practice mode no xp no pressure relaxed untimed beginner',
    'sing intervals singing voice pitch match microphone intervals',
    'progression dictation play back chord progressions harmony hard',
    'free play explore chords piano keyboard sandbox untimed',
    'circle of fifths key signatures wheel theory game relative minor',
    'settings sound instrument midi data preferences accessibility',
    'focus areas weak spots drill review mistakes spaced repetition',
    ...Object.values(PRACTICE_PRESETS).map(
      p => `${p.name} ${p.description} ${p.questionCount} questions ${p.timeLimit ? 'timed time limit' : 'untimed'} quick start preset`,
    ),
    ...Object.values(GAME_MODES).map(m => `${m.name} ${m.description} ${m.id} training mode`),
  ];
  const hasModeMatches = catalogKeywords.some(k => matchesQuery(k, modeQuery));
  const instruments = getInstrumentList();
  const instrumentDropdownRef = useRef<HTMLDivElement>(null);

  // Close instrument dropdown when tapping/clicking outside. `pointerdown`
  // covers mouse, touch and pen in one listener; `mousedown` alone relied on
  // the synthesised mouse event that touch only emits in some situations.
  useEffect(() => {
    if (!showInstrumentDropdown) return;
    const handler = (e: PointerEvent) => {
      if (instrumentDropdownRef.current && !instrumentDropdownRef.current.contains(e.target as Node)) {
        setShowInstrumentDropdown(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [showInstrumentDropdown]);

  const handleInstrumentChange = useCallback((instrument: InstrumentType) => {
    setCurrentInstrument(instrument);
    updateSettings({ instrument });
    trackInstrumentUsage(instrument);
    audio.setInstrument(instrument);
    // audio.playChord reads useAudio's instrument state from closure, which is
    // still the old value at this synchronous moment — pick Flute and the
    // preview played piano. SettingsScreen already works around this the same
    // way; HomeScreen was missed.
    playChordRaw([60, 64, 67], instrument, 1.5);
    setShowInstrumentDropdown(false);
  }, [audio]);

  // lastPlayedDate is a local calendar day; comparing it against a UTC one
  // made the Daily Challenge re-offer itself in the afternoon west of UTC.
  const today = localDateKey();
  const canPlayDaily = dailyStats.lastPlayedDate !== today || !dailyStats.completed;

  const accuracy = userStats.totalQuestionsAnswered > 0
    ? Math.round((userStats.totalCorrect / userStats.totalQuestionsAnswered) * 100)
    : 0;

  const musicKeysProgress = getMusicKeysProgress();
  const notesProgress = getNotesProgress();
  const musicKeysCompleted = musicKeysProgress.filter(p => p.timesCompleted > 0).length;
  const notesCompleted = notesProgress.filter(p => p.timesCompleted > 0).length;

  const unlockedChordLevels = getUnlockedLevels(userStats.totalXP);
  const chordLevelsUnlocked = unlockedChordLevels.length;
  /** What the primary CTA starts: the furthest chord level they've unlocked. */
  const recommendedLevel = unlockedChordLevels[unlockedChordLevels.length - 1] || LEVELS[0];
  const hasPlayedBefore = userStats.totalQuestionsAnswered > 0;
  const streakFreezeData = getStreakFreezeData();

  const weeklyGoalsData = getWeeklyGoals();
  const goalsCompleted = weeklyGoalsData.goals.filter(g => g.completed).length;
  const goalsTotal = weeklyGoalsData.goals.length;

  return (
    <div className="screen-root">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0f0c29] via-[#0f0c29] to-transparent pb-4 px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold gradient-text">KeyPerfect</h1>
            <p className="text-sm text-white/60">Master your musical ear</p>
          </div>
          <div className="flex items-center gap-2">
            {/* A freeze protects a streak, so it only means anything once
                there is one. On a first run it was an unexplained pill on a
                zero-day streak — a bit of vocabulary the player had no way to
                decode and no reason to care about yet. */}
            {dailyStats.currentStreak > 0 && streakFreezeData.freezesAvailable > 0 && (
              <Badge
                variant="info"
                size="sm"
                className="flex items-center gap-1"
                title="Streak freeze ready: miss one day this week and your streak survives"
              >
                <Shield className="w-3 h-3" />
                Freeze ready
              </Badge>
            )}
            {dailyStats.currentStreak > 0 && (
              <StreakBadge streak={dailyStats.currentStreak} />
            )}
            {/* The bottom nav has five tabs and no room for a sixth at 320px,
                so Settings hangs off the Home header instead. Without this it
                was unreachable: nothing in the app navigated to it. */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                aria-label="Settings"
                className="tap-target p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
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

        {/*
          One obvious first tap.

          Home used to open on roughly thirty-nine tiles across four sections,
          several of them near-synonyms ("Chord Training" beside "Chord
          Recognition", two things called Progressions), which left a new
          player to guess which one the app wanted them to press. Everything
          is still here — it is now one session away behind "All modes"
          instead of competing with the thing they should press first.
        */}
        <Card
          hover
          onClick={() =>
            onStartRecommendedLevel
              ? onStartRecommendedLevel(recommendedLevel)
              : onStartLevel()
          }
          className="p-5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Play className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">
                {hasPlayedBefore ? 'Continue training' : 'Start training'}
              </h3>
              <p className="text-sm text-white/60">
                Level {recommendedLevel.id}: {recommendedLevel.name}
              </p>
              {/* Stated up front, because the first place it appeared before
                  was the "1/20" progress bar after the round had begun. */}
              <p className="text-xs text-white/50 mt-1">
                {recommendedLevel.questionsToComplete} questions · about{' '}
                {Math.max(1, Math.round(recommendedLevel.questionsToComplete / 4))} min
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </div>
        </Card>

        <button
          onClick={() => {
            const next = !showAllModes;
            setShowAllModes(next);
            // Remembered, so someone who lives in the full list isn't made to
            // reopen it every time they come back to Home.
            updateSettings({ homeModesExpanded: next });
          }}
          aria-expanded={showAllModes}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <span className="text-sm font-medium">All modes</span>
          <div className="flex items-center gap-2 text-white/50">
            <span className="text-xs">{showAllModes ? 'Hide' : 'Browse everything else'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAllModes ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {showAllModes && (
        <ModeQueryProvider query={modeQuery}>
        <div className="space-y-6">
          {/*
            Grouping alone stops helping once a player knows the name of what
            they want: the catalogue runs to about thirty tiles under five
            headings, so it is searchable by name, skill, difficulty and
            length as well as browsable.
          */}
          <div>
            <label htmlFor="mode-search" className="sr-only">
              Search training modes
            </label>
            <input
              id="mode-search"
              type="search"
              value={modeQuery}
              onChange={e => setModeQuery(e.target.value)}
              placeholder="Search modes — try “intervals”, “timed”, “beginner”"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-white/40 focus:outline-none focus:border-purple-500"
            />
          </div>

          {modeQuery.trim() !== '' && !hasModeMatches && (
            <div role="status" className="text-center py-8 text-white/60 text-sm space-y-3">
              <p>No modes match “{modeQuery.trim()}”.</p>
              <Button size="sm" variant="secondary" onClick={() => setModeQuery('')}>
                Clear search
              </Button>
            </div>
          )}

        <ModeSection className="grid grid-cols-1 gap-3">
          {/* Chord Training */}
          <ModeTile keywords="chord training chords recognition ladder levels ear training beginner medium">
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
          </ModeTile>

          {/* Music Keys - NEW PROMINENT SECTION */}
          <ModeTile keywords="music keys key identification ear training e a g d b f intermediate">
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
          </ModeTile>

          {/* Notes - INDIVIDUAL NOTE IDENTIFICATION */}
          <ModeTile keywords="notes note identification single notes pitch c d e f sharp beginner">
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
          </ModeTile>
        </ModeSection>

        {/* Practice Presets */}
        <ModeSection title="Quick Start" className="grid grid-cols-2 gap-3">
            {Object.values(PRACTICE_PRESETS).map(preset => (
              <ModeTile
                key={preset.id}
                keywords={`${preset.name} ${preset.description} ${preset.questionCount} questions ${preset.timeLimit ? 'timed time limit' : 'untimed'} quick start preset`}
              >
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
                <div className="flex items-center gap-2 mt-2">
                  {/* How long this is, before committing to it. */}
                  <Badge variant="default" size="sm">
                    {preset.questionCount} questions
                  </Badge>
                  {preset.timeLimit && (
                    <Badge variant="info" size="sm">
                      {Math.floor(preset.timeLimit / 60)}m limit
                    </Badge>
                  )}
                </div>
              </Card>
              </ModeTile>
            ))}
        </ModeSection>

        {/* Challenge Modes */}
        <ModeSection title="Challenge Modes" className="grid grid-cols-2 gap-3">
            {/* Daily Challenge */}
            <ModeTile keywords="daily challenge new every day short quick mixed">
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
            </ModeTile>

            {/* Speed Run */}
            <ModeTile keywords="speed run speedrun 60 seconds fast timed one minute hard">
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
            </ModeTile>

            {/* Survival */}
            <ModeTile keywords="survival 3 lives endless streak hard long">
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
            </ModeTile>

            {/* Time Attack */}
            <ModeTile keywords="time attack timed beat the clock fast">
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
            </ModeTile>
        </ModeSection>

        {/* New Features: Learning & Tools */}
        <ModeSection title="Learn & Improve" className="grid grid-cols-2 gap-3">
            {/* Guided Lessons */}
            <ModeTile keywords="guided lessons learn theory tutorial what to listen for beginner">
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
            </ModeTile>

            {/* Comparison Mode */}
            <ModeTile keywords="compare sounds comparison side by side listening ear training beginner">
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
            </ModeTile>

            {/* Mastery Indicators */}
            <ModeTile keywords="mastery per topic progress stats review">
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
            </ModeTile>

            {/* Weekly Goals */}
            <ModeTile keywords="weekly goals practice targets streak habit">
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
            </ModeTile>

            {/* Social Challenges */}
            <ModeTile keywords="challenges social friends share code seed compete">
              <Card
                hover
                onClick={onOpenSocialChallenges}
                className="p-4 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-sm">Challenges</h4>
                </div>
                {/* "Local only" sat directly above "Share codes, play same
                    seed", which reads as a contradiction. Nothing is sent
                    anywhere: a challenge code is a seed you pass to someone
                    yourself, and both devices generate the same questions from
                    it. Say that once, plainly. */}
                <p className="text-xs text-white/60">
                  Pass a code to a friend, play the same questions
                </p>
              </Card>
            </ModeTile>

            {/* Practice Mode (No Stakes) */}
            <ModeTile keywords="practice mode no xp no pressure relaxed untimed beginner">
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
            </ModeTile>

            {/* Interval Singing */}
            <ModeTile keywords="sing intervals singing voice pitch match microphone intervals">
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
            </ModeTile>

            {/* Chord Progression Dictation */}
            <ModeTile keywords="progression dictation play back chord progressions harmony hard">
              <Card
                hover
                onClick={onOpenProgressionDictation}
                className="p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  {/* Named for what it is, so it isn't a second tile called
                      "Progressions" beside the Chord Progressions quiz in
                      Training Modes. This one is dictation: you play the
                      progression back rather than pick it from a list. */}
                  <h4 className="font-semibold text-sm">Progression Dictation</h4>
                </div>
                <p className="text-xs text-white/60">Play back what you hear</p>
              </Card>
            </ModeTile>

            {/* Free Play piano */}
            <ModeTile keywords="free play explore chords piano keyboard sandbox untimed">
              <Card
                hover
                onClick={onOpenFreePlay}
                className="p-4 bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-sky-500/20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                    <Piano className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-sm">Free Play</h4>
                </div>
                <p className="text-xs text-white/60">Explore chords on the piano</p>
              </Card>
            </ModeTile>

            {/* Circle of Fifths */}
            <ModeTile keywords="circle of fifths key signatures wheel theory game relative minor">
              <Card
                hover
                onClick={onOpenCircleOfFifths}
                className="p-4 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border-cyan-500/20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-sm">Circle of 5ths</h4>
                </div>
                <p className="text-xs text-white/60">Interactive wheel game</p>
              </Card>
            </ModeTile>

            {/* Settings. The bottom nav has no sixth slot, so Settings has
                only ever hung off a gear in the header — easy to miss when
                you are looking for it in a list of things you can do. */}
            {onOpenSettings && (
              <ModeTile keywords="settings sound instrument midi data preferences accessibility">
                <Card
                  hover
                  onClick={onOpenSettings}
                  className="p-4 bg-gradient-to-br from-slate-500/10 to-gray-500/10 border-slate-500/20"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-sm">Settings</h4>
                  </div>
                  <p className="text-xs text-white/60">Sound, instrument, MIDI, data</p>
                </Card>
              </ModeTile>
            )}

            {/* Focus Areas / Review Weak Spots */}
            <ModeTile keywords="focus areas weak spots drill review mistakes spaced repetition">
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
            </ModeTile>
        </ModeSection>

        {/* Training Modes */}
        <ModeSection title="Training Modes" className="grid grid-cols-2 gap-3">
            {Object.values(GAME_MODES).filter(mode =>
              // 'practice', 'comparison', 'musickeys' and 'notes' are surfaced
              // through other entry points on this screen. 'reverse' and
              // 'melodic' route to their own dedicated screens; see
              // App.tsx handleStartGameMode.
              //
              // 'chords' is excluded for the same reason: it is the same
              // chord-identification quiz the Chord Training ladder runs, and
              // having both meant Home offered "Chord Training" and "Chord
              // Recognition" as if they were different things.
              !['practice', 'comparison', 'musickeys', 'notes', 'chords'].includes(mode.id)
            ).map(mode => (
              <ModeTile key={mode.id} keywords={`${mode.name} ${mode.description} ${mode.id} training mode`}>
              <Card
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
              </ModeTile>
            ))}
        </ModeSection>

        </div>
        </ModeQueryProvider>
        )}

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

        {/* Recent Achievements */}
        {unlockedAchievements.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Recent Achievements</h2>
            <div className="flex gap-3 overflow-x-auto snap-strip pb-2 -mx-4 px-4">
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
