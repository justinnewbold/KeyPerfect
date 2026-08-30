import { describe, it, expect } from 'vitest';
import { buildKeyLayout, isWhiteKey, midiAtPoint, scrollOffsetForNote } from './pianoLayout';

// C3 = 48, two octaves = 14 white keys and 10 black keys.
const BASE = { startNote: 48, numOctaves: 2, height: 160 } as const;

describe('isWhiteKey', () => {
  it('classifies the C major scale as white', () => {
    expect([60, 62, 64, 65, 67, 69, 71].every(isWhiteKey)).toBe(true);
  });

  it('classifies the accidentals as black', () => {
    expect([61, 63, 66, 68, 70].some(isWhiteKey)).toBe(false);
  });
});

describe('buildKeyLayout', () => {
  it('enforces the minimum key width on a narrow phone', () => {
    // The whole point of the rework: 14 white keys in 360px would be ~26px
    // each, well under a fingertip.
    const layout = buildKeyLayout({ ...BASE, containerWidth: 360, minWhiteWidth: 40 });
    expect(layout.whiteCount).toBe(14);
    expect(layout.whiteWidth).toBe(40);
    expect(layout.trackWidth).toBe(560);
  });

  it('fills the container exactly when the keys already fit', () => {
    // Wide viewports must keep behaving as before, with nothing to scroll.
    const layout = buildKeyLayout({ ...BASE, containerWidth: 980, minWhiteWidth: 40 });
    expect(layout.whiteWidth).toBe(70);
    expect(layout.trackWidth).toBe(980);
  });

  it('lays white keys out edge to edge with no gaps', () => {
    const layout = buildKeyLayout({ ...BASE, containerWidth: 360 });
    const whites = layout.keys.filter(k => k.kind === 'white');
    for (let i = 1; i < whites.length; i++) {
      expect(whites[i].x).toBeCloseTo(whites[i - 1].x + whites[i - 1].width);
    }
  });

  it('produces the right number of keys of each kind', () => {
    const layout = buildKeyLayout({ ...BASE, containerWidth: 360 });
    expect(layout.keys.filter(k => k.kind === 'white')).toHaveLength(14);
    expect(layout.keys.filter(k => k.kind === 'black')).toHaveLength(10);
  });

  it('makes black keys narrower and shorter than white ones', () => {
    const layout = buildKeyLayout({ ...BASE, containerWidth: 360 });
    const black = layout.keys.find(k => k.kind === 'black')!;
    expect(black.width).toBeLessThan(layout.whiteWidth);
    expect(black.height).toBeLessThan(160);
    // Still has to be reachable with a fingertip.
    expect(black.width).toBeGreaterThanOrEqual(26);
  });

  it('keeps a range that opens on a black key inside the track', () => {
    const layout = buildKeyLayout({ startNote: 49, numOctaves: 1, containerWidth: 360, height: 160 });
    expect(layout.keys.every(k => k.x >= 0)).toBe(true);
  });

  it('returns an empty layout rather than dividing by zero', () => {
    const layout = buildKeyLayout({ ...BASE, numOctaves: 0, containerWidth: 360 });
    expect(layout.keys).toHaveLength(0);
    expect(layout.trackWidth).toBe(0);
  });
});

describe('midiAtPoint', () => {
  const layout = buildKeyLayout({ ...BASE, containerWidth: 360, minWhiteWidth: 40 });

  it('finds the first white key at its centre', () => {
    expect(midiAtPoint(layout, 20, 140)).toBe(48); // C3
  });

  it('finds a black key in its upper region', () => {
    const black = layout.keys.find(k => k.midi === 49)!; // C#3
    expect(midiAtPoint(layout, black.x + black.width / 2, 10)).toBe(49);
  });

  it('falls through to the white key below a black key', () => {
    // Same x, but past the black key's shorter height.
    const black = layout.keys.find(k => k.midi === 49)!;
    const midi = midiAtPoint(layout, black.x + black.width / 2, layout.blackHeight + 5);
    expect(midi).not.toBe(49);
    expect([48, 50]).toContain(midi);
  });

  it('returns null outside the track', () => {
    expect(midiAtPoint(layout, -5, 50)).toBeNull();
    expect(midiAtPoint(layout, layout.trackWidth + 5, 50)).toBeNull();
    expect(midiAtPoint(layout, 20, 500)).toBeNull();
  });

  it('assigns adjacent white keys to distinct notes', () => {
    expect(midiAtPoint(layout, 20, 140)).toBe(48);
    expect(midiAtPoint(layout, 60, 140)).toBe(50);
    expect(midiAtPoint(layout, 100, 140)).toBe(52);
  });
});

describe('scrollOffsetForNote', () => {
  const layout = buildKeyLayout({ ...BASE, containerWidth: 360, minWhiteWidth: 40 });

  it('clamps to the start of the track', () => {
    expect(scrollOffsetForNote(layout, 48, 360)).toBe(0);
  });

  it('clamps to the end of the track', () => {
    const max = layout.trackWidth - 360;
    expect(scrollOffsetForNote(layout, 71, 360)).toBeLessThanOrEqual(max);
  });

  it('centres a note in the middle of the range', () => {
    const offset = scrollOffsetForNote(layout, 60, 360);
    expect(offset).toBeGreaterThan(0);
    expect(offset).toBeLessThan(layout.trackWidth - 360);
  });

  it('returns 0 for a note outside the layout', () => {
    expect(scrollOffsetForNote(layout, 12, 360)).toBe(0);
  });
});
