import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { compile } from '@tailwindcss/node';
import { createElement, type ComponentType, type ReactNode } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

test('status and publication filters align on the same 44px row', async ({ page }) => {
  const source = readFileSync('src/components/admin/AdminStatusFilter.tsx', 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const exports: Record<string, ComponentType<{ status: string; kind?: string; type?: string }>> = {};
  // Render the real control with a native GET form in place of Next navigation.
  const resolve = (id: string) => id === 'next/form'
    ? ({ children, ...attrs }: { children: ReactNode }) => createElement('form', attrs, children)
    : jsxRuntime;
  new Function('require', 'exports', output)(resolve, exports);
  const markup = renderToStaticMarkup(createElement('main', { 'data-admin-shell': true },
    ...['status', 'publication', 'articles'].map(kind =>
      createElement(exports.AdminStatusFilter, { key: kind, status: 'active', kind, type: 'rental' }),
    ),
  ));
  const styles = await compile(readFileSync('src/app/site.css', 'utf8'), {
    base: path.resolve('src/app'),
    onDependency: () => {},
  });
  const classes = [...source.matchAll(/className="([^"]+)"/g)].flatMap(match => match[1].split(/\s+/));
  const css = styles.build(classes) + readFileSync('src/app/admin/admin-workspace.css', 'utf8');

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.setContent('<meta name="viewport" content="width=device-width, initial-scale=1">' + markup);
    await page.addStyleTag({ content: css });
    for (const form of await page.locator('form').all()) {
      const select = form.getByRole('combobox');
      const dropdown = (await select.boundingBox())!;
      const button = (await form.getByRole('button').boundingBox())!;
      expect(dropdown.height).toBeGreaterThanOrEqual(44);
      expect(dropdown.y).toBeCloseTo(button.y, 0);
      expect(dropdown.height).toBeCloseTo(button.height, 0);
      expect(button.x).toBeGreaterThan(dropdown.x + dropdown.width);
      expect(button.x + button.width).toBeLessThan(width);
      await select.selectOption('archived');
      expect(await form.evaluate(element => Object.fromEntries(new FormData(element as HTMLFormElement)))).toEqual({
        status: 'archived',
        type: 'rental',
      });
    }
  }
});
