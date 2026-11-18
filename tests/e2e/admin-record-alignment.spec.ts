import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { compile } from '@tailwindcss/node';
import { createElement, type ComponentType, type ReactNode } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

test('room and service rows align with their headers and fit narrow admin containers', async ({ page }) => {
  const roomSource = readFileSync('src/app/admin/rooms/page.tsx', 'utf8');
  const serviceSource = readFileSync('src/components/admin/ServiceRows.tsx', 'utf8');
  const badgeSource = readFileSync('src/components/admin/ui.tsx', 'utf8').split('\n').find(line => line.startsWith('export function StatusBadge'))!;
  const testRecord = {
    id: 'record', name: 'Very long room or service name with no truncation', status: 'awaiting_confirmation',
    priceLabel: '€50 per boat per hour', type: 'Equipment rental', bookingSummary: 'This service is available for online booking.',
    href: '/admin/services/record', sortOrder: 1, actions: createElement('button', {}, 'Duplicate service'),
    images: [], capacity: 2, inventoryCount: 1, basePrice: 50, currency: 'EUR', rateActive: true,
  };
  function compileComponent(source: string) {
    const exports: Record<string, ComponentType<Record<string, unknown>>> = {};
    const output = ts.transpileModule(source, {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText;
    const resolve = (id: string) => {
      if (id === 'react/jsx-runtime') return jsxRuntime;
      if (id === 'next/link') return function TestLink({ children, ...attrs }: { children: ReactNode }) { return createElement('a', attrs, children); };
      if (id.endsWith('/ui')) return badge;
      if (id.endsWith('/ConfirmAction')) return { ConfirmAction: ({ label }: { label: string }) => createElement('button', {}, label) };
      if (id.endsWith('/rooms/actions')) return { archiveRoomType() {}, duplicateRoomType() {}, restoreRoomType() {} };
      if (id === '@/lib/pricing/format') return { formatRoomRate: () => '€50' };
      return {};
    };
    new Function('require', 'exports', output)(resolve, exports);
    return exports;
  }
  const badge = compileComponent(badgeSource);
  const room = compileComponent(roomSource.replace('function RoomList', 'export function RoomList'));
  const service = compileComponent(serviceSource);
  const markup = renderToStaticMarkup(createElement('main', { 'data-admin-shell': true },
    createElement(room.RoomList, { rooms: [testRecord], canEditRates: true }),
    createElement(service.ServiceRows, { items: [testRecord] }),
  ));
  const styles = await compile(readFileSync('src/app/site.css', 'utf8'), {
    base: path.resolve('src/app'),
    onDependency: () => {},
  });
  const classes = [...markup.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(/\s+/));
  const css = styles.build(classes) + readFileSync('src/app/admin/admin-workspace.css', 'utf8');
  await page.setContent('<meta name="viewport" content="width=device-width, initial-scale=1">' + markup);
  await page.addStyleTag({ content: css });

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    // At desktop widths, the sidebar and shell gutters reduce the available list width.
    const listWidth = width >= 1024 ? width - 300 : width - 24;
    await page.locator('main').evaluate((el, size) => { el.style.width = size + 'px'; }, listWidth);
    for (const list of await page.locator('.admin-record-list').all()) {
      const header = list.locator('.admin-record-head');
      const row = list.locator('.admin-record-row');
      await expect(header).toBeVisible({ visible: listWidth >= 898 });
      if (await header.isVisible()) {
        const coordinates = (selector: string) => list.locator(selector).evaluateAll(
          elements => elements.map(element => Math.round(element.getBoundingClientRect().x)),
        );
        expect(await coordinates('.admin-record-head > *')).toEqual(await coordinates('.admin-record-row > *'));
      }
      for (const action of await row.locator('.admin-record-actions > a, summary').all()) {
        const bounds = (await action.boundingBox())!;
        expect(bounds.width).toBeGreaterThanOrEqual(44);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(listWidth);
      }
      const more = row.getByText('More', { exact: true });
      await more.click();
      const menu = row.locator('.admin-record-menu');
      await expect(menu).toBeVisible();
      expect(await menu.evaluate(el => el.getBoundingClientRect().right)).toBeLessThanOrEqual(listWidth);
      await more.click();
      expect(await list.evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(listWidth);
    }
  }
});
