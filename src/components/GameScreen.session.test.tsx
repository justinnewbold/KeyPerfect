import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { AnswerRecord, GameQuestion } from '../types/gameModes';
import { LEVELS } from '../types/levels';

vi.mock('../hooks/useAudio', () => ({
  useAudio: () => ({
    playChord: vi.fn(),
    playNote: vi.fn(),
    playScale: vi.fn(),
    playInterval: vi.fn(),
    playRhythmPattern: vi.fn(),
    playSuccess: vi.fn(),
    playError: vi.fn(),
    startNote: () => ({ stop: vi.fn() }),
    isPlaying: false,
  }),
}));

vi.mock('../utils/midiInput', () => ({
  useMIDIInput: () => ({
    isSupported: false,
    isConnected: false,
    deviceName: null,
    error: null,
    refresh: vi.fn(),
  }),
}));

const { GameScreen } = await import('./GameScreen');

function chordQuestion(id: string, correctAnswer: string, options: string[]): GameQuestion {
  return {
    id,
    type: 'chords',
    prompt: 'Name the chord',
    correctAnswer,
    options,
    audioData: {
      notes: [60, 64, 67],
      rootNote: 60,
      type: correctAnswer,
      playbackMode: 'chord',
      duration: 1.5,
    },
    difficulty: 0.5,
    xpValue: 10,
  };
}

function record(question: GameQuestion, answer: string): AnswerRecord {
  return {
    questionId: question.id,
    userAnswer: answer,
    correctAnswer: question.correctAnswer,
    isCorrect: answer === question.correctAnswer,
    timeToAnswer: 100,
    xpEarned: 10,
  };
}

/** The option button carrying this label, ignoring the icon and index hint. */
function option(label: string): HTMLButtonElement {
  return screen.getByRole('button', { name: new RegExp(`^${label}\\.`) }) as HTMLButtonElement;
}

describe('GameScreen answer state across questions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('does not carry graded styling onto the next question', () => {
    // The reset lived in a passive effect, which runs a paint too late: the
    // first render of question 2 still held question 1's `result`, and the
    // correct/wrong classes are computed against the *new* question's answer
    // — so the next question was painted with its answer already marked in
    // green, before the player had heard anything.
    //
    // `frames` is what the browser would actually show: the Recorder's layout
    // effect runs once per commit, after the DOM is written and before any
    // passive effect gets a chance to tidy up. Asserting only on the settled
    // DOM would pass either way, which is how this shipped.
    const q1 = chordQuestion('q1', 'major', ['major', 'minor']);
    const q2 = chordQuestion('q2', 'minor', ['major', 'minor']);
    const frames: string[][] = [];

    function Recorder() {
      React.useLayoutEffect(() => {
        frames.push(
          Array.from(document.querySelectorAll<HTMLButtonElement>('button')).map(b => b.className)
        );
      });
      return null;
    }

    const view = render(
      <>
        <GameScreen
          level={LEVELS[0]}
          question={q1}
          questionNumber={1}
          totalQuestions={20}
          score={0}
          streak={0}
          onAnswer={answer => record(q1, answer)}
          onNext={vi.fn()}
          onExit={vi.fn()}
        />
        <Recorder />
      </>
    );

    act(() => {
      fireEvent.click(option('Major'));
    });
    expect(option('Major').className).toContain('border-green-500');

    frames.length = 0;
    view.rerender(
      <>
        <GameScreen
          level={LEVELS[0]}
          question={q2}
          questionNumber={2}
          totalQuestions={20}
          score={10}
          streak={1}
          onAnswer={answer => record(q2, answer)}
          onNext={vi.fn()}
          onExit={vi.fn()}
        />
        <Recorder />
      </>
    );

    // No frame of question 2 may show a graded option, first one included.
    for (const frame of frames) {
      for (const className of frame) {
        expect(className).not.toContain('border-green-500');
        expect(className).not.toContain('border-red-500');
      }
    }

    // And every option is answerable again once it settles.
    for (const label of ['Major', 'Minor']) {
      expect(option(label).disabled).toBe(false);
    }
  });
});

describe('GameScreen exit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  function renderMidSession(onExit: () => void) {
    const q = chordQuestion('q1', 'major', ['major', 'minor']);
    return render(
      <GameScreen
        level={LEVELS[0]}
        question={q}
        questionNumber={5}
        totalQuestions={20}
        score={60}
        streak={2}
        onAnswer={answer => record(q, answer)}
        onNext={vi.fn()}
        onExit={onExit}
      />
    );
  }

  it('confirms before ending a session in progress', () => {
    // Tapping the X used to end the run outright: XP banked, results graded on
    // whatever had been answered, no way back.
    const onExit = vi.fn();
    renderMidSession(onExit);

    act(() => {
      fireEvent.click(screen.getByLabelText('Exit session'));
    });

    expect(onExit).not.toHaveBeenCalled();
    expect(screen.getByText('End this session?')).toBeTruthy();
    expect(screen.getByText(/answered 4 of 20 questions/i)).toBeTruthy();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /keep practicing/i }));
    });
    expect(onExit).not.toHaveBeenCalled();
  });

  it('exits once the choice is confirmed', () => {
    const onExit = vi.fn();
    renderMidSession(onExit);

    act(() => {
      fireEvent.click(screen.getByLabelText('Exit session'));
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /end session/i }));
    });

    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
