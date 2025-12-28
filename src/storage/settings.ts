// Settings storage module

import { InstrumentType } from '../types/instruments';
import { STORAGE_KEYS, getItem, setItem } from './core';

export interface AppSettings {
  instrument: InstrumentType;
  volume: number;
  soundEffects: boolean;
  autoAdvance: boolean;
  showHints: boolean;
  playMode: 'chord' | 'arpeggio';
  theme: 'dark' | 'light' | 'purple' | 'blue';
  notifications: boolean;
  lastPreset?: string;
}

export function getDefaultSettings(): AppSettings {
  return {
    instrument: 'piano',
    volume: 0.7,
    soundEffects: true,
    autoAdvance: true,
    showHints: true,
    playMode: 'chord',
    theme: 'dark',
    notifications: true,
  };
}

export function getSettings(): AppSettings {
  return getItem(STORAGE_KEYS.SETTINGS, getDefaultSettings());
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...updates };
  setItem(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}
