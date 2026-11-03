import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedPreviewRoute, approvedSupabaseRead, guardedFetch, previewCsp, previewEnabled, assertPreviewEnvironment, PRODUCTION_ORIGIN, PREVIEW_ORIGIN } from '../src/lib/readonly-preview/policy.ts';

const env = { BOREALIS_READONLY_PREVIEW: '1', NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW: '1', NEXT_DIST_DIR: '.next-readonly-preview-v1', NEXT_PUBLIC_SUPABASE_URL: PRODUCTION_ORIGIN, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_SYNTHETIC_NOT_A_REAL_KEY', APP_URL: PREVIEW_ORIGIN, NEXT_PUBLIC_APP_URL: PREVIEW_ORIGIN, NEXT_PUBLIC_SITE_URL: PREVIEW_ORIGIN };
function withEnv(fn: () => void) {
  const old = { ...process.env };
  for (const key of ['NETLIFY','CONTEXT','VERCEL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','RESEND_FROM_EMAIL','ICAL_SYNC_SECRET','STRIPE_SECRET_KEY','PAYMENT_PROVIDER_SECRET']) delete process.env[key];
  Object.assign(process.env, env);
  try { fn(); } finally { for (const key of Object.keys(process.env)) delete process.env[key]; Object.assign(process.env, old); }
}
const read = (table = 'properties', select = 'id,name,description,location,address_line') => `${PRODUCTION_ORIGIN}/rest/v1/${table}?select=${encodeURIComponent(select)}`;

test('only reviewed informational routes and exact local origin are accepted', () => {
  for (const path of ['/', '/about', '/rooms', '/experiences', '/transfers', '/explore-koman', '/gallery', '/about?lang=en', '/about?_rsc=abc123', '/brand/borealis-logo.svg', '/_next/static/chunks/app.js']) assert.equal(allowedPreviewRoute(PREVIEW_ORIGIN + path, 'GET', new Headers()), true, path);
  for (const path of ['/book', '/contact', '/admin', '/admin/login', '/api/bookings/hold', '/api/bookings/confirm', '/api/contact', '/api/internal/calendars/sync', '/api/calendars/token', '/booking/confirmation/token', '/rooms/private-slug', '/unknown', '/about?preview=homepage', '/about?lang=en&lang=fr', '/_next/image?url=https://example.invalid']) assert.equal(allowedPreviewRoute(PREVIEW_ORIGIN + path, 'GET', new Headers()), false, path);
  assert.equal(allowedPreviewRoute('http://0.0.0.0:3000/about', 'GET', new Headers()), false);
  assert.equal(allowedPreviewRoute(PREVIEW_ORIGIN + '/about', 'POST', new Headers()), false);
  assert.equal(allowedPreviewRoute(PREVIEW_ORIGIN + '/about', 'GET', new Headers({'next-action':'synthetic'})), false);
});

test('approved reads enforce publication, anonymous identity, no cookies and no redirects', () => withEnv(() => {
  const [url, options] = approvedSupabaseRead(read() + '&status=eq.draft', { headers: { Authorization: 'Bearer SYNTHETIC_SESSION', apikey: 'wrong', 'X-HTTP-Method-Override': 'DELETE' } });
  assert.equal(url.searchParams.get('status'), 'eq.published');
  assert.equal(url.searchParams.get('limit'), '200');
  assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error');
  const h = new Headers(options.headers); assert.equal(h.has('authorization'), false); assert.equal(h.has('x-http-method-override'), false); assert.equal(h.get('apikey'), env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}));

test('writes, RPCs, auth, storage, personal tables and unknown projections fail before delegation', () => withEnv(() => {
  for (const method of ['POST','PUT','PATCH','DELETE','OPTIONS','HEAD']) assert.throws(() => approvedSupabaseRead(read(), {method}), /readonly_preview_blocked/);
  for (const path of ['/auth/v1/token','/rest/v1/rpc/available_room_count','/rest/v1/bookings?select=id','/rest/v1/guests?select=id','/storage/v1/object/public/public-media/image.jpg']) assert.throws(() => approvedSupabaseRead(PRODUCTION_ORIGIN + path), /readonly_preview_blocked/);
  for (const url of [read('properties','*'), read('properties','service_role_secret'), read()+'&or=(status.eq.draft)',read()+'&select=id', read()+'&unknown=eq.value', read()+'&limit=1000',read().replace('rlqyruulxyanfgvnzkpe','another-project'), 'https://example.invalid/rest/v1/properties?select=id']) assert.throws(() => approvedSupabaseRead(url), /readonly_preview_blocked/);
  assert.throws(() => approvedSupabaseRead(read(), {credentials:'include'}));
  assert.throws(() => approvedSupabaseRead(read(), {headers:{cookie:'SYNTHETIC'}}));
  assert.throws(() => approvedSupabaseRead(read(), {headers:{'accept-profile':'auth'}}));
}));

test('browser policy prevents direct backend, forms and arbitrary image/proxy traffic', () => {
  assert.match(previewCsp, /connect-src 'self'/); assert.match(previewCsp, /form-action 'none'/); assert.match(previewCsp, /img-src 'self' data:/); assert.match(previewCsp, /frame-src 'none'/);
  const connect = previewCsp.split(';').find(value => value.trim().startsWith('connect-src'))!;
  assert.equal(connect.includes('supabase.co'), false);
  assert.equal(previewCsp.includes('/storage/v1/object/public/public-media/'), true);
  assert.equal(previewCsp.includes('/storage/v1/object/sign/'), false);
});

test('preview environment fails closed on deployment, mixed flags or privileged credentials', () => withEnv(() => {
  assert.equal(previewEnabled(), true); assert.doesNotThrow(assertPreviewEnvironment);
  process.env.SUPABASE_SERVICE_ROLE_KEY='SYNTHETIC'; assert.throws(assertPreviewEnvironment); delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NETLIFY='true'; assert.throws(assertPreviewEnvironment); delete process.env.NETLIFY;
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://another-project.supabase.co'; assert.throws(assertPreviewEnvironment); process.env.NEXT_PUBLIC_SUPABASE_URL=PRODUCTION_ORIGIN;
  delete process.env.NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW; assert.throws(previewEnabled);
}));

test('rejection errors never include URL, headers, cookies or credentials', () => withEnv(() => {
  try { approvedSupabaseRead('https://user:private@example.invalid/?secret=SYNTHETIC'); assert.fail(); }
  catch (error) { assert.equal((error as Error).message, 'readonly_preview_blocked'); }
}));

test('mocked transport receives only accepted reads; forbidden requests make zero calls', async () => {
  const old = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let calls=0;
  const transport=guardedFetch((async () => { calls++; return new Response('{}'); }) as typeof fetch);
  try {
    await assert.rejects(transport(read(),{method:'DELETE'})); assert.equal(calls,0);
    await transport(read()); assert.equal(calls,1);
  } finally { if(old===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=old; }
});
