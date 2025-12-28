import { useCallback, useRef, useState, useEffect } from 'react';
import { InstrumentType } from '../types/instruments';
import {
  playNote,
  playChord,
  playScale,
  playInterval,
  playRhythm,
  stopAllSounds,
  playSuccessSound,
  playErrorSound,
  playClickSound,
  playLevelUpSound,
  playAchievementSound,
  playMetronomeClick,
  setMasterVolume,
  getAudioContext,
} from '../utils/audioEngine';
import { getSettings } from '../utils/storage';

interface UseAudioReturn {
  playNote: (midi: number, duration?: number) => void;
  playChord: (notes: number[], arpeggio?: boolean) => void;
  playScale: (notes: number[]) => void;
  playInterval: (note1: number, note2: number, sequential?: boolean) => void;
  playRhythmPattern: (pattern: number[], midi?: number) => void;
  playSuccess: () => void;
  playError: () => void;
  playClick: () => void;
  playLevelUp: () => void;
  playAchievement: () => void;
  stopAll: () => void;
  setVolume: (volume: number) => void;
  setInstrument: (instrument: InstrumentType) => void;
  instrument: InstrumentType;
  volume: number;
  isPlaying: boolean;
}

export function useAudio(): UseAudioReturn {
  const settings = getSettings();
  const [instrument, setInstrumentState] = useState<InstrumentType>(settings.instrument);
  const [volume, setVolumeState] = useState(settings.volume);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentSound = useRef<{ stop: () => void } | null>(null);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      getAudioContext();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const stopCurrentSound = useCallback(() => {
    if (currentSound.current) {
      currentSound.current.stop();
      currentSound.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handlePlayNote = useCallback((midi: number, duration: number = 1) => {
    stopCurrentSound();
    setIsPlaying(true);
    currentSound.current = playNote(midi, instrument, duration);
    setTimeout(() => setIsPlaying(false), duration * 1000);
  }, [instrument, stopCurrentSound]);

  const handlePlayChord = useCallback((notes: number[], arpeggio: boolean = false) => {
    stopCurrentSound();
    setIsPlaying(true);
    const duration = arpeggio ? 2 : 1.5;
    currentSound.current = playChord(notes, instrument, duration, 0.6, arpeggio);
    setTimeout(() => setIsPlaying(false), duration * 1000);
  }, [instrument, stopCurrentSound]);

  const handlePlayScale = useCallback((notes: number[]) => {
    stopCurrentSound();
    setIsPlaying(true);
    const noteDelay = 0.3;
    const totalDuration = notes.length * noteDelay + 0.4;
    currentSound.current = playScale(notes, instrument, noteDelay, 0.4);
    setTimeout(() => setIsPlaying(false), totalDuration * 1000);
  }, [instrument, stopCurrentSound]);

  const handlePlayInterval = useCallback((note1: number, note2: number, sequential: boolean = true) => {
    stopCurrentSound();
    setIsPlaying(true);
    const duration = sequential ? 2 : 1.5;
    currentSound.current = playInterval(note1, note2, instrument, sequential);
    setTimeout(() => setIsPlaying(false), duration * 1000);
  }, [instrument, stopCurrentSound]);

  const handlePlayRhythm = useCallback((pattern: number[], midi: number = 60) => {
    stopCurrentSound();
    setIsPlaying(true);
    const totalDuration = pattern.reduce((sum, dur) => sum + dur, 0);
    currentSound.current = playRhythm(pattern, instrument, midi);
    setTimeout(() => setIsPlaying(false), totalDuration + 200);
  }, [instrument, stopCurrentSound]);

  const handlePlaySuccess = useCallback(() => {
    const settings = getSettings();
    if (settings.soundEffects) {
      playSuccessSound();
    }
  }, []);

  const handlePlayError = useCallback(() => {
    const settings = getSettings();
    if (settings.soundEffects) {
      playErrorSound();
    }
  }, []);

  const handlePlayClick = useCallback(() => {
    const settings = getSettings();
    if (settings.soundEffects) {
      playClickSound();
    }
  }, []);

  const handlePlayLevelUp = useCallback(() => {
    const settings = getSettings();
    if (settings.soundEffects) {
      playLevelUpSound();
    }
  }, []);

  const handlePlayAchievement = useCallback(() => {
    const settings = getSettings();
    if (settings.soundEffects) {
      playAchievementSound();
    }
  }, []);

  const handleStopAll = useCallback(() => {
    stopAllSounds();
    stopCurrentSound();
  }, [stopCurrentSound]);

  const handleSetVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    setMasterVolume(newVolume);
  }, []);

  const handleSetInstrument = useCallback((newInstrument: InstrumentType) => {
    setInstrumentState(newInstrument);
  }, []);

  return {
    playNote: handlePlayNote,
    playChord: handlePlayChord,
    playScale: handlePlayScale,
    playInterval: handlePlayInterval,
    playRhythmPattern: handlePlayRhythm,
    playSuccess: handlePlaySuccess,
    playError: handlePlayError,
    playClick: handlePlayClick,
    playLevelUp: handlePlayLevelUp,
    playAchievement: handlePlayAchievement,
    stopAll: handleStopAll,
    setVolume: handleSetVolume,
    setInstrument: handleSetInstrument,
    instrument,
    volume,
    isPlaying,
  };
}

// Metronome hook
export function useMetronome() {
  const [isRunning, setIsRunning] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState<[number, number]>([4, 4]);
  const [currentBeat, setCurrentBeat] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatRef = useRef(0);

  const start = useCallback(() => {
    if (isRunning) return;

    getAudioContext();
    setIsRunning(true);
    setCurrentBeat(0);
    beatRef.current = 0;

    const scheduleNote = () => {
      const secondsPerBeat = 60 / bpm;
      const ctx = getAudioContext();

      while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
        const beat = beatRef.current % timeSignature[0];
        playMetronomeClick(beat === 0);

        beatRef.current = (beatRef.current + 1) % timeSignature[0];
        setCurrentBeat(beatRef.current);
        nextNoteTimeRef.current += secondsPerBeat;
      }
    };

    nextNoteTimeRef.current = getAudioContext().currentTime;
    intervalRef.current = window.setInterval(scheduleNote, 25);
  }, [isRunning, bpm, timeSignature]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentBeat(0);
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  }, [isRunning, start, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isRunning,
    bpm,
    setBpm,
    timeSignature,
    setTimeSignature,
    currentBeat,
    start,
    stop,
    toggle,
  };
}
