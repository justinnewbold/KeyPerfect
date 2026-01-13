import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Plus, Minus, Mic, MicOff, Volume2, Music2, Sliders, ChevronDown, Guitar } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useMetronome } from '../hooks/useAudio';
import { createPitchDetector, getAudioContext } from '../utils/audioEngine';
import { PitchDetector } from './PitchDetector';
import { SongAnalysis } from './SongAnalysis';
import { CustomPracticeBuilder } from './CustomPracticeBuilder';
import {
  GuitarTuning,
  GUITAR_TUNINGS_6,
  GUITAR_TUNINGS_7,
  BASS_TUNINGS,
  getTuningById,
} from '../types/instruments';

type ToolType = 'tuner' | 'metronome' | 'singback' | 'songanalysis' | 'custompractice';

export function GuitarTools() {
  const [activeTool, setActiveTool] = useState<ToolType>('metronome');

  const [showSongAnalysis, setShowSongAnalysis] = useState(false);
  const [showCustomPractice, setShowCustomPractice] = useState(false);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0f0c29] via-[#0f0c29] to-transparent pb-4 px-4 pt-6">
        <h1 className="text-2xl font-bold mb-4">Music Tools</h1>

        {/* Tab Selector - scrollable for more tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <button
            onClick={() => setActiveTool('metronome')}
            className={`py-3 px-4 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTool === 'metronome'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-white/10 text-white/60'
            }`}
          >
            🎵 Metronome
          </button>
          <button
            onClick={() => setActiveTool('tuner')}
            className={`py-3 px-4 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTool === 'tuner'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-white/10 text-white/60'
            }`}
          >
            🎸 Tuner
          </button>
          <button
            onClick={() => setActiveTool('singback')}
            className={`py-3 px-4 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTool === 'singback'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-white/10 text-white/60'
            }`}
          >
            🎤 Sing-Back
          </button>
          <button
            onClick={() => setShowSongAnalysis(true)}
            className="py-3 px-4 rounded-xl font-medium transition-all whitespace-nowrap bg-white/10 text-white/60 hover:bg-white/20"
          >
            🎼 Song Analysis
          </button>
          <button
            onClick={() => setShowCustomPractice(true)}
            className="py-3 px-4 rounded-xl font-medium transition-all whitespace-nowrap bg-white/10 text-white/60 hover:bg-white/20"
          >
            ⚙️ Custom Practice
          </button>
        </div>
      </div>

      <div className="px-4">
        {activeTool === 'metronome' && <Metronome />}
        {activeTool === 'tuner' && <Tuner />}
        {activeTool === 'singback' && <PitchDetector mode="singback" />}
      </div>

      {/* Modal Tools */}
      {showSongAnalysis && <SongAnalysis onClose={() => setShowSongAnalysis(false)} />}
      {showCustomPractice && <CustomPracticeBuilder onClose={() => setShowCustomPractice(false)} />}
    </div>
  );
}

