import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';

const playChord = vi.fn();
vi.mock('../hooks/useAudio', () => ({
  useAudio: () => ({
    playChord,
    playNote: vi.fn(),
    playScale: vi.fn(),
    playInterval: vi.fn(),
    playSuccess: vi.fn(),
    playError: vi.fn(),
    startNote: () => ({ stop: vi.fn() }),
    isPlaying: false,
  }),
}));

vi.mock('../utils/audioEngine', () => ({
  getAudioContext: vi.fn(),
  playChord: vi.fn(),
}));

const { TutorialScreen } = await import('./TutorialScreen');

/** Walk from the welcome slide to the "Listen Carefully" one. */
function goToListenStep() {
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
  });
}

describe('TutorialScreen audio demo', () => {
  beforeEach(() => {
    playChord.mockClear();
    localStorage.clear();
  });

  afterEach(cleanup);

  it('plays a chord without advancing the tutorial', () => {
    // This is the one chance to prove sound works before a session starts, so
    // the tap has to reach the speaker and stop there — a tap that moves the
    // tutorial on instead leaves the player to find out mid-round.
    render(<TutorialScreen onComplete={vi.fn()} onSkip={vi.fn()} />);
    goToListenStep();

    expect(screen.getByText('Listen Carefully')).toBeTruthy();

    act(() => {
      fireEvent.click(screen.getByLabelText('Play a C major chord'));
    });

    expect(playChord).toHaveBeenCalledTimes(1);
    // A C major triad, and still on the same slide.
    expect(playChord).toHaveBeenCalledWith([60, 64, 67]);
    expect(screen.getByText('Listen Carefully')).toBeTruthy();
  });

  it('replays on a second tap', () => {
    render(<TutorialScreen onComplete={vi.fn()} onSkip={vi.fn()} />);
    goToListenStep();

    act(() => {
      fireEvent.click(screen.getByLabelText('Play a C major chord'));
    });
    act(() => {
      fireEvent.click(screen.getByLabelText('Play a C major chord'));
    });

    expect(playChord).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Listen Carefully')).toBeTruthy();
  });
});
