import React, { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, screen, fireEvent, act } from '@testing-library/react';

type OnPitch = (frequency: number, note: string, cents: number) => void;

/** The callback the component handed to the most recent createPitchDetector. */
let onPitch: OnPitch | null = null;

vi.mock('../utils/audioEngine', () => ({
  createPitchDetector: (cb: OnPitch) => {
    onPitch = cb;
    return { start: vi.fn().mockResolvedValue(undefined), stop: vi.fn() };
  },
  playNote: vi.fn(),
  getAudioContext: vi.fn(),
}));

const { PitchDetector } = await import('./PitchDetector');

/** The big target-note readout, e.g. "G4". */
function readTarget(): string {
  const el = document.querySelector('.text-6xl');
  if (!el?.textContent) throw new Error('no target rendered');
  return el.textContent.trim();
}

function readScore(): number {
  // The score sits alone in the header block above the "Score" label.
  const label = Array.from(document.querySelectorAll('div')).find(
    d => d.textContent === 'Score' && d.className.includes('text-white/60')
  );
  return Number(label?.previousElementSibling?.textContent ?? NaN);
}

/** Press Start. startListening awaits the mic, so let that promise settle. */
async function start() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
  });
}

/** Sing `note` dead in tune for `frames` detector callbacks. */
function sing(note: string, frames: number) {
  const name = note.replace(/[0-9]/g, '');
  act(() => {
    for (let i = 0; i < frames; i++) onPitch?.(440, `${name}4`, 0);
  });
}

describe('Sing-Back', () => {
  beforeEach(() => {
    onPitch = null;
  });

  afterEach(cleanup);

  it('keeps scoring after the target changes', async () => {
    // The detector is built once, at Start, and holds its callback for life.
    // The callback used to be passed directly, freezing `currentTarget` at
    // whatever it was when Start was pressed — so the detector graded every
    // later note against the first target and only the first note ever scored.
    render(<PitchDetector mode="singback" />);
    await start();
    expect(onPitch).toBeTypeOf('function');

    sing(readTarget(), 5);
    expect(readScore()).toBe(10);

    sing(readTarget(), 5);
    expect(readScore()).toBe(20);

    sing(readTarget(), 5);
    expect(readScore()).toBe(30);
  });

  it('does not score a note held short of the threshold', async () => {
    render(<PitchDetector mode="singback" />);
    await start();

    sing(readTarget(), 4);
    expect(readScore()).toBe(0);
  });

  it('restarts the count when the singer goes off pitch', async () => {
    render(<PitchDetector mode="singback" />);
    await start();

    const target = readTarget();
    sing(target, 4);
    // One frame of something else resets the hold.
    const wrong = target.startsWith('C') ? 'F4' : 'C4';
    sing(wrong, 1);
    sing(target, 4);
    expect(readScore()).toBe(0);

    sing(target, 1);
    expect(readScore()).toBe(10);
  });

  it('counts one hit per note under StrictMode', async () => {
    // The award used to run inside a setMatchCount updater. Updaters must be
    // pure; StrictMode invokes them twice in development, which doubled the
    // score, the hit count and the attempt count for a single held note.
    render(
      <StrictMode>
        <PitchDetector mode="singback" />
      </StrictMode>
    );
    await start();

    sing(readTarget(), 5);

    expect(readScore()).toBe(10);
    expect(screen.getByText('Notes Hit').previousElementSibling?.textContent).toBe('1');
    // One hit out of one attempt.
    expect(screen.getByText('Accuracy').previousElementSibling?.textContent).toBe('100%');
  });
});
