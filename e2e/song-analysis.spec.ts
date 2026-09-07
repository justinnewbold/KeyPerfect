import { test, expect } from '@playwright/test';
import { gotoApp, openTab } from './helpers';

/**
 * Tools -> Song Analysis. The result panel is the last block of a tall left
 * column inside the sheet's own scroller, so pressing Analyze used to leave
 * the answer rendered far below the fold with nothing on screen changing.
 */
test.describe('Tools / Song Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await openTab(page, 'Tools');
    await page.getByRole('button', { name: '🎼 Song Analysis' }).click();
    await expect(page.getByRole('dialog', { name: 'Song Analysis' })).toBeVisible();
  });

  test('results are scrolled into view after Analyze', async ({ page }) => {
    await page.getByRole('button', { name: /^Load Let It Be/ }).click();
    await page.getByRole('button', { name: 'Analyze progression' }).click();

    const result = page.getByTestId('analysis-result');
    await expect(result).toBeVisible();
    await expect(result).toContainText('Key Analysis');

    // "In the DOM" is not enough: the panel has to be inside the viewport.
    const box = (await result.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeLessThan(viewport.height);
  });

  test('too-short progressions get an explicit empty state, not silence', async ({ page }) => {
    await page.getByRole('button', { name: /^Add C Major/ }).click();
    await page.getByRole('button', { name: 'Analyze progression' }).click();

    const result = page.getByTestId('analysis-result');
    await expect(result).toBeVisible();
    await expect(result).toContainText('at least 2 chords');
  });

  test('the analysis panel announces itself to assistive tech', async ({ page }) => {
    await page.getByRole('button', { name: /^Load Autumn Leaves/ }).click();
    await page.getByRole('button', { name: 'Analyze progression' }).click();
    const result = page.getByTestId('analysis-result');
    await expect(result).toHaveAttribute('role', 'status');
    await expect(result).toHaveAttribute('aria-live', 'polite');
  });
});
