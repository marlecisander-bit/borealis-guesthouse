import { expect, test, type Page, type TestInfo } from '@playwright/test';

const publicRoutes = ['/', '/rooms', '/experiences', '/book'];

async function expectHeaderAtViewportTop(page: Page) {
  const header = page.locator('[data-public-header]');
  await expect(header).toBeVisible();
  await expect(header).toHaveCSS('position', 'fixed');
  const box = await header.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeLessThanOrEqual(1);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('public header remains accessible across pages and scroll positions', async ({ page }, testInfo: TestInfo) => {
  const desktop = testInfo.project.name.startsWith('desktop-');

  for (const route of publicRoutes) {
    await page.goto(route);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });

    const desktopNavigation = page.locator('[data-desktop-navigation]');
    const menuToggle = page.locator('[data-mobile-menu-toggle]');
    if (desktop) {
      await expect(desktopNavigation).toBeVisible();
      await expect(menuToggle).toBeHidden();
      await expect(desktopNavigation.getByRole('link')).toHaveCount(8);
    } else {
      await expect(desktopNavigation).toBeHidden();
      await expect(menuToggle).toBeVisible();
      await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
    }

    await expectHeaderAtViewportTop(page);
    await expectNoHorizontalOverflow(page);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expectHeaderAtViewportTop(page);
    await expectNoHorizontalOverflow(page);

    if (!desktop) {
      await menuToggle.click();
      const mobileMenu = page.locator('#mobile-menu');
      const drawerClose = mobileMenu.getByRole('button', { name: 'Close menu' });
      await expect(mobileMenu).toHaveAttribute('aria-hidden', 'false');
      await expect(drawerClose).toBeVisible();
      await drawerClose.click();
      await expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');
    }
  }
});

test('solid-page header spacer prevents content overlap', async ({ page }) => {
  await page.goto('/rooms');
  const headerBox = await page.locator('[data-public-header]').boundingBox();
  const mainBox = await page.locator('main').boundingBox();
  expect(headerBox).not.toBeNull();
  expect(mainBox).not.toBeNull();
  expect(mainBox!.y).toBeGreaterThanOrEqual(headerBox!.height - 1);
});
