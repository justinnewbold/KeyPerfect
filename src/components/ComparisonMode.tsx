import React, { useState, useCallback } from 'react';
import { Play, Volume2, ArrowLeftRight, ChevronLeft } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useAudio } from '../hooks/useAudio';
import { CHORD_TYPES, SCALE_TYPES, INTERVALS, ChordQuality, ScaleType, IntervalType } from '../types/music';
import { getChordNotes, getScaleNotes, getIntervalNotes } from '../utils/gameHelpers';
import { getMidiFromNote, NOTE_NAMES } from '../types/music';

interface ComparisonModeProps {
  onBack: () => void;
}

interface ComparisonPair {
  category: 'chords' | 'scales' | 'intervals';
  itemA: { key: string; label: string; description: string };
  itemB: { key: string; label: string; description: string };
  explanation: string;
}

const COMPARISON_PAIRS: ComparisonPair[] = [
  {
    category: 'chords',
    itemA: { key: 'major', label: 'Major', description: 'Bright, happy sound' },
    itemB: { key: 'minor', label: 'Minor', description: 'Dark, sad sound' },
    explanation: 'The 3rd degree is lowered by one semitone in a minor chord, giving it a darker quality.',
  },
  {
    category: 'chords',
    itemA: { key: 'major7', label: 'Major 7th', description: 'Dreamy, sophisticated' },
    itemB: { key: 'dominant7', label: 'Dominant 7th', description: 'Bluesy, wants resolution' },
    explanation: 'Major 7th has a natural 7th (11 semitones), while dominant 7th has a flat 7th (10 semitones).',
  },
  {
    category: 'chords',
    itemA: { key: 'diminished', label: 'Diminished', description: 'Tense, unstable' },
    itemB: { key: 'augmented', label: 'Augmented', description: 'Dreamy, suspended' },
    explanation: 'Diminished has a flat 3rd and flat 5th. Augmented has a natural 3rd and sharp 5th.',
  },
  {
    category: 'chords',
    itemA: { key: 'sus2', label: 'Suspended 2nd', description: 'Open, lower' },
    itemB: { key: 'sus4', label: 'Suspended 4th', description: 'Anticipating, higher' },
    explanation: 'Sus2 replaces the 3rd with the 2nd, sus4 replaces it with the 4th. Neither sounds major or minor.',
  },
  {
    category: 'chords',
    itemA: { key: 'minor7', label: 'Minor 7th', description: 'Jazzy, mellow' },
    itemB: { key: 'half_diminished7', label: 'Half-Diminished', description: 'Jazzy tension' },
    explanation: 'Half-diminished has a flat 5th compared to minor 7th. It creates more tension.',
  },
  {
    category: 'scales',
    itemA: { key: 'major', label: 'Major', description: 'Happy, bright' },
    itemB: { key: 'natural_minor', label: 'Natural Minor', description: 'Sad, dark' },
    explanation: 'Minor scale lowers the 3rd, 6th, and 7th degrees compared to major.',
  },
  {
    category: 'scales',
    itemA: { key: 'dorian', label: 'Dorian', description: 'Minor but brighter' },
    itemB: { key: 'natural_minor', label: 'Natural Minor', description: 'Standard minor' },
    explanation: 'Dorian has a raised 6th compared to natural minor, giving it a brighter quality.',
  },
  {
    category: 'scales',
    itemA: { key: 'mixolydian', label: 'Mixolydian', description: 'Bluesy major' },
    itemB: { key: 'major', label: 'Major', description: 'Standard major' },
    explanation: 'Mixolydian lowers the 7th degree compared to major, creating a bluesy sound.',
  },
  {
    category: 'intervals',
    itemA: { key: 'minor3', label: 'Minor 3rd', description: 'Greensleeves' },
    itemB: { key: 'major3', label: 'Major 3rd', description: 'Oh When the Saints' },
    explanation: 'The major 3rd is one semitone wider than the minor 3rd. This is the core difference between major and minor.',
  },
  {
    category: 'intervals',
    itemA: { key: 'perfect4', label: 'Perfect 4th', description: 'Here Comes the Bride' },
    itemB: { key: 'perfect5', label: 'Perfect 5th', description: 'Star Wars' },
    explanation: 'The perfect 5th is wider (7 semitones) vs the perfect 4th (5 semitones). They are inversions of each other.',
  },
  {
    category: 'intervals',
    itemA: { key: 'minor7', label: 'Minor 7th', description: 'Star Trek theme' },
    itemB: { key: 'major7', label: 'Major 7th', description: 'Take On Me' },
    explanation: 'The major 7th is just one semitone shy of an octave, creating strong tension wanting to resolve up.',
  },
];

