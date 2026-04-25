import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState,
  GameQuestion,
  AnswerRecord,
  GameResult,
  GameModeType,
  ChallengeModeType,
} from '../types/gameModes';
import { PracticePreset } from '../utils/storage';
import { LevelConfig, LEVELS } from '../types/levels';
import { MUSIC_KEYS_LEVELS } from '../types/musicKeysLevels';
import { NOTES_LEVELS } from '../types/notesLevels';
import { generateGameQuestions, generateMusicKeyQuestions, generateNoteQuestions, shuffleArray } from '../utils/gameHelpers';
import {
  getUserStats,
  updateUserStats,
  updateChordStats,
  updateScaleStats,
  updateIntervalStats,
  updateKeyStats,
  updateNoteStats,
  updateLevelProgress,
  updateMusicKeysProgress,
  updateNotesProgress,
  checkAndUnlockAchievements,
  updateGameModeStats,
  addSessionToHistory,
  getDailyStats,
} from '../utils/storage';
import { calculateQuestionXP, getLevelFromXP } from '../types/stats';
import { updateReviewItem } from '../utils/spacedRepetition';

interface UseGameStateReturn {
  gameState: GameState | null;
  startGame: (mode: GameModeType | ChallengeModeType, levelId?: number) => void;
  startWithPreset: (preset: PracticePreset) => void;
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
  // Synchronous guard so two near-simultaneous endGame() calls (e.g. the
  // timeExpired effect firing while the user clicks Next) don't both
  // execute the post-game side effects against the same closure snapshot.
  const endingRef = useRef(false);

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
    endingRef.current = false;

    let questions: GameQuestion[];
    let totalQuestions: number;

