import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Navigation,
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
} from './components';
import type { Screen } from './components';
import { LevelConfig, LEVELS } from './types/levels';
import { MusicKeysLevelConfig, MUSIC_KEYS_LEVELS } from './types/musicKeysLevels';
import { NotesLevelConfig, NOTES_LEVELS } from './types/notesLevels';
import { GameModeType, ChallengeModeType, GameResult, AnswerRecord } from './types/gameModes';
import { useGameState } from './hooks/useGameState';
import {
  getDailyStats,
  updateDailyStats,
  checkAndUpdateDailyStreak,
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
  | { screen: 'progressionDictation' };

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
  const prevScreenRef = useRef<string>('home');
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

  // Start challenge mode
  const handleStartChallenge = useCallback((mode: ChallengeModeType) => {
    // For Daily Challenge, update streak
    if (mode === 'daily') {
      checkAndUpdateDailyStreak();
    }
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
    if (appState.screen === 'result') {
      startGame(appState.result.mode, appState.result.level);
      const level = LEVELS.find(l => l.id === appState.result.level) || LEVELS[0];
      setAppState({ screen: 'game', level });
    }
  }, [appState, startGame]);

  // Go home
  const handleGoHome = useCallback(() => {
    setAppState({ screen: 'home' });
    setCurrentNavScreen('home');
  }, []);

  // Start next level
  const handleNextLevel = useCallback((levelId: number) => {
    const level = LEVELS.find(l => l.id === levelId);
    if (level) {
      startGame('chords', level.id);
      setAppState({ screen: 'game', level });
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
        return <SettingsScreen />;

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

      default:
        return <HomeScreen onStartLevel={handleStartLevel} onStartChallenge={handleStartChallenge} onStartGameMode={handleStartGameMode} onStartPreset={handleStartPreset} onStartMusicKeys={handleStartMusicKeys} onStartNotes={handleStartNotes} onOpenGuidedLessons={handleOpenGuidedLessons} onOpenComparison={handleOpenComparison} onOpenWeeklyGoals={handleOpenWeeklyGoals} onOpenMastery={handleOpenMastery} onOpenSocialChallenges={handleOpenSocialChallenges} onOpenIntervalSinging={handleOpenIntervalSinging} onOpenProgressionDictation={handleOpenProgressionDictation} />;
    }
  };

  // Don't show navigation during game, tutorial, or feature screens
  const hideNavScreens = ['game', 'musicKeysGame', 'notesGame', 'result', 'guidedLessons', 'comparison', 'weeklyGoals', 'mastery', 'socialChallenges', 'tutorial', 'mistakeReview', 'intervalSinging', 'progressionDictation'];
  const showNavigation = !hideNavScreens.includes(appState.screen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <div key={appState.screen} className="screen-enter">
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
