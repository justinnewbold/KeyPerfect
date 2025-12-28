import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Navigation, HomeScreen, GameScreen, ResultScreen } from './components';

// Lazy load less frequently used screens
const LevelSelect = lazy(() => import('./components/LevelSelect').then(m => ({ default: m.LevelSelect })));
const StatsScreen = lazy(() => import('./components/StatsScreen').then(m => ({ default: m.StatsScreen })));
const GuitarTools = lazy(() => import('./components/GuitarTools').then(m => ({ default: m.GuitarTools })));
const LearnScreen = lazy(() => import('./components/LearnScreen').then(m => ({ default: m.LearnScreen })));
const SettingsScreen = lazy(() => import('./components/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const ReverseModeGame = lazy(() => import('./components/ReverseModeGame').then(m => ({ default: m.ReverseModeGame })));
const MelodicDictationGame = lazy(() => import('./components/MelodicDictationGame').then(m => ({ default: m.MelodicDictationGame })));
const Leaderboard = lazy(() => import('./components/Leaderboard').then(m => ({ default: m.Leaderboard })));
import type { Screen } from './components';
import { LevelConfig, LEVELS } from './types/levels';
import { GameModeType, ChallengeModeType, GameResult, AnswerRecord } from './types/gameModes';
import { useGameState } from './hooks/useGameState';
import {
  getDailyStats,
  updateDailyStats,
  checkAndUpdateDailyStreak,
  PRACTICE_PRESETS,
  PracticePresetId,
  CustomPreset,
  getSettings,
} from './utils/storage';

// Theme background gradients
const THEME_BACKGROUNDS = {
  dark: 'from-[#0f0c29] via-[#302b63] to-[#24243e]',
  purple: 'from-[#1a0a2e] via-[#4a1a6b] to-[#2d1a47]',
  blue: 'from-[#0a1628] via-[#1a3a5c] to-[#0d2137]',
  light: 'from-[#e8e8e8] via-[#d4d4d4] to-[#c0c0c0]',
} as const;

type AppState =
  | { screen: 'home' }
  | { screen: 'levelSelect' }
  | { screen: 'game'; level: LevelConfig }
  | { screen: 'reverseMode' }
  | { screen: 'melodicMode' }
  | { screen: 'leaderboard' }
  | { screen: 'result'; result: GameResult }
  | { screen: 'learn' }
  | { screen: 'stats' }
  | { screen: 'tools' }
  | { screen: 'settings' };

function App() {
  const [appState, setAppState] = useState<AppState>({ screen: 'home' });
  const [currentNavScreen, setCurrentNavScreen] = useState<Screen>('home');
  const [theme, setTheme] = useState<keyof typeof THEME_BACKGROUNDS>(() => getSettings().theme);

  // Listen for theme changes from settings
  useEffect(() => {
    const checkTheme = () => {
      const newTheme = getSettings().theme;
      if (newTheme !== theme) {
        setTheme(newTheme);
      }
    };
    // Check theme when returning from settings
    if (appState.screen !== 'settings') {
      checkTheme();
    }
  }, [appState.screen, theme]);
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
    // Special handling for modes that have dedicated components
    if (mode === 'reverse') {
      setAppState({ screen: 'reverseMode' });
      return;
    }
    if (mode === 'melodic') {
      setAppState({ screen: 'melodicMode' });
      return;
    }
    startGame(mode, 1);
    setAppState({ screen: 'game', level: LEVELS[0] });
  }, [startGame]);

  // Start with a practice preset
  const handleStartPreset = useCallback((presetId: PracticePresetId) => {
    const preset = PRACTICE_PRESETS[presetId];
    startWithPreset(preset);
    setAppState({ screen: 'game', level: LEVELS[0] });
  }, [startWithPreset]);

  // Start with a custom preset
  const handleStartCustomPreset = useCallback((preset: CustomPreset) => {
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

  // Handle completion of special game modes (Reverse, Melodic)
  const handleSpecialModeComplete = useCallback((score: number, accuracy: number) => {
    const result: GameResult = {
      mode: 'chords', // Default, as these modes don't use standard tracking
      level: 1,
      score,
      totalQuestions: 10,
      correctAnswers: Math.round((accuracy / 100) * 10),
      accuracy,
      totalXPEarned: score,
      longestStreak: 0,
      totalTime: 0,
      averageResponseTime: 0,
      newAchievements: [],
      answers: [],
    };
    setAppState({ screen: 'result', result });
  }, []);

  // Open leaderboard
  const handleOpenLeaderboard = useCallback(() => {
    setAppState({ screen: 'leaderboard' });
  }, []);

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
            onStartCustomPreset={handleStartCustomPreset}
            onOpenLeaderboard={handleOpenLeaderboard}
          />
        );

      case 'levelSelect':
        return (
          <LevelSelect
            onSelectLevel={handleSelectLevel}
            onBack={handleGoHome}
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
            onAnswer={handleAnswer}
            onNext={handleNext}
            onExit={handleExitGame}
          />
        );

      case 'reverseMode':
        return (
          <ReverseModeGame
            onComplete={handleSpecialModeComplete}
            onExit={handleGoHome}
          />
        );

      case 'melodicMode':
        return (
          <MelodicDictationGame
            onComplete={handleSpecialModeComplete}
            onExit={handleGoHome}
          />
        );

      case 'leaderboard':
        return <Leaderboard onBack={handleGoHome} />;

      case 'result':
        return (
          <ResultScreen
            result={appState.result}
            onPlayAgain={handlePlayAgain}
            onHome={handleGoHome}
          />
        );

      case 'learn':
        return <LearnScreen />;

      case 'stats':
        return <StatsScreen />;

      case 'tools':
        return <GuitarTools />;

      case 'settings':
        return <SettingsScreen />;

      default:
        return <HomeScreen onStartLevel={handleStartLevel} onStartChallenge={handleStartChallenge} onStartGameMode={handleStartGameMode} onStartPreset={handleStartPreset} onStartCustomPreset={handleStartCustomPreset} onOpenLeaderboard={handleOpenLeaderboard} />;
    }
  };

  // Don't show navigation during game
  const showNavigation = !['game', 'result', 'reverseMode', 'melodicMode', 'leaderboard'].includes(appState.screen);

  // Loading fallback for lazy components
  const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-lg">Loading...</div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${THEME_BACKGROUNDS[theme]} ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
      <Suspense fallback={<LoadingFallback />}>
        {renderScreen()}
      </Suspense>
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
