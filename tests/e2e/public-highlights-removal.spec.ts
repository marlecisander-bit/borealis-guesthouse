import { expect, test, type TestInfo } from '@playwright/test';

const representativeProjects = new Set(['desktop-1440x900', 'mobile-390x844']);
const routes = ['/', '/rooms', '/book', '/experiences', '/about'];
const removedLabels = [
  'Lakefront location',
  'Breakfast included',
  'Private parking',
  'Local experiences',
  'Guest transfers',
];

test('the retired property highlight strip is absent from every public route', async ({ page }, testInfo: TestInfo) => {
  test.skip(!representativeProjects.has(testInfo.project.name), 'Covered on representative desktop and mobile widths.');

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('[aria-label="Property highlights"]')).toHaveCount(0);
    for (const label of removedLabels) await expect(page.getByText(label, { exact: true })).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test('the homepage introduction follows the hero without an orphaned wrapper', async ({ page }, testInfo: TestInfo) => {
  test.skip(!representativeProjects.has(testInfo.project.name), 'Covered on representative desktop and mobile widths.');
  await page.goto('/');
  const adjacentSection = await page.locator('[data-homepage-section="hero"]').evaluate(element =>
    element.nextElementSibling?.getAttribute('data-homepage-section'),
  );
  expect(adjacentSection).toBe('intro');
});
