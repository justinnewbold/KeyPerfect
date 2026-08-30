import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { useLongPress, LongPressOptions } from './useLongPress';
import { firePointer, type PointerInit } from '../test/pointerEvents';

// isPressing is React state, so every dispatch has to settle inside act().
type PointerType = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel';
function fire(el: Element, type: PointerType, init: PointerInit = {}) {
  act(() => {
    firePointer(el, type, init);
  });
}
function fireClick(el: Element) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

function Harness({ onClick, ...options }: LongPressOptions & { onClick?: () => void }) {
  const { ref, isPressing } = useLongPress<HTMLButtonElement>(options);
  return (
    <button ref={ref} data-testid="target" data-pressing={isPressing} onClick={onClick}>
      Answer
    </button>
  );
}

describe('useLongPress', () => {
  beforeEach(() => {
    cleanup();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires after the hold delay', () => {
    const onLongPress = vi.fn();
    const { getByTestId } = render(<Harness onLongPress={onLongPress} delay={500} />);
    const el = getByTestId('target');

    fire(el, 'pointerdown', { clientX: 10, clientY: 10 });
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when released early', () => {
    const onLongPress = vi.fn();
    const { getByTestId } = render(<Harness onLongPress={onLongPress} delay={500} />);
    const el = getByTestId('target');

    fire(el, 'pointerdown', { clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fire(el, 'pointerup', { clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('cancels once the finger moves, so scrolling never registers as a press', () => {
    const onLongPress = vi.fn();
    const onCancel = vi.fn();
    const { getByTestId } = render(
      <Harness onLongPress={onLongPress} onCancel={onCancel} delay={500} moveTolerance={10} />,
    );
    const el = getByTestId('target');

    fire(el, 'pointerdown', { clientX: 10, clientY: 10 });
    fire(el, 'pointermove', { clientX: 10, clientY: 60 });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it('tolerates a small jitter without cancelling', () => {
    const onLongPress = vi.fn();
    const { getByTestId } = render(
      <Harness onLongPress={onLongPress} delay={500} moveTolerance={10} />,
    );
    const el = getByTestId('target');

    fire(el, 'pointerdown', { clientX: 10, clientY: 10 });
    fire(el, 'pointermove', { clientX: 13, clientY: 12 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('cancels on pointercancel', () => {
    const onLongPress = vi.fn();
    const { getByTestId } = render(<Harness onLongPress={onLongPress} delay={500} />);
    const el = getByTestId('target');

    fire(el, 'pointerdown', { clientX: 10, clientY: 10 });
    fire(el, 'pointercancel', { clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('swallows the click that follows a completed press', () => {
    // Without this the same gesture would both preview the answer and submit it.
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const { getByTestId } = render(
      <Harness onLongPress={onLongPress} onClick={onClick} delay={500} />,
    );
    const el = getByTestId('target');

    fire(el, 'pointerdown', { clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fire(el, 'pointerup', { clientX: 10, clientY: 10 });
    fireClick(el);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('leaves an ordinary tap alone', () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const { getByTestId } = render(
      <Harness onLongPress={onLongPress} onClick={onClick} delay={500} />,
    );
    const el = getByTestId('target');

    fire(el, 'pointerdown', { clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(80);
    });
    fire(el, 'pointerup', { clientX: 10, clientY: 10 });
    fireClick(el);

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    const onLongPress = vi.fn();
    const { getByTestId } = render(
      <Harness onLongPress={onLongPress} delay={500} enabled={false} />,
    );
    fire(getByTestId('target'), 'pointerdown', { clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onLongPress).not.toHaveBeenCalled();
  });
});
