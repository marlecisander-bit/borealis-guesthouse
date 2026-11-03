/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { File as NodeFile } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';

function load(file: string, mocks: Record<string, unknown> = {}): any {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', 'File', 'crypto', code)((id: string) => { if (id in mocks) return mocks[id]; throw Error('Unexpected dependency ' + id); }, m, m.exports, NodeFile, webcrypto);
  return m.exports;
}
const config = load('src/lib/hero-image-config.ts');
const security = load('src/lib/media-upload-security.ts', { './hero-image-config.ts': config });
const browser = load('src/lib/hero-original-upload.ts', { './media-upload-security': security });
const mediaConfig = load('src/lib/media-upload-config.ts');
const A = '10000000-0000-4000-8000-000000000001', B = '10000000-0000-4000-8000-000000000002', ID = '20000000-0000-4000-8000-000000000001', USER = '30000000-0000-4000-8000-000000000001';
const session = { userId: USER, propertyId: A, role: 'editor', email: 'fixture@example.test' };
const png = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
const file = () => new NodeFile([png], 'fixture.png', { type: 'image/png' });
const started = () => ({ id: ID, propertyId: A, path: security.heroOriginalPath(A, 'desktop_hero', ID, 'image/png') });
const jsonRequest = (body: unknown) => new Request('https://app.test/admin/content/homepage/hero-upload', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://app.test' }, body: JSON.stringify(body) });
const next = { NextResponse: { json: (data: unknown, options?: ResponseInit) => Response.json(data, options) } };
function browserDb(options: any = {}) {
  const calls: any[] = [], filters: any = {};
  const row = { property_id: A, role: 'editor', is_active: true, ...options.profile };
  const q: any = { select: () => q, eq: (k: string, v: any) => { filters[k] = v; return q; }, in: (k: string, v: any) => { filters[k] = v; return q; }, maybeSingle: async () => ({ data: options.nonmember ? null : row, error: options.profileError || null }) };
  return { calls, filters, db: { auth: { getUser: async () => ({ data: { user: options.expired ? null : { id: USER } }, error: options.expired ? {} : null }) }, from: (t: string) => { assert.equal(t, 'admin_profiles'); return q; }, storage: { from: (bucket: string) => ({ upload: async (...args: any[]) => { calls.push([bucket, ...args]); return { error: options.uploadError || null }; } }) } } };
}
function heroDb(options: any = {}) {
  const calls: any[] = [];
  const row = { id: ID, property_id: A, kind: 'desktop_hero', original_path: started().path, size_bytes: png.length, status: 'pending', ...options.row };
  const db = { from: (table: string) => {
    assert.equal(table, 'homepage_hero_assets'); let values: any;
    const q: any = { select: () => q, eq: (k: string, v: any) => { calls.push(['eq', k, v]); return q; }, or: () => q,
      insert: async (v: any) => { calls.push(['insert', v]); return { error: null }; },
      update: (v: any) => { values = v; calls.push(['update', v]); return q; },
      single: async () => ({ data: values?.status === 'ready' ? { ...row, ...values } : row, error: values?.status === 'ready' && options.saveError ? {} : null }),
      maybeSingle: async () => ({ data: values?.status === 'pending' && options.resetMissing ? null : { id: ID }, error: values?.status === 'pending' && options.resetError ? {} : null }),
      then: (resolve: any, reject: any) => Promise.resolve({ error: options.resetError ? {} : null }).then(resolve, reject),
    }; return q;
  }, storage: { from: (bucket: string) => { assert.equal(bucket, 'public-media'); return {
    download: async (path: string) => { calls.push(['download', path]); return { data: new Blob([options.bytes || png], { type: 'image/png' }), error: null }; },
    upload: async (path: string, bytes: unknown, opts: unknown) => { calls.push(['upload', path, bytes, opts]); return { error: options.failUploadAt === calls.filter(c => c[0] === 'upload').length ? {} : null }; },
    remove: async (paths: string[]) => { calls.push(['remove', paths]); return { error: options.cleanupError ? {} : null }; },
  }; } } };
  return { db, calls, row };
}
function heroHandler(s: any, db: any, processing?: any) {
  return load('src/app/admin/content/homepage/hero-upload/route.ts', {
    'next/server': next, '@/lib/admin/auth': { getCurrentAdmin: async () => s }, '@/lib/supabase/server': { createServerSupabaseClient: async () => db },
    '@/lib/media-url': { mediaBucket: 'public-media' }, '@/lib/hero-image-config': config, '@/lib/media-upload-security': security,
    '@/lib/hero-assets': { mapHeroAsset: (row: any) => row, heroAssetColumns: '*' },
    '@/lib/hero-image-processing': { processHeroImage: processing || (async () => ({ width: 3000, height: 2000, variants: [1000,2000].map(width => ({ bytes: png, width, height: width * 2/3, ext: 'png', mime: 'image/png' })) })) },
  }).POST;
}
function ordinaryHandler(s: any, db: any) {
  return load('src/app/admin/media/upload/route.ts', { 'next/server': next, '@/lib/admin/auth': { getCurrentAdmin: async () => s }, '@/lib/supabase/server': { createServerSupabaseClient: async () => db }, '@/lib/media-url': { mediaBucket: 'public-media', resolvePublicMediaUrl: (p: string) => p }, '@/lib/media-upload-config': mediaConfig, '@/lib/media-upload-security': security }).POST;
}
function multipart(f: NodeFile = file()) { const form = new FormData(); form.set('file', f as any); form.set('uploadId', ID); form.set('property_id', B); return new Request('https://app.test/admin/media/upload', { method: 'POST', body: form }); }

test('authenticated browser hero upload uses O/M/E membership and normal upload, never signing', async () => {
  for (const role of ['owner','manager','editor']) {
    const m = browserDb({ profile: { role } }); await browser.uploadHeroOriginal(m.db, started(), file(), 'desktop_hero');
    assert.equal(m.calls.length, 1); assert.equal(m.calls[0][0], 'public-media'); assert.equal(m.calls[0][1], started().path);
    assert.deepEqual(m.calls[0][3], { upsert: false, contentType: 'image/png', cacheControl: '31536000' });
    assert.equal(m.filters.user_id, USER); assert.equal(m.filters.property_id, A); assert.equal(m.filters.is_active, true);
  }
});
test('browser rejects staff, disabled, nonmember, cross-property and expired authentication without Storage calls', async () => {
  for (const opts of [{ profile: { role: 'staff' } }, { profile: { is_active: false } }, { nonmember: true }, { profile: { property_id: B } }, { expired: true }, { profileError: {} }]) {
    const m = browserDb(opts); await assert.rejects(browser.uploadHeroOriginal(m.db, started(), file(), 'desktop_hero')); assert.equal(m.calls.length, 0);
  }
});
test('browser rejects malformed paths, mismatched ids/kinds, unsupported files and oversized originals before authentication', async () => {
  const badPaths = [started().path.replace(A, B), '../source.png', started().path + '/x', started().path.replace('/original/', '//original/'), started().path.replace('/original/', '/%2e%2e/'), started().path.replace('/original/', '/./'), started().path.replace('/original/', '\\original/'), A.toUpperCase() + '/source.png'];
  for (const path of badPaths) { const m = browserDb(); await assert.rejects(browser.uploadHeroOriginal(m.db, { ...started(), path }, file(), 'desktop_hero')); assert.equal(m.calls.length, 0); }
  for (const f of [new NodeFile(['<svg/>'], 'bad.svg', { type: 'image/svg+xml' }), new NodeFile([new Uint8Array(config.HERO_IMAGE_CONFIG.maxBytes + 1)], 'big.png', { type: 'image/png' })]) {
    const m = browserDb(); await assert.rejects(browser.uploadHeroOriginal(m.db, started(), f, 'desktop_hero')); assert.equal(m.calls.length, 0);
  }
});
test('expired permission during upload fails closed without privileged or signed retry', async () => {
  const m = browserDb({ uploadError: { message: 'private-provider-detail' } }); await assert.rejects(browser.uploadHeroOriginal(m.db, started(), file(), 'desktop_hero'), /permission expired/); assert.equal(m.calls.length, 1);
});
test('getCurrentAdmin queries verified user and active membership; disabled/nonmember yields no session', async () => {
  for (const active of [true, false]) {
    const filters: any = {}; const q: any = { select: () => q, eq: (k: string, v: any) => { filters[k] = v; return q; }, order: () => q, limit: () => q, maybeSingle: async () => ({ data: active ? { role: 'editor', property_id: A } : null, error: null }) };
    const auth = load('src/lib/admin/auth.ts', { 'server-only': {}, react: { cache: (fn: any) => fn }, 'next/navigation': { redirect: () => { throw Error('redirect'); } }, '@/lib/supabase/server': { createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: USER, email: session.email } } }) }, from: () => q }) } });
    const result = await auth.getCurrentAdmin(); assert.equal(!!result, active); assert.equal(filters.user_id, USER); assert.equal(filters.is_active, true);
  }
});
test('both upload routes reject unauthorized sessions before reading the body', async () => {
  for (const s of [null, { ...session, role: 'staff' }, { ...session, propertyId: '../bad' }]) {
    const req = { formData: () => { throw Error('body read'); }, json: () => { throw Error('body read'); } };
    assert.ok([401,403].includes((await ordinaryHandler(s, null)(req)).status)); assert.equal((await heroHandler(s, null)(req)).status, 403);
  }
});
test('hero start uses session property and returns no token for each authorized role', async () => {
  for (const role of ['owner','manager','editor']) { const m = heroDb(); const response = await heroHandler({ ...session, role }, m.db)(jsonRequest({ action: 'start', kind: 'desktop_hero', mime: 'image/png', size: png.length, propertyId: B })); assert.equal(response.status, 200); const value = await response.json(); assert.equal(value.propertyId, A); assert.ok(value.path.startsWith(A + '/hero/')); assert.equal(value.token, undefined); assert.equal(m.calls.filter(c => c[0] === 'insert')[0][1].property_id, A); }
});
test('hero start size/type validation has no metadata or Storage side effects', async () => {
  assert.equal(config.HERO_IMAGE_CONFIG.maxBytes, 10 * 1024 * 1024);
  assert.equal(security.validHeroSize(config.HERO_IMAGE_CONFIG.maxBytes), true);
  for (const patch of [{ mime: 'image/svg+xml' }, { mime: '__proto__' }, { size: config.HERO_IMAGE_CONFIG.maxBytes + 1 }, { size: 0 }, { kind: '../bad' }]) { const m = heroDb(); assert.equal((await heroHandler(session, m.db)(jsonRequest({ action: 'start', kind: 'desktop_hero', mime: 'image/png', size: png.length, ...patch }))).status, 400); assert.equal(m.calls.length, 0); }
});
test('hero finish denies cross-property and noncanonical originals before download', async () => {
  for (const row of [{ property_id: B }, { original_path: A + '/hero/desktop_hero/' + ID + '/original/../source.png' }, { original_path: started().path + '/extra' }]) { const m = heroDb({ row }); assert.equal((await heroHandler(session, m.db)(jsonRequest({ action: 'finish', id: ID }))).status, 400); assert.equal(m.calls.filter(c => c[0] === 'download').length, 0); }
});
test('hero finish preserves original, writes scoped variants and marks ready', async () => {
  const m = heroDb(); const response = await heroHandler(session, m.db)(jsonRequest({ action: 'finish', id: ID })); assert.equal(response.status, 200); const uploads = m.calls.filter(c => c[0] === 'upload'); assert.equal(uploads.length, 2); assert.ok(uploads.every(c => c[1].startsWith(A + '/hero/desktop_hero/' + ID + '/optimized/'))); assert.equal(m.calls.filter(c => c[0] === 'remove').length, 0); assert.ok(m.calls.some(c => c[0] === 'update' && c[1].status === 'ready')); assert.ok(m.calls.some(c => c[0] === 'eq' && c[1] === 'property_id' && c[2] === A));
});
test('hero type mismatch and processing failure reset pending and retain original', async () => {
  for (const m of [heroDb({ bytes: new Uint8Array(png.length) }), heroDb()]) { const response = await heroHandler(session, m.db, async () => { throw Error('Synthetic decoder failure'); })(jsonRequest({ action: 'finish', id: ID })); assert.equal(response.status, 400); assert.ok(m.calls.some(c => c[0] === 'update' && c[1].status === 'pending')); assert.equal(m.calls.filter(c => c[0] === 'remove').length, 0); }
});
test('failed derivative/save cleans only written derivatives; cleanup/reset errors are visible', async () => {
  for (const opts of [{ failUploadAt: 2 }, { saveError: true }, { failUploadAt: 2, cleanupError: true }, { saveError: true, resetError: true }, { saveError: true, resetMissing: true }]) { const m = heroDb(opts); const response = await heroHandler(session, m.db)(jsonRequest({ action: 'finish', id: ID })); assert.equal(response.status, 400); const removed = m.calls.find(c => c[0] === 'remove')[1]; assert.ok(removed.length > 0 && removed.every((path: string) => path.includes('/optimized/') && !path.includes('/original/'))); const result = await response.json(); if (('cleanupError' in opts && opts.cleanupError) || ('resetError' in opts && opts.resetError) || ('resetMissing' in opts && opts.resetMissing)) assert.match(result.error, /recovery is incomplete/); }
});
test('ordinary upload uses authorized session property for object and metadata; compensates DB failure', async () => {
  for (const role of ['owner','manager','editor']) for (const cleanupError of [false,true]) {
    const calls: any[] = []; let insert: any;
    const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: null, error: null }), insert: (v: any) => { insert = v; return q; }, single: async () => ({ data: null, error: {} }) };
    const db = { from: () => q, storage: { from: () => ({ upload: async (path: string) => { calls.push(['upload', path]); return { error: null }; }, remove: async (paths: string[]) => { calls.push(['remove', paths]); return { error: cleanupError ? {} : null }; } }) } };
    const response = await ordinaryHandler({ ...session, role }, db)(multipart()); assert.equal(response.status, 400); assert.equal(insert.property_id, A); assert.equal(insert.file_path, A + '/' + ID + '.png'); assert.equal(insert.created_by, USER); assert.equal(calls.length, 2); assert.deepEqual(calls[1][1], [calls[0][1]]); if (cleanupError) assert.match((await response.json()).error, /cleanup failed/);
  }
});
test('ordinary upload rejects unsupported/truncated images and files over its 4 MiB request cap', async () => {
  for (const f of [new NodeFile(['<svg/>'], 'bad.svg', { type: 'image/svg+xml' }), new NodeFile([new Uint8Array([137])], 'short.png', { type: 'image/png' }), new NodeFile([new Uint8Array(mediaConfig.MEDIA_UPLOAD_CONFIG.maxUploadBytes + 1)], 'big.png', { type: 'image/png' })]) { const response = await ordinaryHandler(session, null)(multipart(f)); assert.ok([400,415].includes(response.status)); }
});
test('proposed INSERT policy allows ordinary upload only; signing denial is a static/model assertion', () => {
  const sql = readFileSync('docs/security-proposals/phase-a/F03-media-policy-consolidation.sql.proposed', 'utf8'); const insert = sql.split('CREATE POLICY borealis_media_object_insert')[1].split('CREATE POLICY borealis_media_object_update')[0]; assert.match(insert, /allow_only_operation\('object.upload'\)/); assert.match(insert, /borealis_can_write_media_object/);
  const intendedInsert = (operation: string, activeOwnProperty: boolean) => activeOwnProperty && operation === 'object.upload';
  for (const operation of ['object.sign_upload_url','object.upload_signed','object.copy','object.move','']) assert.equal(intendedInsert(operation, true), false); assert.equal(intendedInsert('object.upload', true), true);
});
test('public URL delivery contract is unchanged and requires no user or signing token', () => {
  const old = process.env.NEXT_PUBLIC_SUPABASE_URL; process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://public.example.test';
  try { const urls = load('src/lib/media-url.ts'); assert.equal(urls.resolvePublicMediaUrl(A + '/hero/photo one.png'), 'https://public.example.test/storage/v1/object/public/public-media/' + A + '/hero/photo%20one.png'); } finally { if (old === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = old; }
});

test('ordinary O/M/E upload returns the saved own-property metadata and stable public path', async () => {
  for (const role of ['owner','manager','editor']) {
    let row: any; const uploads: any[] = [];
    const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: null, error: null }), insert: (value: any) => { row = value; return q; }, single: async () => ({ data: row, error: null }) };
    const db = { from: () => q, storage: { from: () => ({ upload: async (...args: any[]) => { uploads.push(args); return { error: null }; }, remove: () => { throw Error('Successful upload must not be removed'); } }) } };
    const response = await ordinaryHandler({ ...session, role }, db)(multipart()); assert.equal(response.status, 201); const result = await response.json(); assert.equal(result.asset.property_id, A); assert.equal(result.asset.publicUrl, A + '/' + ID + '.png'); assert.equal(uploads[0][2].upsert, false);
  }
});
