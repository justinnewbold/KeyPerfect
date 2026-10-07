import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, screen, fireEvent } from '@testing-library/react';

// The real audio engine builds oscillators on import-time singletons; none of
// this test touches sound.
vi.mock('./hooks/useAudio', () => ({
  useAudio: () => ({
    playChord: vi.fn(),
    playNote: vi.fn(),
    playScale: vi.fn(),
    playSuccess: vi.fn(),
    playError: vi.fn(),
    startNote: () => ({ stop: vi.fn() }),
    stopAll: vi.fn(),
  }),
}));

vi.mock('./utils/audioEngine', async importOriginal => ({
  ...(await importOriginal<typeof import('./utils/audioEngine')>()),
  playChord: vi.fn(),
}));

const { default: App } = await import('./App');

/**
 * The Settings screen was unreachable: AppState included 'settings',
 * handleNavigate handled it and renderScreen rendered it, but the bottom nav
 * has five tabs and nothing else in the app ever navigated there — so theme,
 * volume, instrument, accessibility and tutorial-replay were all dead.
 */
describe('reaching Settings from Home', () => {
  beforeEach(() => {
    // Skip the first-run tutorial, which otherwise renders instead of Home.
    window.localStorage.setItem('keyperfect_tutorial_completed', 'true');
  });

  afterEach(cleanup);

  // Settings is a lazily loaded chunk, so its heading arrives a tick after
  // the tap; `findBy` waits for it.
  it('opens Settings from the Home header', async () => {
    render(<App />);

    expect(screen.queryByRole('heading', { name: 'Settings' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('gets back to Home from Settings', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Back' }));

    expect(screen.queryByRole('heading', { name: 'Settings' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'KeyPerfect' })).toBeInTheDocument();
  });
});
