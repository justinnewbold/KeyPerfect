import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, Target, Award } from 'lucide-react';
import { Card, Button, Badge } from './ui';
import { createPitchDetector, playNote, getAudioContext } from '../utils/audioEngine';
import { NOTE_NAMES, getMidiFromNote, NoteName, Octave } from '../types/music';

function parseNoteString(noteStr: string): { name: NoteName; octave: Octave } | null {
  const match = noteStr.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return null;
  const name = match[1] as NoteName;
  const octave = parseInt(match[2], 10) as Octave;
  if (!NOTE_NAMES.includes(name)) return null;
  return { name, octave };
}

interface PitchDetectorProps {
  mode: 'tuner' | 'singback' | 'interval';
  targetNote?: string;
  targetInterval?: number;
  onCorrect?: () => void;
  onClose?: () => void;
}

export function PitchDetector({
  mode = 'tuner',
  targetNote,
  targetInterval,
  onCorrect,
  onClose,
}: PitchDetectorProps) {
  const [isListening, setIsListening] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<{
    frequency: number;
    note: string;
    cents: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(targetNote || 'C4');
  const [matchCount, setMatchCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const detectorRef = useRef<ReturnType<typeof createPitchDetector> | null>(null);
  const matchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pickRandomTarget = useCallback(() => {
    const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
    const newTarget = notes[Math.floor(Math.random() * notes.length)];
    setCurrentTarget(newTarget);
    setMatchCount(0);
  }, []);

  const skipTarget = useCallback(() => {
    setAttempts(a => a + 1);
    setStreak(0);
    pickRandomTarget();
  }, [pickRandomTarget]);

  const handlePitchUpdate = useCallback(
    (frequency: number, note: string, cents: number) => {
      setCurrentPitch({ frequency, note, cents });

      if (mode === 'singback') {
        // Check if the sung note matches the target
        const targetNoteName = currentTarget.replace(/[0-9]/g, '');
        const sungNoteName = note.replace(/[0-9]/g, '');

        if (targetNoteName === sungNoteName && Math.abs(cents) < 20) {
          setMatchCount(prev => {
            const newCount = prev + 1;
            // Need to hold the note for about 0.5 seconds (5 callbacks at ~100ms)
            if (newCount >= 5) {
              setScore(s => s + 10);
              setStreak(s => s + 1);
              setTotalHits(h => h + 1);
              setAttempts(a => a + 1);
              setHistory(h => [...h.slice(-9), `${currentTarget}`]);
              onCorrect?.();
              pickRandomTarget();
              return 0;
            }
            return newCount;
          });
        } else {
          setMatchCount(0);
        }
      }
    },
    [mode, currentTarget, onCorrect, pickRandomTarget]
  );

  const startListening = useCallback(async () => {
    try {
      setError(null);
      detectorRef.current = createPitchDetector(handlePitchUpdate);
      await detectorRef.current.start();
      setIsListening(true);
    } catch (err) {
      setError('Could not access microphone. Please allow microphone access.');
      console.error(err);
    }
  }, [handlePitchUpdate]);

  const stopListening = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.stop();
      detectorRef.current = null;
    }
    setIsListening(false);
    setCurrentPitch(null);
  }, []);

  const playTargetNote = useCallback(() => {
    getAudioContext();
    const parsed = parseNoteString(currentTarget);
    const midi = parsed ? getMidiFromNote(parsed.name, parsed.octave) : 60;
    playNote(midi, 'piano', 1.5);
  }, [currentTarget]);

  useEffect(() => {
    return () => {
      if (detectorRef.current) {
        detectorRef.current.stop();
      }
      if (matchTimeoutRef.current) {
        clearTimeout(matchTimeoutRef.current);
      }
    };
  }, []);

  // Get pitch accuracy indicator
  const getPitchIndicator = () => {
    if (!currentPitch) return null;

    const cents = currentPitch.cents;
    if (Math.abs(cents) < 5) return { status: 'perfect', color: 'text-green-400', message: 'Perfect!' };
    if (Math.abs(cents) < 15) return { status: 'good', color: 'text-yellow-400', message: cents > 0 ? 'Slightly Sharp' : 'Slightly Flat' };
    if (Math.abs(cents) < 30) return { status: 'off', color: 'text-orange-400', message: cents > 0 ? 'Sharp' : 'Flat' };
    return { status: 'way_off', color: 'text-red-400', message: cents > 0 ? 'Very Sharp' : 'Very Flat' };
  };

  const indicator = getPitchIndicator();

  // Check if current note matches target
  const isOnTarget = mode === 'singback' && currentPitch &&
    currentPitch.note.replace(/[0-9]/g, '') === currentTarget.replace(/[0-9]/g, '');

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mic className="w-6 h-6 text-purple-400" />
              {mode === 'tuner' ? 'Pitch Detector' : 'Sing-Back Training'}
            </h2>
            <p className="text-sm text-white/60 mt-1">
              {mode === 'tuner'
                ? 'Detect pitch from your microphone'
                : 'Sing the target note to earn points'}
            </p>
          </div>
          {mode === 'singback' && (
            <div className="text-right">
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-sm text-white/60">Score</div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Main display */}
        <div className="relative">
          {/* Target note (for singback mode) */}
          {mode === 'singback' && (
            <div className="text-center mb-6">
              <div className="text-sm text-white/60 mb-2">Target Note</div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={playTargetNote}
                  className="p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-full transition-colors"
                >
                  <Volume2 className="w-6 h-6 text-purple-400" />
                </button>
                <div className={`text-6xl font-bold ${isOnTarget ? 'text-green-400' : 'text-white'}`}>
                  {currentTarget}
                </div>
              </div>
              {isOnTarget && (
                <div className="mt-2 flex justify-center">
                  <div className="h-2 bg-white/10 rounded-full w-32 overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-100"
                      style={{ width: `${(matchCount / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pitch display */}
          <div className="bg-white/5 rounded-xl p-8 text-center">
            {isListening ? (
              currentPitch ? (
                <>
                  <div className="text-7xl font-bold mb-2">
                    {currentPitch.note}
                  </div>
                  <div className="text-xl text-white/60 mb-4">
                    {currentPitch.frequency.toFixed(1)} Hz
                  </div>

                  {/* Cents indicator */}
                  <div className="relative h-8 bg-white/10 rounded-full overflow-hidden mb-4">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1 h-full bg-white/30" />
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-4 bg-purple-500 rounded-full transition-all duration-75"
                      style={{
                        left: `calc(50% + ${currentPitch.cents}% - 8px)`,
                      }}
                    />
                  </div>

                  {indicator && (
                    <div className={`text-lg font-medium ${indicator.color}`}>
                      {indicator.message}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-white/50">
                  <div className="text-4xl mb-2">Listening...</div>
                  <div className="text-sm">Sing or play a note</div>
                </div>
              )
            ) : (
              <div className="text-white/50">
                <MicOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <div className="text-lg">Microphone is off</div>
                <div className="text-sm mt-2">Click Start to begin</div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <Button
            onClick={isListening ? stopListening : startListening}
            className={`flex-1 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start
              </>
            )}
          </Button>
          {mode === 'singback' && (
            <Button variant="secondary" onClick={skipTarget}>
              <Target className="w-5 h-5 mr-2" />
              New Note
            </Button>
          )}
        </div>

        {/* Stats (for singback mode) */}
        {mode === 'singback' && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{streak}</div>
              <div className="text-sm text-white/60">Streak</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{totalHits}</div>
              <div className="text-sm text-white/60">Notes Hit</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">
                {attempts > 0 ? Math.round((totalHits / attempts) * 100) : 0}%
              </div>
              <div className="text-sm text-white/60">Accuracy</div>
            </div>
          </div>
        )}

        {/* Recent history */}
        {mode === 'singback' && history.length > 0 && (
          <div>
            <div className="text-sm text-white/60 mb-2">Recent Notes</div>
            <div className="flex gap-2 flex-wrap">
              {history.map((note, i) => (
                <Badge key={i} variant="purple">
                  {note}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-white/40 text-center">
          {mode === 'tuner'
            ? 'Tip: Get close to the microphone and sing or play clearly'
            : 'Tip: Hold the note steady for half a second to score'}
        </div>
      </div>
    </Card>
  );
}
