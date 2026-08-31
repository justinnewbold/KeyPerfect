import { InstrumentType, INSTRUMENTS, VoiceConfig } from '../types/instruments';

// Audio context singleton
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let reverbNode: ConvolverNode | null = null;
let reverbGain: GainNode | null = null;
let dryGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let analyserNode: AnalyserNode | null = null;

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

  // Dry/wet gain nodes for reverb mix
  dryGain = audioContext.createGain();
  dryGain.gain.value = 0.75;

  reverbGain = audioContext.createGain();
  reverbGain.gain.value = 0.25;

  // Create analyser for visualizer
  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 256;
  analyserNode.smoothingTimeConstant = 0.8;

  // Create reverb impulse (sets reverbNode)
  createReverbImpulse();

  // Connect chain: compressor -> dry/wet split -> masterGain -> analyser -> destination
  // Dry path: compressor -> dryGain -> masterGain
  compressor.connect(dryGain);
  dryGain.connect(masterGain);

  // Wet path: compressor -> reverbNode -> reverbGain -> masterGain
  if (reverbNode) {
    compressor.connect(reverbNode);
    reverbNode.connect(reverbGain);
    reverbGain.connect(masterGain);
  }

  masterGain.connect(analyserNode);
  analyserNode.connect(audioContext.destination);
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

export function getAnalyserNode(): AnalyserNode | null {
  return analyserNode;
}

export function setReverbMix(wet: number) {
  const clamped = Math.max(0, Math.min(1, wet));
  if (dryGain) dryGain.gain.value = 1 - clamped;
  if (reverbGain) reverbGain.gain.value = clamped;
}

// Convert MIDI note to frequency
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Create white noise buffer for percussion
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Middle C, the pitch every key-tracked number in a VoiceConfig is quoted at.
 */
const REFERENCE_FREQUENCY = 261.63;

/** An exponential ramp cannot reach zero, so decays land here and stop. */
const SILENCE = 0.0001;

/** Cached PeriodicWaves: building one per note would be wasteful. */
const waveCache = new Map<string, PeriodicWave>();

/** Cached noise, shared by every transient and breath bed. */
let noiseBuffer: AudioBuffer | null = null;

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    noiseBuffer = createNoiseBuffer(ctx, 2);
  }
  return noiseBuffer;
}

/**
 * One drum hit, chosen from the MIDI note.
 *
 * Kick below 45, snare and toms through the middle, cymbals above 70 — a
 * rough General MIDI shape, so a rhythm pattern played across a range lands
 * on different drums rather than one pitched blip.
 */