    // Handle Music Keys mode separately
    if (mode === 'musickeys') {
      const musicKeysLevel = MUSIC_KEYS_LEVELS.find(l => l.id === levelId) || MUSIC_KEYS_LEVELS[0];
      totalQuestions = musicKeysLevel.questionsToComplete;
      questions = generateMusicKeyQuestions(musicKeysLevel, totalQuestions);
    } else if (mode === 'notes') {
      const notesLevel = NOTES_LEVELS.find(l => l.id === levelId) || NOTES_LEVELS[0];
      totalQuestions = notesLevel.questionsToComplete;
      questions = generateNoteQuestions(notesLevel, totalQuestions);
    } else {
      const level = LEVELS.find(l => l.id === levelId) || LEVELS[0];
      totalQuestions = level.questionsToComplete;

      // Adjust for challenge modes
      if (mode === 'daily') {
        totalQuestions = 10;
      } else if (mode === 'speedrun') {
        totalQuestions = 50; // Max possible in time limit
      } else if (mode === 'survival') {
        totalQuestions = 100; // Unlimited, but cap at 100
      }

      // Convert challenge modes to game modes for question generation
      const gameMode: GameModeType =
        mode === 'daily' || mode === 'speedrun' || mode === 'survival' || mode === 'timeattack'
          ? 'chords'
          : mode;

      questions = generateGameQuestions(level, gameMode, totalQuestions);
    }

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
      gameStartTime: now,
      startTime: now,
      isComplete: false,
      isPracticeMode: mode === 'practice',
    });
  }, []);

  // Start game with a preset configuration
  const startWithPreset = useCallback((preset: PracticePreset) => {
    setTimeExpired(false);
    endingRef.current = false;
    const level = LEVELS[0]; // Use level 1 as base
    const totalQuestions = preset.questionCount;

    // Generate questions from each mode in the preset, mixed together
    const questionsPerMode = Math.ceil(totalQuestions / preset.modes.length);
    let allQuestions: GameQuestion[] = [];

    preset.modes.forEach(mode => {
      const modeQuestions = generateGameQuestions(level, mode, questionsPerMode);
      allQuestions = [...allQuestions, ...modeQuestions];
    });

    // Shuffle and trim to exact question count
    allQuestions = shuffleArray(allQuestions).slice(0, totalQuestions);

    // Adjust difficulty based on preset
    if (preset.difficulty !== 'progressive') {
      const difficultyMultiplier = preset.difficulty === 'easy' ? 0.3 : preset.difficulty === 'medium' ? 0.5 : 0.8;
      allQuestions = allQuestions.map(q => ({
        ...q,
        difficulty: difficultyMultiplier,
      }));
    }

    const now = Date.now();
    const primaryMode = preset.modes[0] as GameModeType;

    setGameState({
      mode: primaryMode,
      level: 1,
      currentQuestion: 0,
      totalQuestions,
      score: 0,
      streak: 0,
      lives: 0,
      timeRemaining: preset.timeLimit || 0,
      questions: allQuestions,
      answers: [],
      gameStartTime: now,
      startTime: now,
      isComplete: false,
      isPracticeMode: false,
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
      questionType: question.type,
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
    } else if (question.type === 'musickeys') {
      updateKeyStats(question.correctAnswer, isCorrect);
    } else if (question.type === 'notes') {
      updateNoteStats(question.correctAnswer, isCorrect);
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

      // Progressive difficulty: adjust upcoming question difficulty based on performance
      const correctSoFar = prev.answers.filter(a => a.isCorrect).length;
      const totalSoFar = prev.answers.length;
      const accuracy = totalSoFar > 0 ? correctSoFar / totalSoFar : 0.5;

      // Scale difficulty: high accuracy → harder questions, low accuracy → easier
      let difficultyAdjust = 0;
      if (accuracy >= 0.9 && totalSoFar >= 3) difficultyAdjust = 0.2;
      else if (accuracy >= 0.75) difficultyAdjust = 0.1;
      else if (accuracy < 0.5 && totalSoFar >= 3) difficultyAdjust = -0.15;
      else if (accuracy < 0.3) difficultyAdjust = -0.25;

      // Apply difficulty adjustment to the next question
      const updatedQuestions = [...prev.questions];
      const nextQ = updatedQuestions[nextIndex];
      if (nextQ && difficultyAdjust !== 0) {
        const baseDifficulty = nextQ.difficulty || 0.5;
        updatedQuestions[nextIndex] = {
          ...nextQ,
          difficulty: Math.max(0.1, Math.min(1.0, baseDifficulty + difficultyAdjust)),
        };
      }

      return {
        ...prev,
        currentQuestion: nextIndex,
        questions: updatedQuestions,
        startTime: Date.now(), // Reset for response time tracking
      };
    });
  }, []);

  const endGame = useCallback((): GameResult => {
    if (!gameState) {
      throw new Error('No active game');
    }
    if (endingRef.current) {
      throw new Error('Game already ended');
    }
    endingRef.current = true;

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

    // Update user stats.
    // currentStreak reflects daily play streak (see AnalyticsDashboard "days in a row"),
    // so keep it synced with DailyStats rather than the per-session answer streak.
    const userStats = getUserStats();
    const dailyStats = getDailyStats();
    const updatedStats = updateUserStats({
      totalXP: userStats.totalXP + totalXPEarned,
      totalQuestionsAnswered: userStats.totalQuestionsAnswered + gameState.answers.length,
      totalCorrect: userStats.totalCorrect + correctAnswers,
      totalIncorrect: userStats.totalIncorrect + (gameState.answers.length - correctAnswers),
      currentStreak: dailyStats.currentStreak,
      longestStreak: Math.max(userStats.longestStreak, longestStreak),
      currentLevel: getLevelFromXP(userStats.totalXP + totalXPEarned),
      lastPlayedDate: new Date().toISOString().split('T')[0],
    });

    // Update level progress
    if (gameState.mode === 'musickeys') {
      updateMusicKeysProgress(gameState.level, {
        questionsCompleted: correctAnswers,
        bestScore: Math.max(0, gameState.score),
      });
    } else if (gameState.mode === 'notes') {
      updateNotesProgress(gameState.level, {
        questionsCompleted: correctAnswers,
        bestScore: Math.max(0, gameState.score),
      });
    } else {
      const level = LEVELS.find(l => l.id === gameState.level);
      if (level) {
        updateLevelProgress(gameState.level, {
          questionsCompleted: correctAnswers,
          bestScore: Math.max(0, gameState.score),
        });
      }
    }

    // Update game mode stats
    updateGameModeStats(gameState.mode, gameState.score, totalTime);

    // Save session to history
    addSessionToHistory({
      date: new Date().toISOString().split('T')[0],
      mode: gameState.mode,
      score: gameState.score,
      totalQuestions: gameState.answers.length,
      correctAnswers,
      accuracy,
      duration: Math.round(totalTime),
      xpEarned: totalXPEarned,
      streak: longestStreak,
    });

    // Check for new achievements
    const newAchievements = checkAndUnlockAchievements(updatedStats);

    // Build category breakdown for session summary
    const categoryMap = new Map<string, { correct: number; total: number }>();
    for (const answer of gameState.answers) {
      const cat = answer.questionType || gameState.mode;
      const entry = categoryMap.get(cat) || { correct: 0, total: 0 };
      entry.total++;
      if (answer.isCorrect) entry.correct++;
      categoryMap.set(cat, entry);
    }
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      correct: data.correct,
      total: data.total,
      accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    }));

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
      categoryBreakdown,
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
    startWithPreset,
    submitAnswer,
    nextQuestion,
    endGame,
    replayAudio,
    isPlaying,
    setIsPlaying,
    timeExpired,
  };
}
