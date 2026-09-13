import { expect, test } from '@playwright/test';

const targetProjects = new Set([
  'mobile-375x812', 'mobile-390x844', 'mobile-430x932',
  'desktop-1280x800', 'desktop-1440x900', 'desktop-1920x1080',
]);

test.setTimeout(120_000);

test('property map stays contained and provides a safe interactive or branded fallback state', async ({ page }, testInfo) => {
  test.skip(!targetProjects.has(testInfo.project.name), 'Covered at the requested mobile and desktop widths.');
  const response = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  expect(response?.ok()).toBeTruthy();
  const map = page.getByTestId('property-map').filter({visible:true});
  await expect(map).toBeVisible();
  const bounds = await map.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  expect(bounds!.height).toBeGreaterThanOrEqual(400);

  if (await map.getAttribute('data-map-state') === 'interactive') {
    await map.scrollIntoViewIfNeeded();
    await expect(map.locator('iframe[loading="lazy"]')).toHaveAttribute('src', /^https:\/\/www\.google\.com\/maps\?/);
    await expect(map.getByRole('link', { name: 'View on Google Maps' })).toHaveAttribute('rel', 'noopener noreferrer');
  } else {
    await expect(map.getByText('Location map coming soon')).toBeVisible();
    await expect(map.locator('iframe')).toHaveCount(0);
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
