import { useState, useCallback, useEffect, useRef } from 'react';
import { getMicrophoneManager, PitchResult } from '../utils/pitchDetection';

interface UseMicrophoneReturn {
  isListening: boolean;
  currentPitch: PitchResult | null;
  detectedNotes: number[]; // MIDI notes detected
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearDetectedNotes: () => void;
  hasPermission: boolean | null;
}

export function useMicrophone(): UseMicrophoneReturn {
  const [isListening, setIsListening] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<PitchResult | null>(null);
  const [detectedNotes, setDetectedNotes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const lastNoteRef = useRef<number | null>(null);
  const noteStableCountRef = useRef(0);
  const STABILITY_THRESHOLD = 3; // Number of consistent detections before confirming a note

  const handlePitch = useCallback((pitch: PitchResult | null) => {
    setCurrentPitch(pitch);

    if (pitch && pitch.confidence > 0.7) {
      // Check if this is a stable note detection
      if (lastNoteRef.current === pitch.midiNote) {
        noteStableCountRef.current++;

        if (noteStableCountRef.current >= STABILITY_THRESHOLD) {
          // Add to detected notes if not already there
          setDetectedNotes(prev => {
            if (!prev.includes(pitch.midiNote)) {
              return [...prev, pitch.midiNote];
            }
            return prev;
          });
        }
      } else {
        lastNoteRef.current = pitch.midiNote;
        noteStableCountRef.current = 1;
      }
    } else {
      lastNoteRef.current = null;
      noteStableCountRef.current = 0;
    }
  }, []);

  const startListening = useCallback(async () => {
    setError(null);

    try {
      const manager = getMicrophoneManager();
      manager.onPitch(handlePitch);

      const success = await manager.start();

      if (success) {
        setIsListening(true);
        setHasPermission(true);
      } else {
        setError('Failed to access microphone');
        setHasPermission(false);
      }
    } catch (err) {
      setError('Microphone access denied');
      setHasPermission(false);
    }
  }, [handlePitch]);

  const stopListening = useCallback(() => {
    const manager = getMicrophoneManager();
    manager.stop();
    setIsListening(false);
    setCurrentPitch(null);
    lastNoteRef.current = null;
    noteStableCountRef.current = 0;
  }, []);

  const clearDetectedNotes = useCallback(() => {
    setDetectedNotes([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const manager = getMicrophoneManager();
      manager.stop();
    };
  }, []);

  return {
    isListening,
    currentPitch,
    detectedNotes,
    error,
    startListening,
    stopListening,
    clearDetectedNotes,
    hasPermission,
  };
}
