import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = 'docs/security-proposals/phase-a/';
const candidate = readFileSync(root + 'hero-metadata-v2/F03-media-and-hero-policy-consolidation-v2.sql.proposed', 'utf8');
const original = readFileSync(root + 'F03-media-policy-consolidation.sql.proposed', 'utf8');
const manifest = JSON.parse(readFileSync(root + 'hero-metadata-v2/manifest.json', 'utf8'));
const A = '10000000-0000-4000-8000-000000000001', B = '10000000-0000-4000-8000-000000000002', ID = '20000000-0000-4000-8000-000000000001';
const attempt = '30000000-0000-4000-8000-000000000001';
const uuidPattern = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
type Row = { property: string; id: string; kind: string; source: string; variants: unknown; status: string };
type Member = { user: string; property: string; active: boolean; role: string };
const row = (): Row => ({ property: A, id: ID, kind: 'desktop_hero', source: `${A}/hero/desktop_hero/${ID}/original/source.jpg`, variants: [], status: 'pending' });
const variants = () => [{ path: `${A}/hero/desktop_hero/${ID}/optimized/${attempt}/1920.webp`, width: 1920, height: 1080 }];
// Deliberately explicit model of the proposal; this does not parse or execute SQL/RLS.
function paths(r: Row) {
  if (!new RegExp('^'+uuidPattern+'$').test(r.property) || !new RegExp('^'+uuidPattern+'$').test(r.id) || !['desktop_hero','mobile_hero'].includes(r.kind)) return false;
  if (!new RegExp(`^${r.property}/hero/${r.kind}/${r.id}/original/source\\.(jpg|png|webp|avif)$`).test(r.source) || !Array.isArray(r.variants)) return false;
  return r.variants.every(v => !!v && typeof v === 'object' && typeof v.path === 'string' && typeof v.width === 'number' && typeof v.height === 'number' && /^[1-9][0-9]{0,7}$/.test(String(v.width)) && /^[1-9][0-9]{0,7}$/.test(String(v.height)) && new RegExp(`^${r.property}/hero/${r.kind}/${r.id}/optimized/${uuidPattern}/${v.width}\\.(jpg|png|webp|avif)$`).test(v.path));
}
function member(user: string | null, property: string, memberships: Member[]) { return user !== null && memberships.some(m => m.user === user && m.property === property && m.active && ['owner','manager','editor'].includes(m.role)); }
function write(user: string | null, target: Row, memberships: Member[], source?: Row) { return (!source || member(user, source.property, memberships)) && member(user, target.property, memberships) && paths(target) && (target.status !== 'ready' || (target.variants as unknown[]).length > 0); }
function read(user: string | null, target: Row, memberships: Member[]) { return target.status === 'ready' || member(user, target.property, memberships); }

