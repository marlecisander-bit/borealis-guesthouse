import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

test('mobile Admin navigation uses the shared destinations and clears dialogs and forms', () => {
  const navigation = source('src/components/layout/AdminMobileNav.tsx');
  const workspace = source('src/app/admin/admin-workspace.css');
  assert.match(navigation, /data-admin-bottom-nav/);
  assert.match(navigation, /adminNavigation.map/);
  assert.match(navigation, /aria-current/);
  assert.match(workspace, /safe-area-inset-bottom/);
  assert.match(workspace, /dialog\[open\]/);
  assert.match(workspace, /--admin-bottom-clearance/);
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
  assert.match(bookings, /aria-label="Bookings" className="admin-record-cards grid gap-3"/);
  assert.match(bookings, /admin-record-wide/);
  assert.match(bookings, /min-h-11/);

  const calendar = source('src/components/admin/AvailabilityCalendar.tsx');
  assert.match(calendar, /calendar-agenda/);
  assert.match(calendar, /calendar-selected/);
  assert.match(calendar, /Previous period/);
  assert.match(calendar, /Next period/);

});

test('mobile room, editor and media actions remain comfortably tappable', () => {
  const rooms = source('src/app/admin/rooms/page.tsx');
  assert.match(rooms, /admin-record-actions/);
  assert.match(rooms, /admin-record-title-image/);

  for (const path of ['src/components/admin/EditorWorkspace.tsx']) {
    const editor = source(path);
    assert.match(editor, /admin-form-actions/);
    assert.match(editor, /min-h-11/);
  }

  const uploader = source('src/components/admin/MediaUploader.tsx');
  assert.match(uploader, /Choose photos/);
  assert.match(uploader, /multiple/);
  assert.match(uploader, /Upload queue/);
  assert.match(uploader, /w-full rounded-lg bg-slate-950/);
  const picker = source('src/components/admin/MediaPicker.tsx');
  assert.match(picker, /admin-image-picker-sheet/);
  assert.match(picker, /admin-image-dialog-heading/);
  assert.match(picker, /admin-image-dialog-body/);
});

test('mobile booking detail prioritizes the common lifecycle action', () => {
  const detail = source('src/app/admin/bookings/[id]/page.tsx');
  assert.ok(detail.indexOf('>Guest</h2>') < detail.indexOf('>Change status</h2>'));
  assert.ok(detail.indexOf('>Change status</h2>') < detail.indexOf('>Payment</h2>'));
});
