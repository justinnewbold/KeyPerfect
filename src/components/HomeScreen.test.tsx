import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';

vi.mock('../hooks/useAudio', () => ({
  useAudio: () => ({
    playChord: vi.fn(),
    playNote: vi.fn(),
    playScale: vi.fn(),
    playSuccess: vi.fn(),
    playError: vi.fn(),
    startNote: () => ({ stop: vi.fn() }),
    setInstrument: vi.fn(),
    stopAll: vi.fn(),
  }),
}));

vi.mock('../utils/audioEngine', () => ({
  playChord: vi.fn(),
  getAudioContext: vi.fn(),
}));

const { HomeScreen } = await import('./HomeScreen');
const { LEVELS } = await import('../types/levels');

function renderHome(props: Partial<React.ComponentProps<typeof HomeScreen>> = {}) {
  return render(
    <HomeScreen
      onStartLevel={vi.fn()}
      onStartChallenge={vi.fn()}
      onStartGameMode={vi.fn()}
      onOpenSettings={vi.fn()}
      {...props}
    />
  );
}

function toggleAllModes() {
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: /all modes/i }));
  });
}

describe('HomeScreen first tap', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('opens with a single primary call to action, not the full tile wall', () => {
    // Home used to open on ~39 tiles across four sections, leaving a new
    // player to guess which one the app wanted them to press first.
    renderHome();

    expect(screen.getByText('Start training')).toBeTruthy();
    // The rest of the catalogue is behind the disclosure until asked for.
    expect(screen.queryByText('Training Modes')).toBeNull();
    expect(screen.queryByText('Challenge Modes')).toBeNull();
    expect(screen.queryByText('Learn & Improve')).toBeNull();
  });

  it('says how long the session it starts will be', () => {
    renderHome();

    expect(screen.getByText(new RegExp(`${LEVELS[0].questionsToComplete} questions`))).toBeTruthy();
  });

  it('starts the highest unlocked level from that one tap', () => {
    const onStartRecommendedLevel = vi.fn();
    renderHome({ onStartRecommendedLevel });

    act(() => {
      fireEvent.click(screen.getByText('Start training'));
    });

    expect(onStartRecommendedLevel).toHaveBeenCalledWith(
      expect.objectContaining({ id: LEVELS[0].id })
    );
  });

  it('reveals everything else on demand, and remembers that choice', () => {
    renderHome();
    toggleAllModes();

    expect(screen.getByText('Training Modes')).toBeTruthy();
    expect(screen.getByText('Challenge Modes')).toBeTruthy();

    // Re-mounting keeps the list open for someone who lives in it.
    cleanup();
    renderHome();
    expect(screen.getByText('Training Modes')).toBeTruthy();
  });
});

describe('HomeScreen tile naming', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('offers each kind of training under exactly one name', () => {
    // "Chord Training" and "Chord Recognition" ran the same chord quiz, and
    // two separate tiles were called Progressions.
    renderHome();
    toggleAllModes();

    expect(screen.queryByText('Chord Recognition')).toBeNull();
    expect(screen.getAllByText(/^Chord Training$/)).toHaveLength(1);
    expect(screen.getAllByText(/Progression/)).toHaveLength(2);
    expect(screen.getByText('Progression Dictation')).toBeTruthy();
    expect(screen.getByText('Chord Progressions')).toBeTruthy();
  });

  it('does not advertise sharing as local only', () => {
    // The tile said "Local only" directly above "Share codes, play same seed".
    renderHome();
    toggleAllModes();

    expect(screen.queryByText('Local only')).toBeNull();
    expect(screen.getByText(/pass a code to a friend/i)).toBeTruthy();
  });

  it('reaches Settings from the mode list as well as the header gear', () => {
    const onOpenSettings = vi.fn();
    renderHome({ onOpenSettings });
    toggleAllModes();

    act(() => {
      fireEvent.click(screen.getByText('Sound, instrument, MIDI, data'));
    });

    expect(onOpenSettings).toHaveBeenCalled();
  });
});

describe('HomeScreen streak freeze', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('does not show a freeze pill before there is a streak to freeze', () => {
    // A freeze protects a daily streak; on a first run it was an unexplained
    // pill sitting next to a streak of zero.
    renderHome();

    expect(screen.queryByText(/freeze/i)).toBeNull();
  });
});
