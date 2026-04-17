/**
 * Cloud Sync Service
 *
 * This module provides cloud synchronization for user data.
 * Note: This requires a backend server to be implemented.
 * The API endpoints are defined here for future implementation.
 */

import {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
  SyncData,
  CloudBackup,
  LeaderboardData,
  LeaderboardEntry,
  Friend,
  Challenge,
} from '../types/auth';
import {
  getUserStats,
  getLevelProgress,
  getChordStats,
  getScaleStats,
  getIntervalStats,
  getDailyStats,
  getGameModeStats,
  getSettings,
  getSessionHistory,
  updateUserStats,
} from './storage';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.keyperfect.app';
const STORAGE_KEY_TOKENS = 'keyperfect_auth_tokens';
const STORAGE_KEY_USER = 'keyperfect_user';
const STORAGE_KEY_SYNC = 'keyperfect_sync_state';

// Helper to get stored tokens
function getStoredTokens(): AuthTokens | null {
  try {
    const tokens = localStorage.getItem(STORAGE_KEY_TOKENS);
    return tokens ? JSON.parse(tokens) : null;
  } catch {
    return null;
  }
}

// Helper to store tokens
function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
}

// Helper to clear auth data
function clearAuthData(): void {
  localStorage.removeItem(STORAGE_KEY_TOKENS);
  localStorage.removeItem(STORAGE_KEY_USER);
}

// API request helper with auth
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const tokens = getStoredTokens();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (tokens?.accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== Authentication ====================

export async function login(credentials: LoginCredentials): Promise<User> {
  const { user, tokens } = await apiRequest<{ user: User; tokens: AuthTokens }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(credentials),
    }
  );

  storeTokens(tokens);
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));

  return user;
}

export async function register(credentials: RegisterCredentials): Promise<User> {
  const { user, tokens } = await apiRequest<{ user: User; tokens: AuthTokens }>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(credentials),
    }
  );

  storeTokens(tokens);
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));

  return user;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    clearAuthData();
  }
}

export async function refreshToken(): Promise<AuthTokens> {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token available');
  }

  const newTokens = await apiRequest<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });

  storeTokens(newTokens);
  return newTokens;
}

