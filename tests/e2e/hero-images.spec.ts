import { test, expect } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as heroConfig from '../../src/lib/hero-image-config';
const requireModule = createRequire(process.cwd() + '/package.json');
import ts from 'typescript';

// Compile with React's runtime; Playwright's default JSX transform targets component tests.
const compiled = ts.transpileModule(readFileSync('src/components/public/HeroImage.tsx', 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const componentModule = { exports: {} as { HeroImage: React.ComponentType<React.ComponentProps<typeof import('../../src/components/public/HeroImage').HeroImage>> } };
new Function('require', 'exports', compiled)((id: string) => id === '@/lib/hero-image-config' ? heroConfig : requireModule(id), componentModule.exports);
const { HeroImage } = componentModule.exports;

for (const { mobileImage, width } of [{ mobileImage: '/mobile.jpg' }, { mobileImage: undefined }, { mobileImage: '/mobile.jpg', width: 769 }]) {
  test(`Hero selects one image with ${mobileImage ? 'mobile composition' : 'desktop fallback'}${width ? ' at 769px' : ''}`, async ({ page }) => {
    if (width) await page.setViewportSize({ width, height: 900 });
    const requests: string[] = [];
    await page.route('http://hero.test/**', async route => {
      requests.push(decodeURIComponent(route.request().url()));
      await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="green"/></svg>' });
    });
    const markup = renderToStaticMarkup(createElement(HeroImage, { desktopImage: '/desktop.jpg', mobileImage, alt: 'Lake view' }));
    await page.setContent(`<meta name="viewport" content="width=device-width, initial-scale=1"><base href="http://hero.test/"><style>body{margin:0}.object-cover{object-fit:cover}section{position:relative;height:88vh}</style><section>${markup}</section>`);
    const image = page.getByRole('img', { name: 'Lake view' });
    await expect(image).toHaveJSProperty('complete', true);
    const expected = mobileImage && page.viewportSize()!.width <= 767 ? 'mobile.jpg' : 'desktop.jpg';
    await expect.poll(() => image.evaluate(img => decodeURIComponent((img as HTMLImageElement).currentSrc))).toContain(expected);
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.every(url => url.includes(expected))).toBe(true);
    await expect(image).toHaveCSS('object-fit', 'cover');
    const box = await image.boundingBox();
    expect(box?.width).toBe(page.viewportSize()!.width);
    expect(box?.height).toBeCloseTo(page.viewportSize()!.height * .88, 0);
    expect(markup).not.toContain('rel="preload"');
  });
}

test('premium variants serve Retina sources directly, with independent focal points', async ({ browser }) => {
  for (const [width, dpr, expected] of [[390, 3, 'mobile-1440'], [1440, 2, 'desktop-3000']] as const) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: dpr });
    try {
      const page = await context.newPage();
      const requests: string[] = [];
      await page.route('http://hero.test/**', async route => {
        requests.push(route.request().url());
        await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>' });
      });
      const asset = (kind: 'desktop_hero' | 'mobile_hero', widths: number[]) => ({ id: kind, kind, filename: 'source.jpg', width: 4000, height: 3000, sizeBytes: 1,
        variants: widths.map(w => ({ url: `http://hero.test/${kind === 'mobile_hero' ? 'mobile' : 'desktop'}-${w}.webp`, width: w, height: w })) });
      const markup = renderToStaticMarkup(createElement(HeroImage, { desktopImage: '/legacy.jpg', alt: 'Premium Hero', desktopAsset: asset('desktop_hero', [1920, 2560, 3000]), mobileAsset: asset('mobile_hero', [1080, 1440, 1600]), desktopFocal: { x: 20, y: 60 }, mobileFocal: { x: 70, y: 30 } }));
      await page.setContent(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>${readFileSync('src/app/homepage-hero.css', 'utf8')}</style><section class="hero-section">${markup}</section>`);
      const image = page.getByRole('img');
      await expect.poll(() => image.evaluate(img => (img as HTMLImageElement).currentSrc)).toContain(expected);
      expect(requests).toEqual([`http://hero.test/${expected}.webp`]);
      await expect(image).toHaveCSS('object-position', width < 768 ? '70% 30%' : '20% 60%');
      expect(markup).not.toContain('rel="preload"');
    } finally { await context.close(); }
  }
});
