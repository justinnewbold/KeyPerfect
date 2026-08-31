export type InstrumentType =
  | 'piano' | 'guitar' | 'strings' | 'synth' | 'organ'
  | 'bass' | 'drums' | 'brass' | 'woodwind' | 'vocal'
  | 'electricPiano' | 'cleanElectric' | 'metalGuitar' | 'cello' | 'flute';

export interface InstrumentConfig {
  id: InstrumentType;
  name: string;
  icon: string;
  color: string;
  description: string;
  /** How audioEngine.playNote should synthesise this instrument. */
  voice: VoiceConfig;
}

/**
 * A recipe for one synthesised instrument voice.
 *
 * This replaced a single oscillator waveform plus a fixed ADSR and fixed-Hz
 * filters, which had four problems that between them accounted for most of
 * why everything sounded like the same buzzer at different pitches:
 *
 *  1. A sustain plateau on instruments that physically cannot sustain. A
 *     piano string is struck once and decays from that instant; holding it at
 *     a constant level for a second and then cutting it is the single most
 *     synthetic thing an ear-training app can do.
 *  2. Filter cutoffs in absolute Hz. A 5 kHz lowpass leaves a low C2 with
 *     seventy-odd harmonics and a high C6 with four, so the same instrument
 *     was buzzy at the bottom and dull at the top. Brightness here is
 *     expressed in *harmonics*, so it tracks pitch the way a real instrument
 *     does.
 *  3. Fixed harmonic amplitudes for the whole note. In every real instrument
 *     the upper partials die first; holding them flat reads as an organ.
 *  4. No attack transient. The hammer thud, pick click, breath and bow noise
 *     are most of what tells two instruments apart in the first 30 ms.
 */
export interface VoiceConfig {
  /**
   * 'decay' — energy arrives once and dies away (piano, guitar, bass).
   * 'sustained' — energy keeps arriving while the note is held (bowed,
   * blown, electric organ, a high-gain guitar).
   */
  kind: 'decay' | 'sustained';
  /**
   * Relative amplitude of harmonics 1..N. This is the instrument's timbre;
   * it is rendered as a PeriodicWave, or as individual oscillators when
   * `inharmonicity` is set.
   */
  partials: number[];
  /**
   * String stiffness, which makes partial n sharp by sqrt(1 + B·n²) rather
   * than a perfect multiple. This is why a piano sounds like a piano and not
   * like an organ, and why pianos are tuned with stretched octaves. Setting
   * it switches the voice to individual per-partial oscillators, which also
   * lets each partial decay at its own rate.
   */
  inharmonicity?: number;
  /** Copies of the voice, spread apart, for a section or a chorus. */
  unison?: { voices: number; cents: number };
  /**
   * The filter envelope, in harmonics above the fundamental rather than Hz,
   * so it tracks pitch. `close` above `open` gives a rising sweep, which is
   * how brass blooms as the player leans into a note.
   */
  brightness: {
    /** Cutoff at the moment of attack. */
    open: number;
    /** Cutoff once the note has settled. */
    close: number;
    /** Seconds to travel between them. */
    time: number;
    /** Resonance at the cutoff. */
    q?: number;
    /** Extra harmonics at full velocity: harder playing is brighter. */
    velocity?: number;
  };
  amp: {
    attack: number;
    /** 'decay' voices: seconds to fall 60 dB, at middle C. */
    decay?: number;
    /**
     * How much faster high notes decay, per octave above middle C. Real
     * strings are shorter and lighter at the top and die away sooner.
     */
    decayKeyTrack?: number;
    /** 'sustained' voices: level held after the initial attack. */
    sustain?: number;
    /** 'sustained' voices: seconds from the attack peak down to sustain. */
    hold?: number;
    release: number;
  };
  /** Pitch wobble, delayed the way a player eases into it. */
  vibrato?: { rate: number; cents: number; onset: number };
  /** Amplitude wobble — a Leslie cabinet, or an amp's tremolo. */
  tremolo?: { rate: number; depth: number };
  /** The noise of the instrument being set in motion. */
  transient?: {
    /** 'noise' for a pick, breath or bow; 'thump' for a hammer or mallet. */
    kind: 'noise' | 'thump';
    level: number;
    decay: number;
    /** Where the transient sits, as a multiple of the note's frequency. */
    tone: number;
    q?: number;
  };
  /** Continuous breath noise under the tone, for flutes and voices. */
  breath?: number;
  /** Waveshaper amount. 0 is clean; a metal guitar is most of the way up. */
  drive?: number;
  /**
   * Fixed resonances that stay put as the pitch moves — a guitar's body, a
   * cello's belly, the vowel formants of a voice, a speaker cabinet. These,
   * not the harmonics, are what make an instrument sound like an object of a
   * particular size.
   */
  formants?: { frequency: number; q: number; gain: number }[];
  /**
   * A bell partial locked to the fundamental, for the struck tine of a
   * Rhodes: `ratio` above the note, fading over `decay` seconds.
   */
  fm?: { ratio: number; index: number; decay: number };
  /** Loudness trim so switching instruments doesn't jump in level. */
  level?: number;
}

