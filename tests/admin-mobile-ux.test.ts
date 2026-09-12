import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

test('mobile Admin navigation is modal, keyboard-safe and locks page scroll', () => {
  const drawer = source('src/components/layout/AdminMobileNav.tsx');
  assert.match(drawer, /role="dialog"/);
  assert.match(drawer, /aria-modal="true"/);
  assert.match(drawer, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(drawer, /event\.key === 'Escape'/);
  assert.match(drawer, /event\.key !== 'Tab'/);
  assert.match(drawer, /h-\[100dvh\]/);
  assert.match(drawer, /onNavigate=\{\(\) => setOpen\(false\)\}/);
});

test('Admin mobile foundations prevent page overflow and respect phone chrome', () => {
  const css = source('src/app/globals.css');
  assert.match(css, /\[data-admin-shell\]\{[^}]*min-height:100dvh/);
  assert.match(css, /@media\(max-width:767px\)/);
  assert.match(css, /font-size:1rem/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /dialog\{inset:0;width:100%;height:100dvh/);
  assert.match(css, /overflow-wrap:anywhere/);
});

test('high-use datasets have touch-first alternatives instead of squeezed tables', () => {
  const bookings = source('src/app/admin/bookings/page.tsx');
  assert.match(bookings, /aria-label="Bookings" className="grid gap-3 md:hidden"/);
  assert.match(bookings, /hidden overflow-x-auto[^<]+md:block/);
  assert.match(bookings, /min-h-11/);

  const calendar = source('src/app/admin/availability/page.tsx');
  assert.match(calendar, /MobileTimeline/);
  assert.match(calendar, /Block this date/);
  assert.match(calendar, /Previous two weeks/);
  assert.match(calendar, /Next two weeks/);
});

test('mobile room, editor and media actions remain comfortably tappable', () => {
  const rooms = source('src/app/admin/rooms/page.tsx');
  assert.match(rooms, /grid grid-cols-2[^"\n]*gap-2[^"\n]*md:flex/);
  assert.match(rooms, /aspect-\[16\/9\]/);

  for (const path of ['src/components/admin/RoomTypeForm.tsx', 'src/components/admin/ExperienceForm.tsx']) {
    const editor = source(path);
    assert.match(editor, /admin-form-actions/);
    assert.match(editor, /grid grid-cols-2 gap-2/);
  }

  const uploader = source('src/components/admin/MediaUploader.tsx');
  assert.match(uploader, /Choose photos/);
  assert.match(uploader, /multiple/);
  assert.match(uploader, /Upload queue/);
  assert.match(uploader, /w-full rounded-lg bg-slate-950/);
  assert.match(source('src/components/admin/MediaPicker.tsx'), /admin-mobile-sheet/);
});

test('mobile booking detail prioritizes the common lifecycle action', () => {
  const detail = source('src/app/admin/bookings/[id]/page.tsx');
  assert.match(detail, /order-1 space-y-6 lg:order-2/);
  assert.ok(detail.indexOf('Change status') < detail.indexOf('Payment'));
});
