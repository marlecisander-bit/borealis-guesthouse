import { expect, test } from '@playwright/test';

test('homepage Hero fits phone viewports and keeps booking controls usable', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  for (const [width, height] of [[320,568], [375,667], [390,844], [393,852], [430,932], [360,640], [412,915], [1440,900]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const hero = page.locator('[data-homepage-section="hero"]');
    const booking = hero.getByRole('form', { name: 'Check room availability' });
    await expect(booking).toBeVisible();
    await expect(hero.locator('h1')).toBeVisible();
    if (width < 768) {
      const box = (await hero.boundingBox())!;
      expect(box.y).toBe(0);
      expect(box.height).toBeCloseTo(height, 0);
      const intro = (await page.locator('[data-homepage-section="intro"]').boundingBox())!;
      expect(intro.y).toBeGreaterThanOrEqual(height);
      const header = (await page.locator('[data-public-header]').boundingBox())!;
      const copy = (await hero.locator('.hero-copy').boundingBox())!;
      expect(copy.y).toBeGreaterThanOrEqual(header.y + header.height);
      const card = (await booking.boundingBox())!;
      expect(copy.y + copy.height).toBeLessThanOrEqual(card.y);
      expect(card.y + card.height).toBeLessThanOrEqual(height - 15);
      for (const button of await booking.locator('button').all()) {
        const target = (await button.boundingBox())!;
        expect(target.height).toBeGreaterThanOrEqual(44);
        expect(target.x).toBeGreaterThanOrEqual(16);
        expect(target.x + target.width).toBeLessThanOrEqual(width - 16);
      }
      expect(await hero.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
    } else {
      expect((await hero.boundingBox())!.height).toBeCloseTo(height * .94, 0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`hero-${width}x${height}.png`) });
  }
  await page.setViewportSize({ width: 320, height: 568 });
  const hero = page.locator('[data-homepage-section="hero"]');
  await hero.getByRole('button', { name: /^Check-in,/ }).click();
  await expect(page.getByRole('dialog', { name: /dates|stay/i })).toBeVisible();
  await page.getByRole('button', { name: 'Close calendar' }).click();
  await hero.getByRole('button', { name: /^Guests/ }).click();
  await expect(page.getByRole('dialog', { name: 'Choose guests' })).toBeVisible();
  await page.getByRole('button', { name: 'Add adults', exact: true }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(hero.locator('input[name="adults"]')).toHaveValue('3');
  await page.evaluate(() => window.scrollTo({ top: innerHeight, behavior: 'instant' }));
  await expect(page.locator('[data-homepage-section="intro"]')).toBeInViewport();
});
