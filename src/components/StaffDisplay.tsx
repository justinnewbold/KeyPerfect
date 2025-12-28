import React from 'react';

interface StaffDisplayProps {
  note: string; // e.g., "C4", "F#5", "Bb3"
  clef?: 'treble' | 'bass';
  showNoteName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Note positions on the staff (treble clef, from bottom line E4)
const TREBLE_NOTE_POSITIONS: Record<string, number> = {
  'C4': -2, 'D4': -1, 'E4': 0, 'F4': 1, 'G4': 2, 'A4': 3, 'B4': 4,
  'C5': 5, 'D5': 6, 'E5': 7, 'F5': 8, 'G5': 9, 'A5': 10, 'B5': 11,
  'C6': 12, 'D6': 13,
  // Sharps/flats use same position as natural
  'C#4': -2, 'Db4': -2, 'D#4': -1, 'Eb4': -1, 'F#4': 1, 'Gb4': 1,
  'G#4': 2, 'Ab4': 2, 'A#4': 3, 'Bb4': 3,
  'C#5': 5, 'Db5': 5, 'D#5': 6, 'Eb5': 6, 'F#5': 8, 'Gb5': 8,
  'G#5': 9, 'Ab5': 9, 'A#5': 10, 'Bb5': 10,
};

// Bass clef positions (from bottom line G2)
const BASS_NOTE_POSITIONS: Record<string, number> = {
  'E2': -2, 'F2': -1, 'G2': 0, 'A2': 1, 'B2': 2,
  'C3': 3, 'D3': 4, 'E3': 5, 'F3': 6, 'G3': 7, 'A3': 8, 'B3': 9,
  'C4': 10, 'D4': 11,
  // Sharps/flats
  'F#2': -1, 'Gb2': -1, 'G#2': 0, 'Ab2': 0, 'A#2': 1, 'Bb2': 1,
  'C#3': 3, 'Db3': 3, 'D#3': 4, 'Eb3': 4, 'F#3': 6, 'Gb3': 6,
  'G#3': 7, 'Ab3': 7, 'A#3': 8, 'Bb3': 8,
};

export function StaffDisplay({
  note,
  clef = 'treble',
  showNoteName = false,
  size = 'md'
}: StaffDisplayProps) {
  const positions = clef === 'treble' ? TREBLE_NOTE_POSITIONS : BASS_NOTE_POSITIONS;
  const notePosition = positions[note] ?? 5; // Default to middle if not found

  // Check if note has accidental
  const hasSharp = note.includes('#');
  const hasFlat = note.includes('b') && !note.startsWith('B');

  // Determine if ledger lines are needed
  const needsLowerLedger = notePosition < 0;
  const needsUpperLedger = notePosition > 8;
  const ledgerCount = needsLowerLedger
    ? Math.ceil(Math.abs(notePosition) / 2)
    : needsUpperLedger
    ? Math.ceil((notePosition - 8) / 2)
    : 0;

  // Size configurations
  const sizes = {
    sm: { width: 120, height: 80, lineSpacing: 8, noteSize: 10 },
    md: { width: 200, height: 120, lineSpacing: 12, noteSize: 14 },
    lg: { width: 280, height: 160, lineSpacing: 16, noteSize: 18 },
  };

  const { width, height, lineSpacing, noteSize } = sizes[size];
  const staffTop = height / 2 - lineSpacing * 2;

  // Calculate note Y position (from bottom line)
  const noteY = staffTop + lineSpacing * 4 - (notePosition * lineSpacing / 2);

  return (
    <div className="flex flex-col items-center">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="bg-white/5 rounded-lg"
      >
        {/* Staff lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1={20}
            y1={staffTop + i * lineSpacing}
            x2={width - 20}
            y2={staffTop + i * lineSpacing}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1}
          />
        ))}

        {/* Clef */}
        <text
          x={30}
          y={staffTop + lineSpacing * 2.5}
          fill="rgba(255,255,255,0.8)"
          fontSize={lineSpacing * 3}
          fontFamily="serif"
          dominantBaseline="middle"
        >
          {clef === 'treble' ? '𝄞' : '𝄢'}
        </text>

        {/* Ledger lines */}
        {needsLowerLedger && Array.from({ length: ledgerCount }).map((_, i) => (
          <line
            key={`lower-${i}`}
            x1={width / 2 - noteSize * 1.5}
            y1={staffTop + lineSpacing * 5 + i * lineSpacing}
            x2={width / 2 + noteSize * 1.5}
            y2={staffTop + lineSpacing * 5 + i * lineSpacing}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1}
          />
        ))}

        {needsUpperLedger && Array.from({ length: ledgerCount }).map((_, i) => (
          <line
            key={`upper-${i}`}
            x1={width / 2 - noteSize * 1.5}
            y1={staffTop - lineSpacing * (i + 1)}
            x2={width / 2 + noteSize * 1.5}
            y2={staffTop - lineSpacing * (i + 1)}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1}
          />
        ))}

