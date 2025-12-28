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

  // Generate visual score representation (scale to 10 boxes based on percentage)
  const scoreRatio = result.totalQuestions > 0 ? result.correctAnswers / result.totalQuestions : 0;
  const filledBoxes = Math.round(scoreRatio * 10);
  const boxes = Array(10).fill('⬜').map((_, i) =>
    i < filledBoxes ? '🟩' : '⬜'
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

// Generate leaderboard from user's actual game history
export function generateLeaderboard(mode: string = 'daily'): Leaderboard {
  const data = getLocalLeaderboard();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - (7 * 24 * 60 * 60 * 1000);

  // Filter entries by time period
  const filterByPeriod = (entries: typeof data.entries, periodStart: number): LeaderboardEntry[] => {
    return entries
      .filter(e => new Date(e.date).getTime() >= periodStart)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((entry, index) => ({
        rank: index + 1,
        username: data.username,
        score: entry.score,
        accuracy: entry.accuracy,
        date: entry.date,
        isCurrentUser: true,
      }));
  };

  // Generate personal best leaderboards based on actual data
  const daily = filterByPeriod(data.entries, todayStart);
  const weekly = filterByPeriod(data.entries, weekStart);
  const allTime = data.entries
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((entry, index) => ({
      rank: index + 1,
      username: data.username,
      score: entry.score,
      accuracy: entry.accuracy,
      date: entry.date,
      isCurrentUser: true,
    }));

  // If no entries, show placeholder message
  const createPlaceholder = (message: string): LeaderboardEntry[] => [{
    rank: 1,
    username: message,
    score: 0,
    accuracy: 0,
    date: new Date().toISOString(),
  }];

  return {
    daily: daily.length > 0 ? daily : createPlaceholder('Play a game to see your daily scores!'),
    weekly: weekly.length > 0 ? weekly : createPlaceholder('Play a game to see your weekly scores!'),
    allTime: allTime.length > 0 ? allTime : createPlaceholder('Play a game to see your best scores!'),
  };
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
