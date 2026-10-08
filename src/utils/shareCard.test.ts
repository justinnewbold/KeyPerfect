// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderResultCard, shareResultCard, resultCardFile } from './shareCard';
import type { GameResult } from '../types/gameModes';

const result: GameResult = {
  mode: 'chords',
  level: 1,
  score: 420,
  totalQuestions: 20,
  plannedQuestions: 20,
  completed: true,
  correctAnswers: 18,
  accuracy: 90,
  totalXPEarned: 120,
  achievementXP: 0,
  longestStreak: 9,
  totalTime: 300,
  averageResponseTime: 2.1,
  newAchievements: [],
  answers: [],
  categoryBreakdown: [],
};

function clearShare() {
  delete (navigator as unknown as Record<string, unknown>).share;
  delete (navigator as unknown as Record<string, unknown>).canShare;
}

describe('shareCard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearShare();
  });

  it('returns null where there is no 2d canvas', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(await renderResultCard(result)).toBeNull();
  });

  it('shares the image with text when the platform accepts files', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: vi.fn(() => true), configurable: true });
    const file = resultCardFile(new Blob(['png'], { type: 'image/png' }));

    expect(await shareResultCard(result, file)).toBe('shared');
    expect(share).toHaveBeenCalledTimes(1);
    const payload = share.mock.calls[0][0];
    expect(payload.files).toEqual([file]);
    expect(payload.text).toContain('Accuracy: 90%');
  });

  it('reports a dismissed share sheet as cancelled, not as a failure to fall back from', async () => {
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    const share = vi.fn().mockRejectedValue(abort);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: vi.fn(() => true), configurable: true });
    const file = resultCardFile(new Blob(['png'], { type: 'image/png' }));

    expect(await shareResultCard(result, file)).toBe('cancelled');
    expect(share).toHaveBeenCalledTimes(1);
  });

  it('copies the text when there is no share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    expect(await shareResultCard(result, null)).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('KeyPerfect'));
  });
});