test('v2 static proposal preserves original hash and Storage/media delta; alternative transaction only', () => {
  assert.equal(createHash('sha256').update(original).digest('hex'), 'c37193538e29df1f67a0a1fecbeba87209b40584f7b4bc08cef1c3f07febf217');
  assert.equal(createHash('sha256').update(candidate).digest('hex'), manifest.candidate_sha256);
  const unchanged = original.slice(original.indexOf('CREATE FUNCTION public.borealis_can_write_media_object'), original.indexOf('-- Preserve media_assets_public_read'));
  assert.ok(candidate.includes(unchanged)); assert.equal((candidate.match(/^BEGIN;$/gm)||[]).length, 1); assert.equal((candidate.match(/^COMMIT;$/gm)||[]).length, 1);
  assert.match(candidate, /lock_timeout = '3s'/); assert.match(candidate, /statement_timeout = '30s'/); assert.equal(manifest.executed, false);
});
test('hero policy static boundary replaces three legacy branches, preserves public/lifecycle and trusted ownership', () => {
  for (const name of ['read','insert','update']) assert.match(candidate, new RegExp('DROP POLICY hero_assets_admin_'+name+' ON public.homepage_hero_assets'));
  const policies = candidate.slice(candidate.indexOf('CREATE POLICY borealis_hero_assets_read'));
  assert.doesNotMatch(policies, /can_manage_homepage\(/); assert.doesNotMatch(candidate, /DROP POLICY hero_assets_public_read|ALTER TABLE|DELETE FROM|INSERT INTO|UPDATE public\./);
  assert.match(policies, /FOR UPDATE TO authenticated[\s\S]*USING \(public.can_manage_property[\s\S]*WITH CHECK \(public.can_manage_property/);
  assert.match(candidate, /IMMUTABLE SECURITY INVOKER SET search_path = ''/); assert.match(candidate, /borealis_hero_paths_valid\(uuid,uuid,text,text,jsonb\) OWNER TO postgres/);
  assert.match(candidate, /7a19027fe9a390687ef548b974f90273/); assert.match(candidate, /Unexpected helper default\/explicit grant/);
  assert.match(candidate, /allow_only_operation\('object.upload'\)/); assert.doesNotMatch(candidate, /allow_only_operation\('object.sign_upload_url'\)/);
});
test('mocked hero authorization allows active O/M/E without legacy email and denies staff/disabled/nonmembers', () => {
  for (const role of ['owner','manager','editor']) assert.equal(write('u', row(), [{ user:'u', property:A, active:true, role }]), true);
  for (const memberships of [[], [{ user:'u', property:A, active:false, role:'owner' }], [{ user:'u', property:A, active:true, role:'staff' }], [{ user:'different', property:A, active:true, role:'owner' }]]) assert.equal(write('u', row(), memberships), false);
  assert.equal(write(null, row(), [{ user:'u', property:A, active:true, role:'owner' }]), false);
});
test('mocked UPDATE checks both source/target properties and complete target path integrity', () => {
  const a = [{ user:'u', property:A, active:true, role:'editor' }];
  const b = { ...row(), property:B, source:row().source.replace(A,B) };
  assert.equal(write('u', b, a, row()), false); assert.equal(write('u', row(), a, b), false);
  assert.equal(write('u', { ...row(), source:row().source.replace(A,B) }, a, row()), false);
  const multi = [...a,{ user:'u', property:B, active:true, role:'staff' }]; assert.equal(write('u', b, multi, row()), false);
  // Same-property authorized repair is possible even if a legacy source path is malformed.
  assert.equal(write('u', row(), a, { ...row(), source:'legacy-invalid' }), true);
});
test('mocked hero lifecycle preserves pending/processing and ready public reads with scoped variants', () => {
  const members = [{ user:'u', property:A, active:true, role:'editor' }];
  for (const status of ['pending','processing']) assert.equal(write('u', { ...row(), status }, members), true);
  assert.equal(write('u', { ...row(), status:'ready' }, members), false);
  const ready = { ...row(), status:'ready', variants:variants() }; assert.equal(write('u', ready, members), true);
  assert.equal(read(null, ready, []), true); assert.equal(read('staff', ready, []), true); assert.equal(read(null, row(), []), false);
  assert.equal(read('u', row(), members), true);
});
test('mocked original/variant path contract rejects malformed JSON, cross-property/kind/id and traversal', () => {
  for (const source of ['../source.jpg',row().source+'/extra',row().source.replace('/original/','//original/'),row().source.replace('/original/','/%2e%2e/'),row().source.replace(ID,attempt),row().source.replace('desktop_hero','mobile_hero')]) assert.equal(paths({ ...row(), source }), false);
  for (const values of [null,{},[null],[{}],[{...variants()[0],path:variants()[0].path.replace(A,B)}],[{...variants()[0],path:variants()[0].path.replace('1920.webp','1920.webp/extra')}],[{...variants()[0],width:'1920'}],[{...variants()[0],height:-1}]]) assert.equal(paths({ ...row(), variants:values }), false);
  assert.equal(paths({ ...row(), variants:variants() }), true);
});
