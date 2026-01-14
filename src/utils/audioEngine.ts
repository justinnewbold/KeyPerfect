import { InstrumentType, INSTRUMENTS } from '../types/instruments';

// Audio context singleton
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let reverbNode: ConvolverNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

// Sound effect buffers
const soundEffects: Map<string, AudioBuffer> = new Map();

// Active sounds for cleanup
const activeSounds: Set<{ stop: () => void }> = new Set();

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
    setupMasterChain();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function setupMasterChain() {
  if (!audioContext) return;

  // Compressor for dynamics control
  compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  // Master gain
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.7;

  // Connect chain
  compressor.connect(masterGain);
  masterGain.connect(audioContext.destination);

  // Create reverb impulse
  createReverbImpulse();
}

function createReverbImpulse() {
  if (!audioContext) return;

  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * 2; // 2 seconds
  const impulse = audioContext.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
  }

  reverbNode = audioContext.createConvolver();
  reverbNode.buffer = impulse;
}

export function setMasterVolume(volume: number) {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
}

// Convert MIDI note to frequency
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Create sound with instrument config
export function playNote(
  midi: number,
  instrument: InstrumentType = 'piano',
  duration: number = 1,
  velocity: number = 0.7
): { stop: () => void } {
  const ctx = getAudioContext();
  const config = INSTRUMENTS[instrument];
  const frequency = midiToFrequency(midi);

  // Create oscillator(s)
  const oscillators: OscillatorNode[] = [];
  const gainNode = ctx.createGain();
  const filterNode = ctx.createBiquadFilter();

  // Main oscillator
  const osc1 = ctx.createOscillator();
  osc1.type = config.waveform;
  osc1.frequency.value = frequency;
  oscillators.push(osc1);

  // Add harmonics for richer sound
  if (instrument === 'piano') {
    // Add soft harmonics
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = frequency * 2;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.3;
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);
    oscillators.push(osc2);

    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = frequency * 3;
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.value = 0.1;
    osc3.connect(osc3Gain);
    osc3Gain.connect(gainNode);
    oscillators.push(osc3);
  } else if (instrument === 'organ') {
    // Drawbar-style organ harmonics
    [2, 3, 4, 5, 6, 8].forEach((mult, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = frequency * mult;
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.4 / (i + 1);
      osc.connect(oscGain);
      oscGain.connect(gainNode);
      oscillators.push(osc);
    });
  } else if (instrument === 'strings') {
    // Slight detuning for string section effect
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = frequency * 1.003;
    osc2.connect(gainNode);
    oscillators.push(osc2);

    const osc3 = ctx.createOscillator();
    osc3.type = 'sawtooth';
    osc3.frequency.value = frequency * 0.997;
    osc3.connect(gainNode);
    oscillators.push(osc3);
  } else if (instrument === 'synth') {
    // Add sub oscillator
    const sub = ctx.createOscillator();
    sub.type = 'square';
    sub.frequency.value = frequency / 2;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.3;
    sub.connect(subGain);
    subGain.connect(gainNode);
    oscillators.push(sub);
  } else if (instrument === 'brass') {
    // Multiple sawtooth for brass ensemble
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = frequency * 1.005;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.5;
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);
    oscillators.push(osc2);
  } else if (instrument === 'vocal') {
    // Formant-like filtering for vocal
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = frequency * 2;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.6;
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);
    oscillators.push(osc2);
  } else if (instrument === 'electricPiano') {
    // Rhodes-style bell harmonics
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = frequency * 2;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.5;
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);
    oscillators.push(osc2);

    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = frequency * 4;
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.value = 0.2;
    osc3.connect(osc3Gain);
    osc3Gain.connect(gainNode);
    oscillators.push(osc3);
  } else if (instrument === 'cleanElectric') {
    // Clean electric with slight chorus
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = frequency * 1.002;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.4;
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);
    oscillators.push(osc2);
  } else if (instrument === 'metalGuitar') {
    // Heavy distortion with multiple harmonics
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = frequency;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.4;
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);
    oscillators.push(osc2);

    // Sub octave for thickness
    const sub = ctx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.value = frequency / 2;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.3;
    sub.connect(subGain);
    subGain.connect(gainNode);
    oscillators.push(sub);

    // Upper harmonics for bite
    const osc3 = ctx.createOscillator();
    osc3.type = 'sawtooth';
    osc3.frequency.value = frequency * 2;
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.value = 0.2;
    osc3.connect(osc3Gain);
    osc3Gain.connect(gainNode);
    oscillators.push(osc3);
  } else if (instrument === 'cello') {
    // Rich cello with vibrato-like detuning
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = frequency * 1.002;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.5;
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);
    oscillators.push(osc2);

    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = frequency * 2;
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.value = 0.15;
    osc3.connect(osc3Gain);
    osc3Gain.connect(gainNode);
    oscillators.push(osc3);
  } else if (instrument === 'flute') {
    // Airy flute with breath-like overtones
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = frequency * 2;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.15;
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);
    oscillators.push(osc2);

    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = frequency * 3;
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.value = 0.05;
    osc3.connect(osc3Gain);
    osc3Gain.connect(gainNode);
    oscillators.push(osc3);
  }

  // Connect main oscillator
  osc1.connect(gainNode);

  // Apply filter if configured
  if (config.filters && config.filters.length > 0) {
    const filter = config.filters[0];
    filterNode.type = filter.type;
    filterNode.frequency.value = filter.frequency;
    filterNode.Q.value = filter.Q;
    gainNode.connect(filterNode);
    filterNode.connect(compressor!);
  } else {
    gainNode.connect(compressor!);
  }

  // ADSR envelope
  const { attack, decay, sustain, release } = config.envelope;
  const now = ctx.currentTime;
  const attackEnd = now + attack;
  const decayEnd = attackEnd + decay;
  const sustainEnd = now + duration - release;
  const releaseEnd = sustainEnd + release;

  // Start at 0
  gainNode.gain.setValueAtTime(0, now);
  // Attack
  gainNode.gain.linearRampToValueAtTime(velocity, attackEnd);
  // Decay to sustain
  gainNode.gain.linearRampToValueAtTime(velocity * sustain, decayEnd);
  // Sustain
  gainNode.gain.setValueAtTime(velocity * sustain, sustainEnd);
  // Release
  gainNode.gain.linearRampToValueAtTime(0, releaseEnd);

  // Start all oscillators
  oscillators.forEach(osc => {
    osc.start(now);
    osc.stop(releaseEnd);
  });

  const soundHandle = {
    stop: () => {
      const now = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
      oscillators.forEach(osc => {
        try {
          osc.stop(now + 0.05);
        } catch {
          // Already stopped
        }
      });
      activeSounds.delete(soundHandle);
    },
  };

  activeSounds.add(soundHandle);

  // Auto cleanup
  setTimeout(() => {
    activeSounds.delete(soundHandle);
  }, (releaseEnd - now) * 1000);

  return soundHandle;
}

