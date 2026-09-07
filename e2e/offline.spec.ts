import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

/**
 * Offline, slow-link and blocked-audio messaging. All three were console.log
 * only, so the app either looked broken or silently did nothing.
 */
test.describe('Network and audio status', () => {
  test('says so when the connection drops, and that training still works', async ({ page, context }) => {
    await gotoApp(page);
    // Let the service worker take control so the copy is the reassuring one.
    await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 10_000 });

    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    const banner = page.getByTestId('status-banner-offline');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('offline');
    await expect(banner).toContainText('generated on your device');

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(banner).toHaveCount(0);
  });

  test('the offline banner can be dismissed', async ({ page, context }) => {
    await gotoApp(page);
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    const banner = page.getByTestId('status-banner-offline');
    await expect(banner).toBeVisible();
    await page.getByRole('button', { name: /^Dismiss/ }).click();
    await expect(banner).toHaveCount(0);
    await context.setOffline(false);
  });

  test('a cold start with no network still renders the app', async ({ page, context }) => {
    // Prime the cache, then reload with the network cut.
    await gotoApp(page);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 10_000 });

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Learn', exact: true })).toBeVisible();
    await context.setOffline(false);
  });

  test('offers a tap when the browser is blocking sound', async ({ page }) => {
    await gotoApp(page);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('keyperfect:audio-blocked')));

    const banner = page.getByTestId('status-banner-audio');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Sound is blocked');
    await expect(page.getByRole('button', { name: 'Enable sound' })).toBeVisible();

    // A real gesture resumes the context, and the banner retires itself.
    await page.getByRole('button', { name: 'Enable sound' }).click();
    await expect(banner).toHaveCount(0);
  });
});