        {/* Accidental */}
        {(hasSharp || hasFlat) && (
          <text
            x={width / 2 - noteSize * 2}
            y={noteY}
            fill="white"
            fontSize={noteSize * 1.5}
            fontFamily="serif"
            dominantBaseline="middle"
            textAnchor="middle"
          >
            {hasSharp ? '♯' : '♭'}
          </text>
        )}

        {/* Note head (filled ellipse) */}
        <ellipse
          cx={width / 2}
          cy={noteY}
          rx={noteSize * 0.8}
          ry={noteSize * 0.6}
          fill="white"
          transform={`rotate(-15 ${width / 2} ${noteY})`}
        />

        {/* Stem */}
        <line
          x1={notePosition > 4 ? width / 2 - noteSize * 0.7 : width / 2 + noteSize * 0.7}
          y1={noteY}
          x2={notePosition > 4 ? width / 2 - noteSize * 0.7 : width / 2 + noteSize * 0.7}
          y2={notePosition > 4 ? noteY + lineSpacing * 3 : noteY - lineSpacing * 3}
          stroke="white"
          strokeWidth={1.5}
        />
      </svg>

      {showNoteName && (
        <div className="mt-2 text-lg font-bold text-purple-400">
          {note}
        </div>
      )}
    </div>
  );
}

// Get a random note for the note reading game
export function getRandomNote(clef: 'treble' | 'bass' = 'treble'): { note: string; midi: number } {
  const trebleNotes = [
    { note: 'C4', midi: 60 }, { note: 'D4', midi: 62 }, { note: 'E4', midi: 64 },
    { note: 'F4', midi: 65 }, { note: 'G4', midi: 67 }, { note: 'A4', midi: 69 },
    { note: 'B4', midi: 71 }, { note: 'C5', midi: 72 }, { note: 'D5', midi: 74 },
    { note: 'E5', midi: 76 }, { note: 'F5', midi: 77 }, { note: 'G5', midi: 79 },
    { note: 'A5', midi: 81 }, { note: 'B5', midi: 83 },
  ];

  const bassNotes = [
    { note: 'E2', midi: 40 }, { note: 'F2', midi: 41 }, { note: 'G2', midi: 43 },
    { note: 'A2', midi: 45 }, { note: 'B2', midi: 47 }, { note: 'C3', midi: 48 },
    { note: 'D3', midi: 50 }, { note: 'E3', midi: 52 }, { note: 'F3', midi: 53 },
    { note: 'G3', midi: 55 }, { note: 'A3', midi: 57 }, { note: 'B3', midi: 59 },
  ];

  const notes = clef === 'treble' ? trebleNotes : bassNotes;
  return notes[Math.floor(Math.random() * notes.length)];
}

// Get display name for note (without octave number for answer options)
export function getNoteDisplayName(note: string): string {
  return note.replace(/[0-9]/g, '');
}
