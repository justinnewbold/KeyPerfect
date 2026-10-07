// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ensurePlaybackSession,
  installInterruptionRecovery,
  isPlaybackSessionReady,
  resetAudioSessionForTests,
} from './audioSession';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1';

describe('ensurePlaybackSession', () => {
  let originalUA: string;
  let play: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalUA = navigator.userAgent;
    play = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    resetAudioSessionForTests();
    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:silent', configurable: true });
    }
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
    vi.restoreAllMocks();
  });

  it('does nothing off Apple platforms', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (X11; Linux x86_64)', configurable: true });
    expect(await ensurePlaybackSession()).toBe(false);
    expect(play).not.toHaveBeenCalled();
  });

  it('plays one looping silent element on iPhone and remembers success', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: IPHONE_UA, configurable: true });
    expect(await ensurePlaybackSession()).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);
    expect(isPlaybackSessionReady()).toBe(true);
    // Idempotent: a second call does not create or play another element.
    expect(await ensurePlaybackSession()).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('retries quietly when play() is refused outside a gesture', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: IPHONE_UA, configurable: true });
    play.mockRejectedValueOnce(new Error('NotAllowedError'));
    expect(await ensurePlaybackSession()).toBe(false);
    expect(isPlaybackSessionReady()).toBe(false);
    expect(await ensurePlaybackSession()).toBe(true);
    expect(play).toHaveBeenCalledTimes(2);
  });
});

describe('installInterruptionRecovery', () => {
  function fakeContext(initial: string) {
    const target = new EventTarget();
    const ctx = Object.assign(target, {
      state: initial,
      resume: vi.fn(async () => {
        ctx.state = 'running';
      }),
    });
    return ctx;
  }

  beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('resumes a suspended context when the page becomes visible', async () => {
    const ctx = fakeContext('suspended');
    const onBlocked = vi.fn();
    const stop = installInterruptionRecovery(ctx as unknown as AudioContext, onBlocked);

    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    expect(onBlocked).toHaveBeenCalledWith(false);

    stop();
    ctx.state = 'suspended';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('waits out an iOS interruption and reports a refused resume as blocked', async () => {
    const ctx = fakeContext('interrupted');
    const onBlocked = vi.fn();
    const stop = installInterruptionRecovery(ctx as unknown as AudioContext, onBlocked);

    // Another app owns the session: no point fighting it.
    ctx.dispatchEvent(new Event('statechange'));
    expect(ctx.resume).not.toHaveBeenCalled();

    // Session handed back but still suspended, and resume is refused.
    ctx.state = 'suspended';
    ctx.resume.mockRejectedValueOnce(new Error('NotAllowedError'));
    ctx.dispatchEvent(new Event('statechange'));
    await Promise.resolve();
    await Promise.resolve();
    expect(onBlocked).toHaveBeenCalledWith(true);
    stop();
  });

  it('ignores running and closed contexts', () => {
    const ctx = fakeContext('running');
    const stop = installInterruptionRecovery(ctx as unknown as AudioContext, vi.fn());
    document.dispatchEvent(new Event('visibilitychange'));
    expect(ctx.resume).not.toHaveBeenCalled();
    stop();
  });
});
