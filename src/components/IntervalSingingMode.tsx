import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, MicOff, Play, Check, X, RotateCcw } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { CircularProgress } from './ui/Progress';
import { useAudio } from '../hooks/useAudio';
import { createPitchDetector, midiToFrequency } from '../utils/audioEngine';
import { INTERVALS } from '../types/music';

interface IntervalSingingModeProps {
  onBack: () => void;
}

interface SingingChallenge {
  rootNote: number; // MIDI
  targetInterval: string;
  targetSemitones: number;
  targetMidi: number;
}

const INTERVAL_SEMITONES: Record<string, number> = {
  minor2: 1, major2: 2, minor3: 3, major3: 4,
  perfect4: 5, tritone: 6, perfect5: 7,
  minor6: 8, major6: 9, minor7: 10, major7: 11, octave: 12,
};

function generateChallenge(): SingingChallenge {
  const rootNote = 60 + Math.floor(Math.random() * 5); // C4-E4 range
  const intervalKeys = Object.keys(INTERVAL_SEMITONES);
  // Use easier intervals for singing
  const singableIntervals = ['major2', 'minor3', 'major3', 'perfect4', 'perfect5', 'octave'];
  const targetInterval = singableIntervals[Math.floor(Math.random() * singableIntervals.length)];
  const targetSemitones = INTERVAL_SEMITONES[targetInterval];

  return {
    rootNote,
    targetInterval,
    targetSemitones,
    targetMidi: rootNote + targetSemitones,
  };
}

export function IntervalSingingMode({ onBack }: IntervalSingingModeProps) {
  const [challenge, setChallenge] = useState<SingingChallenge>(generateChallenge);
  const [isListening, setIsListening] = useState(false);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [detectedNote, setDetectedNote] = useState<string>('');
  const [detectedCents, setDetectedCents] = useState<number>(0);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const audio = useAudio();
  const detectorRef = useRef<{ start: () => Promise<void>; stop: () => void } | null>(null);
  const stableFreqRef = useRef<number[]>([]);

  const targetFreq = midiToFrequency(challenge.targetMidi);
  const rootFreq = midiToFrequency(challenge.rootNote);

  // Check if detected frequency matches target (within 50 cents tolerance)
  const checkMatch = useCallback((freq: number) => {
    if (result) return;

    stableFreqRef.current.push(freq);
    // Need 5 stable readings
    if (stableFreqRef.current.length < 5) return;

    // Keep only last 10 readings
    if (stableFreqRef.current.length > 10) {
      stableFreqRef.current = stableFreqRef.current.slice(-10);
    }

    // Calculate average of recent readings
    const avg = stableFreqRef.current.reduce((a, b) => a + b, 0) / stableFreqRef.current.length;

    // Calculate cents difference from target
    const centsDiff = 1200 * Math.log2(avg / targetFreq);

    if (Math.abs(centsDiff) < 50) {
      // Correct!
      setResult('correct');
      setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      audio.playSuccess();
      stopListening();
    }
  }, [result, targetFreq, audio]);

  const startListening = useCallback(async () => {
    try {
      stableFreqRef.current = [];
      const detector = createPitchDetector((frequency, note, cents) => {
        setDetectedFreq(frequency);
        setDetectedNote(note);
        setDetectedCents(cents);
        checkMatch(frequency);
      });
      detectorRef.current = detector;
      await detector.start();
      setIsListening(true);
    } catch {
      // Microphone access denied
    }
  }, [checkMatch]);

  const stopListening = useCallback(() => {
    detectorRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleGiveUp = useCallback(() => {
    stopListening();
    setResult('incorrect');
    setScore(prev => ({ ...prev, total: prev.total + 1 }));
    audio.playError();
  }, [stopListening, audio]);

  const handleNext = useCallback(() => {
    setChallenge(generateChallenge());
    setResult(null);
    setDetectedFreq(null);
    setDetectedNote('');
    stableFreqRef.current = [];
  }, []);

  const playRootNote = useCallback(() => {
    audio.playNote(challenge.rootNote, 1.5);
  }, [audio, challenge.rootNote]);

  const playTargetNote = useCallback(() => {
    audio.playNote(challenge.targetMidi, 1.5);
  }, [audio, challenge.targetMidi]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      detectorRef.current?.stop();
    };
  }, []);

  const intervalName = INTERVALS[challenge.targetInterval as keyof typeof INTERVALS]?.name || challenge.targetInterval;

  // Visual feedback: how close is the detected pitch to the target
  const pitchAccuracy = detectedFreq
    ? Math.max(0, 100 - Math.abs(1200 * Math.log2(detectedFreq / targetFreq)))
    : 0;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Sing the Interval</h1>
          <p className="text-sm text-white/60">Use your voice to match the target pitch</p>
        </div>
        <Badge variant="purple">{score.correct}/{score.total}</Badge>
      </div>

      {/* Challenge */}
      <Card className="p-6 mb-6 text-center">
        <h2 className="text-lg font-semibold mb-2">Sing a {intervalName} above the root</h2>

        {/* Play root note */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={playRootNote}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            <Play className="w-7 h-7 ml-1" />
          </button>
          {result !== null && (
            <button
              onClick={playTargetNote}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              <Play className="w-7 h-7 ml-1" />
            </button>
          )}
        </div>
        <p className="text-sm text-white/60">
          {result === null ? 'Tap to hear the root note, then sing the interval' : 'Tap green to hear the correct note'}
        </p>
      </Card>

      {/* Pitch meter */}
      <Card className="p-6 mb-6">
        <div className="flex justify-center mb-4">
          <CircularProgress
            value={Math.min(100, pitchAccuracy)}
            max={100}
            size={120}
            strokeWidth={10}
            color={pitchAccuracy > 80 ? '#22c55e' : pitchAccuracy > 50 ? '#eab308' : '#ef4444'}
          >
            <div className="text-center">
              {detectedNote ? (
                <>
                  <div className="text-2xl font-bold">{detectedNote}</div>
                  <div className="text-xs text-white/60">{detectedCents > 0 ? '+' : ''}{detectedCents}c</div>
                </>
              ) : (
                <Mic className="w-8 h-8 text-white/40 mx-auto" />
              )}
            </div>
          </CircularProgress>
        </div>

        <p className="text-center text-sm text-white/60 mb-4">
          Target: {Math.round(targetFreq)} Hz
          {detectedFreq && <> | Detected: {Math.round(detectedFreq)} Hz</>}
        </p>
      </Card>

      {/* Result feedback */}
      {result && (
        <Card className={`p-4 mb-6 ${result === 'correct' ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
          <div className="flex items-center gap-3">
            {result === 'correct' ? (
              <>
                <Check className="w-6 h-6 text-green-400" />
                <span className="font-semibold text-green-300">Great pitch!</span>
              </>
            ) : (
              <>
                <X className="w-6 h-6 text-red-400" />
                <span className="font-semibold text-red-300">The target was {intervalName}</span>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Controls */}
      <div className="space-y-3">
        {result === null ? (
          <>
            {!isListening ? (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={startListening}
                icon={<Mic className="w-5 h-5" />}
              >
                Start Singing
              </Button>
            ) : (
              <Button
                variant="danger"
                size="lg"
                fullWidth
                onClick={handleGiveUp}
                icon={<MicOff className="w-5 h-5" />}
              >
                Give Up
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleNext}
            icon={<RotateCcw className="w-5 h-5" />}
          >
            Next Interval
          </Button>
        )}
      </div>
    </div>
  );
}
