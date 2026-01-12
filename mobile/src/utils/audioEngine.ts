/**
 * Mobile Audio Engine
 *
 * Uses expo-av for audio playback on React Native
 * Shares the same interfaces as the web audio engine
 */

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// Audio context for mobile
let soundObjects: Audio.Sound[] = [];

// Initialize audio session
export async function initializeAudio(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.error('Failed to initialize audio:', error);
  }
}

// Generate a simple tone using expo-av
export async function playTone(
  frequency: number,
  duration: number = 500,
  volume: number = 0.7
): Promise<void> {
  // Note: For production, you'd want to use pre-recorded samples
  // or a native audio synthesis library
  // This is a simplified placeholder

  // Provide haptic feedback as audio alternative
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

// Play a note (MIDI number)
export async function playNote(
  midi: number,
  instrument: string = 'piano',
  duration: number = 1000
): Promise<void> {
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);

  // In a real implementation, you'd load pre-recorded samples
  // For now, we'll use haptic feedback
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  // TODO: Load and play actual audio samples
  // const { sound } = await Audio.Sound.createAsync(
  //   require(`../assets/samples/${instrument}/${midi}.mp3`)
  // );
  // await sound.playAsync();
}

// Play a chord (multiple notes)
export async function playChord(
  midiNotes: number[],
  instrument: string = 'piano',
  duration: number = 1500,
  arpeggio: boolean = false
): Promise<void> {
  if (arpeggio) {
    for (let i = 0; i < midiNotes.length; i++) {
      setTimeout(() => {
        playNote(midiNotes[i], instrument, duration);
      }, i * 100);
    }
  } else {
    await Promise.all(
      midiNotes.map(midi => playNote(midi, instrument, duration))
    );
  }
}

// Play a scale
export async function playScale(
  midiNotes: number[],
  instrument: string = 'piano',
  noteDelay: number = 300
): Promise<void> {
  for (let i = 0; i < midiNotes.length; i++) {
    setTimeout(() => {
      playNote(midiNotes[i], instrument, 400);
    }, i * noteDelay);
  }
}

// Stop all sounds
export async function stopAllSounds(): Promise<void> {
  for (const sound of soundObjects) {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (error) {
      // Sound may already be stopped
    }
  }
  soundObjects = [];
}

// Cleanup
export async function cleanup(): Promise<void> {
  await stopAllSounds();
}

// Success sound effect
export async function playSuccessSound(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

// Error sound effect
export async function playErrorSound(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

// Click sound
export async function playClickSound(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
