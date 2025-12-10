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
