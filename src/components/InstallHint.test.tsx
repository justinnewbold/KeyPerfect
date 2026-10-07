// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1';

async function load() {
  vi.resetModules();
  return import('./InstallHint');
}

describe('InstallHint', () => {
  let originalUA: string;

  beforeEach(() => {
    originalUA = navigator.userAgent;
    localStorage.clear();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
    cleanup();
  });

  it('stays hidden until the third Safari visit, then shows', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: IPHONE_SAFARI, configurable: true });
    const { shouldShowInstallHint } = await load();
    expect(shouldShowInstallHint()).toBe(false);
    expect(shouldShowInstallHint()).toBe(false);
    expect(shouldShowInstallHint()).toBe(true);
  });

  it('never shows in other iOS browsers, elsewhere, or once installed', async () => {
    const { shouldShowInstallHint } = await load();
    localStorage.setItem('keyperfect_install_hint_opens', '10');

    Object.defineProperty(navigator, 'userAgent', { value: IPHONE_CHROME, configurable: true });
    expect(shouldShowInstallHint()).toBe(false);

    Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130', configurable: true });
    expect(shouldShowInstallHint()).toBe(false);

    Object.defineProperty(navigator, 'userAgent', { value: IPHONE_SAFARI, configurable: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    expect(shouldShowInstallHint()).toBe(false);
  });

  it('renders the instructions and dismissing is permanent', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: IPHONE_SAFARI, configurable: true });
    localStorage.setItem('keyperfect_install_hint_opens', '5');
    const { InstallHint, shouldShowInstallHint } = await load();

    render(<InstallHint />);
    expect(await screen.findByText(/Add KeyPerfect to your Home Screen/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss install hint' }));
    expect(screen.queryByTestId('install-hint')).toBeNull();
    expect(shouldShowInstallHint()).toBe(false);
  });
});
