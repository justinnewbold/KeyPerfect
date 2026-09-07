import { test, expect } from '@playwright/test';
import { gotoApp, scrollToBottom } from './helpers';

const WIDTHS = [320, 375, 390, 430];

/**
 * The bottom nav is `position: fixed`, so it sits over the end of every
 * scrollable screen unless the screen reserves its height. Scrolling to the
 * bottom is the worst case: that is where the reserve either exists or does not.
 */
test.describe('Fixed bottom nav clearance', () => {
  for (const width of WIDTHS) {
    test(`Settings content clears the nav at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await gotoApp(page);
      await page.getByRole('button', { name: 'Settings', exact: true }).first().click();
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

      await scrollToBottom(page);

      const navTop = (await page.getByRole('navigation').boundingBox())!.y;

      // Theme is the section the report called out, plus the last control on
      // the screen, which is what a missing bottom reserve actually eats.
      const themeButton = page.getByRole('button', { name: /^Theme: Purple/ });
      const themeBox = (await themeButton.boundingBox())!;
      expect(themeBox.y + themeBox.height, 'Theme control is under the nav').toBeLessThanOrEqual(navTop);

      const last = page.getByRole('button', { name: 'Reset All Data' });
      const lastBox = (await last.boundingBox())!;
      expect(lastBox.y + lastBox.height, 'last control is under the nav').toBeLessThanOrEqual(navTop);
    });
  }

  test('no horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await gotoApp(page);
    await page.getByRole('button', { name: 'Settings', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
