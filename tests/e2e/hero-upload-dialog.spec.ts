import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import sharp from 'sharp';
import { compile } from '@tailwindcss/node';

// Mount the real isolated control without an Admin account or production writes.
// Only the storage transport is mocked; the selected File reaches it untouched.
function controlBundle() {
  const modules: Record<string, string> = {};
  for (const [name, file] of Object.entries({ react: 'react/cjs/react.development.js', 'react/jsx-runtime': 'react/cjs/react-jsx-runtime.development.js', 'react-dom': 'react-dom/cjs/react-dom.development.js', 'react-dom/client': 'react-dom/cjs/react-dom-client.development.js', scheduler: 'scheduler/cjs/scheduler.development.js' })) modules[name] = readFileSync(path.join('node_modules', file), 'utf8');
  for (const [name, file] of Object.entries({ '@/lib/hero-image-config': 'src/lib/hero-image-config.ts', control: 'src/components/admin/HeroImageFields.tsx' })) modules[name] = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  modules['@/lib/supabase/client'] = `exports.createClient=()=>({storage:{from:()=>({uploadToSignedUrl:async(path,token,file)=>{window.uploadedOriginal=Array.from(new Uint8Array(await file.arrayBuffer()));return {error:null}}})}})`;
  return `(()=>{const process={env:{NODE_ENV:'development'}};const factories={${Object.entries(modules).map(([name, code]) => `${JSON.stringify(name)}:function(require,module,exports){${code}\n}`).join(',')}};const cache={};function require(id){if(!cache[id]){const module={exports:{}};cache[id]=module;factories[id](require,module,module.exports)}return cache[id].exports}const React=require('react');require('react-dom/client').createRoot(document.getElementById('root')).render(React.createElement('form',{},React.createElement(require('control').HeroImageFields,{desktopLegacyId:'legacy-desktop',mobileLegacyId:'',desktopUrl:'http://hero.test/legacy.jpg',mobileUrl:'',desktopFocal:null,mobileFocal:null})));})();`;
}

test('dedicated Hero dialog preserves source bytes, focal point, fallback and keyboard behavior', async ({ page }, testInfo) => {
  await page.route('http://hero.test/**', async route => {
    if (route.request().isNavigationRequest()) { await route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }); return; }
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({ json: body.action === 'start' ? { id: 'new-mobile', path: 'original/source.jpg', token: 'test-token' } : { asset: { id: 'new-mobile', kind: 'mobile_hero', filename: 'phone.jpg', width: 640, height: 800, sizeBytes: 1000, variants: [{ url: 'http://hero.test/optimized.jpg', width: 640, height: 800 }] } } });
    } else await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800"><rect width="640" height="800" fill="teal"/></svg>' });
  });
  await page.goto('http://hero.test/');
  await page.setContent('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>');
  const sourceCode = readFileSync('src/components/admin/HeroImageFields.tsx', 'utf8');
  const classes = [...sourceCode.matchAll(/className="([^"]+)"/g), ...sourceCode.matchAll(/className=\{`([^`]+)`\}/g)].flatMap(match => match[1].split(/\s+/));
  classes.push('aspect-[3/4]', 'max-w-60', 'aspect-video');
  const styles = await compile(readFileSync('src/app/globals.css', 'utf8'), { base: path.resolve('src/app'), onDependency: () => {} });
  await page.addStyleTag({ content: styles.build(classes) + readFileSync('src/app/control-alignment.css', 'utf8') });
  await page.addScriptTag({ content: controlBundle() });
  await expect(page.getByText('Using Desktop Hero Image as fallback.')).toBeVisible();
  await page.getByRole('button', { name: 'Replace image' }).nth(1).click();
  const dialog = page.getByRole('dialog', { name: /Mobile Hero Image/ });
  await expect(dialog).toBeVisible();
  const source = await sharp({ create: { width: 640, height: 800, channels: 3, background: '#569' } }).jpeg({ quality: 95 }).toBuffer();
  await dialog.getByLabel('Choose Mobile Hero Image').setInputFiles({ name: 'phone.jpg', mimeType: 'image/jpeg', buffer: source });
  await expect(dialog.getByText(/640 × 800/)).toBeVisible();
  await expect(dialog.getByText(/lower than recommended/)).toBeVisible();
  expect(await dialog.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath('hero-upload-dialog.png') });
  await dialog.getByRole('button', { name: 'Set Hero focal point' }).press('ArrowRight');
  await dialog.getByRole('button', { name: 'Use image' }).click();
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { uploadedOriginal: number[] }).uploadedOriginal)).toEqual(Array.from(source));
  await expect(page.locator('input[name="hero_mobileHeroAssetId"]')).toHaveValue('new-mobile');
  await expect(page.locator('input[name="hero_mobileFocal"]')).toHaveValue(JSON.stringify({ x: 55, y: 42 }));
  await expect(page.locator('input[name="hero_media"]')).toHaveValue('legacy-desktop');
  await page.getByRole('button', { name: 'Remove image' }).nth(1).click();
  await expect(page.locator('input[name="hero_mobileHeroAssetId"]')).toHaveValue('');
  await expect(page.getByText('Using Desktop Hero Image as fallback.')).toBeVisible();
  await page.getByRole('button', { name: 'Replace image' }).first().click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
