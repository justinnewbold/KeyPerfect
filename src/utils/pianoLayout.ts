// Piano keyboard geometry, kept pure so the multi-touch hit test can be tested
// without a layout engine. The component hit-tests against these rectangles
// rather than calling document.elementFromPoint, which returns null under jsdom
// and misbehaves while a pointer is captured.

/** Semitone offsets within an octave that are white keys. */
const WHITE_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11];

export type KeyKind = 'white' | 'black';

export interface KeyRect {
  midi: number;
  kind: KeyKind;
  /** Left edge in px, relative to the track. */
  x: number;
  width: number;
  height: number;
}

export interface KeyLayout {
  keys: KeyRect[];
  /** Total scrollable width in px. */
  trackWidth: number;
  whiteWidth: number;
  whiteCount: number;
  blackHeight: number;
}

export interface KeyLayoutOptions {
  startNote: number;
  numOctaves: number;
  /** Width available to the keyboard in px. */
  containerWidth: number;
  height: number;
  /** Floor for white key width. Below ~40px keys are not reliably hittable. */
  minWhiteWidth?: number;
  blackWidthRatio?: number;
  blackHeightRatio?: number;
}

export function isWhiteKey(midi: number): boolean {
  return WHITE_PITCH_CLASSES.includes(((midi % 12) + 12) % 12);
}

/**
 * Lay the keyboard out in pixels.
 *
 * White keys get at least `minWhiteWidth`; when the container is wide enough
 * to fit them all at that size the track is exactly the container width and
 * nothing scrolls, so wide viewports behave as they did before.
 *
 * Black keys are centred on the boundary between their neighbouring white
 * keys. Real pianos offset them slightly, but centring keeps the visual and
 * the hit test in exact agreement, which matters more here than the last few
 * percent of realism.
 */
export function buildKeyLayout({
  startNote,
  numOctaves,
  containerWidth,
  height,
  minWhiteWidth = 40,
  blackWidthRatio = 0.65,
  blackHeightRatio = 0.62,
}: KeyLayoutOptions): KeyLayout {
  const endNote = startNote + numOctaves * 12;

  let whiteCount = 0;
  for (let midi = startNote; midi < endNote; midi++) {
    if (isWhiteKey(midi)) whiteCount++;
  }
  if (whiteCount === 0) {
    return { keys: [], trackWidth: 0, whiteWidth: 0, whiteCount: 0, blackHeight: 0 };
  }

  const whiteWidth = Math.max(minWhiteWidth, containerWidth / whiteCount);
  const blackWidth = whiteWidth * blackWidthRatio;
  const blackHeight = height * blackHeightRatio;

  const white: KeyRect[] = [];
  const black: KeyRect[] = [];
  let whiteIndex = 0;

  for (let midi = startNote; midi < endNote; midi++) {
    if (isWhiteKey(midi)) {
      white.push({
        midi,
        kind: 'white',
        x: whiteIndex * whiteWidth,
        width: whiteWidth,
        height,
      });
      whiteIndex++;
    } else {
      // whiteIndex is the count of white keys already placed, so it is exactly
      // the boundary this black key straddles.
      const centre = whiteIndex * whiteWidth;
      black.push({
        midi,
        kind: 'black',
        // Clamped for a range that opens on a black key, which would otherwise
        // hang half off the left edge.
        x: Math.max(0, centre - blackWidth / 2),
        width: blackWidth,
        height: blackHeight,
      });
    }
  }

  return {
    // White first so black keys paint over them; the hit test does not rely on
    // this order.
    keys: [...white, ...black],
    trackWidth: whiteCount * whiteWidth,
    whiteWidth,
    whiteCount,
    blackHeight,
  };
}

/**
 * The key at a point in track coordinates, or null. Black keys are tested
 * first because they overlap the white keys they sit between, but only within
 * their shorter height, so the lower part of a white key stays reachable.
 */
export function midiAtPoint(layout: KeyLayout, x: number, y: number): number | null {
  if (x < 0 || x > layout.trackWidth) return null;

  for (const key of layout.keys) {
    if (key.kind !== 'black') continue;
    if (x >= key.x && x < key.x + key.width && y >= 0 && y < key.height) {
      return key.midi;
    }
  }

  for (const key of layout.keys) {
    if (key.kind !== 'white') continue;
    if (x >= key.x && x < key.x + key.width && y >= 0 && y < key.height) {
      return key.midi;
    }
  }

  return null;
}

/**
 * Scroll offset that brings a given note into view, clamped to the track.
 * Used by the octave controls and to reveal highlighted notes.
 */
export function scrollOffsetForNote(
  layout: KeyLayout,
  midi: number,
  viewportWidth: number,
): number {
  const key = layout.keys.find(k => k.midi === midi);
  if (!key) return 0;
  const target = key.x + key.width / 2 - viewportWidth / 2;
  return Math.max(0, Math.min(target, Math.max(0, layout.trackWidth - viewportWidth)));
}
