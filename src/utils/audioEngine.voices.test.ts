import { describe, it, expect, beforeEach } from 'vitest';
import { INSTRUMENTS, InstrumentType, getInstrumentList } from '../types/instruments';
import { playNote, midiToFrequency } from './audioEngine';

/**
 * What a synthesised note is made of.
 *
 * These assert the *structure* of the voice graph — that a struck instrument
 * has no sustain plateau, that brightness is derived from the note's own
 * frequency, that the distorted instrument is actually distorted. What any of
 * it sounds like is not something a mocked AudioContext can answer; that is
 * checked by rendering the engine through a real Web Audio implementation
 * offline and measuring the samples.
 */

type MockParam = { value: number; events: [string, number, number][] };
type MockCtx = { nodes: Record<string, Record<string, unknown>[]> };

/** The single AudioContext the engine holds, with the nodes it has created. */
function ctx(): MockCtx {
  return (globalThis as unknown as { __kpAudioContext: MockCtx }).__kpAudioContext;
}

const PITCHED = getInstrumentList()
  .map(i => i.id)
  .filter(id => id !== 'drums');

describe('instrument voice specs', () => {
  it('gives every instrument a voice', () => {
    for (const instrument of getInstrumentList()) {
      expect(instrument.voice, instrument.id).toBeDefined();
      expect(instrument.voice.partials.length, instrument.id).toBeGreaterThan(0);
    }
  });

  it('leads every spectrum with a non-zero partial', () => {
    // A partial table whose entries are all zero would be silence, and one
    // that starts at zero has no fundamental to be in tune with.
    for (const id of PITCHED) {
      const { partials } = INSTRUMENTS[id as InstrumentType].voice;
      expect(Math.max(...partials), id).toBeGreaterThan(0);
      expect(partials[0], id).toBeGreaterThan(0);
    }
  });

  it('gives struck and plucked instruments a decay rather than a sustain', () => {
    // The old engine held piano, guitar and bass at a constant level for the
    // length of the note and then cut them off. Struck strings decay from the
    // moment they are struck; there is no plateau to hold.
    for (const id of ['piano', 'guitar', 'bass', 'electricPiano', 'cleanElectric'] as const) {
      const voice = INSTRUMENTS[id].voice;
      expect(voice.kind, id).toBe('decay');
      expect(voice.amp.decay, id).toBeGreaterThan(0);
      expect(voice.amp.sustain, id).toBeUndefined();
    }
  });

  it('gives bowed, blown and amplified instruments a sustain level', () => {
    for (const id of ['strings', 'cello', 'brass', 'woodwind', 'flute', 'vocal', 'organ', 'metalGuitar'] as const) {
      const voice = INSTRUMENTS[id].voice;
      expect(voice.kind, id).toBe('sustained');
      expect(voice.amp.sustain, id).toBeGreaterThan(0);
    }
  });

  it('keeps the clarinet on odd harmonics', () => {
    // A cylindrical pipe closed at one end suppresses the even harmonics, and
    // that hollow spectrum is the whole identity of the instrument.
    const { partials } = INSTRUMENTS.woodwind.voice;
    const odd = partials.filter((_, i) => i % 2 === 0);
    const even = partials.filter((_, i) => i % 2 === 1);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(odd)).toBeGreaterThan(mean(even) * 5);
  });

  it('actually distorts the instrument named for its distortion', () => {
    // The metal guitar previously had no waveshaping at all — it was three
    // plain oscillators with a lowpass on them.
    expect(INSTRUMENTS.metalGuitar.voice.drive ?? 0).toBeGreaterThan(0.5);
  });
});

