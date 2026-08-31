import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { AnswerRecord, GameQuestion } from '../types/gameModes';
import { LEVELS } from '../types/levels';

vi.mock('../hooks/useAudio', () => ({
  useAudio: () => ({
    playChord: vi.fn(),
    playNote: vi.fn(),
    playScale: vi.fn(),
    playInterval: vi.fn(),
    playArpeggio: vi.fn(),
    playRhythm: vi.fn(),
    playSuccess: vi.fn(),
    playError: vi.fn(),
    startNote: () => ({ stop: vi.fn() }),
  }),
}));

/** Whatever handler GameScreen currently has registered with the manager. */
let onNoteOn: ((note: number, velocity: number) => void) | undefined;
vi.mock('../utils/midiInput', () => ({
  useMIDIInput: (callbacks?: { onNoteOn?: (n: number, v: number) => void }) => {
    onNoteOn = callbacks?.onNoteOn;
    return { isSupported: false, isConnected: false, deviceName: null, error: null };
  },
}));

const { GameScreen } = await import('./GameScreen');

const question: GameQuestion = {
  id: 'q1',
  type: 'chords',
  prompt: 'Name the chord',
  correctAnswer: 'major',
  // MIDI 60/61/62 map to options 0, 1 and 2 in GameScreen's generic path,
  // which offsets from C4. Notes outside that window submit nothing at all.
  options: ['major', 'minor', 'diminished'],
  audioData: {
    notes: [60, 64, 67],
    rootNote: 60,
    type: 'major',
    playbackMode: 'chord',
    duration: 1.5,
  },
  difficulty: 0.5,
  xpValue: 10,
};

function renderGame(onAnswer: (answer: string) => AnswerRecord) {
  return render(
    <GameScreen
      level={LEVELS[0]}
      question={question}
      questionNumber={1}
      totalQuestions={10}
      score={0}
      streak={0}
      onAnswer={onAnswer}
      onNext={vi.fn()}
      onExit={vi.fn()}
    />
  );
}

function record(answer: string): AnswerRecord {
  return {
    questionId: question.id,
    userAnswer: answer,
    correctAnswer: question.correctAnswer,
    isCorrect: answer === question.correctAnswer,
    timeToAnswer: 100,
    xpEarned: 10,
  };
}

describe('GameScreen answer submission', () => {
  afterEach(cleanup);

  it('submits a MIDI answer once', () => {
    const onAnswer = vi.fn(record);
    renderGame(onAnswer);

    act(() => onNoteOn?.(60, 100));

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith('major');
  });

  it('submits once for a MIDI chord, not once per note', () => {
    // A chord arrives as several note-ons dispatched from one message loop.
    // The only guard was `if (result)`, which is React state and does not
    // update until the next render — so two notes of one chord could each
    // submit an answer for the same question.
    const onAnswer = vi.fn(record);
    renderGame(onAnswer);

    act(() => {
      onNoteOn?.(60, 100);
      onNoteOn?.(61, 100);
      onNoteOn?.(62, 100);
    });

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith('major');
  });
});