export const INSTRUMENTS: Record<InstrumentType, InstrumentConfig> = {
  piano: {
    id: 'piano',
    name: 'Piano',
    icon: '🎹',
    color: 'from-slate-700 to-slate-900',
    description: 'Grand piano with rich harmonics',
    voice: {
      kind: 'decay',
      // Measured grand pianos put most energy in the first three partials and
      // fall away steeply after that.
      partials: [1, 0.62, 0.38, 0.24, 0.15, 0.1, 0.07, 0.045, 0.03, 0.02],
      // Real strings are stiff, so their partials run progressively sharp.
      // Without this the piano is just an organ with a decay on it.
      inharmonicity: 0.0004,
      brightness: { open: 15, close: 4, time: 0.35, q: 0.7, velocity: 8 },
      amp: { attack: 0.004, decay: 4.5, decayKeyTrack: 0.55, release: 0.35 },
      // The hammer felt striking the string, before any tone develops.
      transient: { kind: 'thump', level: 0.16, decay: 0.012, tone: 6, q: 1.2 },
      // The soundboard, which stays put as the pitch moves.
      formants: [{ frequency: 180, q: 1.1, gain: 3 }],
      level: 1,
    },
  },
  guitar: {
    id: 'guitar',
    name: 'Guitar',
    icon: '🎸',
    color: 'from-amber-600 to-amber-800',
    description: 'Acoustic guitar with warm tone',
    voice: {
      kind: 'decay',
      partials: [1, 0.75, 0.5, 0.36, 0.26, 0.18, 0.13, 0.09, 0.06, 0.04],
      brightness: { open: 17, close: 5, time: 0.25, q: 0.8, velocity: 8 },
      amp: { attack: 0.003, decay: 2.8, decayKeyTrack: 0.6, release: 0.3 },
      // The plectrum leaving the string: brief, bright, and most of what
      // says "guitar" before the tone arrives.
      transient: { kind: 'noise', level: 0.2, decay: 0.008, tone: 11, q: 0.9 },
      // A dreadnought's Helmholtz air resonance and its top plate.
      formants: [
        { frequency: 100, q: 1.4, gain: 5 },
        { frequency: 205, q: 1.6, gain: 4 },
      ],
      level: 0.95,
    },
  },
  strings: {
    id: 'strings',
    name: 'Strings',
    icon: '🎻',
    color: 'from-rose-700 to-rose-900',
    description: 'Orchestral string section',
    voice: {
      kind: 'sustained',
      partials: [1, 0.5, 0.34, 0.25, 0.2, 0.16, 0.14, 0.12, 0.1, 0.09, 0.08, 0.07],
      // A section is many players who are never quite in unison. The beating
      // between them is the sound of a section rather than one violin.
      unison: { voices: 3, cents: 9 },
      brightness: { open: 7, close: 9, time: 0.5, q: 0.7, velocity: 4 },
      amp: { attack: 0.18, hold: 0.25, sustain: 0.85, release: 0.5 },
      vibrato: { rate: 5.2, cents: 12, onset: 0.35 },
      transient: { kind: 'noise', level: 0.05, decay: 0.09, tone: 8, q: 0.7 },
      level: 0.8,
    },
  },
  synth: {
    id: 'synth',
    name: 'Synth',
    icon: '🎛️',
    color: 'from-purple-600 to-pink-600',
    description: 'Modern synthesizer lead',
    voice: {
      kind: 'sustained',
      partials: [1, 0.5, 0.33, 0.25, 0.2, 0.16, 0.14, 0.12, 0.11, 0.1],
      // A detuned stack of saws — the sound is the beating, not the wave.
      unison: { voices: 5, cents: 14 },
      // A resonant sweep is the point of a synth, so this one keeps its
      // filter movement rather than being made to imitate an acoustic.
      brightness: { open: 14, close: 2.5, time: 0.6, q: 6, velocity: 10 },
      amp: { attack: 0.008, hold: 0.15, sustain: 0.75, release: 0.25 },
      drive: 0.12,
      level: 0.7,
    },
  },
  organ: {
    id: 'organ',
    name: 'Organ',
    icon: '🎙️',
    color: 'from-red-800 to-red-950',
    description: 'Classic Hammond organ',
    voice: {
      kind: 'sustained',
      // Drawbars: a Hammond is additive by construction, a set of sine
      // tonewheels at fixed ratios. This is roughly 88 8000 888.
      partials: [1, 0.9, 0.55, 0.7, 0, 0.35, 0, 0.28],
      // A tonewheel organ has no envelope to speak of; the contact closes
      // and the tone is simply there.
      brightness: { open: 10, close: 9, time: 0.1, q: 0.5 },
      amp: { attack: 0.006, hold: 0.02, sustain: 1, release: 0.06 },
      // The famous key click: the contacts bouncing, not part of the tone.
      transient: { kind: 'noise', level: 0.09, decay: 0.006, tone: 14, q: 0.8 },
      // A Leslie cabinet, which is why an organ never sits still.
      tremolo: { rate: 6.4, depth: 0.13 },
      vibrato: { rate: 6.4, cents: 5, onset: 0 },
      level: 0.55,
    },
  },
  bass: {
    id: 'bass',
    name: 'Bass',
    icon: '🎸',
    color: 'from-indigo-700 to-indigo-900',
    description: 'Deep electric bass',
    voice: {
      kind: 'decay',
      partials: [1, 0.55, 0.28, 0.16, 0.09, 0.05, 0.03],
      brightness: { open: 10, close: 3, time: 0.3, q: 1.1, velocity: 6 },
      amp: { attack: 0.006, decay: 3.2, decayKeyTrack: 0.4, release: 0.3 },
      transient: { kind: 'noise', level: 0.12, decay: 0.01, tone: 13, q: 1 },
      level: 1,
    },
  },
  drums: {
    id: 'drums',
    name: 'Drums',
    icon: '🥁',
    color: 'from-gray-600 to-gray-800',
    description: 'Drum kit for rhythm',
    // Percussion is not a pitched voice and is synthesised separately; see
    // playDrumHit. This spec is a fallback so the type stays total.
    voice: {
      kind: 'decay',
      partials: [1, 0.4, 0.2],
      brightness: { open: 8, close: 3, time: 0.05 },
      amp: { attack: 0.001, decay: 0.3, release: 0.05 },
      level: 1,
    },
  },
  brass: {
    id: 'brass',
    name: 'Brass',
    icon: '🎺',
    color: 'from-yellow-600 to-yellow-800',
    description: 'Brass section',
    voice: {
      kind: 'sustained',
      // Brass energy peaks at the second and third partials, not the first.
      partials: [0.85, 1, 0.92, 0.78, 0.62, 0.48, 0.36, 0.26, 0.18, 0.12, 0.08],
      unison: { voices: 2, cents: 7 },
      // Opening rather than closing: a brass note blooms as the player
      // leans into it, and that rising brightness is the whole character.
      brightness: { open: 3, close: 11, time: 0.22, q: 1.2, velocity: 6 },
      amp: { attack: 0.06, hold: 0.2, sustain: 0.8, release: 0.25 },
      vibrato: { rate: 5.5, cents: 8, onset: 0.5 },
      // Brass gets its bite from the air column driving itself non-linearly.
      drive: 0.22,
      level: 0.7,
    },
  },
  woodwind: {
    id: 'woodwind',
    name: 'Woodwind',
    icon: '🎷',
    color: 'from-emerald-700 to-emerald-900',
    description: 'Clarinet and flute',
    voice: {
      kind: 'sustained',
      // A cylindrical pipe closed at one end suppresses even harmonics.
      // That hollow, odd-harmonic spectrum is the clarinet.
      partials: [1, 0.06, 0.65, 0.05, 0.4, 0.04, 0.24, 0.03, 0.14, 0.02, 0.08],
      brightness: { open: 6, close: 9, time: 0.25, q: 0.8, velocity: 4 },
      amp: { attack: 0.05, hold: 0.12, sustain: 0.9, release: 0.25 },
      vibrato: { rate: 4.6, cents: 7, onset: 0.6 },
      transient: { kind: 'noise', level: 0.07, decay: 0.05, tone: 9, q: 0.7 },
      breath: 0.02,
      level: 0.8,
    },
  },
  vocal: {
    id: 'vocal',
    name: 'Vocal',
    icon: '🎤',
    color: 'from-pink-600 to-pink-800',
    description: 'Human-like vocal pad',
    voice: {
      kind: 'sustained',
      partials: [1, 0.7, 0.55, 0.42, 0.3, 0.2, 0.14, 0.1, 0.07, 0.05],
      unison: { voices: 2, cents: 6 },
      brightness: { open: 5, close: 7, time: 0.35, q: 0.6 },
      amp: { attack: 0.12, hold: 0.25, sustain: 0.9, release: 0.4 },
      // A trained singer's vibrato is wide and unmistakable.
      vibrato: { rate: 5.5, cents: 22, onset: 0.4 },
      // The vowel. These three resonances are an "ah"; they stay where they
      // are as the pitch moves, which is exactly what a vocal tract does and
      // what makes this read as a voice rather than a filtered saw.
      formants: [
        { frequency: 730, q: 5, gain: 12 },
        { frequency: 1090, q: 7, gain: 9 },
        { frequency: 2440, q: 8, gain: 6 },
      ],
      breath: 0.015,
      level: 0.65,
    },
  },
  electricPiano: {
    id: 'electricPiano',
    name: 'Electric Piano',
    icon: '🎹',
    color: 'from-cyan-600 to-cyan-800',
    description: 'Rhodes-style electric piano',
    voice: {
      kind: 'decay',
      partials: [1, 0.28, 0.09, 0.04, 0.02],
      // A Rhodes is a hammer hitting a tuned metal tine beside a pickup. The
      // bark of the tine is a high, inharmonic partial that fades in a third
      // of a second and leaves a nearly pure tone behind — the reason the
      // instrument sounds struck rather than blown.
      fm: { ratio: 6.5, index: 2.6, decay: 0.35 },
      brightness: { open: 12, close: 3, time: 0.5, q: 0.7, velocity: 9 },
      amp: { attack: 0.002, decay: 3.6, decayKeyTrack: 0.5, release: 0.4 },
      transient: { kind: 'thump', level: 0.1, decay: 0.01, tone: 8, q: 1 },
      level: 0.9,
    },
  },
  cleanElectric: {
    id: 'cleanElectric',
    name: 'Clean Electric',
    icon: '🎸',
    color: 'from-teal-600 to-teal-800',
    description: 'Clean electric guitar tone',
    voice: {
      kind: 'decay',
      partials: [1, 0.62, 0.4, 0.28, 0.18, 0.12, 0.08, 0.05],
      brightness: { open: 13, close: 4, time: 0.3, q: 1.3, velocity: 7 },
      amp: { attack: 0.003, decay: 3, decayKeyTrack: 0.5, release: 0.35 },
      transient: { kind: 'noise', level: 0.17, decay: 0.007, tone: 14, q: 1 },
      // A little valve warmth, well short of breakup.
      drive: 0.06,
      // The speaker, which is what stops a clean electric sounding like a saw.
      formants: [{ frequency: 2100, q: 1.1, gain: 4 }],
      level: 0.9,
    },
  },
  metalGuitar: {
    id: 'metalGuitar',
    name: 'Heavy Metal Guitar',
    icon: '🎸',
    color: 'from-red-700 to-black',
    description: 'High-gain distorted metal guitar',
    voice: {
      kind: 'sustained',
      partials: [1, 0.8, 0.62, 0.5, 0.4, 0.32, 0.25, 0.2, 0.15],
      // The name promised distortion and the old voice had none: it was
      // three plain oscillators. Gain is the instrument here — it is also
      // what makes the note sustain instead of decaying.
      drive: 0.88,
      brightness: { open: 9, close: 7, time: 0.2, q: 1.4, velocity: 4 },
      amp: { attack: 0.004, hold: 0.08, sustain: 0.85, release: 0.2 },
      transient: { kind: 'noise', level: 0.16, decay: 0.008, tone: 12, q: 1 },
      // A 4x12 cabinet: a presence peak and nothing much above it. Without
      // the cabinet, distortion is just fizz.
      formants: [
        { frequency: 2400, q: 1.2, gain: 6 },
        { frequency: 480, q: 1, gain: 3 },
      ],
      level: 0.55,
    },
  },
  cello: {
    id: 'cello',
    name: 'Cello',
    icon: '🎻',
    color: 'from-amber-800 to-amber-950',
    description: 'Solo cello with rich tone',
    voice: {
      kind: 'sustained',
      // A bowed string is close to a sawtooth: every harmonic present and
      // falling away slowly. The cello's is unusually strong up top.
      partials: [1, 0.85, 0.7, 0.55, 0.42, 0.32, 0.25, 0.18, 0.13, 0.1, 0.07],
      unison: { voices: 2, cents: 4 },
      brightness: { open: 5, close: 8, time: 0.45, q: 0.8, velocity: 4 },
      amp: { attack: 0.13, hold: 0.3, sustain: 0.88, release: 0.45 },
      vibrato: { rate: 5, cents: 16, onset: 0.3 },
      // The bow biting the string before it starts to sing.
      transient: { kind: 'noise', level: 0.08, decay: 0.12, tone: 7, q: 0.7 },
      // The body: a cello's belly resonances are low and strong, and are
      // why it sounds like a large wooden box rather than a low violin.
      formants: [
        { frequency: 220, q: 1.5, gain: 6 },
        { frequency: 300, q: 2, gain: 4 },
      ],
      level: 0.75,
    },
  },
  flute: {
    id: 'flute',
    name: 'Winds',
    icon: '🪈',
    color: 'from-sky-600 to-sky-800',
    description: 'Orchestral flute and winds',
    voice: {
      kind: 'sustained',
      // Nearly a sine. What identifies a flute is not its harmonics but the
      // air noise around them.
      partials: [1, 0.3, 0.09, 0.04, 0.02, 0.01],
      brightness: { open: 4, close: 6, time: 0.3, q: 0.6 },
      amp: { attack: 0.09, hold: 0.15, sustain: 0.92, release: 0.3 },
      vibrato: { rate: 5, cents: 14, onset: 0.5 },
      transient: { kind: 'noise', level: 0.12, decay: 0.06, tone: 5, q: 0.6 },
      // Continuous breath under the tone, held for as long as the note is.
      breath: 0.05,
      level: 0.85,
    },
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