describe('playNote graph', () => {
  beforeEach(() => {
    // The engine keeps one AudioContext for the life of the module, so clear
    // its record between tests rather than trying to replace it.
    playNote(60, 'piano', 0.1, 0.5).stop();
    ctx().nodes = {};
  });

  function build(instrument: InstrumentType, midi = 60, velocity = 0.7) {
    ctx().nodes = {};
    const handle = playNote(midi, instrument, 1, velocity);
    return { handle, nodes: ctx().nodes };
  }

  it('renders a note for every instrument without throwing', () => {
    for (const id of getInstrumentList().map(i => i.id)) {
      expect(() => playNote(60, id, 1, 0.7).stop(), id).not.toThrow();
    }
  });

  it('scales the brightness filter with the pitch of the note', () => {
    // The old engine used fixed cutoffs in Hz, so one lowpass had to serve a
    // low C2 (which kept seventy harmonics) and a high C6 (which kept four).
    const lowCutoffs = cutoffsFor('guitar', 36);
    const highCutoffs = cutoffsFor('guitar', 84);

    expect(lowCutoffs.length).toBeGreaterThan(0);
    expect(highCutoffs[0]).toBeGreaterThan(lowCutoffs[0] * 4);
  });

  it('opens the filter further for a harder-played note', () => {
    const soft = cutoffsFor('piano', 60, 0.2);
    const hard = cutoffsFor('piano', 60, 1);
    expect(hard[0]).toBeGreaterThan(soft[0]);
  });

  it('spreads unison voices symmetrically about the true pitch', () => {
    // Detuning a section upward would leave every note sharp.
    const { nodes } = build('strings');
    const detunes = (nodes.oscillator as { detune: MockParam }[])
      .map(o => o.detune.value)
      .filter(v => v !== 0);
    expect(detunes.length).toBeGreaterThan(1);
    const sum = detunes.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum)).toBeLessThan(0.001);
  });

  it('tunes the piano partials sharp, the way a stiff string sounds', () => {
    // Stiffness makes partial n sit above n times the fundamental. It is why
    // a piano is not an organ with a decay on it, and why piano tuners
    // stretch octaves.
    const { nodes } = build('piano', 60);
    const f0 = midiToFrequency(60);
    const freqs = (nodes.oscillator as { frequency: MockParam }[])
      .map(o => o.frequency.value)
      .sort((a, b) => a - b);

    const third = freqs[2];
    expect(third).toBeGreaterThan(f0 * 3);
    // Sharp, but only slightly — a wildly stretched partial is out of tune,
    // not resonant.
    expect(third).toBeLessThan(f0 * 3.05);
  });

  it('keeps every partial below the Nyquist frequency', () => {
    // A partial above half the sample rate aliases back down as an
    // inharmonic tone, which is audible as a metallic buzz on high notes.
    for (const id of PITCHED) {
      const { nodes } = build(id as InstrumentType, 96);
      const freqs = (nodes.oscillator as { frequency: MockParam }[]).map(o => o.frequency.value);
      for (const f of freqs) {
        expect(f, `${id} partial`).toBeLessThan(44100 / 2);
      }
    }
  });

  it('stops every source it started when the note is cut short', () => {
    const { handle, nodes } = build('piano');
    handle.stop();
    for (const osc of nodes.oscillator as { stop: { mock: { calls: unknown[] } } }[]) {
      expect(osc.stop.mock.calls.length).toBeGreaterThan(0);
    }
  });
});

/**
 * The starting cutoff of the brightness filter for one note.
 *
 * Identified by having a *scheduled* frequency: the brightness filter sweeps,
 * while the fixed bands around a transient or a body resonance are set once
 * and left alone.
 */
function cutoffsFor(instrument: InstrumentType, midi: number, velocity = 0.7): number[] {
  ctx().nodes = {};
  playNote(midi, instrument, 1, velocity);
  const filters = (ctx().nodes.filter ?? []) as unknown as { type: string; frequency: MockParam }[];
  return filters
    .filter(f => f.type === 'lowpass' && f.frequency.events.length > 0)
    .map(f => f.frequency.events.find(e => e[0] === 'set')![1]);
}
