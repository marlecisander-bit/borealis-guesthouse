import { expect, test, type Page, type TestInfo } from '@playwright/test';

const projects = new Set(['desktop-1440x900', 'tablet-768x1024', 'mobile-390x844']);
const staticRoutes = ['/', '/rooms', '/experiences', '/transfers', '/explore-koman', '/gallery', '/about', '/contact', '/book'];

// These routes intentionally read live Supabase content. Allow enough time for
// a complete route matrix when the remote development project is cold.
test.setTimeout(240_000);

async function expectHealthyPage(page: Page, route: string) {
  const response = await page.goto(route);
  expect(response?.ok(), `${route} should return a successful response`).toBeTruthy();
  await expect(page.locator('main').first()).toBeVisible();
  await expect(page.getByText('Build Error', { exact: true })).toHaveCount(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${route} should not overflow horizontally`).toBeLessThanOrEqual(1);
}

test('public Website Content routes stay healthy at representative breakpoints', async ({ page }, testInfo: TestInfo) => {
  test.skip(!projects.has(testInfo.project.name), 'Covered at representative desktop, tablet and mobile widths.');
  for (const route of staticRoutes) await expectHealthyPage(page, route);
});

test('domain detail pages remain connected to their domain modules', async ({ page }, testInfo: TestInfo) => {
  test.skip(!projects.has(testInfo.project.name), 'Covered at representative desktop, tablet and mobile widths.');
  for (const [landing, prefix] of [['/rooms', '/rooms/'], ['/experiences', '/experiences/'], ['/transfers', '/transfers/'], ['/explore-koman', '/explore-koman/']] as const) {
    await page.goto(landing);
    const link = page.locator(`a[href^="${prefix}"]`).first();
    if (await link.count()) {
      const href = await link.getAttribute('href');
      if (href) await expectHealthyPage(page, href);
    }
  }
});
