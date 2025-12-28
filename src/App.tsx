import React, { useState, useCallback, useEffect } from 'react';
import {
  Navigation,
  HomeScreen,
  LevelSelect,
  GameScreen,
  ResultScreen,
  StatsScreen,
  GuitarTools,
  LearnScreen,
  SettingsScreen,
} from './components';
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
} from './utils/storage';

type AppState =
  | { screen: 'home' }
  | { screen: 'levelSelect' }
  | { screen: 'game'; level: LevelConfig }
  | { screen: 'result'; result: GameResult }
  | { screen: 'learn' }
  | { screen: 'stats' }
  | { screen: 'tools' }
  | { screen: 'settings' };

function App() {
  const [appState, setAppState] = useState<AppState>({ screen: 'home' });
  const [currentNavScreen, setCurrentNavScreen] = useState<Screen>('home');
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
        return <HomeScreen onStartLevel={handleStartLevel} onStartChallenge={handleStartChallenge} onStartGameMode={handleStartGameMode} onStartPreset={handleStartPreset} onStartCustomPreset={handleStartCustomPreset} />;
    }
  };

  // Don't show navigation during game
  const showNavigation = appState.screen !== 'game' && appState.screen !== 'result';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      {renderScreen()}
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
