import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { addSessionToHistory, localDateKey, localDateKeyDaysAgo } from '../utils/storage';

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(cleanup);

  it('shows an empty state instead of invented history', () => {
    // The trend line, the activity heatmap and the improvement badge beside
    // the real accuracy number were all built from Math.random(), so a user
    // who had never played saw a full week of fabricated history — and it
    // reshuffled on every mount.
    render(<AnalyticsDashboard />);

    expect(screen.getByText(/No sessions in this range yet/)).toBeInTheDocument();
    // The improvement badge sits beside the real accuracy number and renders
    // only when there is a genuine change to report.
    expect(screen.queryByTestId('accuracy-improvement')).toBeNull();
  });

  it('renders the same numbers on every mount', () => {
    const first = render(<AnalyticsDashboard />).container.innerHTML;
    cleanup();
    const second = render(<AnalyticsDashboard />).container.innerHTML;
    expect(second).toBe(first);
  });

  it('counts real questions per day in the heatmap', () => {
    addSessionToHistory({
      date: localDateKey(),
      mode: 'chords',
      score: 0,
      totalQuestions: 12,
      correctAnswers: 9,
      accuracy: 75,
      duration: 60,
      xpEarned: 0,
      streak: 0,
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByTitle(new RegExp(`${localDateKey()}: 12 questions`))).toBeInTheDocument();
    expect(screen.getByTitle(new RegExp(`${localDateKeyDaysAgo(1)}: 0 questions`))).toBeInTheDocument();
  });

  it('widens the trend window when the range changes', () => {
    // The 7D / 30D / All buttons wrote timeRange and nothing ever read it.
    for (const daysAgo of [0, 20]) {
      addSessionToHistory({
        date: localDateKeyDaysAgo(daysAgo),
        mode: 'chords',
        score: 0,
        totalQuestions: 10,
        correctAnswers: 5,
        accuracy: 50,
        duration: 60,
        xpEarned: 0,
        streak: 0,
      });
    }

    render(<AnalyticsDashboard />);

    // A week only reaches the session from today.
    expect(screen.getByText(localDateKeyDaysAgo(6))).toBeInTheDocument();

    fireEvent.click(screen.getByText('30D'));
    expect(screen.getByText(localDateKeyDaysAgo(29))).toBeInTheDocument();
  });
});
