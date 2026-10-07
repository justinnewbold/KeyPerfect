/**
 * iOS audio-session plumbing for Web Audio.
 *
 * Two things make a Web Audio app look broken on an iPhone:
 *
 * 1. The ringer switch. With the switch on silent, iOS puts the page in the
 *    "ambient" audio category, which mutes Web Audio entirely while HTML
 *    media elements keep playing. An ear-training app that goes silent on a
 *    muted phone looks dead. Playing a looping, silent <audio> element flips
 *    the session to "playback", and Web Audio comes through the switch after
 *    that. Safari only lets a media element start inside a user gesture, so
 *    this is attempted on every gesture-driven path (unblockAudio, the first
 *    note) and simply fails quietly until one lands.
 *
 * 2. Interruptions. A phone call, Siri or another app taking the audio
 *    session suspends the AudioContext (iOS reports a non-standard
 *    "interrupted" state). When the app comes back the context stays
 *    suspended until something resumes it. This resumes it when the page is
 *    visible again, and asks for a tap through the existing blocked-audio
 *    banner if that is not allowed.
 */
import { isApplePlatform } from './platform';

let silentLoop: HTMLAudioElement | null = null;
let playbackSessionReady = false;

/** 8 kHz mono 16-bit WAV of a tenth of a second of silence (~1.6 KB). */
function silentWavUrl(): string {
  const sampleRate = 8000;
  const samples = sampleRate / 10;
  const dataBytes = samples * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  ascii(36, 'data');
  view.setUint32(40, dataBytes, true);
  // Sample data is already zero: silence.
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

/**
 * Put the iOS audio session into playback mode so Web Audio ignores the
 * ringer switch. Safe to call often; does nothing off Apple platforms and
 * nothing once it has succeeded. Resolves true once playback mode is on.
 */
export async function ensurePlaybackSession(): Promise<boolean> {
  if (playbackSessionReady) return true;
  if (!isApplePlatform() || typeof Audio === 'undefined') return false;

  if (!silentLoop) {
    const audio = new Audio();
    audio.src = silentWavUrl();
    audio.loop = true;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    audio.setAttribute('x-webkit-airplay', 'deny');
    silentLoop = audio;
  }

  try {
    await silentLoop.play();
    playbackSessionReady = true;
    return true;
  } catch {
    // Not inside a user gesture yet; a later gesture-driven call will land.
    return false;
  }
}

export function isPlaybackSessionReady(): boolean {
  return playbackSessionReady;
}

type ResumableContext = Pick<AudioContext, 'state' | 'resume'> & EventTarget;

/**
 * Resume a context that the OS suspended behind the app's back. Returns a
 * function that removes the listeners. `onBlocked` is told when a resume is
 * refused, so the UI can ask for a tap.
 */
export function installInterruptionRecovery(
  ctx: ResumableContext,
  onBlocked: (blocked: boolean) => void,
): () => void {
  // Test doubles and very old engines expose no EventTarget on the context.
  if (typeof document === 'undefined' || typeof ctx.addEventListener !== 'function') return () => {};

  const tryResume = () => {
    const state = ctx.state as string;
    if (state === 'running' || state === 'closed') return;
    if (document.visibilityState !== 'visible') return;
    ctx
      .resume()
      .then(() => onBlocked((ctx.state as string) !== 'running'))
      .catch(() => onBlocked(true));
  };

  const onVisibility = () => tryResume();
  const onStateChange = () => {
    // "interrupted" is iOS-only and means another app owns the session. Once
    // the page is visible again a resume usually succeeds without a gesture.
    if ((ctx.state as string) === 'interrupted') return;
    tryResume();
  };

  document.addEventListener('visibilitychange', onVisibility);
  ctx.addEventListener('statechange', onStateChange);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    ctx.removeEventListener('statechange', onStateChange);
  };
}

/** Test hook: forget the cached element and state. */
export function resetAudioSessionForTests(): void {
  if (silentLoop) {
    silentLoop.pause();
    silentLoop = null;
  }
  playbackSessionReady = false;
}
