import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

/** Clicks scheduled by the metronome: [accent, audioContext time]. */
const clicks: { accent: boolean; when: number | undefined }[] = [];

/** The fake AudioContext clock, advanced by the tests. */
let audioNow = 0;

vi.mock('../utils/audioEngine', () => ({
  getAudioContext: () => ({ get currentTime() { return audioNow; } }),
  playMetronomeClick: (accent: boolean, when?: number) => clicks.push({ accent, when }),
  // useAudio's other exports; unused here but imported by the module.
  playChord: vi.fn(),
  playNote: vi.fn(),
  playScale: vi.fn(),
  playInterval: vi.fn(),
  playArpeggio: vi.fn(),
  stopAllSounds: vi.fn(),
  setMasterVolume: vi.fn(),
  setReverbAmount: vi.fn(),
}));

const { useMetronome } = await import('./useAudio');

/**
 * Advance the audio clock and the scheduler's setInterval together, in small
 * steps. Jumping the clock in one go is what a backgrounded tab looks like,
 * which is a different scenario (see the resync test).
 */
function advance(seconds: number, stepMs = 5) {
  const steps = Math.round((seconds * 1000) / stepMs);
  act(() => {
    for (let i = 0; i < steps; i++) {
      audioNow += stepMs / 1000;
      vi.advanceTimersByTime(stepMs);
    }
  });
}

describe('useMetronome', () => {
  beforeEach(() => {
    clicks.length = 0;
    audioNow = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules clicks at exact beat times, not at the scheduler tick', () => {
    // Every click used to fire at ctx.currentTime, quantising it to the 25ms
    // interval — an audible flam on the one tool where timing is the product.
    const { result } = renderHook(() => useMetronome());
    act(() => result.current.start()); // 120bpm, 4/4: one beat every 0.5s

    advance(1.0);

    const times = clicks.map(c => c.when);
    expect(times.slice(0, 3)).toEqual([0, 0.5, 1.0]);
  });

  it('accents the downbeat once per bar', () => {
    const { result } = renderHook(() => useMetronome());
    act(() => result.current.start());

    advance(2.0); // one full 4/4 bar plus the next downbeat

    expect(clicks.slice(0, 5).map(c => c.accent)).toEqual([true, false, false, false, true]);
  });

  it('highlights the beat that is sounding, not the next one', () => {
    // The loop clicked the current beat then published beat + 1, so the
    // display ran a whole beat ahead: the downbeat lit during the silence
    // before the accent.
    const { result } = renderHook(() => useMetronome());
    act(() => result.current.start());

    advance(0.01);
    expect(result.current.currentBeat).toBe(0);

    advance(0.5);
    expect(result.current.currentBeat).toBe(1);

    advance(0.5);
    expect(result.current.currentBeat).toBe(2);
  });

  it('resyncs instead of firing every click missed while backgrounded', () => {
    // setInterval freezes in a backgrounded tab while the AudioContext clock
    // runs on. The scheduler had no catch-up cap, so returning to the tab
    // fired every missed click at once.
    const { result } = renderHook(() => useMetronome());
    act(() => result.current.start());
    advance(0.01);
    const before = clicks.length;

    // 30 seconds of audio clock pass with no scheduler ticks.
    act(() => {
      audioNow += 30;
    });
    advance(0.03); // the tab comes back and the scheduler runs once

    expect(clicks.length - before).toBeLessThanOrEqual(2);
  });

  it('stops scheduling once stopped', () => {
    const { result } = renderHook(() => useMetronome());
    act(() => result.current.start());
    advance(1.0);

    act(() => result.current.stop());
    const after = clicks.length;

    advance(2.0);
    expect(clicks.length).toBe(after);
    expect(result.current.currentBeat).toBe(0);
  });
});
