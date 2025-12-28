// Pitch detection using autocorrelation algorithm
// Based on the YIN algorithm for fundamental frequency detection

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface PitchResult {
  frequency: number;
  midiNote: number;
  noteName: string;
  octave: number;
  cents: number; // How many cents off from the note (-50 to +50)
  confidence: number; // 0-1 confidence level
}

// Convert frequency to MIDI note number
export function frequencyToMidi(frequency: number): number {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

// Convert MIDI note to frequency
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Get note name from MIDI number
export function midiToNoteName(midi: number): { name: string; octave: number } {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return { name: NOTE_NAMES[noteIndex], octave };
}

// Calculate cents deviation from the nearest note
function getCentsDeviation(frequency: number, midiNote: number): number {
  const perfectFreq = midiToFrequency(midiNote);
  return Math.round(1200 * Math.log2(frequency / perfectFreq));
}

// Autocorrelation-based pitch detection
export function detectPitch(
  buffer: Float32Array<ArrayBufferLike>,
  sampleRate: number
): PitchResult | null {
  const bufferSize = buffer.length;

  // Check if there's enough signal (not silence)
  let rms = 0;
  for (let i = 0; i < bufferSize; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / bufferSize);

  // If the signal is too quiet, return null
  if (rms < 0.01) {
    return null;
  }

  // Autocorrelation
  const correlations = new Float32Array(bufferSize);

  for (let lag = 0; lag < bufferSize; lag++) {
    let sum = 0;
    for (let i = 0; i < bufferSize - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
    }
    correlations[lag] = sum;
  }

  // Find the first peak after the initial decay
  // This corresponds to the fundamental frequency
  let foundPeak = false;
  let peakLag = 0;
  let peakValue = 0;

  // Skip the first few samples to avoid detecting the DC component
  const minLag = Math.floor(sampleRate / 1000); // Min frequency ~1000 Hz
  const maxLag = Math.floor(sampleRate / 60);   // Max frequency ~60 Hz (below typical musical range)

  // Find where the correlation first drops below a threshold
  let threshold = correlations[0] * 0.5;
  let belowThreshold = false;

  for (let lag = minLag; lag < Math.min(maxLag, bufferSize); lag++) {
    if (correlations[lag] < threshold) {
      belowThreshold = true;
    }

    if (belowThreshold && correlations[lag] > peakValue) {
      peakValue = correlations[lag];
      peakLag = lag;
      foundPeak = true;
    }
  }

  if (!foundPeak || peakLag === 0) {
    return null;
  }

  // Calculate confidence based on how strong the peak is
  const confidence = peakValue / correlations[0];

  if (confidence < 0.5) {
    return null;
  }

  // Convert lag to frequency
  const frequency = sampleRate / peakLag;

  // Validate frequency range (20 Hz - 4000 Hz for musical notes)
  if (frequency < 20 || frequency > 4000) {
    return null;
  }

  const midiNote = frequencyToMidi(frequency);
  const { name, octave } = midiToNoteName(midiNote);
  const cents = getCentsDeviation(frequency, midiNote);

  return {
    frequency,
    midiNote,
    noteName: name,
    octave,
    cents,
    confidence,
  };
}

// Microphone manager class
export class MicrophoneManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;
  private isListening = false;
  private onPitchCallback: ((pitch: PitchResult | null) => void) | null = null;
  private animationFrame: number | null = null;

  async start(): Promise<boolean> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.source.connect(this.analyser);

      this.buffer = new Float32Array(this.analyser.fftSize) as Float32Array<ArrayBuffer>;
      this.isListening = true;

      this.detectLoop();

      return true;
    } catch (error) {
      console.error('Failed to access microphone:', error);
      return false;
    }
  }

  stop(): void {
    this.isListening = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.buffer = null;
  }

  onPitch(callback: (pitch: PitchResult | null) => void): void {
    this.onPitchCallback = callback;
  }

  private detectLoop = (): void => {
    if (!this.isListening || !this.analyser || !this.buffer || !this.audioContext) {
      return;
    }

    this.analyser.getFloatTimeDomainData(this.buffer);
    const pitch = detectPitch(this.buffer, this.audioContext.sampleRate);

    if (this.onPitchCallback) {
      this.onPitchCallback(pitch);
    }

    this.animationFrame = requestAnimationFrame(this.detectLoop);
  };

  isActive(): boolean {
    return this.isListening;
  }
}

// Singleton instance
let microphoneManager: MicrophoneManager | null = null;

export function getMicrophoneManager(): MicrophoneManager {
  if (!microphoneManager) {
    microphoneManager = new MicrophoneManager();
  }
  return microphoneManager;
}
