import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import { PRACTICE_PRESETS } from '../utils/storage';

vi.mock('../utils/audioEngine', () => ({
  getAudioContext: () => ({ currentTime: 0 }),
  playNote: vi.fn(),
  playChord: vi.fn(),
  playScale: vi.fn(),
  playInterval: vi.fn(),
  playRhythm: vi.fn(),
  stopAllSounds: vi.fn(),
  setMasterVolume: vi.fn(),
}));

describe('timed sessions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function tick(seconds: number) {
    act(() => {
      vi.advanceTimersByTime(seconds * 1000);
    });
  }

  it('counts down a timed challenge mode', () => {
    const { result } = renderHook(() => useGameState());
    act(() => result.current.startGame('speedrun', 1));

    expect(result.current.gameState?.timeRemaining).toBe(60);
    tick(3);
    expect(result.current.gameState?.timeRemaining).toBe(57);
  });

  it('counts down a preset that ships a time limit', () => {
    // isTimedMode was a hard-coded list of speedrun and timeattack. Quick
    // Practice ships timeLimit: 120 and was not on it, so its badge sat frozen
    // at 120s and the limit was never enforced.
    const quick = PRACTICE_PRESETS.quick;
    expect(quick.timeLimit).toBe(120);

    const { result } = renderHook(() => useGameState());
    act(() => result.current.startWithPreset(quick));

    expect(result.current.gameState?.timeRemaining).toBe(120);
    tick(5);
    expect(result.current.gameState?.timeRemaining).toBe(115);
  });

  it('does not run a clock for an untimed mode', () => {
    const { result } = renderHook(() => useGameState());
    act(() => result.current.startGame('chords', 1));

    expect(result.current.gameState?.isTimed).toBe(false);
    tick(5);
    expect(result.current.gameState?.timeRemaining).toBe(0);
    expect(result.current.gameState?.isComplete).toBe(false);
  });

  it('ends the session and flags expiry when the clock runs out', () => {
    const { result } = renderHook(() => useGameState());
    act(() => result.current.startGame('timeattack', 1));

    expect(result.current.gameState?.timeRemaining).toBe(30);
    tick(30);

    expect(result.current.timeExpired).toBe(true);
    expect(result.current.gameState?.isComplete).toBe(true);
  });

  it('gives Time Attack enough questions to outlast its clock', () => {
    // timeattack was missing from the totalQuestions override block that gives
    // daily 10, speedrun 50 and survival 100, so it hard-stopped at the
    // level's own count — which made its +3s-per-correct premise pointless,
    // the run ending long before the clock did.
    const { result } = renderHook(() => useGameState());
    act(() => result.current.startGame('timeattack', 1));

    expect(result.current.gameState?.totalQuestions).toBe(100);
  });

  it('keeps the other challenge modes on their own counts', () => {
    const counts: Record<string, number> = {};
    for (const mode of ['daily', 'speedrun', 'survival'] as const) {
      const { result, unmount } = renderHook(() => useGameState());
      act(() => result.current.startGame(mode, 1));
      counts[mode] = result.current.gameState!.totalQuestions;
      unmount();
    }
    expect(counts).toEqual({ daily: 10, speedrun: 50, survival: 100 });
  });
});
