import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { midiManager, useMIDIInput } from './midiInput';

/** Deliver a note-on to whatever handlers are currently registered. */
function pressKey(note = 60, velocity = 100) {
  act(() => {
    // The manager's callbacks are private; the message path is what matters,
    // so reach in the same way handleMIDIMessage does.
    const cb = (midiManager as unknown as { callbacks: { onNoteOn?: (n: number, v: number) => void } })
      .callbacks;
    cb.onNoteOn?.(note, velocity);
  });
}

function Consumer({ onNote }: { onNote: (note: number) => void }) {
  useMIDIInput({ onNoteOn: onNote });
  return null;
}

/** Render and let the hook's initialize() promise settle. */
async function mount(ui: React.ReactElement) {
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(ui);
  });
  return result;
}

describe('useMIDIInput', () => {
  beforeEach(() => {
    // initialize() reports unsupported and returns early in jsdom, which is
    // all these tests need — they exercise callback registration, not devices.
    midiManager.setCallbacks({});
  });

  afterEach(cleanup);

  it('delivers notes to the mounted consumer', async () => {
    const onNote = vi.fn();
    await mount(<Consumer onNote={onNote} />);

    pressKey(64);
    expect(onNote).toHaveBeenCalledWith(64, 100);
  });

  it('stops delivering after the consumer unmounts', async () => {
    // midiManager is a singleton and the cleanup used to be an empty function
    // with the comment "keep MIDI connection alive". That kept the *handlers*
    // registered too, so a key pressed from Home or the results screen ran
    // GameScreen's submitAnswer against a game that had already ended.
    const onNote = vi.fn();
    const { unmount } = await mount(<Consumer onNote={onNote} />);

    unmount();
    pressKey(64);

    expect(onNote).not.toHaveBeenCalled();
  });

  it('does not silence a consumer that mounted after it', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const a = await mount(<Consumer onNote={first} />);
    await mount(<Consumer onNote={second} />);

    // The second consumer registered last and owns the handlers; unmounting
    // the first must not clear them.
    a.unmount();
    pressKey(64);

    expect(second).toHaveBeenCalledWith(64, 100);
    expect(first).not.toHaveBeenCalled();
  });

  it('runs the latest handler, not the one registered at mount', async () => {
    // The old hook re-registered on [onNoteOn, onNoteOff] identity, so a
    // caller that memoised its handler — as GameScreen does — kept whatever
    // state that handler had closed over when it was first registered.
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = await mount(<Consumer onNote={first} />);

    await act(async () => {
      rerender(<Consumer onNote={second} />);
    });
    pressKey(64);

    expect(second).toHaveBeenCalledWith(64, 100);
    expect(first).not.toHaveBeenCalled();
  });
});
