import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const js = ts.transpileModule(readFileSync('src/components/admin/AdminAppResume.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function fixture({ displayMode = true, ios = false, initiallyVisible = true, path = '/admin/bookings', online = true } = {}) {
  const document = Object.assign(new EventTarget(), { visibilityState: initiallyVisible ? 'visible' : 'hidden' });
  const calls: string[] = [];
  const window = Object.assign(new EventTarget(), {
    matchMedia: () => ({ matches: displayMode }),
    scrollTo: () => calls.push('scroll'),
  });
  const navigator = { standalone: ios, onLine: online };
  const location = Object.assign(new URL(path, 'https://admin.example'), {
    reload: () => calls.push('reload'),
    replace: (target: string) => calls.push(target),
  });
  const exports: { AdminAppResume?: () => void } = {};
  runInNewContext(js, { exports, document, window, navigator, location, Event,
    require: () => ({ useEffect: (setup: () => void) => setup() }),
  });
  exports.AdminAppResume?.();
  const show = (visibility: string) => {
    document.visibilityState = visibility;
    document.dispatchEvent(new Event('visibilitychange'));
  };
  return { calls, window, show, reopen: () => { show('hidden'); show('visible'); } };
}

test('a standalone app returns to Today on resume and reloads Today when already there', () => {
  const bookings = fixture();
  assert.deepEqual(bookings.calls, []);
  bookings.reopen();
  bookings.show('visible');
  assert.deepEqual(bookings.calls, ['/admin/dashboard']);
  const dashboard = fixture({ path: '/admin/dashboard', displayMode: false, ios: true });
  dashboard.reopen();
  assert.deepEqual(dashboard.calls, ['scroll', 'reload']);
});

test('browser tabs, offline sessions, sign-in, and protected edits stay in place', () => {
  for (const options of [{ displayMode: false }, { online: false }, { path: '/admin/login' }, { path: '/admin/mfa' }]) {
    const app = fixture(options);
    app.reopen();
    assert.deepEqual(app.calls, []);
  }
  const editor = fixture();
  editor.window.addEventListener('borealis-admin-resume', event => event.preventDefault());
  editor.reopen();
  assert.deepEqual(editor.calls, []);
});

test('first foreground visit of a deep link and ordinary document navigation are preserved', () => {
  const notification = fixture({ initiallyVisible: false, path: '/admin/bookings/example' });
  notification.show('visible');
  assert.deepEqual(notification.calls, []);
  notification.show('hidden');
  notification.window.dispatchEvent(new Event('pagehide'));
  notification.show('visible');
  assert.deepEqual(notification.calls, []);
  notification.reopen();
  assert.deepEqual(notification.calls, ['/admin/dashboard']);
});
