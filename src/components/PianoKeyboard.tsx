import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio } from '../hooks/useAudio';
import { triggerHapticFeedback } from '../utils/haptics';

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
}

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
const BLACK_KEYS = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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
}: PianoKeyboardProps) {
  const audio = useAudio();
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const touchRef = useRef<Map<number, number>>(new Map()); // touchId -> noteId

  const endNote = startNote + numOctaves * 12;

  // Get all white keys in range
  const whiteKeys: number[] = [];
  const blackKeys: number[] = [];

  for (let midi = startNote; midi < endNote; midi++) {
    const noteInOctave = midi % 12;
    if (WHITE_KEYS.includes(noteInOctave)) {
      whiteKeys.push(midi);
    } else {
      blackKeys.push(midi);
    }
  }

  const playNote = useCallback((midi: number) => {
    if (disabled) return;

    audio.playNote(midi, 0.5);
    triggerHapticFeedback('light');
    onNotePlay?.(midi);

    setActiveKeys(prev => {
      const next = new Set(prev);
      next.add(midi);
      return next;
    });

    // Clear active state after a short delay
    setTimeout(() => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(midi);
        return next;
      });
    }, 200);
  }, [audio, disabled, onNotePlay]);

  // Keyboard input for desktop
  useEffect(() => {
    const keyMap: Record<string, number> = {
      'a': startNote,      // C
      'w': startNote + 1,  // C#
      's': startNote + 2,  // D
      'e': startNote + 3,  // D#
      'd': startNote + 4,  // E
      'f': startNote + 5,  // F
      't': startNote + 6,  // F#
      'g': startNote + 7,  // G
      'y': startNote + 8,  // G#
      'h': startNote + 9,  // A
      'u': startNote + 10, // A#
      'j': startNote + 11, // B
      'k': startNote + 12, // C (next octave)
      'o': startNote + 13, // C#
      'l': startNote + 14, // D
      'p': startNote + 15, // D#
      ';': startNote + 16, // E
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const midi = keyMap[e.key.toLowerCase()];
      if (midi !== undefined && !e.repeat) {
        playNote(midi);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, playNote, startNote]);

  const getBlackKeyPosition = (midi: number): number => {
    const noteInOctave = midi % 12;
    const octaveOffset = Math.floor((midi - startNote) / 12);
    const whiteKeysBeforeThisOctave = whiteKeys.filter(k => k < startNote + octaveOffset * 12).length;

    // Position based on which white key it's after
    const positions: Record<number, number> = {
      1: 0.7,   // C# is 70% from C to D
      3: 1.7,   // D# is 70% from D to E
      6: 3.7,   // F# is 70% from F to G
      8: 4.7,   // G# is 70% from G to A
      10: 5.7,  // A# is 70% from A to B
    };

    const basePosition = positions[noteInOctave] || 0;
    return (whiteKeysBeforeThisOctave + octaveOffset * 7 + basePosition) / whiteKeys.length * 100;
  };

  const isHighlighted = (midi: number) => highlightNotes.includes(midi);
  const isPlayed = (midi: number) => playedNotes.includes(midi);
  const isActive = (midi: number) => activeKeys.has(midi);

  const whiteKeyWidth = 100 / whiteKeys.length;
  const blackKeyWidth = whiteKeyWidth * 0.6;

  return (
    <div
      className={`relative select-none ${compact ? 'h-24' : 'h-36'} w-full`}
      style={{ touchAction: 'none' }}
    >
      {/* White keys */}
      <div className="absolute inset-0 flex">
        {whiteKeys.map((midi, index) => {
          const noteName = NOTE_NAMES[midi % 12];
          const octave = Math.floor(midi / 12) - 1;
          const highlighted = isHighlighted(midi);
          const played = isPlayed(midi);
          const active = isActive(midi);

          return (
            <button
              key={midi}
              disabled={disabled}
              onMouseDown={() => playNote(midi)}
              onTouchStart={(e) => {
                e.preventDefault();
                playNote(midi);
              }}
              className={`
                relative flex-1 border border-gray-400 rounded-b-lg
                transition-all duration-100
                ${active ? 'bg-purple-300 scale-[0.98]' : 'bg-white hover:bg-gray-100'}
                ${highlighted ? 'ring-2 ring-green-500 ring-inset' : ''}
                ${played ? 'bg-green-200' : ''}
                ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              `}
              style={{ width: `${whiteKeyWidth}%` }}
            >
              {showLabels && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-medium ${
                  active ? 'text-purple-800' : 'text-gray-500'
                }`}>
                  {noteName}{octave}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Black keys */}
      {blackKeys.map(midi => {
        const highlighted = isHighlighted(midi);
        const played = isPlayed(midi);
        const active = isActive(midi);
        const position = getBlackKeyPosition(midi);

        return (
          <button
            key={midi}
            disabled={disabled}
            onMouseDown={() => playNote(midi)}
            onTouchStart={(e) => {
              e.preventDefault();
              playNote(midi);
            }}
            className={`
              absolute top-0 rounded-b-lg z-10
              transition-all duration-100
              ${active ? 'bg-purple-600 scale-[0.98]' : 'bg-gray-900 hover:bg-gray-800'}
              ${highlighted ? 'ring-2 ring-green-500' : ''}
              ${played ? 'bg-green-600' : ''}
              ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
            `}
            style={{
              left: `${position}%`,
              width: `${blackKeyWidth}%`,
              height: compact ? '60%' : '65%',
              transform: 'translateX(-50%)',
            }}
          />
        );
      })}
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
    />
  );
}
