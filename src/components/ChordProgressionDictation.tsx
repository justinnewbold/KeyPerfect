import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Check, X, RotateCcw, ChevronRight } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useAudio } from '../hooks/useAudio';
import { getChordNotes } from '../utils/gameHelpers';
import { CHORD_TYPES } from '../types/music';

interface ChordProgressionDictationProps {
  onBack: () => void;
}

type ChordType = 'major' | 'minor' | 'diminished' | 'augmented' | 'dominant7';

interface Progression {
  name: string;
  rootNote: number;
  chords: { type: ChordType; semitones: number }[];
}

const PROGRESSIONS: Progression[] = [
  { name: 'I-V-vi-IV', rootNote: 60, chords: [
    { type: 'major', semitones: 0 },
    { type: 'major', semitones: 7 },
    { type: 'minor', semitones: 9 },
    { type: 'major', semitones: 5 },
  ]},
  { name: 'I-IV-V-I', rootNote: 60, chords: [
    { type: 'major', semitones: 0 },
    { type: 'major', semitones: 5 },
    { type: 'major', semitones: 7 },
    { type: 'major', semitones: 0 },
  ]},
  { name: 'ii-V-I', rootNote: 60, chords: [
    { type: 'minor', semitones: 2 },
    { type: 'dominant7', semitones: 7 },
    { type: 'major', semitones: 0 },
  ]},
  { name: 'I-vi-IV-V', rootNote: 60, chords: [
    { type: 'major', semitones: 0 },
    { type: 'minor', semitones: 9 },
    { type: 'major', semitones: 5 },
    { type: 'major', semitones: 7 },
  ]},
  { name: 'vi-IV-I-V', rootNote: 60, chords: [
    { type: 'minor', semitones: 9 },
    { type: 'major', semitones: 5 },
    { type: 'major', semitones: 0 },
    { type: 'major', semitones: 7 },
  ]},
  { name: 'I-IV-vi-V', rootNote: 60, chords: [
    { type: 'major', semitones: 0 },
    { type: 'major', semitones: 5 },
    { type: 'minor', semitones: 9 },
    { type: 'major', semitones: 7 },
  ]},
];

const CHORD_OPTIONS: ChordType[] = ['major', 'minor', 'diminished', 'augmented', 'dominant7'];

function generateRound(): Progression {
  return PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
}

export function ChordProgressionDictation({ onBack }: ChordProgressionDictationProps) {
  const [progression, setProgression] = useState<Progression>(generateRound);
  const [userGuesses, setUserGuesses] = useState<(ChordType | null)[]>([]);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const audio = useAudio();
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const totalChords = progression.chords.length;

  const playProgression = useCallback(() => {
    // Clear previous timeouts
    playTimeoutRef.current.forEach(t => clearTimeout(t));
    playTimeoutRef.current = [];

    progression.chords.forEach((chord, i) => {
      const timeout = setTimeout(() => {
        const notes = getChordNotes(progression.rootNote + chord.semitones, chord.type);
        audio.playChord(notes);
      }, i * 1500);
      playTimeoutRef.current.push(timeout);
    });
  }, [progression, audio]);

  const playSingleChord = useCallback((index: number) => {
    const chord = progression.chords[index];
    const notes = getChordNotes(progression.rootNote + chord.semitones, chord.type);
    audio.playChord(notes);
  }, [progression, audio]);

  const handleGuess = useCallback((chordType: ChordType) => {
    if (isRevealed) return;

    const newGuesses = [...userGuesses];
    newGuesses[currentChordIndex] = chordType;
    setUserGuesses(newGuesses);

    if (currentChordIndex < totalChords - 1) {
      setCurrentChordIndex(currentChordIndex + 1);
    }
  }, [currentChordIndex, totalChords, userGuesses, isRevealed]);

  const handleReveal = useCallback(() => {
    setIsRevealed(true);

    // Count correct guesses
    let correct = 0;
    progression.chords.forEach((chord, i) => {
      if (userGuesses[i] === chord.type) correct++;
    });

    setScore(prev => ({
      correct: prev.correct + correct,
      total: prev.total + totalChords,
    }));
  }, [progression, userGuesses, totalChords]);

  const handleNext = useCallback(() => {
    setProgression(generateRound());
    setUserGuesses([]);
    setCurrentChordIndex(0);
    setIsRevealed(false);
  }, []);

  const allGuessed = userGuesses.filter(g => g !== null && g !== undefined).length === totalChords;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Progression Dictation</h1>
          <p className="text-sm text-white/60">Identify each chord in the progression</p>
        </div>
        <Badge variant="purple">{score.correct}/{score.total}</Badge>
      </div>

      {/* Play button */}
      <Card className="p-6 mb-6 text-center">
        <h2 className="text-lg font-semibold mb-4">
          {totalChords}-Chord Progression
        </h2>
        <button
          onClick={playProgression}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30"
        >
          <Play className="w-9 h-9 ml-1" />
        </button>
        <p className="text-sm text-white/60 mt-3">Tap to play the full progression</p>
      </Card>

      {/* Chord slots */}
      <Card className="p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3 text-white/60">Your Answers</h3>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Array.from({ length: totalChords }).map((_, i) => {
            const guess = userGuesses[i];
            const correct = isRevealed ? progression.chords[i].type : null;
            const isCorrect = isRevealed && guess === correct;
            const isWrong = isRevealed && guess !== correct;
            const isCurrent = !isRevealed && i === currentChordIndex;

            return (
              <button
                key={i}
                onClick={() => {
                  if (!isRevealed) setCurrentChordIndex(i);
                  playSingleChord(i);
                }}
                className={`p-3 rounded-xl border-2 text-center transition-all text-sm ${
                  isCorrect
                    ? 'bg-green-500/20 border-green-500'
                    : isWrong
                    ? 'bg-red-500/20 border-red-500'
                    : isCurrent
                    ? 'bg-purple-500/20 border-purple-500'
                    : 'bg-white/10 border-white/20'
                }`}
              >
                <div className="text-xs text-white/40 mb-1">#{i + 1}</div>
                {guess ? (
                  <div className="font-medium">
                    {CHORD_TYPES[guess as keyof typeof CHORD_TYPES]?.name || guess}
                  </div>
                ) : (
                  <div className="text-white/30">?</div>
                )}
                {isRevealed && isWrong && correct && (
                  <div className="text-xs text-green-400 mt-1">
                    {CHORD_TYPES[correct as keyof typeof CHORD_TYPES]?.name || correct}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!isRevealed && (
          <p className="text-xs text-white/40 text-center">
            Tap a slot to select it, then choose the chord type below
          </p>
        )}
      </Card>

      {/* Chord type selector */}
      {!isRevealed && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {CHORD_OPTIONS.map(chordType => (
            <button
              key={chordType}
              onClick={() => handleGuess(chordType)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                userGuesses[currentChordIndex] === chordType
                  ? 'bg-purple-500/30 border-purple-500'
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              }`}
            >
              {CHORD_TYPES[chordType as keyof typeof CHORD_TYPES]?.name || chordType}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {!isRevealed ? (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleReveal}
            disabled={!allGuessed}
            icon={<Check className="w-5 h-5" />}
          >
            Check Answers
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleNext}
            icon={<ChevronRight className="w-5 h-5" />}
          >
            Next Progression
          </Button>
        )}
      </div>
    </div>
  );
}
