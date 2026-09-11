import { expect, test, type Page, type TestInfo } from '@playwright/test';

const representativeProjects = new Set(['desktop-1440x900', 'mobile-390x844']);

function runOnRepresentativeViewports(testInfo: TestInfo) {
  test.skip(!representativeProjects.has(testInfo.project.name), 'Covered on one desktop and one narrow mobile viewport.');
}

function dateLabel(date: Date) {
  return date.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

function futureDate(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('header Book now responds immediately and reaches the prefetched booking route', async ({ page }, testInfo) => {
  runOnRepresentativeViewports(testInfo);
  await page.route('**/book**', async route => {
    if (new URL(route.request().url()).pathname === '/book') await new Promise(resolve => setTimeout(resolve, 700));
    await route.continue();
  });
  await page.goto('/rooms');
  const cta = page.locator('[data-public-header] [data-booking-link][href="/book"]').first();
  await expect(cta).toBeVisible();
  await expect(cta).toHaveCSS('background-color', 'rgb(36, 82, 62)');
  await cta.click();
  await expect(cta.locator('[aria-busy="true"]')).toBeVisible();
  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByRole('heading', { name:'Your Koman stay, made simple.' })).toBeVisible();
  if (testInfo.project.name === 'desktop-1440x900') {
    await expect(page.getByText('Booking summary', { exact:true }).locator('..')).toHaveCSS('background-color', 'rgb(36, 82, 62)');
  }
  await expectNoHorizontalOverflow(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/rooms$/);
  await expect(cta).toBeVisible();
  await expect(cta.locator('[aria-busy="true"]')).toHaveCount(0);
});

test('homepage criteria use client navigation and remain pre-populated on /book', async ({ page }, testInfo) => {
  runOnRepresentativeViewports(testInfo);
  const checkIn = futureDate(7);
  const checkOut = futureDate(9);
  await page.goto('/');
  const search = page.getByRole('form', { name:'Check room availability' });
  await search.getByRole('button', { name:/^Check-in,/ }).click();
  await page.getByRole('button', { name:dateLabel(checkIn), exact:true }).click();
  await page.getByRole('button', { name:dateLabel(checkOut), exact:true }).click();
  await search.getByLabel('Number of guests').selectOption('3');
  const submit = search.getByRole('button', { name:/Check availability/i });
  await submit.click();
  await expect(page).toHaveURL(new RegExp(`/book\\?checkIn=${checkIn.toISOString().slice(0,10)}&checkOut=${checkOut.toISOString().slice(0,10)}&guests=3`));
  await expect(page.getByRole('button', { name:/Check-in/ })).toContainText(checkIn.toLocaleDateString('en-GB'));
  await expectNoHorizontalOverflow(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  const restoredSubmit = page.getByRole('form', { name:'Check room availability' }).getByRole('button', { name:/Check availability/i });
  await expect(restoredSubmit).toBeVisible();
  await expect(restoredSubmit).not.toHaveAttribute('aria-busy', 'true');
});

test('room availability entry preserves its room selection', async ({ page }, testInfo) => {
  runOnRepresentativeViewports(testInfo);
  await page.goto('/rooms');
  const roomCta = page.locator('[data-booking-link][href^="/book?room="]').first();
  await expect(roomCta).toBeVisible();
  const href = await roomCta.getAttribute('href');
  await roomCta.click();
  await expect(page).toHaveURL(new RegExp(`${href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await page.goBack();
  await expect(roomCta).toBeVisible();
});
