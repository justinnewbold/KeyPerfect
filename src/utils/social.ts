// Social sharing and leaderboard functionality

import { GameResult } from '../types/gameModes';

// Share result to social media
export interface ShareData {
  title: string;
  text: string;
  url?: string;
}

export function generateShareText(result: GameResult): string {
  const emojis = result.accuracy >= 90 ? '🎯🔥' : result.accuracy >= 70 ? '🎵✨' : '🎹💪';

  const modeNames: Record<string, string> = {
    daily: 'Daily Challenge',
    chords: 'Chord Recognition',
    scales: 'Scale Training',
    intervals: 'Interval Training',
    speedrun: 'Speed Run',
    survival: 'Survival Mode',
    reverse: 'Reverse Mode',
    melodic: 'Melodic Dictation',
  };

  const modeName = modeNames[result.mode] || result.mode;

  return `${emojis} KeyPerfect ${modeName}\n` +
    `Score: ${result.score} | Accuracy: ${Math.round(result.accuracy)}%\n` +
    `Streak: ${result.longestStreak} | Questions: ${result.correctAnswers}/${result.totalQuestions}\n` +
    `#KeyPerfect #EarTraining #MusicTheory`;
}

export function generateDailyShareText(result: GameResult, streakDays: number): string {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Generate visual score representation
  const boxes = Array(10).fill('⬜').map((_, i) =>
    i < Math.ceil(result.correctAnswers) ? '🟩' : '⬜'
  ).join('');

  return `KeyPerfect Daily ${date}\n` +
    `${boxes}\n` +
    `Score: ${result.score} | ${Math.round(result.accuracy)}%\n` +
    `🔥 ${streakDays} day streak\n` +
    `#KeyPerfect #DailyChallenge`;
}

export async function shareResult(result: GameResult, streakDays?: number): Promise<boolean> {
  const text = result.mode === 'daily' && streakDays !== undefined
    ? generateDailyShareText(result, streakDays)
    : generateShareText(result);

  const shareData: ShareData = {
    title: 'KeyPerfect Score',
    text,
  };

  // Try native share API first (mobile)
  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
      return false;
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

// Share to specific platforms
export function getShareUrls(result: GameResult): {
  twitter: string;
  facebook: string;
  whatsapp: string;
} {
  const text = encodeURIComponent(generateShareText(result));
  const url = encodeURIComponent(window.location.origin);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?quote=${text}`,
    whatsapp: `https://wa.me/?text=${text}`,
  };
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  accuracy: number;
  date: string;
  isCurrentUser?: boolean;
}

export interface Leaderboard {
  daily: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
}

// Local leaderboard storage (would connect to backend in production)
const LEADERBOARD_KEY = 'keyperfect_leaderboard';

interface LocalLeaderboardData {
  entries: {
    score: number;
    accuracy: number;
    date: string;
    mode: string;
  }[];
  username: string;
}

export function getLocalLeaderboard(): LocalLeaderboardData {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading leaderboard:', e);
  }
  return { entries: [], username: 'Player' };
}

export function saveToLeaderboard(result: GameResult) {
  const data = getLocalLeaderboard();

  data.entries.push({
    score: result.score,
    accuracy: result.accuracy,
    date: new Date().toISOString(),
    mode: result.mode,
  });

  // Keep only last 100 entries
  if (data.entries.length > 100) {
    data.entries = data.entries.slice(-100);
  }

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to leaderboard:', e);
  }
}

export function setUsername(username: string) {
  const data = getLocalLeaderboard();
  data.username = username;

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving username:', e);
  }
}

export function getUsername(): string {
  return getLocalLeaderboard().username;
}

// Generate mock leaderboard with user's best scores
export function generateLeaderboard(mode: string = 'daily'): Leaderboard {
  const data = getLocalLeaderboard();
  const userEntries = data.entries.filter(e => e.mode === mode);

  // Sort by score descending
  const sortedEntries = [...userEntries].sort((a, b) => b.score - a.score);

  // Generate mock players
  const mockNames = [
    'MusicMaster', 'EarTrainer', 'ChordWizard', 'PitchPerfect',
    'ScaleRunner', 'MelodyMaker', 'HarmonyHero', 'RhythmKing',
  ];

  const generateMockEntries = (count: number, scoreRange: [number, number]): LeaderboardEntry[] => {
    return Array(count).fill(null).map((_, i) => ({
      rank: i + 1,
      username: mockNames[i % mockNames.length] + (i >= mockNames.length ? (i + 1).toString() : ''),
      score: Math.floor(scoreRange[0] + Math.random() * (scoreRange[1] - scoreRange[0])),
      accuracy: Math.floor(70 + Math.random() * 30),
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  };

  // Create leaderboards
  const daily = generateMockEntries(10, [150, 300]);
  const weekly = generateMockEntries(10, [1000, 2500]);
  const allTime = generateMockEntries(10, [5000, 15000]);

  // Insert user's best score if available
  if (sortedEntries.length > 0) {
    const userBest = sortedEntries[0];
    const userEntry: LeaderboardEntry = {
      rank: 0,
      username: data.username,
      score: userBest.score,
      accuracy: userBest.accuracy,
      date: userBest.date,
      isCurrentUser: true,
    };

    // Find position in daily
    const dailyPos = daily.findIndex(e => e.score < userEntry.score);
    if (dailyPos !== -1) {
      daily.splice(dailyPos, 0, userEntry);
      daily.pop();
    }
  }

  // Update ranks
  [daily, weekly, allTime].forEach(board => {
    board.forEach((entry, i) => {
      entry.rank = i + 1;
    });
  });

  return { daily, weekly, allTime };
}

// Achievements for social sharing
export function getShareableAchievements(): string[] {
  const achievements: string[] = [];

  // Check various milestones
  const data = getLocalLeaderboard();
  const totalGames = data.entries.length;

  if (totalGames >= 100) achievements.push('🎮 100 Games Played');
  if (totalGames >= 50) achievements.push('🎮 50 Games Played');

  const perfectGames = data.entries.filter(e => e.accuracy >= 100).length;
  if (perfectGames >= 10) achievements.push('🎯 10 Perfect Games');
  if (perfectGames >= 1) achievements.push('🎯 First Perfect Game');

  return achievements;
}
