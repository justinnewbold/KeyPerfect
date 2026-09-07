import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end coverage for the interaction bugs that unit tests cannot see:
 * overlay/stacking regressions and off-screen results only show up against a
 * real layout engine.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    // The CI image runs as root, where Chromium's sandbox cannot start.
    launchOptions: { args: ['--no-sandbox'] },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      // iPhone-class viewport: the one the fixed bottom nav overlaps.
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: false },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