// Play a chord (multiple notes)
export function playChord(
  midiNotes: number[],
  instrument: InstrumentType = 'piano',
  duration: number = 1.5,
  velocity: number = 0.6,
  arpeggio: boolean = false,
  arpeggioDelay: number = 0.1
): { stop: () => void } {
  const sounds: { stop: () => void }[] = [];

  midiNotes.forEach((midi, index) => {
    const delay = arpeggio ? index * arpeggioDelay : 0;
    setTimeout(() => {
      const sound = playNote(midi, instrument, duration - delay, velocity);
      sounds.push(sound);
    }, delay * 1000);
  });

  return {
    stop: () => sounds.forEach(s => s.stop()),
  };
}

// Play a scale
export function playScale(
  midiNotes: number[],
  instrument: InstrumentType = 'piano',
  noteDelay: number = 0.3,
  noteDuration: number = 0.4,
  velocity: number = 0.6
): { stop: () => void } {
  const sounds: { stop: () => void }[] = [];
  let cancelled = false;

  midiNotes.forEach((midi, index) => {
    setTimeout(() => {
      if (cancelled) return;
      const sound = playNote(midi, instrument, noteDuration, velocity);
      sounds.push(sound);
    }, index * noteDelay * 1000);
  });

  return {
    stop: () => {
      cancelled = true;
      sounds.forEach(s => s.stop());
    },
  };
}

// Play interval (two notes)
export function playInterval(
  midi1: number,
  midi2: number,
  instrument: InstrumentType = 'piano',
  sequential: boolean = true,
  duration: number = 1
): { stop: () => void } {
  if (sequential) {
    const sound1 = playNote(midi1, instrument, duration);
    let sound2: { stop: () => void } | null = null;

    const timeout = setTimeout(() => {
      sound2 = playNote(midi2, instrument, duration);
    }, duration * 1000 * 0.8);

    return {
      stop: () => {
        clearTimeout(timeout);
        sound1.stop();
        sound2?.stop();
      },
    };
  } else {
    return playChord([midi1, midi2], instrument, duration);
  }
}

