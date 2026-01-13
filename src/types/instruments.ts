export type InstrumentType =
  | 'piano' | 'guitar' | 'strings' | 'synth' | 'organ'
  | 'bass' | 'drums' | 'brass' | 'woodwind' | 'vocal';

export interface InstrumentConfig {
  id: InstrumentType;
  name: string;
  icon: string;
  color: string;
  description: string;
  waveform: OscillatorType;
  envelope: EnvelopeConfig;
  filters?: FilterConfig[];
  effects?: EffectConfig[];
}

export interface EnvelopeConfig {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface FilterConfig {
  type: BiquadFilterType;
  frequency: number;
  Q: number;
  gain?: number;
}

export interface EffectConfig {
  type: 'reverb' | 'delay' | 'chorus' | 'distortion';
  wet: number;
  params: Record<string, number>;
}

export const INSTRUMENTS: Record<InstrumentType, InstrumentConfig> = {
  piano: {
    id: 'piano',
    name: 'Piano',
    icon: '🎹',
    color: 'from-slate-700 to-slate-900',
    description: 'Grand piano with rich harmonics',
    waveform: 'triangle',
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.8 },
    filters: [
      { type: 'lowpass', frequency: 5000, Q: 1 },
    ],
  },
  guitar: {
    id: 'guitar',
    name: 'Guitar',
    icon: '🎸',
    color: 'from-amber-600 to-amber-800',
    description: 'Acoustic guitar with warm tone',
    waveform: 'sawtooth',
    envelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 1.0 },
    filters: [
      { type: 'lowpass', frequency: 3000, Q: 2 },
      { type: 'highpass', frequency: 100, Q: 1 },
    ],
  },
  strings: {
    id: 'strings',
    name: 'Strings',
    icon: '🎻',
    color: 'from-rose-700 to-rose-900',
    description: 'Orchestral string section',
    waveform: 'sawtooth',
    envelope: { attack: 0.2, decay: 0.3, sustain: 0.7, release: 0.5 },
    filters: [
      { type: 'lowpass', frequency: 4000, Q: 0.5 },
    ],
  },
  synth: {
    id: 'synth',
    name: 'Synth',
    icon: '🎛️',
    color: 'from-purple-600 to-pink-600',
    description: 'Modern synthesizer lead',
    waveform: 'square',
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 },
    filters: [
      { type: 'lowpass', frequency: 2000, Q: 5 },
    ],
  },
  organ: {
    id: 'organ',
    name: 'Organ',
    icon: '🎙️',
    color: 'from-red-800 to-red-950',
    description: 'Classic Hammond organ',
    waveform: 'sine',
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.1 },
    filters: [
      { type: 'bandpass', frequency: 1000, Q: 1 },
    ],
  },
  bass: {
    id: 'bass',
    name: 'Bass',
    icon: '🎸',
    color: 'from-indigo-700 to-indigo-900',
    description: 'Deep electric bass',
    waveform: 'triangle',
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.4 },
    filters: [
      { type: 'lowpass', frequency: 800, Q: 1 },
    ],
  },
  drums: {
    id: 'drums',
    name: 'Drums',
    icon: '🥁',
    color: 'from-gray-600 to-gray-800',
    description: 'Drum kit for rhythm',
    waveform: 'sine',
    envelope: { attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.2 },
  },
  brass: {
    id: 'brass',
    name: 'Brass',
    icon: '🎺',
    color: 'from-yellow-600 to-yellow-800',
    description: 'Brass section',
    waveform: 'sawtooth',
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.3 },
    filters: [
      { type: 'lowpass', frequency: 3500, Q: 2 },
    ],
  },
  woodwind: {
    id: 'woodwind',
    name: 'Woodwind',
    icon: '🎷',
    color: 'from-emerald-700 to-emerald-900',
    description: 'Clarinet and flute',
    waveform: 'sine',
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.4 },
    filters: [
      { type: 'bandpass', frequency: 2000, Q: 2 },
    ],
  },
  vocal: {
    id: 'vocal',
    name: 'Vocal',
    icon: '🎤',
    color: 'from-pink-600 to-pink-800',
    description: 'Human-like vocal pad',
    waveform: 'sine',
    envelope: { attack: 0.15, decay: 0.2, sustain: 0.8, release: 0.5 },
    filters: [
      { type: 'bandpass', frequency: 1200, Q: 3 },
    ],
  },
};

export function getInstrumentList(): InstrumentConfig[] {
  return Object.values(INSTRUMENTS);
}

// Guitar String Configuration
export interface GuitarString {
  note: string;      // e.g., "E2", "B1"
  frequency: number; // Hz
  midi: number;      // MIDI note number
}

export interface GuitarTuning {
  id: string;
  name: string;
  strings: number;   // 6 or 7
  category: 'standard' | 'drop' | 'open' | 'alternate' | 'extended';
  notes: GuitarString[];
  description?: string;
}

