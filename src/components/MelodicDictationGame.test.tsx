import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act, screen } from '@testing-library/react';

// Replace the keyboard with one button per playable note, so the test drives
// note entry directly rather than simulating pointer geometry.
const NOTES = Array.from({ length: 25 }, (_, i) => 48 + i);
vi.mock('./PianoKeyboard', () => ({
  PianoKeyboard: ({ onNotePlay }: { onNotePlay?: (midi: number) => void }) => (
    <div>
      {NOTES.map(midi => (
        <button key={midi} data-testid={`note-${midi}`} onClick={() => onNotePlay?.(midi)}>
          {midi}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../hooks/useAudio', () => ({
  useAudio: () => ({
    playNote: vi.fn(),
    playChord: vi.fn(),
    playSuccess: vi.fn(),
    playError: vi.fn(),
    startNote: () => ({ stop: vi.fn() }),
  }),
}));

const { MelodicDictationGame } = await import('./MelodicDictationGame');

/**
 * Math.random() === 0.5 pins the first melody to [66, 68, 70].
 *
 * startNote = 60 + floor(0.5 * 12) = 66, and the easy interval pool's
 * midpoint entry is +2. 0.5 is chosen over 0 deliberately: with 0 the
 * generator picks the most negative interval every time, and its
 * "keep the note in range" while-loop would then spin forever, since
 * re-rolling a fixed random never escapes.
 */
function pinMelody() {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
}

function play(...midis: number[]) {
  for (const midi of midis) {
    act(() => {
      screen.getByTestId(`note-${midi}`).click();
    });
  }
}

function renderGame() {
  const onComplete = vi.fn();
  render(<MelodicDictationGame onComplete={onComplete} onExit={vi.fn()} />);
  act(() => {
    vi.advanceTimersByTime(1200);
  });
  return onComplete;
}

describe('MelodicDictationGame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pinMelody();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    cleanup();
  });

  it('grades an exact transcription as a perfect one', () => {
    renderGame();
    play(66, 68, 70);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByText(/Perfect transcription/i)).toBeInTheDocument();
  });

  it('grades a mostly-right melody as partial, not correct', () => {
    // Two of three notes right. This must not count as a correct answer for
    // accuracy or streak purposes, but still earns partial XP.
    renderGame();
    play(66, 68, 49);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByText(/Partially correct/i)).toBeInTheDocument();
    expect(screen.queryByText(/Perfect transcription/i)).not.toBeInTheDocument();
  });

  it('grades a mostly-wrong melody as incorrect', () => {
    renderGame();
    play(48, 49, 50);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText(/Perfect transcription/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Partially correct/i)).not.toBeInTheDocument();
  });

  it('awards XP for a partial answer without counting it correct', () => {
    // Drive the whole 8-question session, answering every melody partially,
    // then inspect the reported records.
    const onComplete = renderGame();
    for (let q = 0; q < 8; q++) {
      // Enter enough notes to trigger grading whatever this melody's length
      // is: the first two are right for the pinned melody, the rest wrong.
      play(66, 68, 49, 49, 49, 49);
      act(() => {
        vi.advanceTimersByTime(300);
      });
      const next = screen.getByRole('button', { name: /^(Next|See Results)$/ });
      act(() => {
        next.click();
      });
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    const { answers } = onComplete.mock.calls[0][0];
    expect(answers).toHaveLength(8);
    // Partially-right answers are never correct...
    expect(answers.every((a: { isCorrect: boolean }) => !a.isCorrect)).toBe(true);
    // ...but the ones that cleared the halfway mark still earned something.
    expect(answers.some((a: { xpEarned: number }) => a.xpEarned > 0)).toBe(true);
  });

  it('reports one answer record per question and only completes once', () => {
    const onComplete = renderGame();
    for (let q = 0; q < 8; q++) {
      play(66, 68, 70, 70, 70, 70);
      act(() => {
        vi.advanceTimersByTime(300);
      });
      act(() => {
        screen.getByRole('button', { name: /^(Next|See Results)$/ }).click();
      });
    }
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0].answers).toHaveLength(8);

    act(() => {
      screen.getByRole('button', { name: /^(Next|See Results)$/ }).click();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