function playDrumHit(
  midi: number,
  velocity: number = 0.7
): { stop: () => void } {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const bus = ctx.createGain();
  bus.gain.value = 1;
  bus.connect(compressor!);

  const sources: (OscillatorNode | AudioBufferSourceNode)[] = [];
  let tail = 0.4;

  /** A band of noise with its own decay, the skin or the metal. */
  const addNoise = (
    type: BiquadFilterType,
    frequency: number,
    q: number,
    level: number,
    decay: number
  ) => {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    const band = ctx.createBiquadFilter();
    band.type = type;
    band.frequency.value = frequency;
    band.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.max(SILENCE, level * velocity), now);
    g.gain.exponentialRampToValueAtTime(SILENCE, now + decay);
    noise.connect(band);
    band.connect(g);
    g.connect(bus);
    noise.start(now);
    noise.stop(now + decay + 0.02);
    sources.push(noise);
  };

  /** A tuned body, optionally swept — the drum's pitch and its drop. */
  const addTone = (
    type: OscillatorType,
    from: number,
    to: number,
    level: number,
    decay: number,
    pitchTime = decay * 0.4
  ) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + pitchTime);
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.max(SILENCE, level * velocity), now);
    g.gain.exponentialRampToValueAtTime(SILENCE, now + decay);
    osc.connect(g);
    g.connect(bus);
    osc.start(now);
    osc.stop(now + decay + 0.02);
    sources.push(osc);
  };

  if (midi < 45) {
    // Kick: a fast pitch drop is the beater, the low sine is the shell.
    // The old version had the drop but no click, so it read as a soft thud
    // with nothing to cut through a mix.
    addTone('sine', 160, 45, 0.9, 0.45, 0.07);
    addNoise('bandpass', 1800, 1.2, 0.12, 0.02);
    tail = 0.5;
  } else if (midi < 60) {
    // Snare: two slightly detuned heads plus the wires underneath. Real
    // snares are tuned — a single noise burst is a hiss, not a drum.
    addTone('triangle', 210, 170, 0.5, 0.14);
    addTone('triangle', 320, 260, 0.3, 0.1);
    addNoise('highpass', 1400, 0.7, 0.75, 0.18);
    tail = 0.25;
  } else if (midi < 70) {
    // Toms: one tuned body per note, so a fill actually descends.
    const pitch = 180 * Math.pow(2, (65 - midi) / 12);
    addTone('sine', pitch * 1.3, pitch, 0.85, 0.5, 0.1);
    addNoise('bandpass', pitch * 4, 1, 0.1, 0.05);
    tail = 0.55;
  } else {
    /*
     * Cymbals: six square waves at deliberately non-integer ratios, run
     * through a highpass.
     *
     * White noise, which is what this used to be, is a "tss" — it has no
     * pitch content at all. A cymbal is metal ringing at a dense cluster of
     * unrelated frequencies, and that inharmonic cluster is what the ear
     * hears as metal rather than as static.
     */
    const open = midi > 74;
    const decay = open ? 0.55 : 0.09;
    const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
    const base = 40;
    ratios.forEach(ratio => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = base * ratio;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7000;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 10000;
      bp.Q.value = 0.6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(Math.max(SILENCE, 0.14 * velocity), now);
      g.gain.exponentialRampToValueAtTime(SILENCE, now + decay);
      osc.connect(bp);
      bp.connect(hp);
      hp.connect(g);
      g.connect(bus);
      osc.start(now);
      osc.stop(now + decay + 0.02);
      sources.push(osc);
    });
    addNoise('highpass', 9000, 0.7, 0.18, decay * 0.6);
    tail = decay + 0.1;
  }

  const soundHandle = {
    stop: () => {
      const t = ctx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0, t + 0.02);
      sources.forEach(source => {
        try {
          source.stop(t + 0.02);
        } catch {
          // Already stopped.
        }
      });
      activeSounds.delete(soundHandle);
    },
  };

  activeSounds.add(soundHandle);
  setTimeout(() => activeSounds.delete(soundHandle), tail * 1000 + 100);

  return soundHandle;
}

/**
 * The instrument's spectrum as a single wave.
 *
 * One oscillator plays the whole harmonic series this way, which is what lets
 * a chord of these voices stay affordable on a phone. `partials[i]` is the
 * amplitude of harmonic i+1, written into the imaginary terms so each starts
 * as a sine.
 */
function getPeriodicWave(ctx: AudioContext, instrument: InstrumentType, partials: number[]): PeriodicWave {
  const cached = waveCache.get(instrument);
  if (cached) return cached;

  const real = new Float32Array(partials.length + 1);
  const imag = new Float32Array(partials.length + 1);
  partials.forEach((amplitude, i) => {
    imag[i + 1] = amplitude;
  });

  // disableNormalization defaults to false, which scales every wave to the
  // same peak — that is what keeps instruments with wildly different partial
  // counts at comparable loudness.
  const wave = ctx.createPeriodicWave(real, imag);
  waveCache.set(instrument, wave);
  return wave;
}

/**
 * A soft-clipping curve for `drive`.
 *
 * tanh-shaped rather than hard clipping: a hard clip generates unlimited odd
 * harmonics that alias into ugly non-harmonic frequencies, which is what makes
 * naive web-audio distortion sound like a broken speaker instead of an amp.
 */
function makeDriveCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 1024;
  const curve = new Float32Array(new ArrayBuffer(samples * 4));
  // Map 0-1 onto a useful range of gain before the clipper.
  const k = 1 + amount * 60;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / (samples - 1) - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

/** Cutoff for `harmonics` above `frequency`, kept inside the usable band. */
function cutoffFor(ctx: AudioContext, frequency: number, harmonics: number): number {
  const nyquist = ctx.sampleRate / 2;
  return Math.min(nyquist * 0.95, Math.max(60, frequency * harmonics));
}

/**
 * Schedule the amplitude envelope and report when the note is finally silent.
 *
 * The two kinds are genuinely different physics rather than two presets:
 * a struck or plucked string is given its energy once and decays from that
 * instant, while a bowed, blown or amplified note is fed continuously and
 * holds until it is released.
 */
function scheduleAmplitude(
  gain: GainNode,
  voice: VoiceConfig,
  now: number,
  duration: number,
  peak: number,
  frequency: number
): number {
  const { attack, release } = voice.amp;
  const attackEnd = now + Math.max(0.001, attack);

  gain.gain.setValueAtTime(SILENCE, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(SILENCE, peak), attackEnd);

  if (voice.kind === 'decay') {
    // Higher strings are shorter and lighter, so they die away sooner. The
    // exponent is per octave above middle C.
    const octaves = Math.log2(frequency / REFERENCE_FREQUENCY);
    const keyTrack = voice.amp.decayKeyTrack ?? 0;
    const decayTime = Math.max(0.05, (voice.amp.decay ?? 1) * Math.pow(2, -keyTrack * octaves));

    // A continuous exponential fall from the attack peak: no plateau, ever.
    // Released early, the note is simply cut short — exactly what lifting a
    // finger off a piano key does.
    const naturalEnd = attackEnd + decayTime;
    const end = Math.min(naturalEnd, now + duration + release);
    // Where the natural decay would have reached by `end`, so a note cut
    // short leaves off at the level it had actually decayed to.
    const remaining = Math.max(SILENCE, peak * Math.pow(SILENCE / peak, (end - attackEnd) / decayTime));
    gain.gain.exponentialRampToValueAtTime(remaining, end);
    gain.gain.linearRampToValueAtTime(0, end + 0.01);
    return end + 0.01;
  }

  const sustain = Math.max(SILENCE, peak * (voice.amp.sustain ?? 0.8));
  const holdEnd = attackEnd + (voice.amp.hold ?? 0.1);
  const sustainEnd = Math.max(holdEnd, now + duration);
  gain.gain.exponentialRampToValueAtTime(sustain, holdEnd);
  gain.gain.setValueAtTime(sustain, sustainEnd);
  gain.gain.exponentialRampToValueAtTime(SILENCE, sustainEnd + release);
  gain.gain.linearRampToValueAtTime(0, sustainEnd + release + 0.01);
  return sustainEnd + release + 0.01;
}

/**
 * One playable note.
 *
 * The chain is: oscillators (plus any tine, transient and breath) into a
 * brightness filter that sweeps with the note, through any drive and body
 * resonances, into the amplitude envelope.
 */