// Standard reference frequencies (A4 = 440 Hz)
const NOTE_FREQUENCIES: Record<string, number> = {
  // Octave 1
  'A1': 55.00, 'A#1': 58.27, 'Bb1': 58.27, 'B1': 61.74,
  // Octave 2
  'C2': 65.41, 'C#2': 69.30, 'Db2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'Eb2': 77.78,
  'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'Gb2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'Ab2': 103.83,
  'A2': 110.00, 'A#2': 116.54, 'Bb2': 116.54, 'B2': 123.47,
  // Octave 3
  'C3': 130.81, 'C#3': 138.59, 'Db3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56,
  'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'Ab3': 207.65,
  'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 'B3': 246.94,
  // Octave 4
  'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'Ab4': 415.30,
  'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88,
};

// MIDI note numbers
const NOTE_MIDI: Record<string, number> = {
  'A1': 33, 'A#1': 34, 'Bb1': 34, 'B1': 35,
  'C2': 36, 'C#2': 37, 'Db2': 37, 'D2': 38, 'D#2': 39, 'Eb2': 39,
  'E2': 40, 'F2': 41, 'F#2': 42, 'Gb2': 42, 'G2': 43, 'G#2': 44, 'Ab2': 44,
  'A2': 45, 'A#2': 46, 'Bb2': 46, 'B2': 47,
  'C3': 48, 'C#3': 49, 'Db3': 49, 'D3': 50, 'D#3': 51, 'Eb3': 51,
  'E3': 52, 'F3': 53, 'F#3': 54, 'Gb3': 54, 'G3': 55, 'G#3': 56, 'Ab3': 56,
  'A3': 57, 'A#3': 58, 'Bb3': 58, 'B3': 59,
  'C4': 60, 'C#4': 61, 'Db4': 61, 'D4': 62, 'D#4': 63, 'Eb4': 63,
  'E4': 64, 'F4': 65, 'F#4': 66, 'Gb4': 66, 'G4': 67, 'G#4': 68, 'Ab4': 68,
  'A4': 69, 'A#4': 70, 'Bb4': 70, 'B4': 71,
};

function createString(note: string): GuitarString {
  return {
    note,
    frequency: NOTE_FREQUENCIES[note] || 0,
    midi: NOTE_MIDI[note] || 0,
  };
}

// 6-String Guitar Tunings
export const GUITAR_TUNINGS_6: GuitarTuning[] = [
  // Standard Tunings
  {
    id: 'standard-e',
    name: 'Standard E',
    strings: 6,
    category: 'standard',
    notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'].map(createString),
    description: 'Standard guitar tuning',
  },
  {
    id: 'half-step-down',
    name: 'Half Step Down (Eb)',
    strings: 6,
    category: 'standard',
    notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'].map(createString),
    description: 'All strings tuned down 1 semitone',
  },
  {
    id: 'full-step-down',
    name: 'Full Step Down (D)',
    strings: 6,
    category: 'standard',
    notes: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'].map(createString),
    description: 'All strings tuned down 2 semitones',
  },
  // Drop Tunings
  {
    id: 'drop-d',
    name: 'Drop D',
    strings: 6,
    category: 'drop',
    notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'].map(createString),
    description: 'Low E dropped to D for power chords',
  },
  {
    id: 'drop-c-sharp',
    name: 'Drop C#',
    strings: 6,
    category: 'drop',
    notes: ['C#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'].map(createString),
    description: 'Drop D tuned down 1 semitone',
  },
  {
    id: 'drop-c',
    name: 'Drop C',
    strings: 6,
    category: 'drop',
    notes: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'].map(createString),
    description: 'Drop D tuned down 2 semitones - popular in metal',
  },
  {
    id: 'drop-b',
    name: 'Drop B',
    strings: 6,
    category: 'drop',
    notes: ['B1', 'F#2', 'B2', 'E3', 'G#3', 'C#4'].map(createString),
    description: 'Very low tuning for heavy metal',
  },
  // Open Tunings
  {
    id: 'open-g',
    name: 'Open G',
    strings: 6,
    category: 'open',
    notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'].map(createString),
    description: 'Open G major chord - used in blues and slide guitar',
  },
  {
    id: 'open-d',
    name: 'Open D',
    strings: 6,
    category: 'open',
    notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'].map(createString),
    description: 'Open D major chord - popular for slide guitar',
  },
  {
    id: 'open-e',
    name: 'Open E',
    strings: 6,
    category: 'open',
    notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'].map(createString),
    description: 'Open E major chord',
  },
  {
    id: 'open-a',
    name: 'Open A',
    strings: 6,
    category: 'open',
    notes: ['E2', 'A2', 'E3', 'A3', 'C#4', 'E4'].map(createString),
    description: 'Open A major chord',
  },
  // Alternate Tunings
  {
    id: 'dadgad',
    name: 'DADGAD',
    strings: 6,
    category: 'alternate',
    notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'].map(createString),
    description: 'Celtic/folk tuning - Dsus4 chord',
  },
  {
    id: 'double-drop-d',
    name: 'Double Drop D',
    strings: 6,
    category: 'alternate',
    notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'D4'].map(createString),
    description: 'Both E strings dropped to D',
  },
  {
    id: 'all-fourths',
    name: 'All Fourths',
    strings: 6,
    category: 'alternate',
    notes: ['E2', 'A2', 'D3', 'G3', 'C4', 'F4'].map(createString),
    description: 'Uniform intervals - used by jazz guitarists',
  },
  {
    id: 'nashville',
    name: 'Nashville Tuning',
    strings: 6,
    category: 'alternate',
    notes: ['E3', 'A3', 'D4', 'G4', 'B3', 'E4'].map(createString),
    description: 'High strung tuning for bright chimey sound',
  },
];

