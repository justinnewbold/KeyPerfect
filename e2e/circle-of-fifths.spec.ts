import { test, expect } from '@playwright/test';
import { gotoApp, openTab } from './helpers';

/**
 * Learn -> Circle of 5ths. The wheel's note buttons are absolutely positioned
 * inside a relatively positioned box, and the "Circle of Fifths" caption used
 * to be a full-bleed `absolute inset-0` sibling painted after them, so it took
 * every click aimed at a note.
 */
test.describe('Learn / Circle of Fifths', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await openTab(page, 'Learn');
    await page.getByRole('button', { name: 'Circle of 5ths' }).click();
  });

  test('a note button is the hit target for a normal click', async ({ page }) => {
    const c = page.getByRole('button', { name: 'Play C major chord' });
    await expect(c).toBeVisible();

    // Fails with a timeout when an overlay covers the button: Playwright's
    // actionability check refuses to click an element that is not the topmost
    // node at its own centre point.
    await c.click({ timeout: 5000 });
    await expect(c).toHaveAttribute('aria-pressed', 'true');
  });

  test('every note on the wheel is the topmost element at its own centre', async ({ page }) => {
    const notes = page.getByRole('button', { name: /^Play .* major chord$/ });
    const count = await notes.count();
    expect(count).toBe(12);

    for (let i = 0; i < count; i++) {
      const note = notes.nth(i);
      const label = await note.getAttribute('aria-label');
      const box = (await note.boundingBox())!;
      const topmostIsSelf = await note.evaluate((el, b) => {
        const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        return el.contains(hit) || el === hit;
      }, box);
      expect(topmostIsSelf, `${label} is covered by an overlay`).toBe(true);
    }
  });

  test('a note is reachable and activatable from the keyboard', async ({ page }) => {
    const c = page.getByRole('button', { name: 'Play C major chord' });
    await c.focus();
    await expect(c).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(c).toHaveAttribute('aria-pressed', 'true');

    // Tab moves along the wheel rather than skipping out of it.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Play G major chord' })).toBeFocused();
  });
});
