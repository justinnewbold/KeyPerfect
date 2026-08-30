import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useSwipe, SwipeOptions } from './useSwipe';
import { fireSwipe } from '../test/pointerEvents';

function Harness({ inner, ...options }: SwipeOptions & { inner?: React.ReactNode }) {
  const { ref } = useSwipe<HTMLDivElement>(options);
  return (
    <div ref={ref} data-testid="surface">
      {inner ?? <span data-testid="child">content</span>}
    </div>
  );
}

describe('useSwipe', () => {
  beforeEach(() => {
    cleanup();
    // The edge gate is measured against the viewport width.
    Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true });
  });

  it('fires the matching direction callback on a horizontal flick', () => {
    const onSwipeLeft = vi.fn();
    const { getByTestId } = render(
      <Harness axis="horizontal" onSwipeLeft={onSwipeLeft} />,
    );
    fireSwipe(getByTestId('surface'), { from: { x: 300, y: 100 }, to: { x: 180, y: 105 } });
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });

  it('ignores mouse drags so desktop text selection never navigates', () => {
    const onSwipeLeft = vi.fn();
    const { getByTestId } = render(
      <Harness axis="horizontal" onSwipeLeft={onSwipeLeft} />,
    );
    fireSwipe(getByTestId('surface'), {
      from: { x: 300, y: 100 },
      to: { x: 180, y: 105 },
      pointerType: 'mouse',
    });
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('does not steal a swipe that starts inside a horizontal scroll strip', () => {
    const onSwipeLeft = vi.fn();
    const { getByTestId } = render(
      <Harness
        axis="horizontal"
        onSwipeLeft={onSwipeLeft}
        inner={
          <div className="flex overflow-x-auto">
            <button data-testid="tab">Tab</button>
          </div>
        }
      />,
    );
    fireSwipe(getByTestId('tab'), { from: { x: 300, y: 100 }, to: { x: 180, y: 105 } });
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('ignores a vertical drag when constrained to the horizontal axis', () => {
    const onSwipe = vi.fn();
    const { getByTestId } = render(<Harness axis="horizontal" onSwipe={onSwipe} />);
    fireSwipe(getByTestId('surface'), { from: { x: 200, y: 300 }, to: { x: 205, y: 120 } });
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('does not fire when disabled', () => {
    const onSwipeLeft = vi.fn();
    const { getByTestId } = render(
      <Harness axis="horizontal" enabled={false} onSwipeLeft={onSwipeLeft} />,
    );
    fireSwipe(getByTestId('surface'), { from: { x: 300, y: 100 }, to: { x: 180, y: 105 } });
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('honours a shouldStart veto', () => {
    const onSwipeDown = vi.fn();
    const { getByTestId } = render(
      <Harness axis="vertical" onSwipeDown={onSwipeDown} shouldStart={() => false} />,
    );
    fireSwipe(getByTestId('surface'), { from: { x: 200, y: 100 }, to: { x: 205, y: 260 } });
    expect(onSwipeDown).not.toHaveBeenCalled();
  });

  describe('edgeOnly', () => {
    it('recognises a swipe that begins at the screen edge', () => {
      const onSwipeRight = vi.fn();
      const { getByTestId } = render(
        <Harness axis="horizontal" edgeOnly onSwipeRight={onSwipeRight} />,
      );
      fireSwipe(getByTestId('surface'), { from: { x: 8, y: 100 }, to: { x: 140, y: 104 } });
      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('ignores the same swipe started mid-screen', () => {
      const onSwipeRight = vi.fn();
      const { getByTestId } = render(
        <Harness axis="horizontal" edgeOnly onSwipeRight={onSwipeRight} />,
      );
      fireSwipe(getByTestId('surface'), { from: { x: 200, y: 100 }, to: { x: 332, y: 104 } });
      expect(onSwipeRight).not.toHaveBeenCalled();
    });
  });
});
