import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import {
  Navigation,
  NAV_HEIGHT_PX,
  HomeScreen,
  LevelSelect,
  MusicKeysLevelSelect,
  NotesLevelSelect,
  Confetti,
} from './components';
import type { Screen } from './components';

/*
 * Every screen past Home is its own chunk. The app used to ship as one 600 KB
 * bundle, all of which had to download, parse and compile before the first
 * tap did anything; Home and the level pickers are what a launch actually
 * needs. The loaders are kept in one list so they can be warmed in idle time
 * below, which keeps the service worker's offline cache complete and makes a
 * later tap on a mode feel instant.
 */
const lazyLoaders = {
  GameScreen: () => import('./components/GameScreen'),
  ResultScreen: () => import('./components/ResultScreen'),
  StatsScreen: () => import('./components/StatsScreen'),
  GuitarTools: () => import('./components/GuitarTools'),
  LearnScreen: () => import('./components/LearnScreen'),
  SettingsScreen: () => import('./components/SettingsScreen'),
  TutorialScreen: () => import('./components/TutorialScreen'),
  GuidedLessons: () => import('./components/GuidedLessons'),
  ComparisonMode: () => import('./components/ComparisonMode'),
  WeeklyGoals: () => import('./components/WeeklyGoals'),
  MasteryIndicators: () => import('./components/MasteryIndicators'),
  SocialChallenges: () => import('./components/SocialChallenges'),
  MistakeReviewScreen: () => import('./components/MistakeReviewScreen'),
  IntervalSingingMode: () => import('./components/IntervalSingingMode'),
  ChordProgressionDictation: () => import('./components/ChordProgressionDictation'),
  CircleOfFifthsGame: () => import('./components/CircleOfFifthsGame'),
  PracticeScreen: () => import('./components/PracticeScreen'),
  ReverseModeGame: () => import('./components/ReverseModeGame'),
  MelodicDictationGame: () => import('./components/MelodicDictationGame'),
};

const GameScreen = lazy(() => lazyLoaders.GameScreen().then(m => ({ default: m.GameScreen })));
const ResultScreen = lazy(() => lazyLoaders.ResultScreen().then(m => ({ default: m.ResultScreen })));
const StatsScreen = lazy(() => lazyLoaders.StatsScreen().then(m => ({ default: m.StatsScreen })));
const GuitarTools = lazy(() => lazyLoaders.GuitarTools().then(m => ({ default: m.GuitarTools })));
const LearnScreen = lazy(() => lazyLoaders.LearnScreen().then(m => ({ default: m.LearnScreen })));
const SettingsScreen = lazy(() => lazyLoaders.SettingsScreen().then(m => ({ default: m.SettingsScreen })));
const TutorialScreen = lazy(() => lazyLoaders.TutorialScreen().then(m => ({ default: m.TutorialScreen })));
const GuidedLessons = lazy(() => lazyLoaders.GuidedLessons().then(m => ({ default: m.GuidedLessons })));
const ComparisonMode = lazy(() => lazyLoaders.ComparisonMode().then(m => ({ default: m.ComparisonMode })));
const WeeklyGoals = lazy(() => lazyLoaders.WeeklyGoals().then(m => ({ default: m.WeeklyGoals })));
const MasteryIndicators = lazy(() => lazyLoaders.MasteryIndicators().then(m => ({ default: m.MasteryIndicators })));
const SocialChallenges = lazy(() => lazyLoaders.SocialChallenges().then(m => ({ default: m.SocialChallenges })));
const MistakeReviewScreen = lazy(() => lazyLoaders.MistakeReviewScreen().then(m => ({ default: m.MistakeReviewScreen })));
const IntervalSingingMode = lazy(() => lazyLoaders.IntervalSingingMode().then(m => ({ default: m.IntervalSingingMode })));
const ChordProgressionDictation = lazy(() => lazyLoaders.ChordProgressionDictation().then(m => ({ default: m.ChordProgressionDictation })));
const CircleOfFifthsGame = lazy(() => lazyLoaders.CircleOfFifthsGame().then(m => ({ default: m.CircleOfFifthsGame })));
const PracticeScreen = lazy(() => lazyLoaders.PracticeScreen().then(m => ({ default: m.PracticeScreen })));
const ReverseModeGame = lazy(() => lazyLoaders.ReverseModeGame().then(m => ({ default: m.ReverseModeGame })));
const MelodicDictationGame = lazy(() => lazyLoaders.MelodicDictationGame().then(m => ({ default: m.MelodicDictationGame })));

