import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState,
  GameQuestion,
  AnswerRecord,
  GameResult,
  GameModeType,
  ChallengeModeType,
} from '../types/gameModes';
import { LevelConfig, LEVELS } from '../types/levels';
import { generateGameQuestions } from '../utils/gameHelpers';
import {
  getUserStats,
  updateUserStats,
  updateChordStats,
  updateScaleStats,
  updateIntervalStats,
  updateLevelProgress,
  checkAndUnlockAchievements,
  updateGameModeStats,
} from '../utils/storage';
import { calculateQuestionXP, getLevelFromXP } from '../types/stats';
import { updateReviewItem } from '../utils/spacedRepetition';

interface UseGameStateReturn {
  gameState: GameState | null;
  startGame: (mode: GameModeType | ChallengeModeType, levelId?: number) => void;
  submitAnswer: (answer: string) => AnswerRecord;
  nextQuestion: () => void;
  endGame: () => GameResult;
  replayAudio: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  timeExpired: boolean;
}

export function useGameState(): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Timer effect for timed game modes
  useEffect(() => {
    if (!gameState) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const isTimedMode = gameState.mode === 'speedrun' || gameState.mode === 'timeattack';

    if (!isTimedMode || gameState.isComplete) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setGameState(prev => {
        if (!prev || prev.isComplete) return prev;

        const newTime = prev.timeRemaining - 1;

        if (newTime <= 0) {
          setTimeExpired(true);
          return { ...prev, timeRemaining: 0, isComplete: true };
        }

        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState?.mode, gameState?.isComplete]);

  // Reset timeExpired when starting a new game
  const startGame = useCallback((
    mode: GameModeType | ChallengeModeType,
    levelId: number = 1
  ) => {
    setTimeExpired(false);
    const level = LEVELS.find(l => l.id === levelId) || LEVELS[0];
    let totalQuestions = level.questionsToComplete;

    // Adjust for challenge modes
    if (mode === 'daily') {
      totalQuestions = 10;
    } else if (mode === 'speedrun') {
      totalQuestions = 50; // Max possible in time limit
    } else if (mode === 'survival') {
      totalQuestions = 100; // Unlimited, but cap at 100
    }

    // Convert challenge modes to game modes for question generation
    // Challenge modes use mixed content (chords, scales, intervals)
    const isChallengeMode = mode === 'daily' || mode === 'speedrun' || mode === 'survival' || mode === 'timeattack';
    const gameMode: GameModeType = isChallengeMode
      ? (['chords', 'scales', 'intervals'][Math.floor(Math.random() * 3)] as GameModeType)
      : mode;

    const questions = generateGameQuestions(level, gameMode, totalQuestions);

    const now = Date.now();
    setGameState({
      mode,
      level: levelId,
      currentQuestion: 0,
      totalQuestions,
      score: 0,
      streak: 0,
      lives: mode === 'survival' ? 3 : 0,
      timeRemaining: mode === 'speedrun' ? 60 : mode === 'timeattack' ? 30 : 0,
      questions,
      answers: [],
      gameStartTime: now, // Track when game started for total time
      startTime: now, // Track when current question started for response time
      isComplete: false,
    });
  }, []);

  const submitAnswer = useCallback((answer: string): AnswerRecord => {
    if (!gameState) {
      throw new Error('No active game');
    }

    const question = gameState.questions[gameState.currentQuestion];
    const isCorrect = answer === question.correctAnswer;
    const timeToAnswer = Date.now() - gameState.startTime;

    // Calculate XP
    const xpEarned = calculateQuestionXP(
      isCorrect,
      gameState.streak,
      question.difficulty
    );

    const record: AnswerRecord = {
      questionId: question.id,
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      timeToAnswer,
      xpEarned,
    };

    // Update stats based on question type
    if (question.type === 'chords') {
      updateChordStats(question.correctAnswer, isCorrect);
      updateReviewItem('chord', question.correctAnswer, isCorrect, timeToAnswer, gameState.streak);
    } else if (question.type === 'scales') {
      updateScaleStats(question.correctAnswer, isCorrect);
      updateReviewItem('scale', question.correctAnswer, isCorrect, timeToAnswer, gameState.streak);
    } else if (question.type === 'intervals') {
      updateIntervalStats(question.correctAnswer, isCorrect);
      updateReviewItem('interval', question.correctAnswer, isCorrect, timeToAnswer, gameState.streak);
    }

    // Update game state
    setGameState(prev => {
      if (!prev) return null;

      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const newLives = !isCorrect && prev.mode === 'survival'
        ? prev.lives - 1
        : prev.lives;

      // Time adjustments for timeattack mode
      let newTime = prev.timeRemaining;
      if (prev.mode === 'timeattack') {
        if (isCorrect) {
          newTime = prev.timeRemaining + 3; // Add 3 seconds for correct answer
        } else {
          newTime = Math.max(0, prev.timeRemaining - 2); // Subtract 2 seconds for wrong answer
        }
      } else if (prev.mode === 'speedrun' && !isCorrect) {
        newTime = Math.max(0, prev.timeRemaining - 2); // Subtract 2 seconds for wrong answer in speedrun
      }

      // Check if game should end
      const shouldEnd =
        (prev.mode === 'survival' && newLives <= 0) ||
        prev.currentQuestion >= prev.totalQuestions - 1;

      return {
        ...prev,
        score: prev.score + xpEarned,
        streak: newStreak,
        lives: newLives,
        timeRemaining: newTime,
        answers: [...prev.answers, record],
        isComplete: shouldEnd,
      };
    });

    return record;
  }, [gameState]);

  const nextQuestion = useCallback(() => {
    setGameState(prev => {
      if (!prev) return null;
      const nextIndex = prev.currentQuestion + 1;

      if (nextIndex >= prev.totalQuestions) {
        return { ...prev, isComplete: true };
      }

      return {
        ...prev,
        currentQuestion: nextIndex,
        startTime: Date.now(), // Reset for response time tracking
      };
    });
  }, []);

  const endGame = useCallback((): GameResult => {
    if (!gameState) {
      throw new Error('No active game');
    }

    const correctAnswers = gameState.answers.filter(a => a.isCorrect).length;
    const totalXPEarned = gameState.answers.reduce((sum, a) => sum + a.xpEarned, 0);
    const totalTime = (Date.now() - gameState.gameStartTime) / 1000;
    const accuracy = gameState.answers.length > 0
      ? (correctAnswers / gameState.answers.length) * 100
      : 0;

    // Calculate longest streak from answers
    let longestStreak = 0;
    let currentStreak = 0;
    gameState.answers.forEach(a => {
      if (a.isCorrect) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    // Update user stats
    const userStats = getUserStats();
    const updatedStats = updateUserStats({
      totalXP: userStats.totalXP + totalXPEarned,
      totalQuestionsAnswered: userStats.totalQuestionsAnswered + gameState.answers.length,
      totalCorrect: userStats.totalCorrect + correctAnswers,
      totalIncorrect: userStats.totalIncorrect + (gameState.answers.length - correctAnswers),
      currentStreak: longestStreak,
      longestStreak: Math.max(userStats.longestStreak, longestStreak),
      currentLevel: getLevelFromXP(userStats.totalXP + totalXPEarned),
      lastPlayedDate: new Date().toISOString().split('T')[0],
    });

    // Update level progress
    const level = LEVELS.find(l => l.id === gameState.level);
    if (level) {
      updateLevelProgress(gameState.level, {
        questionsCompleted: correctAnswers,
        bestScore: Math.max(0, gameState.score),
      });
    }

    // Update game mode stats
    updateGameModeStats(gameState.mode, gameState.score, totalTime);

    // Check for new achievements
    const newAchievements = checkAndUnlockAchievements(updatedStats);

    const result: GameResult = {
      mode: gameState.mode,
      level: gameState.level,
      score: gameState.score,
      totalQuestions: gameState.answers.length,
      correctAnswers,
      accuracy,
      totalXPEarned,
      longestStreak,
      totalTime,
      averageResponseTime: totalTime / Math.max(1, gameState.answers.length),
      newAchievements: newAchievements.map(a => a.id),
      answers: gameState.answers,
    };

    setGameState(null);
    return result;
  }, [gameState]);

  const replayAudio = useCallback(() => {
    setIsPlaying(true);
    // Audio replay is handled by the component
  }, []);

  return {
    gameState,
    startGame,
    submitAnswer,
    nextQuestion,
    endGame,
    replayAudio,
    isPlaying,
    setIsPlaying,
    timeExpired,
  };
}