export function playNote(
  midi: number,
  instrument: InstrumentType = 'piano',
  duration: number = 1,
  velocity: number = 0.7
): { stop: () => void } {
  // Percussion is not a pitched voice; see playDrumHit.
  if (instrument === 'drums') {
    return playDrumHit(midi, velocity);
  }

  const ctx = getAudioContext();
  const voice = INSTRUMENTS[instrument].voice;
  const frequency = midiToFrequency(midi);
  const now = ctx.currentTime;

  const sources: (OscillatorNode | AudioBufferSourceNode)[] = [];

  // --- Amplitude envelope, at the end of the chain ---------------------
  const ampGain = ctx.createGain();
  const peak = velocity * (voice.level ?? 1);
  const endTime = scheduleAmplitude(ampGain, voice, now, duration, peak, frequency);

  // --- Brightness filter, in harmonics so it tracks pitch ---------------
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = voice.brightness.q ?? 0.7;
  // Playing harder opens the filter. This is the single strongest cue that
  // an instrument is being played rather than triggered.
  const velocityOpen = (voice.brightness.velocity ?? 0) * velocity;
  const open = cutoffFor(ctx, frequency, voice.brightness.open + velocityOpen);
  const close = cutoffFor(ctx, frequency, voice.brightness.close + velocityOpen * 0.3);
  filter.frequency.setValueAtTime(open, now);
  filter.frequency.exponentialRampToValueAtTime(
    close,
    now + Math.max(0.01, voice.brightness.time)
  );

  // --- Voice output bus -------------------------------------------------
  // Everything the instrument produces meets here, before the filter.
  const voiceBus = ctx.createGain();
  voiceBus.gain.value = 1;

  // --- Vibrato, shared by every oscillator in the voice ------------------
  let vibratoDepth: GainNode | null = null;
  if (voice.vibrato) {
    const vibratoLFO = ctx.createOscillator();
    vibratoLFO.type = 'sine';
    vibratoLFO.frequency.value = voice.vibrato.rate;
    vibratoDepth = ctx.createGain();
    // Eased in rather than present from the first millisecond: players reach
    // for vibrato once a note is already sounding, and an instant wobble is
    // a giveaway that nobody is holding the instrument.
    vibratoDepth.gain.setValueAtTime(0, now);
    vibratoDepth.gain.linearRampToValueAtTime(
      voice.vibrato.cents,
      now + Math.max(0.001, voice.vibrato.onset)
    );
    vibratoLFO.connect(vibratoDepth);
    vibratoLFO.start(now);
    vibratoLFO.stop(endTime);
    sources.push(vibratoLFO);
  }

  /** Attach one oscillator to the bus, detuned and vibrato-linked. */
  const addOscillator = (osc: OscillatorNode, detuneCents: number, gainValue: number) => {
    osc.detune.value = detuneCents;
    if (vibratoDepth) vibratoDepth.connect(osc.detune);
    const g = ctx.createGain();
    g.gain.value = gainValue;
    osc.connect(g);
    g.connect(voiceBus);
    osc.start(now);
    osc.stop(endTime);
    sources.push(osc);
  };

  // --- The tone itself ---------------------------------------------------
  if (voice.inharmonicity) {
    /*
     * A stiff string, rendered partial by partial.
     *
     * Real strings resist bending, so partial n sits at n·f·sqrt(1 + B·n²) —
     * progressively sharper than a whole multiple — and the high partials
     * fade much faster than the low ones. Neither can be expressed in a
     * PeriodicWave, which is by definition perfectly harmonic and decays as
     * one. The extra oscillators are what make the piano sound struck.
     */
    const b = voice.inharmonicity;
    voice.partials.forEach((amplitude, i) => {
      if (amplitude <= 0) return;
      const n = i + 1;
      const partialFreq = frequency * n * Math.sqrt(1 + b * n * n);
      if (partialFreq > ctx.sampleRate * 0.45) return;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = partialFreq;

      const g = ctx.createGain();
      // Each partial gets its own decay: the nth dies roughly n times as
      // fast, which is the shape of a real string losing its high end within
      // the first second while the fundamental rings on.
      const partialDecay = Math.max(
        0.08,
        (voice.amp.decay ?? 1) / Math.pow(n, 0.8)
      );
      g.gain.setValueAtTime(amplitude, now);
      g.gain.exponentialRampToValueAtTime(
        SILENCE,
        Math.min(endTime, now + partialDecay)
      );

      if (vibratoDepth) vibratoDepth.connect(osc.detune);
      osc.connect(g);
      g.connect(voiceBus);
      osc.start(now);
      osc.stop(endTime);
      sources.push(osc);
    });
  } else {
    const wave = getPeriodicWave(ctx, instrument, voice.partials);
    const unison = voice.unison?.voices ?? 1;
    const spread = voice.unison?.cents ?? 0;
    for (let i = 0; i < unison; i++) {
      const osc = ctx.createOscillator();
      osc.setPeriodicWave(wave);
      osc.frequency.value = frequency;
      // Spread symmetrically about the true pitch so the note stays in tune.
      const offset = unison === 1 ? 0 : (i / (unison - 1) - 0.5) * 2 * spread;
      addOscillator(osc, offset, 1 / Math.sqrt(unison));
    }
  }

  // --- The Rhodes tine ---------------------------------------------------
  if (voice.fm) {
    const bell = ctx.createOscillator();
    bell.type = 'sine';
    bell.frequency.value = frequency * voice.fm.ratio;
    const bellGain = ctx.createGain();
    // Barks on the strike and is gone within a third of a second, leaving
    // the near-sine body behind. That contrast is the instrument.
    bellGain.gain.setValueAtTime(voice.fm.index * 0.1, now);
    bellGain.gain.exponentialRampToValueAtTime(
      SILENCE,
      Math.min(endTime, now + voice.fm.decay)
    );
    bell.connect(bellGain);
    bellGain.connect(voiceBus);
    bell.start(now);
    bell.stop(endTime);
    sources.push(bell);
  }

  // --- The noise of the instrument being set in motion -------------------
  /** Held so stop() can silence the transient, which bypasses ampGain. */
  let transientGain: GainNode | null = null;
  if (voice.transient) {
    const t = voice.transient;
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const band = ctx.createBiquadFilter();
    band.type = t.kind === 'thump' ? 'lowpass' : 'bandpass';
    band.frequency.value = cutoffFor(ctx, frequency, t.tone);
    band.Q.value = t.q ?? 1;

    const g = ctx.createGain();
    g.gain.setValueAtTime(t.level * velocity, now);
    g.gain.exponentialRampToValueAtTime(SILENCE, now + Math.max(0.002, t.decay));

    noise.connect(band);
    band.connect(g);
    /*
     * Straight out, past both the brightness filter and the amplitude
     * envelope.
     *
     * A pick click or a hammer thud is broadband, and it happens *before*
     * the note does — it must not be shaped by the string's decay, and in
     * particular must not be multiplied by the attack ramp. Routed through
     * the envelope, an 8 ms pick was being faded in over the note's first
     * 3 ms and arrived with its leading edge gone, which is most of the
     * click.
     */
    g.connect(compressor!);
    transientGain = g;
    noise.start(now);
    noise.stop(Math.min(endTime, now + t.decay + 0.05));
    sources.push(noise);
  }

  // --- Breath under the tone --------------------------------------------
  if (voice.breath) {
    const air = ctx.createBufferSource();
    air.buffer = getNoiseBuffer(ctx);
    air.loop = true;

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = cutoffFor(ctx, frequency, 2);
    band.Q.value = 0.8;

    const g = ctx.createGain();
    g.gain.value = voice.breath * velocity;

    air.connect(band);
    band.connect(g);
    g.connect(voiceBus);
    air.start(now);
    air.stop(endTime);
    sources.push(air);
  }

  // --- Wire the chain ----------------------------------------------------
  let tail: AudioNode = voiceBus;

  if (voice.drive && voice.drive > 0) {
    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDriveCurve(voice.drive);
    shaper.oversample = '4x';
    // Soft clipping raises the average level a lot, so pull the output back
    // to keep drive a timbre change rather than a volume change.
    const trim = ctx.createGain();
    trim.gain.value = 1 / (1 + voice.drive * 2);
    tail.connect(shaper);
    shaper.connect(trim);
    tail = trim;
  }

  tail.connect(filter);
  let afterFilter: AudioNode = filter;

  if (voice.formants && voice.formants.length > 0) {
    /*
     * Body resonances, in parallel with the plain signal rather than in
     * series. A peaking filter chain would colour everything; a parallel
     * bank adds the resonance the way a wooden box or a speaker cone does,
     * and leaves the direct sound intact underneath.
     */
    const sum = ctx.createGain();
    sum.gain.value = 1;
    afterFilter.connect(sum);
    for (const f of voice.formants) {
      const peakFilter = ctx.createBiquadFilter();
      peakFilter.type = 'bandpass';
      peakFilter.frequency.value = Math.min(ctx.sampleRate * 0.45, f.frequency);
      peakFilter.Q.value = f.q;
      const g = ctx.createGain();
      // `gain` is quoted in dB of emphasis; as a parallel send that is a
      // modest amount of extra signal, not a doubling.
      g.gain.value = Math.pow(10, f.gain / 20) * 0.12;
      afterFilter.connect(peakFilter);
      peakFilter.connect(g);
      g.connect(sum);
    }
    afterFilter = sum;
  }

  afterFilter.connect(ampGain);

  // --- Tremolo, after the envelope --------------------------------------
  let output: AudioNode = ampGain;
  if (voice.tremolo) {
    const tremGain = ctx.createGain();
    tremGain.gain.value = 1 - voice.tremolo.depth;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = voice.tremolo.rate;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = voice.tremolo.depth;
    lfo.connect(lfoDepth);
    lfoDepth.connect(tremGain.gain);
    lfo.start(now);
    lfo.stop(endTime);
    sources.push(lfo);
    ampGain.connect(tremGain);
    output = tremGain;
  }

  output.connect(compressor!);

  const soundHandle = {
    stop: () => {
      const t = ctx.currentTime;
      ampGain.gain.cancelScheduledValues(t);
      ampGain.gain.setValueAtTime(Math.max(SILENCE, ampGain.gain.value), t);
      ampGain.gain.linearRampToValueAtTime(0, t + 0.05);
      if (transientGain) {
        transientGain.gain.cancelScheduledValues(t);
        transientGain.gain.setValueAtTime(Math.max(SILENCE, transientGain.gain.value), t);
        transientGain.gain.linearRampToValueAtTime(0, t + 0.05);
      }
      sources.forEach(source => {
        try {
          source.stop(t + 0.05);
        } catch {
          // Already stopped.
        }
      });
      activeSounds.delete(soundHandle);
    },
  };

  activeSounds.add(soundHandle);
  setTimeout(() => activeSounds.delete(soundHandle), (endTime - now) * 1000);

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
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  let cancelled = false;

  midiNotes.forEach((midi, index) => {
    const delay = arpeggio ? index * arpeggioDelay : 0;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      const sound = playNote(midi, instrument, duration - delay, velocity);
      sounds.push(sound);
    }, delay * 1000);
    timeouts.push(timeout);
  });

  return {
    stop: () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      sounds.forEach(s => s.stop());
    },
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
/**
 * @param when AudioContext time to sound the click at. Defaults to now.
 *   The metronome passes a scheduled time: firing every click at
 *   `ctx.currentTime` quantised them to its 25ms scheduler tick, which is an
 *   audible flam on the one tool where timing is the whole product.
 */
export function playMetronomeClick(accent: boolean = false, when?: number) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = accent ? 1500 : 1000;
  osc.connect(gain);
  gain.connect(compressor!);

  // A time already in the past would be rejected by the param methods.
  const at = Math.max(when ?? ctx.currentTime, ctx.currentTime);
  gain.gain.setValueAtTime(accent ? 0.5 : 0.3, at);
  gain.gain.linearRampToValueAtTime(0, at + 0.05);

  osc.start(at);
  osc.stop(at + 0.05);
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

  function stop() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    analyser = null;
  }

  return {
    start: async () => {
      // Idempotent. start() used to overwrite mediaStream and analyser
      // without releasing the previous ones, so a second call orphaned a live
      // MediaStream — its tracks were never stopped, which leaves the
      // browser's microphone indicator lit for the rest of the session — and
      // left a second requestAnimationFrame loop running forever.
      stop();
      const ctx = getAudioContext();
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = ctx.createMediaStreamSource(mediaStream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      detect();
    },
    stop,
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
    reverbGain = null;
    dryGain = null;
    compressor = null;
    analyserNode = null;
  }
}