// Play a rhythm pattern
export function playRhythm(
  pattern: number[], // Array of beat durations in milliseconds
  instrument: InstrumentType = 'piano',
  midi: number = 60, // Note to use for the beat
  velocity: number = 0.7
): { stop: () => void } {
  const sounds: { stop: () => void }[] = [];
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  let cancelled = false;

  let currentTime = 0;
  pattern.forEach((duration, index) => {
    const timeout = setTimeout(() => {
      if (cancelled) return;
      // Use a short percussive note for each beat
      const sound = playNote(midi, instrument, 0.1, velocity);
      sounds.push(sound);
    }, currentTime);
    timeouts.push(timeout);
    currentTime += duration;
  });

  return {
    stop: () => {
      cancelled = true;
      timeouts.forEach(t => clearTimeout(t));
      sounds.forEach(s => s.stop());
    },
  };
}

// Stop all sounds
export function stopAllSounds() {
  activeSounds.forEach(sound => sound.stop());
  activeSounds.clear();
}

// Sound effects
export function playSuccessSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(compressor!);

  const now = ctx.currentTime;

  // Rising arpeggio effect
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
  osc.frequency.setValueAtTime(783.99, now + 0.2); // G5

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.4);

  osc.start(now);
  osc.stop(now + 0.4);
}

export function playErrorSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.connect(gain);
  gain.connect(compressor!);

  const now = ctx.currentTime;

  osc.frequency.setValueAtTime(200, now);
  osc.frequency.linearRampToValueAtTime(150, now + 0.2);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.25);

  osc.start(now);
  osc.stop(now + 0.25);
}

export function playClickSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 1000;
  osc.connect(gain);
  gain.connect(compressor!);

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.05);

  osc.start(now);
  osc.stop(now + 0.05);
}

export function playLevelUpSound() {
  const ctx = getAudioContext();
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(compressor!);

    const start = ctx.currentTime + i * 0.1;
    gain.gain.setValueAtTime(0.3, start);
    gain.gain.linearRampToValueAtTime(0, start + 0.3);

    osc.start(start);
    osc.stop(start + 0.3);
  });
}

export function playAchievementSound() {
  const ctx = getAudioContext();

  // Fanfare-like sound
  const frequencies = [523.25, 659.25, 783.99, 1046.5, 1318.5];

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(compressor!);

    const start = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.05);
    gain.gain.linearRampToValueAtTime(0, start + 0.4);

    osc.start(start);
    osc.stop(start + 0.4);
  });
}

// Metronome click
export function playMetronomeClick(accent: boolean = false) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = accent ? 1500 : 1000;
  osc.connect(gain);
  gain.connect(compressor!);

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(accent ? 0.5 : 0.3, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.05);

  osc.start(now);
  osc.stop(now + 0.05);
}

// Tuner frequency detection using autocorrelation
export function createPitchDetector(onPitch: (frequency: number, note: string, cents: number) => void): {
  start: () => Promise<void>;
  stop: () => void;
} {
  let mediaStream: MediaStream | null = null;
  let analyser: AnalyserNode | null = null;
  let animationId: number | null = null;

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  function frequencyToNote(freq: number): { note: string; cents: number } {
    const midiNumber = 12 * Math.log2(freq / 440) + 69;
    const roundedMidi = Math.round(midiNumber);
    const cents = Math.round((midiNumber - roundedMidi) * 100);
    const noteName = noteNames[roundedMidi % 12];
    const octave = Math.floor(roundedMidi / 12) - 1;
    return { note: `${noteName}${octave}`, cents };
  }

  function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / SIZE);

    if (rms < 0.01) return -1; // Not enough signal

    // Find the first zero crossing
    let r1 = 0;
    let r2 = SIZE - 1;
    const threshold = 0.2;

    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < threshold) {
        r1 = i;
        break;
      }
    }

    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < threshold) {
        r2 = SIZE - i;
        break;
      }
    }

    const buf = buffer.slice(r1, r2);
    const c = new Array(buf.length).fill(0);

    for (let i = 0; i < buf.length; i++) {
      for (let j = 0; j < buf.length - i; j++) {
        c[i] += buf[j] * buf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;

    let maxval = -1;
    let maxpos = -1;

    for (let i = d; i < buf.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;

    // Parabolic interpolation
    const x1 = c[T0 - 1];
    const x2 = c[T0];
    const x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;

    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }

  function detect() {
    if (!analyser) return;

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    const frequency = autoCorrelate(buffer, getAudioContext().sampleRate);

    if (frequency > 50 && frequency < 2000) {
      const { note, cents } = frequencyToNote(frequency);
      onPitch(frequency, note, cents);
    }

    animationId = requestAnimationFrame(detect);
  }

  return {
    start: async () => {
      const ctx = getAudioContext();
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = ctx.createMediaStreamSource(mediaStream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      detect();
    },
    stop: () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
      }
      analyser = null;
    },
  };
}

// Cleanup
export function cleanup() {
  stopAllSounds();
  if (audioContext) {
    audioContext.close();
    audioContext = null;
    masterGain = null;
    reverbNode = null;
    compressor = null;
  }
}
