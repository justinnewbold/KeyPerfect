import { Page } from '@playwright/test';

/**
 * Land on Home as an anonymous returning user. The tutorial auto-opens for
 * first-time visitors, which would sit in front of every screen under test.
 */
export async function gotoApp(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('keyperfect_tutorial_completed', 'true');
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Learn', exact: true }).waitFor();
}

export async function openTab(page: Page, tab: 'Home' | 'Play' | 'Learn' | 'Tools' | 'Stats') {
  await page.getByRole('button', { name: tab, exact: true }).click();
}

/**
 * Scroll to the very bottom and stay there. `html { scroll-behavior: smooth }`
 * makes a single scrollTo an animation, so a naive scroll-then-measure reads a
 * position part-way down the page.
 */
export async function scrollToBottom(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
  });
  let previous = -1;
  for (let i = 0; i < 30; i++) {
    const y = await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      return window.scrollY;
    });
    if (y === previous) return;
    previous = y;
    await page.waitForTimeout(50);
  }
}
