import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Navigation,
  NAV_HEIGHT_PX,
  HomeScreen,
  LevelSelect,
  MusicKeysLevelSelect,
  NotesLevelSelect,
  GameScreen,
  ResultScreen,
  StatsScreen,
  GuitarTools,
  LearnScreen,
  SettingsScreen,
  TutorialScreen,
  GuidedLessons,
  ComparisonMode,
  WeeklyGoals,
  MasteryIndicators,
  SocialChallenges,
  MistakeReviewScreen,
  Confetti,
  IntervalSingingMode,
  ChordProgressionDictation,
  CircleOfFifthsGame,
  PracticeScreen,
} from './components';
import type { Screen } from './components';
import { LevelConfig, LEVELS } from './types/levels';
import { MusicKeysLevelConfig, MUSIC_KEYS_LEVELS } from './types/musicKeysLevels';
import { NotesLevelConfig, NOTES_LEVELS } from './types/notesLevels';
import { GameModeType, ChallengeModeType, GameResult, AnswerRecord } from './types/gameModes';
import { useGameState } from './hooks/useGameState';
import { useSwipe } from './hooks/useSwipe';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
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
  | { screen: 'practice' };

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

  const [appState, setAppState] = useState<AppState>(
    isFirstUser() ? { screen: 'tutorial' } : { screen: 'home' }
  );
  const [currentNavScreen, setCurrentNavScreen] = useState<Screen>('home');
  const [swipeTransition, setSwipeTransition] = useState<
    { tab: Screen; dir: 'forward' | 'back' } | null
  >(null);
  const prevScreenRef = useRef<string>('home');
  const reducedMotion = usePrefersReducedMotion();
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
  }, []);

  // Apply theme to document
  useEffect(() => {
    const theme = getSettings().theme;
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-purple', 'theme-blue', 'theme-light');
    root.classList.add(`theme-${theme}`);
  }, [appState]); // Re-check on any screen change in case settings changed

  // Track screen transitions for animation
  useEffect(() => {
    prevScreenRef.current = appState.screen;
  }, [appState.screen]);

  // Handle time expiration for timed game modes
  useEffect(() => {
    if (timeExpired && gameState && appState.screen === 'game') {
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
    const isPracticeMode = mode === 'practice';
    startGame(mode, 1);
    setAppState({ screen: 'game', level: LEVELS[0], isPracticeMode });
  }, [startGame]);

  // Start with a practice preset
  const handleStartPreset = useCallback((presetId: PracticePresetId) => {
    const preset = PRACTICE_PRESETS[presetId];
    startWithPreset(preset);
    setAppState({ screen: 'game', level: LEVELS[0] });
  }, [startWithPreset]);

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

  // Exit game
  const handleExitGame = useCallback(() => {
    if (gameState) {
      const result = endGame();
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
    switch (appState.screen) {
      case 'home':
        return (
          <HomeScreen
            onStartLevel={handleStartLevel}
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
          />
        );

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
        return <GuitarTools />;

      case 'settings':
        return (
          <SettingsScreen
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
            onComplete={() => {
              localStorage.setItem('keyperfect_tutorial_completed', 'true');
              setAppState({ screen: 'home' });
            }}
            onSkip={() => {
              localStorage.setItem('keyperfect_tutorial_completed', 'true');
              setAppState({ screen: 'home' });
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

      default:
        return <HomeScreen onStartLevel={handleStartLevel} onStartChallenge={handleStartChallenge} onStartGameMode={handleStartGameMode} onStartPreset={handleStartPreset} onStartMusicKeys={handleStartMusicKeys} onStartNotes={handleStartNotes} onOpenGuidedLessons={handleOpenGuidedLessons} onOpenComparison={handleOpenComparison} onOpenWeeklyGoals={handleOpenWeeklyGoals} onOpenMastery={handleOpenMastery} onOpenSocialChallenges={handleOpenSocialChallenges} onOpenIntervalSinging={handleOpenIntervalSinging} onOpenProgressionDictation={handleOpenProgressionDictation} onOpenCircleOfFifths={handleOpenCircleOfFifths} onOpenFreePlay={handleOpenFreePlay} />;
    }
  };

  // Don't show navigation during game, tutorial, or feature screens
  const hideNavScreens = ['game', 'musicKeysGame', 'notesGame', 'result', 'guidedLessons', 'comparison', 'weeklyGoals', 'mastery', 'socialChallenges', 'tutorial', 'mistakeReview', 'intervalSinging', 'progressionDictation', 'circleOfFifths'];
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
   * Edge-swipe only. The gesture has to start within ~20px of a screen edge,
   * which is the iOS back-gesture convention and, more importantly, means it
   * structurally cannot compete with the horizontal scroll strips on Home,
   * Learn, Stats, Tools and Guided Lessons, or with the piano's scroller.
   *
   * `showNavigation` already excludes all fourteen game and feature screens,
   * so reusing it means a stray swipe can never cost quiz progress, and any
   * screen added to hideNavScreens is protected automatically.
   */
  const { ref: swipeRef } = useSwipe<HTMLDivElement>({
    axis: 'horizontal',
    edgeOnly: true,
    enabled: showNavigation && swipeIndex >= 0,
    onSwipeLeft: () => stepTab(1),
    onSwipeRight: () => stepTab(-1),
  });

  const direction =
    swipeTransition && swipeTransition.tab === swipeTab ? swipeTransition.dir : null;
  const transitionClass = reducedMotion
    ? ''
    : direction === 'forward'
    ? 'screen-enter-right'
    : direction === 'back'
    ? 'screen-enter-left'
    : 'screen-enter';

  return (
    <div
      ref={swipeRef}
      className="min-h-dvh safe-area-x bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white"
      /*
       * Screens read this to size their bottom clearance and to position their
       * fixed action bars. It is 0 when the nav is hidden, so a `.action-bar`
       * sits on the safe-area edge instead of floating above empty space.
       */
      style={{ '--kp-nav-h': showNavigation ? `${NAV_HEIGHT_PX}px` : '0px' } as React.CSSProperties}
    >
      <div key={appState.screen} className={transitionClass}>
        {renderScreen()}
      </div>
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