/** Warm every lazy chunk once the first screen is settled and the CPU is idle. */
function prefetchLazyScreens(): () => void {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return () => {};
  const run = () => {
    Object.values(lazyLoaders).forEach(load => {
      load().catch(() => {
        /* offline or a failed fetch; the screen loads on demand later */
      });
    });
  };
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(run, { timeout: 4000 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(run, 2500);
  return () => window.clearTimeout(id);
}

/** Shown for the few milliseconds a screen's chunk takes to arrive. */
function ScreenFallback() {
  return (
    <div className="screen-root flex items-center justify-center" aria-busy="true" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-purple-400" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
import { LevelConfig, LEVELS } from './types/levels';
import { MusicKeysLevelConfig, MUSIC_KEYS_LEVELS } from './types/musicKeysLevels';
import { NotesLevelConfig, NOTES_LEVELS } from './types/notesLevels';
import { GameModeType, ChallengeModeType, GameResult, AnswerRecord, SessionSummary } from './types/gameModes';
import { useGameState } from './hooks/useGameState';
import { awardSession } from './utils/sessionResults';
import { useSwipe } from './hooks/useSwipe';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { applyTheme, applyGlassIntensity, watchSystemTheme } from './utils/theme';
import { applyDynamicType, watchDynamicType } from './utils/dynamicType';
import { classifyScreenChange, runScreenTransition, ScreenTransitionKind } from './utils/screenTransition';
import { syncAppBadge } from './utils/badge';
import { screenFromHash, hashForScreen, isRoutable, deepLinkFromHash } from './utils/routing';
import type { DeepLinkTool } from './utils/routing';
import {
  getDailyStats,
  updateDailyStats,
  PRACTICE_PRESETS,
  PracticePresetId,
  SocialChallenge,
  getSettings,
  getUserStats,
} from './utils/storage';
import {
  loadAccessibilitySettings,
  applyAccessibilitySettings,
  injectAccessibilityStyles,
} from './utils/accessibility';

type AppState =
  | { screen: 'home' }
  | { screen: 'levelSelect' }
  | { screen: 'musicKeysSelect' }
  | { screen: 'notesSelect' }
  | { screen: 'game'; level: LevelConfig; isPracticeMode?: boolean }
  | { screen: 'musicKeysGame'; musicKeysLevel: MusicKeysLevelConfig }
  | { screen: 'notesGame'; notesLevel: NotesLevelConfig }
  | { screen: 'result'; result: GameResult }
  | { screen: 'learn' }
  | { screen: 'stats'; initialTab?: string }
  | { screen: 'tools' }
  | { screen: 'settings' }
  | { screen: 'tutorial' }
  | { screen: 'guidedLessons' }
  | { screen: 'comparison' }
  | { screen: 'weeklyGoals' }
  | { screen: 'mastery' }
  | { screen: 'socialChallenges' }
  | { screen: 'mistakeReview'; result: GameResult }
  | { screen: 'intervalSinging' }
  | { screen: 'progressionDictation' }
  | { screen: 'circleOfFifths' }
  | { screen: 'practice' }
  | { screen: 'reverseMode' }
  | { screen: 'melodicDictation' };

/** Left-to-right order of the bottom nav; must match Navigation's navItems. */
const NAV_ORDER: Screen[] = ['home', 'play', 'learn', 'tools', 'stats'];

/**
 * Screens that belong to a bottom-nav tab, and so can be swiped between.
 * Deliberately partial: 'settings' renders the nav without being one of the
 * five tabs, and every game screen is absent.
 */
const SCREEN_TO_NAV_TAB: Partial<Record<AppState['screen'], Screen>> = {
  home: 'home',
  levelSelect: 'play',
  practice: 'play',
  musicKeysSelect: 'play',
  notesSelect: 'play',
  learn: 'learn',
  tools: 'tools',
  stats: 'stats',
};

function App() {
  // Check if this is a first-time user (auto-trigger tutorial)
  const isFirstUser = () => {
    const stats = getUserStats();
    return stats.totalQuestionsAnswered === 0 && !localStorage.getItem('keyperfect_tutorial_completed');
  };

  /*
   * The URL is the source of truth for the landing screen, so a refresh or a
   * shared link reopens what the player was on. A first-time visitor with no
   * hash still gets the tutorial; an unrecognised hash degrades to Home rather
   * than to a blank screen.
   */
  const [appState, commitAppState] = useState<AppState>(() => {
    const fromUrl = screenFromHash(window.location.hash);
    if (fromUrl) return { screen: fromUrl } as AppState;
    return isFirstUser() ? { screen: 'tutorial' } : { screen: 'home' };
  });
  // Tool a deep link asked Tools to open on; also the GuitarTools key, so a
  // second link while Tools is open switches tool.
  const [toolsInitialTool, setToolsInitialTool] = useState<DeepLinkTool | undefined>(() => {
    const link = deepLinkFromHash(window.location.hash);
    return link?.kind === 'tool' ? link.tool : undefined;
  });
  const [currentNavScreen, setCurrentNavScreen] = useState<Screen>(
    () => SCREEN_TO_NAV_TAB[screenFromHash(window.location.hash) ?? 'home'] ?? 'home',
  );
  const [swipeTransition, setSwipeTransition] = useState<
    { tab: Screen; dir: 'forward' | 'back' } | null
  >(null);
  const prevScreenRef = useRef<string>('home');
  const reducedMotion = usePrefersReducedMotion();

  /*
   * Every screen change goes through here so it can run as an iOS-style push
   * or pop (utils/screenTransition.ts). `appStateRef` gives the wrapper the
   * screen being left without re-creating it on every render, which would
   * churn every handler that depends on it. `forcedKindRef` lets Back
   * (popstate) say "pop" even when the classifier would guess otherwise.
   */
  const appStateRef = useRef(appState);
  appStateRef.current = appState;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;
  const forcedKindRef = useRef<ScreenTransitionKind | null>(null);
  const viewTransitionRanRef = useRef(false);

  const setAppState = useCallback((next: React.SetStateAction<AppState>) => {
    const prev = appStateRef.current;
    const resolved = typeof next === 'function' ? (next as (s: AppState) => AppState)(prev) : next;
    const kind = forcedKindRef.current ?? classifyScreenChange(prev.screen, resolved.screen);
    forcedKindRef.current = null;
    appStateRef.current = resolved;
    viewTransitionRanRef.current = runScreenTransition(
      kind,
      () => commitAppState(resolved),
      reducedMotionRef.current,
    );
  }, []);
  const {
    gameState,
    startGame,
    startWithPreset,
    submitAnswer,
    nextQuestion,
    endGame,
    setIsPlaying,
    timeExpired,
  } = useGameState();

  // Inject accessibility styles and apply saved settings once on mount
  useEffect(() => {
    injectAccessibilityStyles();
    applyAccessibilitySettings(loadAccessibilitySettings());
    applyDynamicType();
    const stopDynamicType = watchDynamicType();
    const stopPrefetch = prefetchLazyScreens();
    return () => {
      stopDynamicType();
      stopPrefetch();
    };
  }, []);

  // Keep the Home Screen icon badge equal to the number of reviews due.
  // Re-checked on every screen change, which is when a session can have
  // cleared some or scheduled more.
  useEffect(() => {
    void syncAppBadge();
  }, [appState]);

  // Apply theme and glass intensity to the document. `system` also follows
  // the OS appearance while this screen is mounted.
  useEffect(() => {
    const settings = getSettings();
    applyTheme(settings.theme);
    applyGlassIntensity(settings.glassIntensity ?? 'balanced');
    return watchSystemTheme(settings.theme);
  }, [appState]); // Re-check on any screen change in case settings changed

  // Track screen transitions for animation
  useEffect(() => {
    prevScreenRef.current = appState.screen;
  }, [appState.screen]);

  // Handle time expiration for timed game modes. musicKeysGame and notesGame
  // render the same GameScreen with the same timer, so checking only for
  // 'game' meant a timed variant of either would run its clock to zero and
  // then sit there, the session never ending.
  useEffect(() => {
    const isGameScreen =
      appState.screen === 'game' ||
      appState.screen === 'musicKeysGame' ||
      appState.screen === 'notesGame';
    if (timeExpired && gameState && isGameScreen) {
      const result = endGame();
      setAppState({ screen: 'result', result });
    }
  }, [timeExpired, gameState, appState.screen, endGame]);

  // Navigation handler
  const handleNavigate = useCallback((screen: Screen) => {
    setCurrentNavScreen(screen);
    switch (screen) {
      case 'home':
        setAppState({ screen: 'home' });
        break;
      case 'play':
        setAppState({ screen: 'levelSelect' });
        break;
      case 'learn':
        setAppState({ screen: 'learn' });
        break;
      case 'stats':
        setAppState({ screen: 'stats' });
        break;
      case 'tools':
        setAppState({ screen: 'tools' });
        break;
      case 'settings':
        setAppState({ screen: 'settings' });
        break;
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    handleNavigate('settings');
  }, [handleNavigate]);

  // Start level-based training
  const handleStartLevel = useCallback(() => {
    setAppState({ screen: 'levelSelect' });
    setCurrentNavScreen('play');
  }, []);

  // Select and start a level
  const handleSelectLevel = useCallback((level: LevelConfig) => {
    startGame('chords', level.id);
    setAppState({ screen: 'game', level });
  }, [startGame]);

  // Start Music Keys training
  const handleStartMusicKeys = useCallback(() => {
    setAppState({ screen: 'musicKeysSelect' });
    setCurrentNavScreen('play');
  }, []);

  // Select and start a Music Keys level
  const handleSelectMusicKeysLevel = useCallback((level: MusicKeysLevelConfig) => {
    startGame('musickeys', level.id);
    setAppState({ screen: 'musicKeysGame', musicKeysLevel: level });
  }, [startGame]);

  // Start Notes training
  const handleStartNotes = useCallback(() => {
    setAppState({ screen: 'notesSelect' });
    setCurrentNavScreen('play');
  }, []);

  // Select and start a Notes level
  const handleSelectNotesLevel = useCallback((level: NotesLevelConfig) => {
    startGame('notes', level.id);
    setAppState({ screen: 'notesGame', notesLevel: level });
  }, [startGame]);

  // Start challenge mode. The daily-login streak is credited from
  // useGameState.endGame once the user has actually played a question
  // (any mode), so we no longer need a pre-emptive call here - the old
  // version let players inflate the streak by tapping Daily Challenge
  // and immediately exiting without answering.
  const handleStartChallenge = useCallback((mode: ChallengeModeType) => {
    startGame(mode, 1);
    setAppState({ screen: 'game', level: LEVELS[0] });
  }, [startGame]);

  // Start specific game mode
  const handleStartGameMode = useCallback((mode: GameModeType) => {
    // These two have dedicated screens that generate their own questions,
    // rather than routing through useGameState and the generic GameScreen.
    if (mode === 'reverse') {
      setAppState({ screen: 'reverseMode' });
      return;
    }
    if (mode === 'melodic') {
      setAppState({ screen: 'melodicDictation' });
      return;
    }
    const isPracticeMode = mode === 'practice';
    startGame(mode, 1);
    setAppState({ screen: 'game', level: LEVELS[0], isPracticeMode });
  }, [startGame]);

  // Award a self-contained screen's session through the same path every other
  // mode uses, then hand it to the shared result screen.
  const handleStandaloneComplete = useCallback(
    (mode: GameModeType, totalQuestions: number) => (session: SessionSummary) => {
      const result = awardSession({
        mode,
        answers: session.answers,
        score: session.score,
        totalTime: session.totalTime,
        totalQuestions,
        // No level: these modes are not part of the level ladder, and writing
        // progress for one would inflate its completion percentage.
      });
      setAppState({ screen: 'result', result });
    },
    [],
  );

  // Start with a practice preset
  const handleStartPreset = useCallback((presetId: PracticePresetId) => {
    const preset = PRACTICE_PRESETS[presetId];
    startWithPreset(preset);
    setAppState({ screen: 'game', level: LEVELS[0] });
  }, [startWithPreset]);

  // A `#/start/<preset>` link (Siri Shortcut, bookmark) starts a session
  // straight away: on launch here, and while running via the popstate
  // handler, which reads the latest handler through this ref.
  const startPresetRef = useRef(handleStartPreset);
  startPresetRef.current = handleStartPreset;
  useEffect(() => {
    const link = deepLinkFromHash(window.location.hash);
    if (link?.kind === 'start') startPresetRef.current(link.preset);
  }, []);

  // Handle answer submission
  const handleAnswer = useCallback((answer: string): AnswerRecord => {
    return submitAnswer(answer);
  }, [submitAnswer]);

  // Handle next question or end game
  const handleNext = useCallback(() => {
    if (!gameState) return;

    if (gameState.currentQuestion >= gameState.totalQuestions - 1 || gameState.isComplete) {
      const result = endGame();

      // Update daily stats if it was daily challenge
      if (gameState.mode === 'daily') {
        const today = new Date().toISOString().split('T')[0];
        updateDailyStats({
          lastPlayedDate: today,
          completed: true,
          todayScore: result.score,
          todayQuestions: result.totalQuestions,
        });
      }

      setAppState({ screen: 'result', result });
    } else {
      nextQuestion();
    }
  }, [gameState, endGame, nextQuestion]);

  // Exit game. GameScreen confirms with the player first, so by the time this
  // runs the choice to stop has been made deliberately; a session abandoned
  // before its last question is still awarded, but reported as an early exit.
  const handleExitGame = useCallback(() => {
    if (gameState) {
      const endedEarly =
        !gameState.isComplete && gameState.answers.length < gameState.totalQuestions;
      const result = endGame({ endedEarly });
      setAppState({ screen: 'result', result });
    } else {
      setAppState({ screen: 'home' });
      setCurrentNavScreen('home');
    }
  }, [gameState, endGame]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    if (appState.screen !== 'result') return;
    const { mode, level: levelId } = appState.result;

    if (mode === 'musickeys') {
      const level = MUSIC_KEYS_LEVELS.find(l => l.id === levelId);
      if (level) {
        startGame('musickeys', level.id);
        setAppState({ screen: 'musicKeysGame', musicKeysLevel: level });
      }
      return;
    }

    if (mode === 'notes') {
      const level = NOTES_LEVELS.find(l => l.id === levelId);
      if (level) {
        startGame('notes', level.id);
        setAppState({ screen: 'notesGame', notesLevel: level });
      }
      return;
    }

    // These two have dedicated screens that generate their own questions.
    // Falling through to the generic quiz hits generateQuestion's
    // `default: generateChordQuestion`, so Play Again used to hand the player
    // a chord-identification quiz labelled "Level 1" and then file the
    // session under this mode's stats.
    if (mode === 'reverse') {
      setAppState({ screen: 'reverseMode' });
      return;
    }
    if (mode === 'melodic') {
      setAppState({ screen: 'melodicDictation' });
      return;
    }

    startGame(mode, levelId);
    const level = LEVELS.find(l => l.id === levelId) || LEVELS[0];
    setAppState({ screen: 'game', level });
  }, [appState, startGame]);

  // Go home
  const handleGoHome = useCallback(() => {
    setAppState({ screen: 'home' });
    setCurrentNavScreen('home');
  }, []);

  // Start next level — mode-aware to support chords, musickeys, and notes
  const handleNextLevel = useCallback((levelId: number, mode: string) => {
    if (mode === 'musickeys') {
      const level = MUSIC_KEYS_LEVELS.find(l => l.id === levelId);
      if (level) {
        startGame('musickeys', level.id);
        setAppState({ screen: 'musicKeysGame', musicKeysLevel: level });
      }
    } else if (mode === 'notes') {
      const level = NOTES_LEVELS.find(l => l.id === levelId);
      if (level) {
        startGame('notes', level.id);
        setAppState({ screen: 'notesGame', notesLevel: level });
      }
    } else {
      const level = LEVELS.find(l => l.id === levelId);
      if (level) {
        startGame('chords', level.id);
        setAppState({ screen: 'game', level });
      }
    }
  }, [startGame]);

  // New feature navigation handlers
  const handleOpenGuidedLessons = useCallback(() => {
    setAppState({ screen: 'guidedLessons' });
  }, []);

  const handleOpenComparison = useCallback(() => {
    setAppState({ screen: 'comparison' });
  }, []);

  const handleOpenWeeklyGoals = useCallback(() => {
    setAppState({ screen: 'weeklyGoals' });
  }, []);

  const handleOpenMastery = useCallback(() => {
    setAppState({ screen: 'mastery' });
  }, []);

  const handleOpenSocialChallenges = useCallback(() => {
    setAppState({ screen: 'socialChallenges' });
  }, []);

  const handleOpenIntervalSinging = useCallback(() => {
    setAppState({ screen: 'intervalSinging' });
  }, []);

  const handleOpenProgressionDictation = useCallback(() => {
    setAppState({ screen: 'progressionDictation' });
  }, []);

  const handleOpenCircleOfFifths = useCallback(() => {
    setAppState({ screen: 'circleOfFifths' });
  }, []);

  // Free play on the piano keyboard. Shows the bottom nav, so it counts as
  // part of the Play tab for swipe navigation.
  const handleOpenFreePlay = useCallback(() => {
    setCurrentNavScreen('play');
    setAppState({ screen: 'practice' });
  }, []);

  const handleOpenFocusAreas = useCallback(() => {
    setCurrentNavScreen('stats');
    setAppState({ screen: 'stats', initialTab: 'insights' });
  }, []);

  // Start a social challenge
  const handleStartSocialChallenge = useCallback((challenge: SocialChallenge) => {
    startGame(challenge.mode as GameModeType, 1);
    setAppState({ screen: 'game', level: LEVELS[0] });
  }, [startGame]);

  // Handle guided lessons starting practice
  const handleStartPracticeFromLesson = useCallback((mode: string) => {
    startGame(mode as GameModeType, 1);
    setAppState({ screen: 'game', level: LEVELS[0] });
  }, [startGame]);

  // Render current screen
  const renderScreen = () => {
    // Built once and reused by both 'home' and the default fallback. They used
    // to be two hand-maintained copies of the same 16-prop call, and the copy
    // had already drifted — it was missing onOpenFocusAreas.
    const homeScreen = (
          <HomeScreen
            onStartLevel={handleStartLevel}
            onStartRecommendedLevel={handleSelectLevel}
            onStartChallenge={handleStartChallenge}
            onStartGameMode={handleStartGameMode}
            onStartPreset={handleStartPreset}
            onStartMusicKeys={handleStartMusicKeys}
            onStartNotes={handleStartNotes}
            onOpenGuidedLessons={handleOpenGuidedLessons}
            onOpenComparison={handleOpenComparison}
            onOpenWeeklyGoals={handleOpenWeeklyGoals}
            onOpenMastery={handleOpenMastery}
            onOpenSocialChallenges={handleOpenSocialChallenges}
            onOpenIntervalSinging={handleOpenIntervalSinging}
            onOpenProgressionDictation={handleOpenProgressionDictation}
            onOpenFocusAreas={handleOpenFocusAreas}
            onOpenCircleOfFifths={handleOpenCircleOfFifths}
            onOpenFreePlay={handleOpenFreePlay}
            onOpenSettings={handleOpenSettings}
          />
    );

    switch (appState.screen) {
      case 'home':
        return homeScreen;

      case 'levelSelect':
        return (
          <LevelSelect
            onSelectLevel={handleSelectLevel}
            onBack={handleGoHome}
          />
        );

      case 'musicKeysSelect':
        return (
          <MusicKeysLevelSelect
            onSelectLevel={handleSelectMusicKeysLevel}
            onBack={handleGoHome}
          />
        );

      case 'notesSelect':
        return (
          <NotesLevelSelect
            onSelectLevel={handleSelectNotesLevel}
            onBack={handleGoHome}
          />
        );

      case 'notesGame':
        if (!gameState) {
          return <div>Loading...</div>;
        }
        return (
          <GameScreen
            level={LEVELS[0]}
            question={gameState.questions[gameState.currentQuestion]}
            questionNumber={gameState.currentQuestion + 1}
            totalQuestions={gameState.totalQuestions}
            score={gameState.score}
            streak={gameState.streak}
            lives={gameState.lives > 0 ? gameState.lives : undefined}
            timeRemaining={gameState.timeRemaining > 0 ? gameState.timeRemaining : undefined}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onExit={handleExitGame}
          />
        );

      case 'musicKeysGame':
        if (!gameState) {
          return <div>Loading...</div>;
        }
        return (
          <GameScreen
            level={LEVELS[0]}
            question={gameState.questions[gameState.currentQuestion]}
            questionNumber={gameState.currentQuestion + 1}
            totalQuestions={gameState.totalQuestions}
            score={gameState.score}
            streak={gameState.streak}
            lives={gameState.lives > 0 ? gameState.lives : undefined}
            timeRemaining={gameState.timeRemaining > 0 ? gameState.timeRemaining : undefined}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onExit={handleExitGame}
          />
        );

      case 'game':
        if (!gameState) {
          return <div>Loading...</div>;
        }
        return (
          <GameScreen
            level={appState.level}
            question={gameState.questions[gameState.currentQuestion]}
            questionNumber={gameState.currentQuestion + 1}
            totalQuestions={gameState.totalQuestions}
            score={gameState.score}
            streak={gameState.streak}
            lives={gameState.lives > 0 ? gameState.lives : undefined}
            timeRemaining={gameState.timeRemaining > 0 ? gameState.timeRemaining : undefined}
            isPracticeMode={appState.isPracticeMode}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onExit={handleExitGame}
          />
        );

      case 'result':
        return (
          <ResultScreen
            result={appState.result}
            onPlayAgain={handlePlayAgain}
            onHome={handleGoHome}
            onNextLevel={handleNextLevel}
            onReviewMistakes={() => setAppState({ screen: 'mistakeReview', result: appState.result })}
          />
        );

      case 'learn':
        return <LearnScreen />;

      case 'stats':
        return <StatsScreen onStartGameMode={handleStartGameMode} initialTab={appState.initialTab} />;

      case 'tools':
        return <GuitarTools key={toolsInitialTool ?? 'default'} initialTool={toolsInitialTool} />;

      case 'settings':
        return (
          <SettingsScreen
            onBack={handleGoHome}
            onReplayTutorial={() => {
              localStorage.removeItem('keyperfect_tutorial_completed');
              setAppState({ screen: 'tutorial' });
            }}
          />
        );

      case 'guidedLessons':
        return (
          <GuidedLessons
            onBack={handleGoHome}
            onStartPractice={handleStartPracticeFromLesson}
          />
        );

      case 'comparison':
        return <ComparisonMode onBack={handleGoHome} />;

      case 'weeklyGoals':
        return <WeeklyGoals onBack={handleGoHome} />;

      case 'mastery':
        return <MasteryIndicators onBack={handleGoHome} />;

      case 'socialChallenges':
        return (
          <SocialChallenges
            onBack={handleGoHome}
            onStartChallenge={handleStartSocialChallenge}
          />
        );

      case 'tutorial':
        return (
          <TutorialScreen
            // handleGoHome rather than setAppState: the tutorial can now be
            // replayed from Settings, and going home via setAppState alone
            // left currentNavScreen on 'settings', so no tab was highlighted.
            onComplete={() => {
              localStorage.setItem('keyperfect_tutorial_completed', 'true');
              handleGoHome();
            }}
            onSkip={() => {
              localStorage.setItem('keyperfect_tutorial_completed', 'true');
              handleGoHome();
            }}
          />
        );

      case 'mistakeReview':
        return (
          <MistakeReviewScreen
            result={appState.result}
            onBack={() => setAppState({ screen: 'result', result: appState.result })}
          />
        );

      case 'intervalSinging':
        return <IntervalSingingMode onBack={handleGoHome} />;

      case 'progressionDictation':
        return <ChordProgressionDictation onBack={handleGoHome} />;

      case 'circleOfFifths':
        return <CircleOfFifthsGame onBack={handleGoHome} />;

      case 'practice':
        return <PracticeScreen onBack={handleGoHome} />;

      case 'reverseMode':
        return (
          <ReverseModeGame
            onComplete={handleStandaloneComplete('reverse', 10)}
            onExit={handleGoHome}
          />
        );

      case 'melodicDictation':
        return (
          <MelodicDictationGame
            onComplete={handleStandaloneComplete('melodic', 8)}
            onExit={handleGoHome}
          />
        );

      default:
        return homeScreen;
    }
  };

  // Don't show navigation during game, tutorial, or feature screens
  const hideNavScreens = ['game', 'musicKeysGame', 'notesGame', 'result', 'guidedLessons', 'comparison', 'weeklyGoals', 'mastery', 'socialChallenges', 'tutorial', 'mistakeReview', 'intervalSinging', 'progressionDictation', 'circleOfFifths', 'reverseMode', 'melodicDictation'];
  const showNavigation = !hideNavScreens.includes(appState.screen);

  // Which bottom-nav tab the current screen belongs to. Screens absent from
  // this map are not swipeable: Settings renders the nav but is not one of the
  // five tabs, so swiping there would jump somewhere arbitrary.
  const swipeTab = SCREEN_TO_NAV_TAB[appState.screen];
  const swipeIndex = swipeTab ? NAV_ORDER.indexOf(swipeTab) : -1;

  const stepTab = useCallback((delta: number) => {
    const next = swipeIndex + delta;
    // No wrap-around: home and stats are the ends of the bar, and wrapping
    // between them reads as a glitch rather than as navigation.
    if (swipeIndex < 0 || next < 0 || next >= NAV_ORDER.length) return;
    const target = NAV_ORDER[next];
    // Tagged with its target tab so the directional animation applies only to
    // the screen the swipe actually produced; navigating any other way falls
    // back to the default transition without needing to clear this.
    setSwipeTransition({ tab: target, dir: delta > 0 ? 'forward' : 'back' });
    handleNavigate(target);
  }, [swipeIndex, handleNavigate]);

  /*
   * Tab swiping happens on two narrow strips pinned to the screen edges
   * rather than on the whole page, for a reason that only shows up on a real
   * device: with the default touch-action the browser claims a drag for
   * panning and fires pointercancel before the gesture finishes, so a
   * passive listener on the page root never sees a completed swipe. The fix
   * is `touch-action: pan-y pinch-zoom` -- the browser keeps vertical
   * scrolling and zooming, we get horizontal drags -- but on the root that
   * would also forbid horizontal panning in every descendant, breaking all
   * seven horizontal scroll strips and the piano.
   *
   * Confining it to 16px edge strips gives the gesture somewhere it reliably
   * works while leaving the rest of the page untouched. 16px is the screens'
   * own horizontal padding, so the strips sit over margin, and they stop
   * above the nav so they never cover a tab button.
   *
   * `showNavigation` already excludes all fourteen game and feature screens,
   * so reusing it means a stray swipe can never cost quiz progress, and any
   * screen added to hideNavScreens is protected automatically.
   */
  const swipeEnabled = showNavigation && swipeIndex >= 0;
  const edgeSwipeOptions = {
    axis: 'horizontal' as const,
    enabled: swipeEnabled,
    onSwipeLeft: () => stepTab(1),
    onSwipeRight: () => stepTab(-1),
  };
  const { ref: leftEdgeRef } = useSwipe<HTMLDivElement>(edgeSwipeOptions);
  const { ref: rightEdgeRef } = useSwipe<HTMLDivElement>(edgeSwipeOptions);

  /*
   * Keep the URL in step with the screen.
   *
   * `pushState` rather than assigning `location.hash`, so the browser's Back
   * button — and Android's hardware back — walk back through the app instead
   * of leaving it. Screens carrying required runtime state (a round in
   * progress, a result) are not addressable; they show their parent's URL, so
   * a refresh lands one tap from where the player was rather than on a screen
   * with nothing to render.
   */
  useEffect(() => {
    const nextHash = hashForScreen(appState.screen);
    if (!nextHash || window.location.hash === nextHash) return;
    // A deep link such as #/tools/tuner already names this screen; leave it
    // rather than stacking a plain #/tools entry on top of it.
    if (screenFromHash(window.location.hash) === appState.screen) return;

    // A non-addressable screen must not add a history entry of its own:
    // otherwise Back from a finished round steps through the round itself.
    if (isRoutable(appState.screen)) {
      window.history.pushState(null, '', nextHash);
    } else {
      window.history.replaceState(null, '', nextHash);
    }
  }, [appState.screen]);

  useEffect(() => {
    const handlePopState = (event: Event) => {
      const link = deepLinkFromHash(window.location.hash);
      if (link?.kind === 'start') {
        startPresetRef.current(link.preset);
        return;
      }
      if (link?.kind === 'tool') setToolsInitialTool(link.tool);
      const screen = screenFromHash(window.location.hash) ?? 'home';
      // Safari's own edge-swipe Back already animated the page; a second
      // slide on top of it reads as a stutter.
      const uaAnimated = (event as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition === true;
      forcedKindRef.current = uaAnimated ? 'none' : 'pop';
      setAppState(current => (current.screen === screen ? current : ({ screen } as AppState)));
      setCurrentNavScreen(SCREEN_TO_NAV_TAB[screen] ?? 'home');
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [setAppState]);

  /*
   * Entrance animations are held off until the first screen has actually been
   * painted.
   *
   * Every screen is wrapped in `.screen-enter`, whose keyframes start at
   * `opacity: 0`. Chromium does not count a paint of a fully transparent
   * element as contentful, and the opacity ramp runs on the compositor rather
   * than the main thread, so no later frame re-triggers the check: the app
   * reported `first-paint` and never `first-contentful-paint` at all.
   * Lighthouse scored it NO_FCP, and real users' FCP and LCP went unreported.
   *
   * The flag has to be flipped from a committed effect rather than a timer in
   * main.tsx: React schedules the initial commit, so a bare
   * `requestAnimationFrame` at module scope can fire before the first screen
   * has rendered and lift the gate too early.
   */
  useEffect(() => {
    // Two frames, not one: a single rAF callback still runs *before* the
    // current frame is painted, so the gate would be lifted before the paint
    // it exists to protect. The second fires once that frame is on screen.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        document.documentElement.classList.add('kp-first-paint');
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  const direction =
    swipeTransition && swipeTransition.tab === swipeTab ? swipeTransition.dir : null;
  // A view transition already animated this navigation; a CSS entrance on
  // top of it would slide the new screen twice.
  const transitionClass = reducedMotion || viewTransitionRanRef.current
    ? ''
    : direction === 'forward'
    ? 'screen-enter-right'
    : direction === 'back'
    ? 'screen-enter-left'
    : 'screen-enter';

  return (
    <div
      className="min-h-dvh safe-area-x app-bg text-white"
      /*
       * Screens read this to size their bottom clearance and to position their
       * fixed action bars. It is 0 when the nav is hidden, so a `.action-bar`
       * sits on the safe-area edge instead of floating above empty space.
       */
      style={{ '--kp-nav-h': showNavigation ? `${NAV_HEIGHT_PX}px` : '0px' } as React.CSSProperties}
    >
      {/* The one `main` landmark on the page: screen-reader users can jump
          straight to the screen's content instead of tabbing past the header
          and nav on every navigation. */}
      <main id="main-content" key={appState.screen} className={transitionClass}>
        <Suspense fallback={<ScreenFallback />}>{renderScreen()}</Suspense>
      </main>
      {swipeEnabled && (
        <>
          <div ref={leftEdgeRef} className="edge-swipe-zone left-0" aria-hidden="true" />
          <div ref={rightEdgeRef} className="edge-swipe-zone right-0" aria-hidden="true" />
        </>
      )}
      {showNavigation && (
        <Navigation
          currentScreen={currentNavScreen}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

export default App;
