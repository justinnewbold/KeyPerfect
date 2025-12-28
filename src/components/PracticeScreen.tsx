import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Volume2, RefreshCw, ChevronLeft, Music } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { PianoKeyboard } from './PianoKeyboard';
import { useAudio } from '../hooks/useAudio';
import {
  CHORD_TYPES,
  SCALE_TYPES,
  INTERVALS,
  ChordQuality,
  ScaleType,
  IntervalType,
} from '../types/music';
import { getChordNotes, getScaleNotes, getIntervalNotes, randomElement } from '../utils/gameHelpers';

type PracticeType = 'chords' | 'scales' | 'intervals' | 'freeplay';

interface PracticeScreenProps {
  onBack: () => void;
}

export function PracticeScreen({ onBack }: PracticeScreenProps) {
  const [practiceType, setPracticeType] = useState<PracticeType>('chords');
  const [currentItem, setCurrentItem] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [rootNote, setRootNote] = useState(60); // Middle C
  const audio = useAudio();
  const playTimeoutRef = useRef<number | null>(null);

  const practiceTypes: { id: PracticeType; name: string; icon: string }[] = [
    { id: 'chords', name: 'Chords', icon: '🎹' },
    { id: 'scales', name: 'Scales', icon: '🎼' },
    { id: 'intervals', name: 'Intervals', icon: '📏' },
    { id: 'freeplay', name: 'Free Play', icon: '🎵' },
  ];

  const playCurrentItem = useCallback(() => {
    if (!currentItem) return;

    if (practiceType === 'chords') {
      const notes = getChordNotes(rootNote, currentItem as ChordQuality);
      audio.playChord(notes);
    } else if (practiceType === 'scales') {
      const notes = getScaleNotes(rootNote, currentItem as ScaleType);
      audio.playScale(notes);
    } else if (practiceType === 'intervals') {
      const notes = getIntervalNotes(rootNote, currentItem as IntervalType);
      audio.playInterval(notes[0], notes[1]);
    }
  }, [currentItem, practiceType, rootNote, audio]);

  // Track if we should auto-play after generating new item
  const shouldAutoPlayRef = useRef(false);

  const generateNew = useCallback(() => {
    setShowAnswer(false);

    // Randomize root note (within a comfortable range)
    const newRoot = 48 + Math.floor(Math.random() * 24); // C3 to B4
    setRootNote(newRoot);

    let newItem: string | null = null;
    if (practiceType === 'chords') {
      const chordTypes = Object.keys(CHORD_TYPES) as ChordQuality[];
      newItem = randomElement(chordTypes);
    } else if (practiceType === 'scales') {
      const scaleTypes = Object.keys(SCALE_TYPES) as ScaleType[];
      newItem = randomElement(scaleTypes);
    } else if (practiceType === 'intervals') {
      const intervalTypes = Object.keys(INTERVALS) as IntervalType[];
      newItem = randomElement(intervalTypes);
    }

    setCurrentItem(newItem);
    shouldAutoPlayRef.current = practiceType !== 'freeplay';
  }, [practiceType]);

  // Auto-play when currentItem changes and shouldAutoPlay is true
  useEffect(() => {
    if (shouldAutoPlayRef.current && currentItem) {
      // Clear any pending timeout
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
      // Play after a short delay
      playTimeoutRef.current = window.setTimeout(() => {
        playCurrentItem();
        shouldAutoPlayRef.current = false;
      }, 300);
    }
    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
    };
  }, [currentItem, playCurrentItem]);

  const getDisplayName = (type: string): string => {
    if (practiceType === 'chords') {
      return CHORD_TYPES[type as ChordQuality]?.name || type;
    }
    if (practiceType === 'scales') {
      return SCALE_TYPES[type as ScaleType]?.name || type;
    }
    if (practiceType === 'intervals') {
      return INTERVALS[type as IntervalType]?.name || type;
    }
    return type;
  };

  const getDescription = (type: string): string => {
    if (practiceType === 'chords') {
      return CHORD_TYPES[type as ChordQuality]?.description || '';
    }
    if (practiceType === 'scales') {
      return SCALE_TYPES[type as ScaleType]?.description || '';
    }
    if (practiceType === 'intervals') {
      return INTERVALS[type as IntervalType]?.description || '';
    }
    return '';
  };

  const handleNotePlay = (midi: number) => {
    // In free play mode, just play the note
    audio.playNote(midi, 0.5);
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Practice Mode</h1>
          <p className="text-sm text-white/60">Practice without pressure</p>
        </div>
      </div>

      {/* Practice Type Selection */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {practiceTypes.map(type => (
          <button
            key={type.id}
            onClick={() => {
              setPracticeType(type.id);
              setCurrentItem(null);
              setShowAnswer(false);
            }}
            className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
              practiceType === type.id
                ? 'bg-purple-500/30 border-2 border-purple-500'
                : 'bg-white/10 border-2 border-transparent hover:bg-white/20'
            }`}
          >
            <span className="text-xl">{type.icon}</span>
            <span className="text-xs">{type.name}</span>
          </button>
        ))}
      </div>

      {/* Main Practice Area */}
      {practiceType === 'freeplay' ? (
        // Free Play Mode - Piano Keyboard
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-4 text-center">Play anything!</h3>
          <PianoKeyboard
            startNote={48}
            numOctaves={2}
            onNotePlay={handleNotePlay}
            showLabels={true}
          />
          <p className="text-sm text-white/50 text-center mt-3">
            Use keyboard (A-L keys) or tap the piano
          </p>
        </Card>
      ) : (
        // Ear Training Mode
        <>
          {!currentItem ? (
            <Card className="p-8 text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Music className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Ready to Practice?</h3>
              <p className="text-white/60 mb-4">
                Generate a random {practiceType.slice(0, -1)} and try to identify it by ear.
              </p>
              <Button
                variant="primary"
                onClick={generateNew}
                icon={<Play className="w-5 h-5" />}
              >
                Start Practicing
              </Button>
            </Card>
          ) : (
            <>
              <Card className="p-6 mb-6">
                <h3 className="font-semibold text-center mb-4">
                  What {practiceType.slice(0, -1)} is this?
                </h3>

                {/* Play Button */}
                <div className="flex justify-center mb-4">
                  <button
                    onClick={playCurrentItem}
                    disabled={audio.isPlaying}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                      audio.isPlaying
                        ? 'bg-purple-500 animate-pulse'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                    }`}
                  >
                    {audio.isPlaying ? (
                      <Volume2 className="w-8 h-8 animate-pulse" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </button>
                </div>

                {/* Show/Hide Answer */}
                {!showAnswer ? (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowAnswer(true)}
                  >
                    Reveal Answer
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-purple-500/20 rounded-xl">
                    <Badge variant="purple" size="lg">
                      {getDisplayName(currentItem)}
                    </Badge>
                    <p className="text-sm text-white/60 mt-2">
                      {getDescription(currentItem)}
                    </p>
                  </div>
                )}
              </Card>

              <Button
                variant="primary"
                fullWidth
                onClick={generateNew}
                icon={<RefreshCw className="w-5 h-5" />}
              >
                Next {practiceType.slice(0, -1).charAt(0).toUpperCase() + practiceType.slice(1, -1)}
              </Button>
            </>
          )}
        </>
      )}

      {/* Quick Reference */}
      {practiceType !== 'freeplay' && (
        <Card className="p-4 mt-6">
          <h4 className="font-semibold mb-3">Quick Reference</h4>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {practiceType === 'chords' &&
              Object.entries(CHORD_TYPES).slice(0, 8).map(([key, chord]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentItem(key);
                    setShowAnswer(true);
                    setTimeout(() => {
                      const notes = getChordNotes(rootNote, key as ChordQuality);
                      audio.playChord(notes);
                    }, 100);
                  }}
                  className="p-2 bg-white/5 rounded-lg text-left text-sm hover:bg-white/10"
                >
                  <div className="font-medium">{chord.name}</div>
                  <div className="text-xs text-white/50">{chord.description}</div>
                </button>
              ))}
            {practiceType === 'scales' &&
              Object.entries(SCALE_TYPES).slice(0, 8).map(([key, scale]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentItem(key);
                    setShowAnswer(true);
                    setTimeout(() => {
                      const notes = getScaleNotes(rootNote, key as ScaleType);
                      audio.playScale(notes);
                    }, 100);
                  }}
                  className="p-2 bg-white/5 rounded-lg text-left text-sm hover:bg-white/10"
                >
                  <div className="font-medium">{scale.name}</div>
                  <div className="text-xs text-white/50">{scale.description}</div>
                </button>
              ))}
            {practiceType === 'intervals' &&
              Object.entries(INTERVALS).map(([key, interval]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentItem(key);
                    setShowAnswer(true);
                    setTimeout(() => {
                      const notes = getIntervalNotes(rootNote, key as IntervalType);
                      audio.playInterval(notes[0], notes[1]);
                    }, 100);
                  }}
                  className="p-2 bg-white/5 rounded-lg text-left text-sm hover:bg-white/10"
                >
                  <div className="font-medium">{interval.name}</div>
                  <div className="text-xs text-white/50">{interval.description}</div>
                </button>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
