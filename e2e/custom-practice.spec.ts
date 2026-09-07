import { test, expect } from '@playwright/test';
import { gotoApp, openTab } from './helpers';

/**
 * Tools -> Custom Practice Builder. Every category header carried an
 * identically-named "Select All" control, and the header row itself is a
 * role=button that wraps it, so the selection could be toggled by the wrong
 * target. The counter badge next to each header is the observable result.
 */
test.describe('Tools / Custom Practice Builder', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await openTab(page, 'Tools');
    await page.getByRole('button', { name: '⚙️ Custom Practice' }).click();
    await expect(page.getByRole('dialog', { name: 'Custom Practice Builder' })).toBeVisible();
  });

  test('Select All selects every chord in the Basic category', async ({ page }) => {
    const selectAll = page.getByRole('button', { name: 'Select all Basic chords' });
    await expect(selectAll).toBeVisible();

    await selectAll.click({ timeout: 5000 });

    await expect(page.getByTestId('chord-count-Basic')).toHaveText('4/4');
    await expect(page.getByRole('heading', { name: 'Select Chords (4)' })).toBeVisible();
  });

  test('Select All toggles back to Deselect All and clears the category', async ({ page }) => {
    await page.getByRole('button', { name: 'Select all Basic chords' }).click();
    const deselect = page.getByRole('button', { name: 'Deselect all Basic chords' });
    await expect(deselect).toBeVisible();
    await deselect.click();
    await expect(page.getByTestId('chord-count-Basic')).toHaveText('0/4');
  });

  test('Select All is operable from the keyboard without expanding the category', async ({ page }) => {
    const selectAll = page.getByRole('button', { name: 'Select all Modes scales' });
    await selectAll.focus();
    await expect(selectAll).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('scale-count-Modes')).toHaveText('6/6');
    // The category header must not have swallowed the key event and expanded.
    await expect(page.getByRole('button', { name: 'Dorian', exact: true })).toHaveCount(0);
  });

  test('an individual topic toggles with pointer and keyboard', async ({ page }) => {
    await page.getByRole('button', { name: /^Basic chords, /  }).click();
    const major = page.getByRole('button', { name: 'Major', exact: true });
    await major.click();
    await expect(major).toHaveAttribute('aria-pressed', 'true');

    const minor = page.getByRole('button', { name: 'Minor', exact: true });
    await minor.focus();
    await page.keyboard.press('Enter');
    await expect(minor).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('chord-count-Basic')).toHaveText('2/4');
  });
});
