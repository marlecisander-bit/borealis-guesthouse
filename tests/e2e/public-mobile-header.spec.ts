import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const screenshotRoot = path.resolve('test-results/screenshots');

async function saveScreenshot(page: Page, testInfo: TestInfo, name: string) {
  const directory = path.join(screenshotRoot, testInfo.project.name);
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, `${name}.png`) });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectHeaderInsideViewport(page: Page) {
  const header = page.locator('[data-public-header]');
  await expect(header).toBeVisible();
  const box = await header.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
}

test('public mobile header remains stable through menu and scroll states', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-chromium', 'Mobile header behavior is covered by mobile and tablet projects.');
  const browserErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', error => browserErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.goto('/');
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await expect(page.locator('[data-public-header]')).toHaveAttribute('data-state', 'hero');
  const menuButton = page.getByRole('button', { name: 'Open menu' });
  await expect(menuButton).toBeVisible();
  await expectHeaderInsideViewport(page);
  await expectNoHorizontalOverflow(page);
  await saveScreenshot(page, testInfo, 'homepage-mobile-top');

  const topScroll = await page.evaluate(() => window.scrollY);
  await menuButton.click();
  const menu = page.locator('#mobile-menu');
  await expect(menu).toHaveAttribute('aria-hidden', 'false');
  await expect(menu).toHaveCSS('visibility', 'visible');
  await expect(menu.getByRole('button', { name: 'Close menu' })).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  expect(await page.evaluate(() => Number.parseFloat(document.body.style.top || '0'))).toBeCloseTo(-topScroll, 0);
  await expectNoHorizontalOverflow(page);
  await saveScreenshot(page, testInfo, 'mobile-menu-open');

  await menu.getByRole('button', { name: 'Close menu' }).click();
  await expect(menu).toHaveAttribute('aria-hidden', 'true');
  await expect(menu).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');

  await page.evaluate(() => window.scrollTo({ top: Math.min(700, document.documentElement.scrollHeight - window.innerHeight), behavior: 'instant' }));
  await expect(page.locator('[data-public-header]')).toHaveAttribute('data-state', 'scrolled');
  await expectHeaderInsideViewport(page);
  await expect(page.getByLabel('Borealis Guest House — Home').first()).toBeVisible();
  await expect(menuButton).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await saveScreenshot(page, testInfo, 'homepage-after-scroll');
  await saveScreenshot(page, testInfo, 'sticky-header-state');

  const scrolledPosition = await page.evaluate(() => window.scrollY);
  await menuButton.click();
  await expect(menu).toHaveAttribute('aria-hidden', 'false');
  await expect(menu).toHaveCSS('visibility', 'visible');
  expect(await page.evaluate(() => Number.parseFloat(document.body.style.top || '0'))).toBeCloseTo(-scrolledPosition, 0);
  await expectHeaderInsideViewport(page);
  await saveScreenshot(page, testInfo, 'menu-open-while-scrolled');
  await menu.getByRole('button', { name: 'Close menu' }).click();
  await expect(menu).toHaveCSS('visibility', 'hidden');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(scrolledPosition, -1);

  await page.getByLabel('Borealis Guest House — Home').first().click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
  await expect(page.locator('[data-public-header]')).toHaveAttribute('data-state', 'hero');
  await expectHeaderInsideViewport(page);
  expect(browserErrors, `Unexpected browser errors:\n${browserErrors.join('\n')}`).toEqual([]);
});