function Metronome() {
  const {
    isRunning,
    bpm,
    setBpm,
    timeSignature,
    setTimeSignature,
    currentBeat,
    toggle,
  } = useMetronome();

  const timeSignatures: [number, number][] = [
    [2, 4], [3, 4], [4, 4], [5, 4], [6, 8], [7, 8]
  ];

  const handleBpmChange = (delta: number) => {
    const newBpm = Math.max(30, Math.min(300, bpm + delta));
    setBpm(newBpm);
  };

  const commonBpms = [60, 80, 100, 120, 140, 160];

  return (
    <div className="space-y-6 animate-in">
      {/* BPM Display */}
      <Card className="p-6 text-center">
        <div className="text-6xl font-bold mb-2">{bpm}</div>
        <div className="text-sm text-white/60 mb-6">BPM</div>

        {/* Beat Indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: timeSignature[0] }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                isRunning && currentBeat === i
                  ? i === 0
                    ? 'bg-red-500 scale-125'
                    : 'bg-purple-500 scale-125'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* BPM Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleBpmChange(-5)}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Minus className="w-6 h-6" />
          </button>

          <button
            onClick={toggle}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRunning
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            } shadow-lg`}
          >
            {isRunning ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </button>

          <button
            onClick={() => handleBpmChange(5)}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </Card>

      {/* Quick BPM Selection */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Quick Tempo</h3>
        <div className="grid grid-cols-6 gap-2">
          {commonBpms.map(tempo => (
            <button
              key={tempo}
              onClick={() => setBpm(tempo)}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                bpm === tempo
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {tempo}
            </button>
          ))}
        </div>
      </Card>

      {/* Time Signature */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Time Signature</h3>
        <div className="grid grid-cols-6 gap-2">
          {timeSignatures.map(sig => (
            <button
              key={`${sig[0]}/${sig[1]}`}
              onClick={() => setTimeSignature(sig)}
              className={`py-3 rounded-lg text-sm font-medium transition-all ${
                timeSignature[0] === sig[0] && timeSignature[1] === sig[1]
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {sig[0]}/{sig[1]}
            </button>
          ))}
        </div>
      </Card>

      {/* BPM Slider */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Fine Tune</h3>
        <input
          type="range"
          min="30"
          max="300"
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-white/40 mt-2">
          <span>30</span>
          <span>300</span>
        </div>
      </Card>
    </div>
  );
}

type InstrumentCategory = '6-string' | '7-string' | 'bass';

function Tuner() {
  const [isListening, setIsListening] = useState(false);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string>('--');
  const [cents, setCents] = useState(0);
  const [detector, setDetector] = useState<{ start: () => Promise<void>; stop: () => void } | null>(null);

  // Tuning selection state
  const [instrumentCategory, setInstrumentCategory] = useState<InstrumentCategory>('6-string');
  const [selectedTuning, setSelectedTuning] = useState<GuitarTuning>(GUITAR_TUNINGS_6[0]);
  const [showTuningSelector, setShowTuningSelector] = useState(false);

  // Get tunings based on instrument category
  const getAvailableTunings = (): GuitarTuning[] => {
    switch (instrumentCategory) {
      case '6-string':
        return GUITAR_TUNINGS_6;
      case '7-string':
        return GUITAR_TUNINGS_7;
      case 'bass':
        return BASS_TUNINGS;
      default:
        return GUITAR_TUNINGS_6;
    }
  };

  // Update selected tuning when category changes
  useEffect(() => {
    const tunings = getAvailableTunings();
    if (tunings.length > 0) {
      setSelectedTuning(tunings[0]);
    }
  }, [instrumentCategory]);

  useEffect(() => {
    const pitchDetector = createPitchDetector((freq, noteName, centsValue) => {
      setFrequency(Math.round(freq * 10) / 10);
      setNote(noteName);
      setCents(centsValue);
    });
    setDetector(pitchDetector);

    return () => {
      pitchDetector.stop();
    };
  }, []);

  const toggleListening = async () => {
    if (!detector) return;

    if (isListening) {
      detector.stop();
      setIsListening(false);
      setFrequency(null);
      setNote('--');
      setCents(0);
    } else {
      try {
        await detector.start();
        setIsListening(true);
      } catch (error) {
        console.error('Could not access microphone:', error);
        alert('Could not access microphone. Please allow microphone access.');
      }
    }
  };

  const getTuningIndicator = () => {
    if (cents === 0) return 'In Tune';
    if (Math.abs(cents) <= 5) return 'Almost!';
    return cents > 0 ? 'Sharp' : 'Flat';
  };

  const getTuningColor = () => {
    if (Math.abs(cents) <= 5) return 'text-green-400';
    if (Math.abs(cents) <= 15) return 'text-amber-400';
    return 'text-red-400';
  };

  // Check if detected note matches any string in the current tuning
  const isNoteInTuning = (detectedNote: string): boolean => {
    return selectedTuning.notes.some(s => s.note === detectedNote);
  };

  // Group tunings by category for display
  const groupTuningsByCategory = (tunings: GuitarTuning[]) => {
    const grouped: Record<string, GuitarTuning[]> = {};
    tunings.forEach(tuning => {
      if (!grouped[tuning.category]) {
        grouped[tuning.category] = [];
      }
      grouped[tuning.category].push(tuning);
    });
    return grouped;
  };

  const categoryLabels: Record<string, string> = {
    standard: 'Standard Tunings',
    drop: 'Drop Tunings',
    open: 'Open Tunings',
    alternate: 'Alternate Tunings',
    extended: 'Extended Range',
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Instrument Type Selector */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Instrument</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setInstrumentCategory('6-string')}
            className={`py-3 px-4 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
              instrumentCategory === '6-string'
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Guitar className="w-5 h-5" />
            <span className="text-sm">6-String</span>
          </button>
          <button
            onClick={() => setInstrumentCategory('7-string')}
            className={`py-3 px-4 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
              instrumentCategory === '7-string'
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Guitar className="w-5 h-5" />
            <span className="text-sm">7-String</span>
          </button>
          <button
            onClick={() => setInstrumentCategory('bass')}
            className={`py-3 px-4 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
              instrumentCategory === 'bass'
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Guitar className="w-5 h-5" />
            <span className="text-sm">Bass</span>
          </button>
        </div>
      </Card>

      {/* Tuning Selector */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Tuning</h3>
        <button
          onClick={() => setShowTuningSelector(!showTuningSelector)}
          className="w-full p-4 bg-white/10 rounded-xl flex items-center justify-between hover:bg-white/15 transition-colors"
        >
          <div className="text-left">
            <div className="font-medium">{selectedTuning.name}</div>
            <div className="text-sm text-white/60">
              {selectedTuning.notes.map(s => s.note.replace(/[0-9]/g, '')).join(' - ')}
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform ${showTuningSelector ? 'rotate-180' : ''}`} />
        </button>

        {/* Tuning Dropdown */}
        {showTuningSelector && (
          <div className="mt-3 max-h-80 overflow-y-auto space-y-4">
            {Object.entries(groupTuningsByCategory(getAvailableTunings())).map(([category, tunings]) => (
              <div key={category}>
                <h4 className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">
                  {categoryLabels[category] || category}
                </h4>
                <div className="space-y-1">
                  {tunings.map(tuning => (
                    <button
                      key={tuning.id}
                      onClick={() => {
                        setSelectedTuning(tuning);
                        setShowTuningSelector(false);
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedTuning.id === tuning.id
                          ? 'bg-purple-500/30 border border-purple-500/50'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-medium text-sm">{tuning.name}</div>
                      <div className="text-xs text-white/50">
                        {tuning.notes.map(s => s.note).join(' - ')}
                      </div>
                      {tuning.description && (
                        <div className="text-xs text-white/40 mt-1">{tuning.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Main Tuner Display */}
      <Card className="p-6 text-center">
        <div className="text-7xl font-bold mb-2">{note}</div>
        <div className="text-lg text-white/60 mb-4">
          {frequency ? `${frequency} Hz` : 'Waiting for input...'}
        </div>

        {/* Cents Indicator */}
        <div className="relative h-8 bg-white/10 rounded-full mb-4 overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 w-1 bg-green-500 transform -translate-x-1/2" />
          {isListening && frequency && (
            <div
              className="absolute top-1 bottom-1 w-3 bg-purple-500 rounded-full transition-all duration-100"
              style={{
                left: `calc(50% + ${(cents / 50) * 40}%)`,
                transform: 'translateX(-50%)',
              }}
            />
          )}
        </div>

        <div className="flex justify-between text-xs text-white/40 mb-4">
          <span>Flat</span>
          <span className={`font-medium ${getTuningColor()}`}>
            {isListening && frequency ? getTuningIndicator() : '--'}
          </span>
          <span>Sharp</span>
        </div>

        {/* Listen Button */}
        <button
          onClick={toggleListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
          } shadow-lg`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        <p className="text-sm text-white/60 mt-4">
          {isListening ? 'Listening... Play a note' : 'Tap to start tuning'}
        </p>
      </Card>

      {/* Selected Tuning Reference */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">
          {selectedTuning.name} Tuning
        </h3>
        <div className="space-y-2">
          {selectedTuning.notes.map((string, i) => (
            <div
              key={`${string.note}-${i}`}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                note === string.note
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">
                  {selectedTuning.notes.length - i}
                </span>
                <span className="font-medium">{string.note}</span>
              </div>
              <span className="text-white/60">{string.frequency.toFixed(2)} Hz</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-white/60 mb-2">Tips</h3>
        <ul className="text-sm text-white/60 space-y-1">
          <li>• Play one string at a time</li>
          <li>• Wait for the note to stabilize</li>
          <li>• Green indicator means you're in tune</li>
          <li>• Tune in a quiet environment for best results</li>
          {instrumentCategory === '7-string' && (
            <li>• For 7-string, start with the low B string</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
