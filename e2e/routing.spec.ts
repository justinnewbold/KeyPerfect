import { test, expect } from '@playwright/test';
import { gotoApp, openTab } from './helpers';

/**
 * Deep-link and refresh behaviour. Before this the app held its screen in
 * React state alone: a refresh, a shared link or the browser's Back button
 * all dropped the player on Home.
 */
test.describe('Deep links and refresh', () => {
  test('the URL follows the screen', async ({ page }) => {
    await gotoApp(page);
    await openTab(page, 'Tools');
    await expect(page).toHaveURL(/#\/tools$/);

    await openTab(page, 'Learn');
    await expect(page).toHaveURL(/#\/learn$/);
  });

  test('a refresh reopens the same screen', async ({ page }) => {
    await gotoApp(page);
    await openTab(page, 'Tools');
    await expect(page.getByRole('heading', { name: 'Music Tools' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Music Tools' })).toBeVisible();
  });

  test('a pasted deep link opens that screen directly', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('keyperfect_tutorial_completed', 'true'));
    await page.goto('/#/circle-of-fifths');
    // The Circle of Fifths *game*, which nothing on Home links to directly.
    await expect(page.getByRole('group', { name: 'Circle of fifths' })).toBeVisible();
  });

  test('Back walks through the app rather than leaving it', async ({ page }) => {
    await gotoApp(page);
    await openTab(page, 'Tools');
    await openTab(page, 'Stats');

    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Music Tools' })).toBeVisible();

    await page.goBack();
    await expect(page.getByRole('heading', { name: 'KeyPerfect' })).toBeVisible();
  });

  test('an unrecognised link lands on Home, not on a blank screen', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('keyperfect_tutorial_completed', 'true'));
    await page.goto('/#/not-a-real-screen');
    await expect(page.getByRole('heading', { name: 'KeyPerfect' })).toBeVisible();
  });

  test('a refresh mid-round lands on the ladder, not on a dead screen', async ({ page }) => {
    await gotoApp(page);
    await page.getByText(/^(Continue|Start) training$/).click();
    await expect(page.getByRole('button', { name: 'Exit session' })).toBeVisible();

    // A round in progress has no honest URL, so it shows its parent's.
    await expect(page).toHaveURL(/#\/play$/);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Exit session' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Select Level' })).toBeVisible();
  });
});
