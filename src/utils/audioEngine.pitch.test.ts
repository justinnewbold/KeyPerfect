import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPitchDetector } from './audioEngine';

/** A MediaStream whose tracks record whether they were stopped. */
function fakeStream() {
  const track = { stop: vi.fn(), kind: 'audio' };
  return { stream: { getTracks: () => [track] } as unknown as MediaStream, track };
}

describe('createPitchDetector', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  it('releases the microphone on stop', async () => {
    const { stream, track } = fakeStream();
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream);

    const detector = createPitchDetector(() => {});
    await detector.start();
    expect(track.stop).not.toHaveBeenCalled();

    detector.stop();
    expect(track.stop).toHaveBeenCalled();
  });

  it('releases the previous microphone stream when started again', async () => {
    // start() used to overwrite mediaStream without releasing the old one, so
    // a re-entrant start orphaned a live MediaStream: its tracks were never
    // stopped, which leaves the browser's mic indicator lit for the rest of
    // the session, and its requestAnimationFrame loop ran on forever.
    const first = fakeStream();
    const second = fakeStream();
    vi.spyOn(navigator.mediaDevices, 'getUserMedia')
      .mockResolvedValueOnce(first.stream)
      .mockResolvedValueOnce(second.stream);

    const detector = createPitchDetector(() => {});
    await detector.start();
    await detector.start();

    expect(first.track.stop).toHaveBeenCalled();
    expect(second.track.stop).not.toHaveBeenCalled();

    detector.stop();
    expect(second.track.stop).toHaveBeenCalled();
  });

  it('cancels the detection loop on stop', async () => {
    const { stream } = fakeStream();
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream);

    const detector = createPitchDetector(() => {});
    await detector.start();
    detector.stop();

    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});