export function ComparisonMode({ onBack }: ComparisonModeProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'chords' | 'scales' | 'intervals'>('all');
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const audio = useAudio();

  const filteredPairs = selectedCategory === 'all'
    ? COMPARISON_PAIRS
    : COMPARISON_PAIRS.filter(p => p.category === selectedCategory);

  const currentPair = filteredPairs[currentPairIndex] || filteredPairs[0];

  const playSound = useCallback((item: { key: string }, category: string) => {
    const rootMidi = getMidiFromNote('C', 4);

    if (category === 'chords') {
      const notes = getChordNotes(rootMidi, item.key as ChordQuality);
      audio.playChord(notes);
    } else if (category === 'scales') {
      const notes = getScaleNotes(rootMidi, item.key as ScaleType);
      audio.playScale(notes);
    } else if (category === 'intervals') {
      const interval = INTERVALS[item.key as IntervalType];
      audio.playInterval(rootMidi, rootMidi + interval.semitones);
    }
  }, [audio]);

  const handleNext = () => {
    setShowExplanation(false);
    setCurrentPairIndex(prev => (prev + 1) % filteredPairs.length);
  };

  const handlePrev = () => {
    setShowExplanation(false);
    setCurrentPairIndex(prev => (prev - 1 + filteredPairs.length) % filteredPairs.length);
  };

  return (
    <div className="screen-root px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Comparison Mode</h1>
          <p className="text-sm text-white/60">Hear the difference side by side</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto snap-strip">
        {(['all', 'chords', 'scales', 'intervals'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat); setCurrentPairIndex(0); setShowExplanation(false); }}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Comparison Card */}
      {currentPair && (
        <>
          <Card className="p-6 mb-4">
            <div className="text-center mb-2">
              <Badge variant="purple" size="sm">
                {currentPairIndex + 1} / {filteredPairs.length}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mb-6">
              {/* Sound A */}
              <div className="flex-1 text-center">
                <button
                  onClick={() => playSound(currentPair.itemA, currentPair.category)}
                  className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3 hover:scale-105 transition-transform shadow-lg shadow-blue-500/30"
                >
                  <Play className="w-7 h-7 ml-0.5" />
                </button>
                <h3 className="font-bold text-lg">{currentPair.itemA.label}</h3>
                <p className="text-sm text-white/60">{currentPair.itemA.description}</p>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center">
                <ArrowLeftRight className="w-6 h-6 text-white/40 mb-1" />
                <span className="text-xs text-white/40">VS</span>
              </div>

              {/* Sound B */}
              <div className="flex-1 text-center">
                <button
                  onClick={() => playSound(currentPair.itemB, currentPair.category)}
                  className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-3 hover:scale-105 transition-transform shadow-lg shadow-pink-500/30"
                >
                  <Play className="w-7 h-7 ml-0.5" />
                </button>
                <h3 className="font-bold text-lg">{currentPair.itemB.label}</h3>
                <p className="text-sm text-white/60">{currentPair.itemB.description}</p>
              </div>
            </div>

            {/* Show Explanation Toggle */}
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
            >
              {showExplanation ? 'Hide' : 'Show'} Explanation
            </button>

            {showExplanation && (
              <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm leading-relaxed">{currentPair.explanation}</p>
              </div>
            )}
          </Card>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={handlePrev}>
              Previous
            </Button>
            <Button variant="primary" fullWidth onClick={handleNext}>
              Next Pair
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
