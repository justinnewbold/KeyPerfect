import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act, screen } from '@testing-library/react';
import { SessionSummary } from '../types/gameModes';

// Replace the keyboard with a plain button per note, so the test drives note
// input directly instead of simulating pointer geometry.
vi.mock('./PianoKeyboard', () => ({
  PianoKeyboard: ({ onNotePlay }: { onNotePlay?: (midi: number) => void }) => (
    <div>
      {[60, 61, 64, 67].map(midi => (
        <button key={midi} data-testid={`note-${midi}`} onClick={() => onNotePlay?.(midi)}>
          {midi}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../hooks/useAudio', () => ({
  useAudio: () => ({
    playChord: vi.fn(),
    playSuccess: vi.fn(),
    playError: vi.fn(),
    startNote: () => ({ stop: vi.fn() }),
    playNote: vi.fn(),
  }),
}));

const updateChordStats = vi.fn();
vi.mock('../utils/storage', () => ({ updateChordStats: (...a: unknown[]) => updateChordStats(...a) }));

const updateReviewItem = vi.fn();
vi.mock('../utils/spacedRepetition', () => ({
  updateReviewItem: (...a: unknown[]) => updateReviewItem(...a),
}));

const { ReverseModeGame } = await import('./ReverseModeGame');

const TOTAL_QUESTIONS = 10;

/** Math.random() === 0 pins the question to a C major triad: [60, 64, 67]. */
function pinToCMajor() {
  vi.spyOn(Math, 'random').mockReturnValue(0);
}

function playCMajor() {
  act(() => {
    screen.getByTestId('note-60').click();
  });
  act(() => {
    screen.getByTestId('note-64').click();
  });
  act(() => {
    screen.getByTestId('note-67').click();
  });
  // The component grades on a 500ms timer once enough notes are entered.
  act(() => {
    vi.advanceTimersByTime(600);
  });
}

/** Three notes that are never the target, to force an incorrect answer. */
function playWrong() {
  act(() => {
    screen.getByTestId('note-60').click();
  });
  act(() => {
    screen.getByTestId('note-61').click();
  });
  act(() => {
    screen.getByTestId('note-64').click();
  });
  act(() => {
    vi.advanceTimersByTime(600);
  });
}

function advance() {
  const next = screen.getByRole('button', { name: /^(Next|See Results)$/ });
  act(() => {
    next.click();
  });
}

describe('ReverseModeGame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    updateChordStats.mockClear();
    updateReviewItem.mockClear();
    pinToCMajor();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    cleanup();
  });

  function renderGame() {
    const onComplete = vi.fn<(session: SessionSummary) => void>();
    render(<ReverseModeGame onComplete={onComplete} onExit={vi.fn()} />);
    // The first question is set in an effect.
    act(() => {
      vi.advanceTimersByTime(600);
    });
    return onComplete;
  }

  it('reports one answer record per question', () => {
    const onComplete = renderGame();
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      playCMajor();
      advance();
    }
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0].answers).toHaveLength(TOTAL_QUESTIONS);
  });

  it('marks a matching chord correct and awards XP for it', () => {
    const onComplete = renderGame();
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      playCMajor();
      advance();
    }
    const { answers } = onComplete.mock.calls[0][0];
    expect(answers.every(a => a.isCorrect)).toBe(true);
    expect(answers.every(a => a.xpEarned > 0)).toBe(true);
  });

  it('yields an accuracy of exactly 100% on a perfect run, never more', () => {
    // The bug this replaces derived accuracy from score as
    // score / (totalQuestions * 15); streak bonuses pushed a good run past
    // 100%. Accuracy now comes from the answer records.
    const onComplete = renderGame();
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      playCMajor();
      advance();
    }
    const { answers } = onComplete.mock.calls[0][0];
    const accuracy = (answers.filter(a => a.isCorrect).length / answers.length) * 100;
    expect(accuracy).toBe(100);
  });

  it('scores a wrong chord as incorrect with no XP', () => {
    const onComplete = renderGame();
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      playWrong();
      advance();
    }
    const { answers } = onComplete.mock.calls[0][0];
    expect(answers.every(a => !a.isCorrect)).toBe(true);
    expect(answers.every(a => a.xpEarned === 0)).toBe(true);
  });

  it('records per-item chord stats and spaced repetition for each answer', () => {
    // awardSession does not cover per-item stats, so the screen must.
    renderGame();
    playCMajor();
    expect(updateChordStats).toHaveBeenCalledWith('major', true);
    expect(updateReviewItem).toHaveBeenCalledWith('chord', 'major', true, expect.any(Number), 0);
  });

  it('reports the session only once even if advanced again', () => {
    const onComplete = renderGame();
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      playCMajor();
      advance();
    }
    // The last button stays mounted; a second press must not re-award.
    advance();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('carries a positive elapsed time for the session', () => {
    const onComplete = renderGame();
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      playCMajor();
      advance();
    }
    expect(onComplete.mock.calls[0][0].totalTime).toBeGreaterThan(0);
  });
});
