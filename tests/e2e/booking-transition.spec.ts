import { expect, test, type Page } from '@playwright/test';

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

async function heroGeometry(page: Page) {
  const hero = page.locator('[data-homepage-section="hero"] picture img');
  await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  return hero.evaluate((image: HTMLImageElement) => {
    const { x, y, width, height } = image.getBoundingClientRect();
    return {
      x, y, width, height,
      crop: getComputedStyle(image).objectPosition,
      source: image.currentSrc,
      scroll: window.scrollY,
    };
  });
}

test('the date dialog preserves the hero crop, scroll position and opener focus', async ({ page, browserName, isMobile }) => {
  await page.goto('/');
  if (browserName === 'chromium') {
    await page.addStyleTag({ content: 'html::-webkit-scrollbar { width: 15px } html::-webkit-scrollbar-thumb { background: #555 }' });
  }

  const opener = page.getByRole('button', { name: /^Check-in,/ });
  await expect(opener).toBeVisible();
  await opener.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const before = await heroGeometry(page);
  if (browserName === 'chromium' && !isMobile) {
    expect(await page.evaluate(() => innerWidth - document.documentElement.clientWidth)).toBeGreaterThan(0);
  }

  const dialog = page.getByRole('dialog', { name: 'Choose your stay dates' });
  await opener.click();
  await expect(dialog).toBeFocused();
  expect(await heroGeometry(page)).toEqual(before);
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close calendar' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await heroGeometry(page)).toEqual(before);
});

test('booking navigation keeps the source geometry until the booking shell takes over', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('[data-public-header] [data-booking-link][href="/book"]').first();
  await page.evaluate(() => window.scrollTo({ top: 150, behavior: 'instant' }));
  const before = await heroGeometry(page);
  await page.route(url => url.pathname === '/book', async route => {
    if (route.request().headers()['rsc']) await new Promise(resolve => setTimeout(resolve, 400));
    await route.continue();
  });

  const frames = await page.evaluateHandle(() => {
    const hero = document.querySelector('[data-homepage-section="hero"] picture img')!;
    const samples: number[][] = [];
    const capture = () => {
      if (!hero.isConnected) return;
      const { x, y, width, height } = hero.getBoundingClientRect();
      samples.push([x, y, width, height, scrollY]);
      requestAnimationFrame(capture);
    };
    capture();
    return samples;
  });
  await link.click();
  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByRole('heading', { name: 'Dates and guests' })).toBeVisible();
  await expect(page.locator('[data-booking-stage]')).toBeVisible();
  for (const sample of await frames.jsonValue()) {
    expect(sample).toEqual([before.x, before.y, before.width, before.height, before.scroll]);
  }
  await frames.dispose();

  await page.goBack();
  await expect(page.locator('[data-homepage-section="hero"]')).toBeVisible();
  await expect.poll(() => heroGeometry(page)).toEqual(before);
});
