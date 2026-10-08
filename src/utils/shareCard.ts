/**
 * Shareable result card: a 1080x1350 PNG of a finished session, for the iOS
 * share sheet. Messages, Instagram and Photos all take an image where they
 * would show a block of text, and it reads like what native apps share.
 *
 * Rendered ahead of the tap (see ResultScreen): Safari only opens the share
 * sheet in direct response to a gesture, and drawing plus encoding the PNG
 * after the tap risks the activation running out before `navigator.share`.
 */
import type { GameResult } from '../types/gameModes';
import { generateShareText, modeDisplayName, shareResult } from './social';

const WIDTH = 1080;
const HEIGHT = 1350;
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw the card. Resolves to null where canvas is unavailable. */
export async function renderResultCard(result: GameResult): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    ctx = null;
  }
  if (!ctx) return null;

  // Background: the app's dark gradient with a soft glow.
  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, '#0f0c29');
  bg.addColorStop(0.55, '#302b63');
  bg.addColorStop(1, '#24243e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const glow = ctx.createRadialGradient(220, 160, 0, 220, 160, 700);
  glow.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
  glow.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Wordmark and mode.
  const brand = ctx.createLinearGradient(96, 0, 560, 0);
  brand.addColorStop(0, '#c084fc');
  brand.addColorStop(0.5, '#f472b6');
  brand.addColorStop(1, '#fb923c');
  ctx.fillStyle = brand;
  ctx.font = `700 76px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillText('KeyPerfect', 96, 180);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = `500 44px ${FONT}`;
  ctx.fillText(modeDisplayName(result.mode), 96, 250);

  // Headline accuracy.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 260px ${FONT}`;
  ctx.fillText(`${Math.round(result.accuracy)}%`, WIDTH / 2, 640);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = `500 44px ${FONT}`;
  ctx.fillText('accuracy', WIDTH / 2, 715);

  // Glass panel with three stats.
  const panelX = 96;
  const panelY = 820;
  const panelW = WIDTH - 192;
  const panelH = 300;
  roundRect(ctx, panelX, panelY, panelW, panelH, 48);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const stats: [string, string][] = [
    [`${result.correctAnswers}/${result.totalQuestions}`, 'correct'],
    [String(result.longestStreak), 'best streak'],
    [String(result.score), 'score'],
  ];
  const col = panelW / stats.length;
  stats.forEach(([value, label], i) => {
    const cx = panelX + col * i + col / 2;
    ctx!.fillStyle = '#ffffff';
    ctx!.font = `700 84px ${FONT}`;
    ctx!.fillText(value, cx, panelY + 160);
    ctx!.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx!.font = `500 36px ${FONT}`;
    ctx!.fillText(label, cx, panelY + 225);
  });

  // Footer.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = `500 36px ${FONT}`;
  const host = typeof window !== 'undefined' ? window.location.host : '';
  ctx.fillText(host ? `Ear training · ${host}` : 'Ear training with KeyPerfect', WIDTH / 2, 1250);

  return new Promise(resolve => {
    try {
      canvas.toBlob(blob => resolve(blob), 'image/png');
    } catch {
      resolve(null);
    }
  });
}

export function resultCardFile(blob: Blob): File {
  return new File([blob], 'keyperfect-result.png', { type: 'image/png' });
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled';

/**
 * Share the card image with the text alongside it when the platform takes
 * files (iOS and Android share sheets do), otherwise fall back to the text
 * share or clipboard copy the app already had.
 */
export async function shareResultCard(result: GameResult, card: File | null): Promise<ShareOutcome> {
  const text = generateShareText(result);
  if (card && typeof navigator.share === 'function' && navigator.canShare?.({ files: [card] })) {
    try {
      await navigator.share({ files: [card], text, title: 'KeyPerfect result' });
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled';
      // Fall through to the text share.
    }
  }
  const ok = await shareResult(result);
  if (!ok) return 'cancelled';
  return typeof navigator.share === 'function' ? 'shared' : 'copied';
}