export function getCurrentUser(): User | null {
  try {
    const user = localStorage.getItem(STORAGE_KEY_USER);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const tokens = getStoredTokens();
  const user = getCurrentUser();
  return !!(tokens?.accessToken && user);
}

// ==================== Cloud Sync ====================

export function collectSyncData(): SyncData {
  return {
    userStats: getUserStats(),
    levelProgress: getLevelProgress(),
    chordStats: getChordStats(),
    scaleStats: getScaleStats(),
    intervalStats: getIntervalStats(),
    dailyStats: getDailyStats(),
    gameModeStats: getGameModeStats(),
    achievements: JSON.parse(localStorage.getItem('keyperfect_achievements') || '[]'),
    settings: getSettings(),
    sessionHistory: getSessionHistory(),
    customPracticeSets: JSON.parse(localStorage.getItem('keyperfect_custom_sets') || '[]'),
    timestamp: new Date().toISOString(),
  };
}

export async function syncToCloud(): Promise<CloudBackup> {
  if (!isAuthenticated()) {
    throw new Error('Must be logged in to sync');
  }

  const syncData = collectSyncData();

  const backup = await apiRequest<CloudBackup>('/sync/upload', {
    method: 'POST',
    body: JSON.stringify({
      data: syncData,
      deviceInfo: navigator.userAgent,
    }),
  });

  // Update sync state
  localStorage.setItem(
    STORAGE_KEY_SYNC,
    JSON.stringify({
      lastSyncedAt: new Date().toISOString(),
      isSyncing: false,
      pendingChanges: 0,
      syncError: null,
    })
  );

  return backup;
}

export async function syncFromCloud(): Promise<SyncData> {
  if (!isAuthenticated()) {
    throw new Error('Must be logged in to sync');
  }

  const backup = await apiRequest<CloudBackup>('/sync/download');

  // Apply the synced data to local storage
  if (backup.data.userStats) {
    updateUserStats(backup.data.userStats as Parameters<typeof updateUserStats>[0]);
  }

  // Store other data...
  if (backup.data.achievements) {
    localStorage.setItem('keyperfect_achievements', JSON.stringify(backup.data.achievements));
  }

  if (backup.data.customPracticeSets) {
    localStorage.setItem('keyperfect_custom_sets', JSON.stringify(backup.data.customPracticeSets));
  }

  return backup.data;
}

export async function getCloudBackups(): Promise<CloudBackup[]> {
  return apiRequest<CloudBackup[]>('/sync/backups');
}

export async function restoreBackup(backupId: string): Promise<SyncData> {
  const backup = await apiRequest<CloudBackup>(`/sync/backups/${backupId}`);
  // Apply backup data locally...
  return backup.data;
}

// ==================== Leaderboard ====================

export async function getLeaderboard(
  mode: string = 'overall',
  timeframe: 'all' | 'weekly' | 'daily' = 'all'
): Promise<LeaderboardData> {
  return apiRequest<LeaderboardData>(
    `/leaderboard?mode=${mode}&timeframe=${timeframe}`
  );
}

export async function submitScore(
  mode: string,
  score: number
): Promise<LeaderboardEntry> {
  return apiRequest<LeaderboardEntry>('/leaderboard/submit', {
    method: 'POST',
    body: JSON.stringify({ mode, score }),
  });
}

// ==================== Social Features ====================

export async function getFriends(): Promise<Friend[]> {
  return apiRequest<Friend[]>('/social/friends');
}

export async function addFriend(userId: string): Promise<Friend> {
  return apiRequest<Friend>('/social/friends', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function removeFriend(userId: string): Promise<void> {
  await apiRequest(`/social/friends/${userId}`, { method: 'DELETE' });
}

export async function getChallenges(): Promise<Challenge[]> {
  return apiRequest<Challenge[]>('/social/challenges');
}

export async function createChallenge(
  challengedUserId: string,
  mode: string
): Promise<Challenge> {
  return apiRequest<Challenge>('/social/challenges', {
    method: 'POST',
    body: JSON.stringify({ challengedUserId, mode }),
  });
}

export async function respondToChallenge(
  challengeId: string,
  accept: boolean
): Promise<Challenge> {
  return apiRequest<Challenge>(`/social/challenges/${challengeId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  });
}

export async function submitChallengeScore(
  challengeId: string,
  score: number
): Promise<Challenge> {
  return apiRequest<Challenge>(`/social/challenges/${challengeId}/score`, {
    method: 'POST',
    body: JSON.stringify({ score }),
  });
}

// ==================== Offline Support ====================

let pendingSync: SyncData[] = [];

export function queueOfflineSync(data: Partial<SyncData>): void {
  pendingSync.push({
    ...collectSyncData(),
    ...data,
    timestamp: new Date().toISOString(),
  });

  // Store pending syncs
  localStorage.setItem('keyperfect_pending_sync', JSON.stringify(pendingSync));
}

export async function processPendingSync(): Promise<void> {
  if (!isAuthenticated()) return;

  // Load any pending syncs persisted from a previous session before checking if
  // there's anything to process.
  const stored = localStorage.getItem('keyperfect_pending_sync');
  if (stored) {
    try {
      pendingSync = JSON.parse(stored);
    } catch {
      pendingSync = [];
    }
  }

  if (pendingSync.length === 0) return;

  for (const data of pendingSync) {
    try {
      await apiRequest('/sync/upload', {
        method: 'POST',
        body: JSON.stringify({ data, deviceInfo: navigator.userAgent }),
      });
    } catch (error) {
      console.error('Failed to sync pending data:', error);
      return; // Stop processing on first failure
    }
  }

  // Clear pending syncs
  pendingSync = [];
  localStorage.removeItem('keyperfect_pending_sync');
}

// Auto-sync when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processPendingSync();
  });
}
