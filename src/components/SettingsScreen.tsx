import React, { useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Palette,
  Bell,
  BellOff,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Check,
  Accessibility,
  Eye,
  Type,
  Sparkles,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { INSTRUMENTS, InstrumentType, getInstrumentList } from '../types/instruments';
import {
  getSettings,
  updateSettings,
  AppSettings,
  resetAllData,
  exportData,
  importData,
  trackInstrumentUsage,
  getStreakFreezeData,
  updateStreakFreezeSettings,
} from '../utils/storage';
import { useAudio } from '../hooks/useAudio';
import { useAccessibility, AccessibilitySettings } from '../utils/accessibility';

interface SettingsScreenProps {
  onReplayTutorial?: () => void;
}

export function SettingsScreen({ onReplayTutorial }: SettingsScreenProps = {}) {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [streakFreezeEnabled, setStreakFreezeEnabled] = useState(getStreakFreezeData().autoFreezeEnabled);
  const audio = useAudio();
  const a11y = useAccessibility();

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setSettings(prev => ({ ...prev, volume }));
    updateSettings({ volume });
    audio.setVolume(volume);
  }, [audio]);

  const handleInstrumentChange = useCallback((instrument: InstrumentType) => {
    setSettings(prev => ({ ...prev, instrument }));
    updateSettings({ instrument });
    trackInstrumentUsage(instrument);
    audio.setInstrument(instrument);
    // Play a sample chord with the new instrument
    audio.playChord([60, 64, 67]);
  }, [audio]);

  const handleSoundEffectsToggle = useCallback(() => {
    const newValue = !settings.soundEffects;
    setSettings(prev => ({ ...prev, soundEffects: newValue }));
    updateSettings({ soundEffects: newValue });
    if (newValue) {
      audio.playSuccess();
    }
  }, [settings.soundEffects, audio]);

  const handleThemeChange = useCallback((theme: AppSettings['theme']) => {
    setSettings(prev => ({ ...prev, theme }));
    updateSettings({ theme });
    // App.tsx's theme effect only fires on appState changes, so without
    // applying the class here the new theme wouldn't show until the user
    // navigated away from Settings.
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-purple', 'theme-blue', 'theme-light');
    root.classList.add(`theme-${theme}`);
  }, []);

  const handlePlayModeChange = useCallback((playMode: AppSettings['playMode']) => {
    setSettings(prev => ({ ...prev, playMode }));
    updateSettings({ playMode });
  }, []);

  const handleAutoAdvanceToggle = useCallback(() => {
    const newValue = !settings.autoAdvance;
    setSettings(prev => ({ ...prev, autoAdvance: newValue }));
    updateSettings({ autoAdvance: newValue });
  }, [settings.autoAdvance]);

  const handleShowHintsToggle = useCallback(() => {
    const newValue = !settings.showHints;
    setSettings(prev => ({ ...prev, showHints: newValue }));
    updateSettings({ showHints: newValue });
  }, [settings.showHints]);

  const handleNotificationsToggle = useCallback(() => {
    const newValue = !settings.notifications;
    setSettings(prev => ({ ...prev, notifications: newValue }));
    updateSettings({ notifications: newValue });
  }, [settings.notifications]);

  const handleExportData = useCallback(() => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyperfect-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleImportData = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const success = importData(content);
          setImportStatus(success ? 'success' : 'error');
          if (success) {
            setSettings(getSettings());
          }
          setTimeout(() => setImportStatus('idle'), 3000);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  const handleResetData = useCallback(() => {
    resetAllData();
    setSettings(getSettings());
    setShowResetConfirm(false);
  }, []);

  const instruments = getInstrumentList();

  const themes = [
    { id: 'dark', name: 'Dark', color: 'from-gray-800 to-gray-900' },
    { id: 'purple', name: 'Purple', color: 'from-purple-800 to-indigo-900' },
    { id: 'blue', name: 'Blue', color: 'from-blue-800 to-cyan-900' },
    { id: 'light', name: 'Light', color: 'from-gray-100 to-gray-300' },
  ] as const;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Volume Control */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          {settings.volume > 0 ? (
            <Volume2 className="w-5 h-5 text-purple-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-gray-400" />
          )}
          <h3 className="font-semibold">Volume</h3>
          <span className="ml-auto text-sm text-white/60">
            {Math.round(settings.volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.volume}
          onChange={handleVolumeChange}
          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </Card>

      {/* Instrument Selection */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Music className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">Instrument</h3>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {instruments.map(inst => (
            <button
              key={inst.id}
              onClick={() => handleInstrumentChange(inst.id)}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                settings.instrument === inst.id
                  ? 'bg-purple-500/30 border-2 border-purple-500'
                  : 'bg-white/10 border-2 border-transparent hover:bg-white/20'
              }`}
            >
              <span className="text-xl">{inst.icon}</span>
              <span className="text-xs truncate w-full text-center">{inst.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Theme Selection */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Palette className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">Theme</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`p-3 rounded-xl bg-gradient-to-br ${theme.color} flex items-center justify-center gap-2 transition-all ${
                settings.theme === theme.id
                  ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0f0c29]'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              {settings.theme === theme.id && <Check className="w-4 h-4" />}
              <span className="text-sm font-medium">{theme.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Playback Mode */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Music className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">Chord Playback</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handlePlayModeChange('chord')}
            className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
              settings.playMode === 'chord'
                ? 'bg-purple-500/30 border-2 border-purple-500'
                : 'bg-white/10 border-2 border-transparent hover:bg-white/20'
            }`}
          >
            <span className="font-medium">Simultaneous</span>
            <span className="text-xs text-white/60">All notes at once</span>
          </button>
          <button
            onClick={() => handlePlayModeChange('arpeggio')}
            className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
              settings.playMode === 'arpeggio'
                ? 'bg-purple-500/30 border-2 border-purple-500'
                : 'bg-white/10 border-2 border-transparent hover:bg-white/20'
            }`}
          >
            <span className="font-medium">Arpeggio</span>
            <span className="text-xs text-white/60">Notes one by one</span>
          </button>
        </div>
      </Card>

      {/* Toggle Settings */}
      <Card className="p-4 mb-4">
        <h3 className="font-semibold mb-3">Preferences</h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              {settings.soundEffects ? (
                <Bell className="w-5 h-5 text-purple-400" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <span>Sound Effects</span>
            </div>
            <button
              onClick={handleSoundEffectsToggle}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.soundEffects ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.soundEffects ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-lg">⏭️</span>
              <span>Auto-Advance</span>
            </div>
            <button
              onClick={handleAutoAdvanceToggle}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.autoAdvance ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.autoAdvance ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-lg">💡</span>
              <span>Show Hints</span>
            </div>
            <button
              onClick={handleShowHintsToggle}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.showHints ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.showHints ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              {settings.notifications ? (
                <Bell className="w-5 h-5 text-purple-400" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <span>Notifications</span>
            </div>
            <button
              onClick={handleNotificationsToggle}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.notifications ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-lg">🛡️</span>
              <div>
                <span>Auto Streak Freeze</span>
                <p className="text-xs text-white/60">Protect your streak once per week</p>
              </div>
            </div>
            <button
              onClick={() => {
                const newValue = !streakFreezeEnabled;
                setStreakFreezeEnabled(newValue);
                updateStreakFreezeSettings(newValue);
              }}
              className={`w-12 h-6 rounded-full transition-colors ${
                streakFreezeEnabled ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  streakFreezeEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        </div>
      </Card>

      {/* Accessibility Settings */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Accessibility className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">Accessibility</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-blue-400" />
              <span>High Contrast</span>
            </div>
            <button
              onClick={() => a11y.updateSetting('highContrast', !a11y.settings.highContrast)}
              className={`w-12 h-6 rounded-full transition-colors ${
                a11y.settings.highContrast ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  a11y.settings.highContrast ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-blue-400" />
              <span>Large Text</span>
            </div>
            <button
              onClick={() => a11y.updateSetting('largeText', !a11y.settings.largeText)}
              className={`w-12 h-6 rounded-full transition-colors ${
                a11y.settings.largeText ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  a11y.settings.largeText ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span>Reduced Motion</span>
            </div>
            <button
              onClick={() => a11y.updateSetting('reducedMotion', !a11y.settings.reducedMotion)}
              className={`w-12 h-6 rounded-full transition-colors ${
                a11y.settings.reducedMotion ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  a11y.settings.reducedMotion ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-5 h-5 text-blue-400" />
              <span>Color Blind Mode</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => a11y.updateSetting('colorBlindMode', mode)}
                  className={`p-2 rounded-xl text-xs text-center transition-all ${
                    a11y.settings.colorBlindMode === mode
                      ? 'bg-purple-500/30 border-2 border-purple-500'
                      : 'bg-white/10 border-2 border-transparent hover:bg-white/20'
                  }`}
                >
                  {mode === 'none' ? 'Off' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-4 mb-4">
        <h3 className="font-semibold mb-3">Data Management</h3>

        <div className="space-y-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleExportData}
            icon={<Download className="w-4 h-4" />}
          >
            Export Progress
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={handleImportData}
            icon={<Upload className="w-4 h-4" />}
          >
            Import Progress
            {importStatus === 'success' && (
              <Badge variant="success" size="sm" className="ml-2">Imported!</Badge>
            )}
            {importStatus === 'error' && (
              <Badge variant="danger" size="sm" className="ml-2">Failed</Badge>
            )}
          </Button>

          {!showResetConfirm ? (
            <Button
              variant="danger"
              fullWidth
              onClick={() => setShowResetConfirm(true)}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Reset All Data
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleResetData}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Confirm Reset
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* App Info */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">About</h3>
        <p className="text-sm text-white/60 mb-2">
          KeyPerfect v14.0.0
        </p>
        <p className="text-xs text-white/40 mb-4">
          A music theory ear training app to help you master chord recognition,
          scale identification, and interval training.
        </p>
        {onReplayTutorial && (
          <Button
            variant="secondary"
            fullWidth
            onClick={onReplayTutorial}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Replay Tutorial
          </Button>
        )}
      </Card>
    </div>
  );
}
