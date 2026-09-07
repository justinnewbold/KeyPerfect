import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gotoApp, openTab } from './helpers';

/**
 * Automated accessibility sweep over the screens this pass touched. Axe covers
 * the machine-checkable half of what a Lighthouse a11y run reports — names,
 * roles, contrast, landmark and form-label rules — on the real rendered page.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations.map(v => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.length,
    help: v.help,
    target: v.nodes[0]?.target?.join(' '),
  }));
}

test.describe('Accessibility', () => {
  test('Home has no serious or critical violations', async ({ page }) => {
    await gotoApp(page);
    expect(await scan(page)).toEqual([]);
  });

  test('the expanded mode catalogue is clean', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: /all modes/i }).click();
    expect(await scan(page)).toEqual([]);
  });

  test('Learn / Circle of Fifths is clean', async ({ page }) => {
    await gotoApp(page);
    await openTab(page, 'Learn');
    await page.getByRole('button', { name: 'Circle of 5ths' }).click();
    expect(await scan(page)).toEqual([]);
  });

  test('Tools / Metronome is clean', async ({ page }) => {
    await gotoApp(page);
    await openTab(page, 'Tools');
    expect(await scan(page)).toEqual([]);
  });

  test('Custom Practice Builder is clean', async ({ page }) => {
    await gotoApp(page);
    await openTab(page, 'Tools');
    await page.getByRole('button', { name: '⚙️ Custom Practice' }).click();
    await expect(page.getByRole('dialog', { name: 'Custom Practice Builder' })).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test('Song Analysis, including its result panel, is clean', async ({ page }) => {
    await gotoApp(page);
    await openTab(page, 'Tools');
    await page.getByRole('button', { name: '🎼 Song Analysis' }).click();
    await page.getByRole('button', { name: /^Load Let It Be/ }).click();
    await page.getByRole('button', { name: 'Analyze progression' }).click();
    await expect(page.getByTestId('analysis-result')).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test('Settings is clean', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Settings', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test('a training round is clean', async ({ page }) => {
    await gotoApp(page);
    await page.getByText(/^(Continue|Start) training$/).click();
    await expect(page.getByRole('button', { name: 'Exit session' })).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });
});