// 7-String Guitar Tunings
export const GUITAR_TUNINGS_7: GuitarTuning[] = [
  // Standard Tunings
  {
    id: '7-standard-b',
    name: 'Standard B',
    strings: 7,
    category: 'standard',
    notes: ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'].map(createString),
    description: 'Standard 7-string tuning',
  },
  {
    id: '7-standard-a',
    name: 'Standard A',
    strings: 7,
    category: 'standard',
    notes: ['A1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4'].map(createString),
    description: 'All strings tuned down 2 semitones from Standard B',
  },
  {
    id: '7-half-step-down',
    name: 'Half Step Down (Bb)',
    strings: 7,
    category: 'standard',
    notes: ['Bb1', 'Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'].map(createString),
    description: 'All strings tuned down 1 semitone',
  },
  // Drop Tunings
  {
    id: '7-drop-a',
    name: 'Drop A',
    strings: 7,
    category: 'drop',
    notes: ['A1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'].map(createString),
    description: 'Low B dropped to A for power chords',
  },
  {
    id: '7-drop-g-sharp',
    name: 'Drop G#',
    strings: 7,
    category: 'drop',
    notes: ['G#1', 'D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'].map(createString),
    description: 'Drop A tuned down 1 semitone',
  },
  {
    id: '7-drop-g',
    name: 'Drop G',
    strings: 7,
    category: 'drop',
    notes: ['G1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4'].map(createString),
    description: 'Very low drop tuning - popular in djent/progressive metal',
  },
  // Extended Range
  {
    id: '7-low-f-sharp',
    name: 'Low F#',
    strings: 7,
    category: 'extended',
    notes: ['F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3'].map(createString),
    description: 'Extended low range tuning',
  },
];

// Bass Guitar Tunings (4, 5, and 6 string)
export const BASS_TUNINGS: GuitarTuning[] = [
  // 4-String Bass
  {
    id: 'bass-4-standard',
    name: '4-String Standard',
    strings: 4,
    category: 'standard',
    notes: ['E1', 'A1', 'D2', 'G2'].map(n => ({
      note: n,
      frequency: NOTE_FREQUENCIES[n] || (n === 'E1' ? 41.20 : 0),
      midi: NOTE_MIDI[n] || (n === 'E1' ? 28 : 0),
    })),
    description: 'Standard 4-string bass tuning',
  },
  {
    id: 'bass-4-drop-d',
    name: '4-String Drop D',
    strings: 4,
    category: 'drop',
    notes: ['D1', 'A1', 'D2', 'G2'].map(n => ({
      note: n,
      frequency: NOTE_FREQUENCIES[n] || (n === 'D1' ? 36.71 : 0),
      midi: NOTE_MIDI[n] || (n === 'D1' ? 26 : 0),
    })),
    description: 'Drop D bass tuning',
  },
  // 5-String Bass
  {
    id: 'bass-5-standard',
    name: '5-String Standard (Low B)',
    strings: 5,
    category: 'standard',
    notes: ['B0', 'E1', 'A1', 'D2', 'G2'].map(n => ({
      note: n,
      frequency: NOTE_FREQUENCIES[n] || (n === 'B0' ? 30.87 : n === 'E1' ? 41.20 : 0),
      midi: NOTE_MIDI[n] || (n === 'B0' ? 23 : n === 'E1' ? 28 : 0),
    })),
    description: 'Standard 5-string bass with low B',
  },
];

// All Guitar Tunings Combined
export const ALL_GUITAR_TUNINGS: GuitarTuning[] = [
  ...GUITAR_TUNINGS_6,
  ...GUITAR_TUNINGS_7,
];

// All Tunings (including bass)
export const ALL_TUNINGS: GuitarTuning[] = [
  ...ALL_GUITAR_TUNINGS,
  ...BASS_TUNINGS,
];

// Helper functions
export function getTuningsByStrings(strings: number): GuitarTuning[] {
  return ALL_TUNINGS.filter(t => t.strings === strings);
}

export function getTuningsByCategory(category: GuitarTuning['category']): GuitarTuning[] {
  return ALL_GUITAR_TUNINGS.filter(t => t.category === category);
}

export function getTuningById(id: string): GuitarTuning | undefined {
  return ALL_TUNINGS.find(t => t.id === id);
}

export function get6StringTunings(): GuitarTuning[] {
  return GUITAR_TUNINGS_6;
}

export function get7StringTunings(): GuitarTuning[] {
  return GUITAR_TUNINGS_7;
}
