import { expect, test } from '@playwright/test';

test('Admin entry remains readable and free of page overflow', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

  const viewportWidth = page.viewportSize()?.width ?? 0;
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    root: document.documentElement.scrollWidth,
  }));
  expect(dimensions.body).toBeLessThanOrEqual(viewportWidth);
  expect(dimensions.root).toBeLessThanOrEqual(viewportWidth);

  for (const input of await page.locator('input').all()) {
    const styles = await input.evaluate((element) => {
      const computed = getComputedStyle(element);
      return { height: element.getBoundingClientRect().height, fontSize: Number.parseFloat(computed.fontSize) };
    });
    expect(styles.height).toBeGreaterThanOrEqual(44);
    expect(styles.fontSize).toBeGreaterThanOrEqual(16);
  }
  expect(consoleErrors).toEqual([]);
});
