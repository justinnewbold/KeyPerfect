import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { PianoKeyboard } from './PianoKeyboard';
import { firePointer } from '../test/pointerEvents';

// One stop spy per started note, so the tests can assert exactly which voices
// were released rather than just how many.
const started: { midi: number; stop: ReturnType<typeof vi.fn> }[] = [];

vi.mock('../hooks/useAudio', () => ({
  useAudio: () => ({
    startNote: (midi: number) => {
      const stop = vi.fn();
      started.push({ midi, stop });
      return { stop };
    },
    playNote: vi.fn(),
  }),
}));

const KEY_WIDTH = 40;
const HEIGHT = 160;

/**
 * jsdom reports every element as 0x0, and the component hit-tests against the
 * layout it computes from clientWidth. Pin both so the coordinates in these
 * tests map onto known keys: 14 white keys at the 40px floor.
 */
function stubGeometry() {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return 360;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
    configurable: true,
    get() {
      return 0;
    },
    set() {},
  });
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 360, height: HEIGHT, right: 360, bottom: HEIGHT, x: 0, y: 0 }) as DOMRect;
}

/** Centre of the nth white key, below the black keys so it is unambiguous. */
function whiteKeyPoint(index: number) {
  return { x: index * KEY_WIDTH + KEY_WIDTH / 2, y: HEIGHT - 10 };
}

function getSurface(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-no-swipe]') as HTMLElement;
}

function press(el: HTMLElement, pointerId: number, point: { x: number; y: number }) {
  act(() => {
    firePointer(el, 'pointerdown', { pointerId, clientX: point.x, clientY: point.y });
  });
}

function release(el: HTMLElement, pointerId: number, point: { x: number; y: number }) {
  act(() => {
    firePointer(el, 'pointerup', { pointerId, clientX: point.x, clientY: point.y });
  });
}

describe('PianoKeyboard', () => {
  beforeEach(() => {
    started.length = 0;
    stubGeometry();
  });

  afterEach(() => {
    cleanup();
  });

  it('sounds the key under the finger', () => {
    const { container } = render(<PianoKeyboard startNote={48} numOctaves={2} />);
    press(getSurface(container), 1, whiteKeyPoint(0));

    expect(started).toHaveLength(1);
    expect(started[0].midi).toBe(48); // C3
  });

  it('holds a note until the finger lifts', () => {
    const { container } = render(<PianoKeyboard startNote={48} numOctaves={2} />);
    const surface = getSurface(container);

    press(surface, 1, whiteKeyPoint(0));
    expect(started[0].stop).not.toHaveBeenCalled();

    release(surface, 1, whiteKeyPoint(0));
    expect(started[0].stop).toHaveBeenCalledTimes(1);
  });

  it('plays three fingers as three simultaneous notes', () => {
    // The old implementation routed through useAudio.playNote, which stops the
    // previous sound first, so a chord was impossible.
    const { container } = render(<PianoKeyboard startNote={48} numOctaves={2} />);
    const surface = getSurface(container);

    press(surface, 1, whiteKeyPoint(0)); // C3
    press(surface, 2, whiteKeyPoint(2)); // E3
    press(surface, 3, whiteKeyPoint(4)); // G3

    expect(started.map(v => v.midi)).toEqual([48, 52, 55]);
    expect(started.every(v => v.stop.mock.calls.length === 0)).toBe(true);
  });

  it('releases only the finger that lifted', () => {
    const { container } = render(<PianoKeyboard startNote={48} numOctaves={2} />);
    const surface = getSurface(container);

    press(surface, 1, whiteKeyPoint(0));
    press(surface, 2, whiteKeyPoint(2));
    release(surface, 1, whiteKeyPoint(0));

    expect(started[0].stop).toHaveBeenCalledTimes(1);
    expect(started[1].stop).not.toHaveBeenCalled();
  });

  it('releases on pointercancel', () => {
    const { container } = render(<PianoKeyboard startNote={48} numOctaves={2} />);
    const surface = getSurface(container);

    press(surface, 1, whiteKeyPoint(0));
    act(() => {
      firePointer(surface, 'pointercancel', { pointerId: 1 });
    });

    expect(started[0].stop).toHaveBeenCalledTimes(1);
  });

  it('silences every held note when unmounted mid-press', () => {
    // Navigating away used to be able to leave a note ringing.
    const { container, unmount } = render(<PianoKeyboard startNote={48} numOctaves={2} />);
    const surface = getSurface(container);

    press(surface, 1, whiteKeyPoint(0));
    press(surface, 2, whiteKeyPoint(2));
    expect(started).toHaveLength(2);

    unmount();
    expect(started.every(v => v.stop.mock.calls.length >= 1)).toBe(true);
  });

  it('plays nothing while disabled', () => {
    const { container } = render(<PianoKeyboard startNote={48} numOctaves={2} disabled />);
    press(getSurface(container), 1, whiteKeyPoint(0));
    expect(started).toHaveLength(0);
  });

  it('slides to the next note when glissando is on', () => {
    const { container } = render(<PianoKeyboard startNote={48} numOctaves={2} glissando />);
    const surface = getSurface(container);

    press(surface, 1, whiteKeyPoint(0));
    act(() => {
      firePointer(surface, 'pointermove', {
        pointerId: 1,
        clientX: whiteKeyPoint(1).x,
        clientY: whiteKeyPoint(1).y,
      });
    });

    expect(started.map(v => v.midi)).toEqual([48, 50]);
    expect(started[0].stop).toHaveBeenCalledTimes(1); // previous note released
  });

  it('does not slide when glissando is off, so note entry stays deliberate', () => {
    const { container } = render(<PianoKeyboard startNote={48} numOctaves={2} />);
    const surface = getSurface(container);

    press(surface, 1, whiteKeyPoint(0));
    act(() => {
      firePointer(surface, 'pointermove', {
        pointerId: 1,
        clientX: whiteKeyPoint(3).x,
        clientY: whiteKeyPoint(3).y,
      });
    });

    expect(started).toHaveLength(1);
  });

  it('steals the oldest voice once the polyphony cap is reached', () => {
    const { container } = render(
      <PianoKeyboard startNote={48} numOctaves={2} maxVoices={2} />,
    );
    const surface = getSurface(container);

    press(surface, 1, whiteKeyPoint(0));
    press(surface, 2, whiteKeyPoint(1));
    press(surface, 3, whiteKeyPoint(2));

    expect(started[0].stop).toHaveBeenCalledTimes(1);
    expect(started[1].stop).not.toHaveBeenCalled();
    expect(started[2].stop).not.toHaveBeenCalled();
  });

  it('reports the notes currently held', () => {
    const onNotesChange = vi.fn();
    const { container } = render(
      <PianoKeyboard startNote={48} numOctaves={2} onNotesChange={onNotesChange} />,
    );
    const surface = getSurface(container);

    press(surface, 1, whiteKeyPoint(0));
    press(surface, 2, whiteKeyPoint(2));

    expect(onNotesChange).toHaveBeenLastCalledWith([48, 52]);
  });

  it('gives every key an accessible name', () => {
    const { container } = render(<PianoKeyboard startNote={60} numOctaves={1} />);
    const c4 = container.querySelector('[data-midi="60"]');
    expect(c4).toHaveAttribute('aria-label', 'C4');
    const cSharp4 = container.querySelector('[data-midi="61"]');
    expect(cSharp4).toHaveAttribute('aria-label', 'C#4');
  });
});
