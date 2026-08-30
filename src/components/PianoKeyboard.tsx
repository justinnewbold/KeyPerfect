import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { triggerHapticFeedback } from '../utils/haptics';
import { buildKeyLayout, KeyLayout, midiAtPoint, scrollOffsetForNote } from '../utils/pianoLayout';

interface PianoKeyboardProps {
  startNote?: number; // MIDI note number (default 48 = C3)
  numOctaves?: number; // Number of octaves to display
  onNotePlay?: (midi: number) => void;
  onNotesChange?: (notes: number[]) => void;
  highlightNotes?: number[]; // Notes to highlight (correct answer)
  playedNotes?: number[]; // Notes already played by user
  disabled?: boolean;
  showLabels?: boolean;
  compact?: boolean;
  /** Floor for white key width in px. */
  minWhiteKeyWidth?: number;
  /**
   * Sliding a finger across keys plays each in turn. Right for free play,
   * wrong for note entry, where a stray smear enters notes the user did not
   * mean and costs them the answer.
   */
  glissando?: boolean;
  /** Show the octave shift controls. Default true. */
  octaveControls?: boolean;
  /** Cap on simultaneous voices; the oldest is stolen beyond it. */
  maxVoices?: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Lowest and highest starting notes reachable with the octave controls. */
const MIN_START_NOTE = 24; // C1
const MAX_START_NOTE = 96; // C7

/** Minimum gap between glissando haptics; a fast smear would otherwise buzz. */
const GLISS_HAPTIC_MS = 30;

type Voice = { stop: () => void };

function noteLabel(midi: number): string {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export function PianoKeyboard({
  startNote = 48, // C3
  numOctaves = 2,
  onNotePlay,
  onNotesChange,
  highlightNotes = [],
  playedNotes = [],
  disabled = false,
  showLabels = true,
  compact = false,
  minWhiteKeyWidth = 40,
  glissando = false,
  octaveControls = true,
  maxVoices = 8,
}: PianoKeyboardProps) {
  const audio = useAudio();
  const reducedMotion = usePrefersReducedMotion();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [octaveShift, setOctaveShift] = useState(0);

  const height = compact ? 96 : 160;
  const effectiveStart = startNote + octaveShift * 12;

  const layout: KeyLayout = buildKeyLayout({
    startNote: effectiveStart,
    numOctaves,
    containerWidth: viewportWidth,
    height,
    minWhiteWidth: minWhiteKeyWidth,
  });
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  /*
   * Refs are the source of truth for sounding notes; activeKeys is derived and
   * exists only to drive rendering. Pointer handlers fire faster than React
   * batches state, so tracking voices in state would drop notes.
   */
  const pointersRef = useRef<Map<number, { midi: number; voice: Voice }>>(new Map());
  const voiceOrderRef = useRef<number[]>([]); // pointerIds, oldest first
  const keyboardVoicesRef = useRef<Map<string, { midi: number; voice: Voice }>>(new Map());
  const lastGlissHapticRef = useRef(0);
  const [activeKeys, setActiveKeys] = useState<ReadonlySet<number>>(new Set());

  const syncActiveKeys = useCallback(() => {
    const midis = new Set<number>();
    pointersRef.current.forEach(v => midis.add(v.midi));
    keyboardVoicesRef.current.forEach(v => midis.add(v.midi));
    setActiveKeys(midis);
    onNotesChange?.([...midis]);
  }, [onNotesChange]);

  const startVoice = useCallback(
    (midi: number): Voice | null => {
      if (disabled) return null;
      const voice = audio.startNote(midi);
      onNotePlay?.(midi);
      return voice;
    },
    [audio, disabled, onNotePlay],
  );

  /**
   * Sound a note for a moment. Used when a key is activated by keyboard or
   * assistive tech, which has no press-and-release to map onto.
   */
  const pressBriefly = useCallback(
    (midi: number) => {
      const id = `activate-${midi}`;
      if (keyboardVoicesRef.current.has(id)) return;
      const voice = startVoice(midi);
      if (!voice) return;
      keyboardVoicesRef.current.set(id, { midi, voice });
      syncActiveKeys();
      setTimeout(() => {
        const entry = keyboardVoicesRef.current.get(id);
        if (!entry) return;
        entry.voice.stop();
        keyboardVoicesRef.current.delete(id);
        syncActiveKeys();
      }, 400);
    },
    [startVoice, syncActiveKeys],
  );

  // --- pointer input -------------------------------------------------------

  const releasePointer = useCallback(
    (pointerId: number) => {
      const entry = pointersRef.current.get(pointerId);
      if (!entry) return;
      entry.voice.stop();
      pointersRef.current.delete(pointerId);
      voiceOrderRef.current = voiceOrderRef.current.filter(id => id !== pointerId);
      syncActiveKeys();
    },
    [syncActiveKeys],
  );

  const pointToMidi = useCallback((clientX: number, clientY: number): number | null => {
    const el = scrollRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    // Track coordinates, so scroll position is accounted for.
    return midiAtPoint(layoutRef.current, clientX - rect.left + el.scrollLeft, clientY - rect.top);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      const midi = pointToMidi(e.clientX, e.clientY);
      if (midi === null) return;

      // Capture on the container so moves and the release still arrive if the
      // finger slides off the keyboard; without it a note sticks on.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Not fatal: the note still plays, it just may not track off-element.
      }

      if (pointersRef.current.size >= maxVoices) {
        const oldest = voiceOrderRef.current[0];
        if (oldest !== undefined) releasePointer(oldest);
      }

      const voice = startVoice(midi);
      if (!voice) return;
      pointersRef.current.set(e.pointerId, { midi, voice });
      voiceOrderRef.current.push(e.pointerId);
      triggerHapticFeedback('light');
      syncActiveKeys();
    },
    [disabled, maxVoices, pointToMidi, releasePointer, startVoice, syncActiveKeys],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!glissando) return;
      const entry = pointersRef.current.get(e.pointerId);
      if (!entry) return;

      const midi = pointToMidi(e.clientX, e.clientY);
      if (midi === null || midi === entry.midi) return;

      entry.voice.stop();
      const voice = startVoice(midi);
      if (!voice) {
        pointersRef.current.delete(e.pointerId);
        voiceOrderRef.current = voiceOrderRef.current.filter(id => id !== e.pointerId);
        syncActiveKeys();
        return;
      }
      pointersRef.current.set(e.pointerId, { midi, voice });

      const now = Date.now();
      if (now - lastGlissHapticRef.current > GLISS_HAPTIC_MS) {
        lastGlissHapticRef.current = now;
        triggerHapticFeedback('light');
      }
      syncActiveKeys();
    },
    [glissando, pointToMidi, startVoice, syncActiveKeys],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => releasePointer(e.pointerId),
    [releasePointer],
  );

  // --- computer keyboard input --------------------------------------------

  useEffect(() => {
    const keyMap: Record<string, number> = {
      a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6,
      g: 7, y: 8, h: 9, u: 10, j: 11, k: 12,
      o: 13, l: 14, p: 15, ';': 16,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || e.repeat) return;
      const key = e.key.toLowerCase();
      const offset = keyMap[key];
      if (offset === undefined || keyboardVoicesRef.current.has(key)) return;
      const midi = effectiveStart + offset;
      const voice = startVoice(midi);
      if (!voice) return;
      keyboardVoicesRef.current.set(key, { midi, voice });
      syncActiveKeys();
    };

    // Previously there was no keyup path at all, so held keys just ran out
    // their fixed duration.
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const entry = keyboardVoicesRef.current.get(key);
      if (!entry) return;
      entry.voice.stop();
      keyboardVoicesRef.current.delete(key);
      syncActiveKeys();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabled, effectiveStart, startVoice, syncActiveKeys]);

  // --- lifecycle -----------------------------------------------------------

  // Silence everything still sounding when the component goes away or is
  // disabled mid-press. Without this, navigating away leaves a note ringing.
  useEffect(() => {
    if (!disabled) return;
    pointersRef.current.forEach(v => v.voice.stop());
    pointersRef.current.clear();
    keyboardVoicesRef.current.forEach(v => v.voice.stop());
    keyboardVoicesRef.current.clear();
    voiceOrderRef.current = [];
    setActiveKeys(new Set());
  }, [disabled]);

  useEffect(() => {
    const pointers = pointersRef.current;
    const keys = keyboardVoicesRef.current;
    return () => {
      pointers.forEach(v => v.voice.stop());
      pointers.clear();
      keys.forEach(v => v.voice.stop());
      keys.clear();
    };
  }, []);

  // Track the available width so the layout can decide whether to scroll.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewportWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Bring highlighted notes into view when they land outside the window.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || highlightNotes.length === 0 || layout.trackWidth <= el.clientWidth) return;
    const target = layout.keys.find(k => k.midi === highlightNotes[0]);
    if (!target) return;
    const visible = target.x >= el.scrollLeft && target.x + target.width <= el.scrollLeft + el.clientWidth;
    if (visible) return;
    el.scrollTo({
      left: scrollOffsetForNote(layout, highlightNotes[0], el.clientWidth),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [highlightNotes, layout, reducedMotion]);

  const shiftOctave = useCallback(
    (delta: number) => {
      setOctaveShift(prev => {
        const next = prev + delta;
        const candidate = startNote + next * 12;
        if (candidate < MIN_START_NOTE || candidate + numOctaves * 12 > MAX_START_NOTE) {
          return prev;
        }
        triggerHapticFeedback('light');
        return next;
      });
    },
    [numOctaves, startNote],
  );

  const isHighlighted = (midi: number) => highlightNotes.includes(midi);
  const isPlayed = (midi: number) => playedNotes.includes(midi);

  const canShiftDown = effectiveStart - 12 >= MIN_START_NOTE;
  const canShiftUp = effectiveStart + 12 + numOctaves * 12 <= MAX_START_NOTE;
  const scrolls = layout.trackWidth > viewportWidth + 1;

  return (
    <div className="w-full">
      {octaveControls && (
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => shiftOctave(-1)}
            disabled={!canShiftDown}
            aria-label="Shift down an octave"
            className="tap-target rounded-lg bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs text-white/60 tabular-nums">
            {noteLabel(effectiveStart)} – {noteLabel(effectiveStart + numOctaves * 12)}
          </span>
          <button
            type="button"
            onClick={() => shiftOctave(1)}
            disabled={!canShiftUp}
            aria-label="Shift up an octave"
            className="tap-target rounded-lg bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        /*
         * data-no-swipe keeps the app's edge-swipe navigation off the
         * keyboard. touch-action is the real decision here: `none` lets us own
         * every touch, which is what multi-touch and glissando need, at the
         * cost of native momentum scrolling -- hence the octave buttons above.
         * Without glissando there is nothing to own, so scrolling comes back.
         */
        data-no-swipe
        className="relative w-full overflow-x-auto select-none"
        style={{ height, touchAction: glissando ? 'none' : 'pan-x' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
      >
        <div className="relative" style={{ width: layout.trackWidth || '100%', height }}>
          {layout.keys.map(key => {
            const active = activeKeys.has(key.midi);
            const highlighted = isHighlighted(key.midi);
            const played = isPlayed(key.midi);
            const isBlack = key.kind === 'black';

            return (
              <button
                key={key.midi}
                type="button"
                data-midi={key.midi}
                disabled={disabled}
                aria-label={noteLabel(key.midi)}
                // Pointer input is handled by the container against the layout
                // geometry, so this fires only for keyboard and assistive-tech
                // activation, which report detail 0.
                onClick={e => {
                  if (e.detail === 0) pressBriefly(key.midi);
                }}
                className={`absolute top-0 border transition-colors duration-100 ${
                  isBlack
                    ? `rounded-b-md z-10 border-gray-800 ${
                        active ? 'bg-purple-600' : played ? 'bg-green-600' : 'bg-gray-900'
                      }`
                    : `rounded-b-lg border-gray-400 ${
                        active ? 'bg-purple-300' : played ? 'bg-green-200' : 'bg-white'
                      }`
                } ${highlighted ? 'ring-2 ring-green-500 ring-inset' : ''} ${
                  disabled ? 'opacity-60' : 'cursor-pointer'
                }`}
                style={{ left: key.x, width: key.width, height: key.height }}
              >
                {showLabels && !isBlack && (
                  <span
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-medium ${
                      active ? 'text-purple-800' : 'text-gray-500'
                    }`}
                  >
                    {noteLabel(key.midi)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {scrolls && (
        <p className="mt-1 text-center text-xs text-white/40">
          Scroll for more keys, or use the octave arrows
        </p>
      )}
    </div>
  );
}

// Simplified piano for practice mode
export function MiniPiano({
  onNotePlay,
  disabled = false,
}: {
  onNotePlay?: (midi: number) => void;
  disabled?: boolean;
}) {
  return (
    <PianoKeyboard
      startNote={60} // Middle C
      numOctaves={1}
      onNotePlay={onNotePlay}
      disabled={disabled}
      showLabels={false}
      compact={true}
      octaveControls={false}
    />
  );
}
