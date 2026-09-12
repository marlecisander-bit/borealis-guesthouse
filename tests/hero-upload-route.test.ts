import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as config from '../src/lib/hero-image-config.ts';
import { processHeroImage } from '../src/lib/hero-image-processing.ts';

const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL('../src/app/admin/content/homepage/hero-upload/route.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
const owner = { userId: 'owner', role: 'owner', propertyId: 'c889345c-c05b-4459-b72f-c1b441fc1160' };
function handler(session: typeof owner | null, db: unknown) {
  const dependencies: Record<string, unknown> = {
    '@/lib/admin/auth': { getCurrentAdmin: async () => session },
    '@/lib/supabase/server': { createServerSupabaseClient: async () => db },
    '@/lib/media-url': { mediaBucket: 'public-media' },
    '@/lib/hero-image-config': config,
    '@/lib/hero-assets': { mapHeroAsset: (row: unknown) => row, heroAssetColumns: '*' },
    '@/lib/hero-image-processing': { processHeroImage },
  };
  const exports = {} as { POST: (request: Request) => Promise<Response> };
  new Function('require', 'exports', compiled)((id: string) => dependencies[id] || require(id), exports);
  return exports.POST;
}
const request = (body: unknown, origin = 'http://localhost:3100') => new Request('http://localhost:3100/admin/content/homepage/hero-upload', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('Hero uploads reject anonymous, staff and cross-origin requests before touching storage', async () => {
  for (const session of [null, { ...owner, role: 'staff' }]) assert.equal((await handler(session, null)(request({ action: 'start' }))).status, 403);
  assert.equal((await handler(owner, null)(request({ action: 'start' }, 'https://unrelated.example'))).status, 403);
});

test('Hero upload initiation validates type/size and signs an immutable property-owned original', async () => {
  const rows: Record<string, unknown>[] = [];
  const signed: { path: string; upsert: boolean }[] = [];
  const db = {
    from: (table: string) => { assert.equal(table, 'homepage_hero_assets'); return { insert: async (row: Record<string, unknown>) => { rows.push(row); return { error: null }; } }; },
    storage: { from: (bucket: string) => { assert.equal(bucket, 'public-media'); return { createSignedUploadUrl: async (path: string, options: { upsert: boolean }) => { signed.push({ path, ...options }); return { data: { token: 'signed' }, error: null }; } }; } },
  };
  const post = handler(owner, db);
  for (const patch of [{ mime: 'image/svg+xml' }, { size: config.HERO_IMAGE_CONFIG.maxBytes + 1 }, { kind: 'gallery' }]) {
    assert.equal((await post(request({ action: 'start', kind: 'mobile_hero', mime: 'image/jpeg', size: 1000, ...patch }))).status, 400);
  }
  assert.equal(rows.length, 0);
  const response = await post(request({ action: 'start', kind: 'mobile_hero', mime: 'image/jpeg', size: 1000, filename: 'lake.jpg', propertyId: 'another-property' }));
  assert.equal(response.status, 200);
  assert.equal(rows[0].property_id, owner.propertyId);
  assert.ok(signed[0].path.startsWith(`${owner.propertyId}/hero/mobile_hero/`));
  assert.ok(signed[0].path.endsWith('/original/source.jpg'));
  assert.equal(signed[0].upsert, false);
});

test('Finalization is property-scoped and an already-ready upload is not recompressed', async () => {
  const id = '2b6fc64c-d884-43be-a36d-c87a1b0ca509';
  let storedProperty = owner.propertyId;
  const post = handler(owner, {
    from: () => {
      const filters: Record<string, string> = {};
      const query = { select: () => query, eq: (key: string, value: string) => { filters[key] = value; return query; }, single: async () => ({ data: filters.id === id && filters.property_id === storedProperty ? { id, status: 'ready' } : null, error: null }) };
      return query;
    },
    storage: { from: () => { throw new Error('Ready images must not be processed again'); } },
  });
  assert.equal((await post(request({ action: 'finish', id }))).status, 200);
  storedProperty = 'other-property';
  assert.equal((await post(request({ action: 'finish', id }))).status, 400);
});
