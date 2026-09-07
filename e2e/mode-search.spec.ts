import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

/**
 * Home's catalogue runs to about thirty tiles under five headings. Grouping
 * alone stops helping once you know the name of what you want, so the list is
 * searchable — and a heading whose tiles are all filtered out goes with them.
 */
test.describe('Home / mode search', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: /all modes/i }).click();
    await expect(page.getByRole('heading', { name: 'Training Modes' })).toBeVisible();
  });

  test('opens on one primary call to action, not the whole wall', async ({ page }) => {
    await page.reload();
    await expect(page.getByText(/^(Continue|Start) training$/)).toBeVisible();
  });

  test('filters tiles and drops the headings they leave empty', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search training modes' }).fill('circle');

    await expect(page.getByRole('heading', { name: 'Circle of 5ths' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Challenge Modes' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Quick Start' })).toHaveCount(0);
  });

  test('searches by difficulty and by length, not just by name', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: 'Search training modes' });

    await search.fill('beginner');
    await expect(page.getByRole('heading', { name: 'Guided Lessons' })).toBeVisible();

    await search.fill('timed');
    await expect(page.getByRole('heading', { name: 'Time Attack' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Free Play' })).toHaveCount(0);
  });

  test('says so when nothing matches, and offers a way back', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search training modes' }).fill('bagpipes');

    await expect(page.getByText(/No modes match/)).toBeVisible();
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page.getByRole('heading', { name: 'Training Modes' })).toBeVisible();
  });
});
