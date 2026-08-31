import { vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { installPointerEventShims } from './pointerEvents';

// localStorage. This was four bare vi.fn()s, which cannot hold state: a write
// vanished and the next read returned null, so any test touching a screen that
// persists something saw a store that never remembered anything. Back it with
// a Map so reads and writes agree, and empty it between tests so files stay
// independent. It starts empty, which is what the old always-null stub gave.
const localStorageStore = new Map<string, string>();
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => (localStorageStore.has(key) ? localStorageStore.get(key)! : null),
    setItem: (key: string, value: string) => void localStorageStore.set(key, String(value)),
    removeItem: (key: string) => void localStorageStore.delete(key),
    clear: () => localStorageStore.clear(),
    key: (index: number) => Array.from(localStorageStore.keys())[index] ?? null,
    get length() {
      return localStorageStore.size;
    },
  },
});

/*
 * Mock AudioContext.
 *
 * Rich enough to let the synthesis engine build a complete voice graph — the
 * nodes record what was scheduled on them, so a test can assert the shape of
 * an envelope or the cutoff of a filter. It cannot tell you what anything
 * sounds like; that is checked by rendering through a real Web Audio
 * implementation offline, outside the test suite.
 */
function audioParam(initial = 0) {
  return {
    value: initial,
    /** Every scheduled change, in call order: [method, value, time]. */
    events: [] as [string, number, number][],
    setValueAtTime(v: number, t: number) {
      this.value = v;
      this.events.push(['set', v, t]);
      return this;
    },
    linearRampToValueAtTime(v: number, t: number) {
      this.value = v;
      this.events.push(['linear', v, t]);
      return this;
    },
    exponentialRampToValueAtTime(v: number, t: number) {
      this.value = v;
      this.events.push(['exponential', v, t]);
      return this;
    },
    setTargetAtTime(v: number, t: number) {
      this.events.push(['target', v, t]);
      return this;
    },
    cancelScheduledValues(t: number) {
      this.events.push(['cancel', 0, t]);
      return this;
    },
  };
}

class MockAudioContext {
  /** Every node this context has created, for assertions. */
  nodes: Record<string, unknown[]> = {};

  constructor() {
    // The engine holds one AudioContext for the life of the module, so a test
    // cannot reach it through the constructor. Publish the instance instead,
    // and let each test clear `nodes` so it sees only what it built.
    (globalThis as unknown as { __kpAudioContext: MockAudioContext }).__kpAudioContext = this;
  }

  private record<T>(kind: string, node: T): T {
    (this.nodes[kind] ||= []).push(node);
    return node;
  }

  createOscillator() {
    return this.record('oscillator', {
      type: 'sine' as OscillatorType,
      frequency: audioParam(440),
      detune: audioParam(0),
      periodicWave: null as unknown,
      setPeriodicWave(wave: unknown) {
        this.periodicWave = wave;
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    });
  }
  createGain() {
    return this.record('gain', {
      gain: audioParam(1),
      connect: vi.fn(),
      disconnect: vi.fn(),
    });
  }
  createBiquadFilter() {
    return this.record('filter', {
      type: 'lowpass' as BiquadFilterType,
      frequency: audioParam(1000),
      Q: audioParam(1),
      gain: audioParam(0),
      connect: vi.fn(),
      disconnect: vi.fn(),
    });
  }
  createWaveShaper() {
    return this.record('waveShaper', {
      curve: null as Float32Array | null,
      oversample: 'none',
      connect: vi.fn(),
      disconnect: vi.fn(),
    });
  }
  createBufferSource() {
    return this.record('bufferSource', {
      buffer: null as unknown,
      loop: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    });
  }
  createPeriodicWave(real: Float32Array, imag: Float32Array) {
    return this.record('periodicWave', { real, imag });
  }
  createDynamicsCompressor() {
    return {
      threshold: { value: -24 },
      knee: { value: 30 },
      ratio: { value: 12 },
      attack: { value: 0.003 },
      release: { value: 0.25 },
      connect: vi.fn(),
    };
  }
  createConvolver() {
    return {
      buffer: null,
      connect: vi.fn(),
    };
  }
  createAnalyser() {
    return {
      fftSize: 2048,
      getFloatTimeDomainData: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  createMediaStreamSource() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  createBuffer(channels = 1, length = 44100, sampleRate = 44100) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: (channel = 0) => data[channel],
    };
  }
  get currentTime() {
    return 0;
  }
  get sampleRate() {
    return 44100;
  }
  get destination() {
    return {};
  }
  get state() {
    return 'running';
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

Object.defineProperty(window, 'AudioContext', { value: MockAudioContext });

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
});

// jsdom implements none of these; anything touch- or motion-related needs them.
installPointerEventShims();

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageStore.clear();
});
