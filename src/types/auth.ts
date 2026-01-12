// User Authentication Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
  subscription: 'free' | 'premium';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Sync Types
export interface SyncState {
  lastSyncedAt: string | null;
  isSyncing: boolean;
  pendingChanges: number;
  syncError: string | null;
}

export interface SyncData {
  userStats: unknown;
  levelProgress: unknown[];
  chordStats: unknown[];
  scaleStats: unknown[];
  intervalStats: unknown[];
  dailyStats: unknown;
  gameModeStats: unknown[];
  achievements: string[];
  settings: unknown;
  sessionHistory: unknown[];
  customPracticeSets: unknown[];
  timestamp: string;
}

export interface CloudBackup {
  id: string;
  userId: string;
  data: SyncData;
  createdAt: string;
  deviceInfo: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  rank: number;
  mode: string;
  achievedAt: string;
}

export interface LeaderboardData {
  global: LeaderboardEntry[];
  friends: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  userRank?: number;
}

// Social Types
export interface Friend {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'playing';
  lastActive: string;
}

export interface Challenge {
  id: string;
  challengerId: string;
  challengerName: string;
  challengedId: string;
  challengedName: string;
  mode: string;
  challengerScore?: number;
  challengedScore?: number;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  createdAt: string;
  expiresAt: string;
}
