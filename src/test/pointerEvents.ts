import { vi } from 'vitest';

// jsdom implements neither PointerEvent nor the pointer-capture methods, so
// anything driven by pointer events needs these installed before it can be
// tested at all.

export interface PointerInit extends MouseEventInit {
  pointerId?: number;
  pointerType?: string;
  isPrimary?: boolean;
}

export class MockPointerEvent extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly isPrimary: boolean;

  constructor(type: string, init: PointerInit = {}) {
    super(type, { bubbles: true, cancelable: true, ...init });
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? 'touch';
    this.isPrimary = init.isPrimary ?? true;
  }
}

/** Install the shims. Call once from the shared test setup. */
export function installPointerEventShims(): void {
  if (typeof window === 'undefined') return;

  if (typeof window.PointerEvent === 'undefined') {
    (window as unknown as { PointerEvent: unknown }).PointerEvent = MockPointerEvent;
    (globalThis as unknown as { PointerEvent: unknown }).PointerEvent = MockPointerEvent;
  }

  const proto = window.Element.prototype as unknown as Record<string, unknown>;
  if (typeof proto.setPointerCapture !== 'function') {
    proto.setPointerCapture = vi.fn();
    proto.releasePointerCapture = vi.fn();
    proto.hasPointerCapture = vi.fn(() => false);
  }
}

/**
 * Dispatch one pointer event. `timeStamp` is read-only on real events and
 * always 0 in jsdom, so it is defined explicitly -- the swipe classifier
 * divides by elapsed time and would otherwise see every gesture as instant.
 */
export function firePointer(
  target: EventTarget,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  init: PointerInit & { timeStamp?: number } = {},
): void {
  const { timeStamp, ...rest } = init;
  const event = new MockPointerEvent(type, rest);
  if (timeStamp !== undefined) {
    Object.defineProperty(event, 'timeStamp', { value: timeStamp, configurable: true });
  }
  target.dispatchEvent(event);
}

export interface SwipeSequenceOptions {
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Intermediate moves. Default 4. */
  steps?: number;
  /** Total elapsed time in ms. Default 200. */
  duration?: number;
  pointerType?: string;
  pointerId?: number;
  startTime?: number;
}

/** Drive a full down -> move* -> up gesture across `target`. */
export function fireSwipe(target: EventTarget, options: SwipeSequenceOptions): void {
  const {
    from,
    to,
    steps = 4,
    duration = 200,
    pointerType = 'touch',
    pointerId = 1,
    startTime = 1000,
  } = options;

  const common = { pointerType, pointerId, isPrimary: true };
  firePointer(target, 'pointerdown', {
    ...common,
    clientX: from.x,
    clientY: from.y,
    timeStamp: startTime,
  });

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    firePointer(target, 'pointermove', {
      ...common,
      clientX: from.x + (to.x - from.x) * t,
      clientY: from.y + (to.y - from.y) * t,
      timeStamp: startTime + duration * t,
    });
  }

  firePointer(target, 'pointerup', {
    ...common,
    clientX: to.x,
    clientY: to.y,
    timeStamp: startTime + duration,
  });
}
