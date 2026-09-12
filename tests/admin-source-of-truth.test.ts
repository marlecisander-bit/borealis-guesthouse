import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

test('Admin navigation groups owner tasks predictably', () => {
  const navigation = source('src/lib/admin/navigation.ts');
  for (const label of ['Dashboard', 'Bookings', 'Calendar', 'Rooms & Rates', 'Experiences & Transfers', 'Website', 'Media', 'Settings']) {
    assert.match(navigation, new RegExp(`label: '${label.replace('&', '\\&')}'`));
  }
  assert.equal((navigation.match(/\{ label:/g) || []).length, 8);
  assert.match(source('src/components/admin/AdminWorkspaceNav.tsx'), /Guest enquiries/);
  assert.match(source('src/components/admin/AdminWorkspaceNav.tsx'), /Property & policies/);
});

test('Settings is the only editor for property-wide contact details', () => {
  const settings = source('src/components/admin/SettingsForm.tsx');
  const contact = source('src/app/admin/content/contact/page.tsx');
  assert.match(settings, /name="phone"/);
  assert.match(settings, /name="facebook"/);
  for (const field of ['phone', 'whatsapp', 'email', 'instagram']) {
    assert.doesNotMatch(contact, new RegExp(`name:'${field}'`));
  }
});

test('Languages and global SEO are not duplicated in Settings', () => {
  const settings = source('src/components/admin/SettingsForm.tsx');
  assert.doesNotMatch(settings, /Default language/);
  assert.doesNotMatch(settings, /Default SEO image/);
  assert.match(source('src/app/admin/languages/page.tsx'), /Default language/);
  assert.match(source('src/components/admin/SeoSettingsForm.tsx'), /defaultOgMediaId/);
});

test('Public contact data prefers the canonical property record', () => {
  const service = source('src/services/site-content.ts');
  assert.match(service, /phone,whatsapp,email,instagram_url,facebook_url/);
  assert.match(service, /property\?\.email\|\|d\.email/);
  assert.match(service, /property\?\.facebook_url/);
});

test('Dashboard focuses on daily booking operations', () => {
  const repository = source('src/lib/repositories/admin/dashboard.ts');
  const page = source('src/app/admin/dashboard/page.tsx');
  assert.match(repository, /booking_status/);
  assert.match(repository, /\.eq\('check_in', date\)/);
  assert.match(repository, /\.eq\('check_out', date\)/);
  assert.match(repository, /\.limit\(5\)/);
  assert.doesNotMatch(repository, /from\('content_pages'\)/);
  assert.match(page, /Needs attention/);
  assert.match(page, /href={`\/admin\/bookings\/\$\{booking\.id\}`}/);
});

test('Room editor keeps technical identifiers out of the owner workflow', () => {
  const form = source('src/components/admin/RoomTypeForm.tsx');
  const list = source('src/app/admin/rooms/page.tsx');
  assert.match(form, /type="hidden" name="slug"/);
  assert.match(form, /Guests & beds/);
  assert.match(form, /Advanced/);
  assert.match(list, /QuickRoomRateForm/);
});

test('Room gallery browser mutations remain explicitly property scoped', () => {
  const manager = source('src/components/admin/RoomImagesManager.tsx');
  const propertyFilters = manager.match(/\.eq\('property_id', propertyId\)/g) || [];
  assert.ok(propertyFilters.length >= 6);
  assert.match(manager, /\.eq\('room_type_id', roomTypeId\)/);
});
