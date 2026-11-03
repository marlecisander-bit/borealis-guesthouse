import { projections, publicAssets } from './contract.ts';
import { previewPublicImages } from './public-images.ts';

export const PRODUCTION_ORIGIN = 'https://rlqyruulxyanfgvnzkpe.supabase.co';
export const PREVIEW_ORIGIN = 'http://127.0.0.1:3000';
export class PreviewPolicyError extends Error {
  constructor() { super('readonly_preview_blocked'); this.name = 'PreviewPolicyError'; }
}
const reject = (): never => { throw new PreviewPolicyError(); };
export function previewEnabled() {
  const server = process.env.BOREALIS_READONLY_PREVIEW;
  const browser = process.env.NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW;
  if (server !== undefined && server !== '1') reject();
  if (browser !== undefined && browser !== '1') reject();
  if (server === '1' && browser !== '1') reject();
  if (typeof window === 'undefined' && browser === '1' && server !== '1') reject();
  return server === '1' || browser === '1';
}
export function assertPreviewEnvironment() {
  if (!previewEnabled()) reject();
  if (process.env.NETLIFY || process.env.CONTEXT || process.env.VERCEL) reject();
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== PRODUCTION_ORIGIN) reject();
  if (process.env.NEXT_DIST_DIR !== '.next-readonly-preview-v1') reject();
  for (const key of ['SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'ICAL_SYNC_SECRET', 'STRIPE_SECRET_KEY', 'PAYMENT_PROVIDER_SECRET']) {
    if (process.env[key]) reject();
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!key.startsWith('sb_publishable_')) {
    try {
      const claim = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (claim.role !== 'anon' || claim.ref !== 'rlqyruulxyanfgvnzkpe') reject();
    } catch { reject(); }
  }
  for (const key of ['APP_URL', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL']) {
    if (process.env[key] !== PREVIEW_ORIGIN) reject();
  }
}
const pages = new Set(['/', '/about', '/rooms', '/experiences', '/transfers', '/explore-koman', '/gallery']);
export function allowedPreviewRoute(raw: string, method: string, headers: Headers) {
  try {
    const url = new URL(raw);
    if (url.origin !== PREVIEW_ORIGIN || !['GET', 'HEAD'].includes(method)) return false;
    if (headers.has('next-action') || headers.has('x-http-method-override')) return false;
    if (/%|\\|\.\./.test(url.pathname)) return false;
    if (url.pathname.startsWith('/_next/static/')) return /^[a-zA-Z0-9_./%+@~-]+$/.test(url.pathname);
    if (publicAssets.includes(url.pathname)) return !url.search;
    if (!pages.has(url.pathname)) return false;
    for (const [key, value] of url.searchParams) {
      if (url.searchParams.getAll(key).length !== 1) return false;
      if (key === 'lang' && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(value)) continue;
      if (key === '_rsc' && /^[A-Za-z0-9_-]{1,100}$/.test(value)) continue;
      return false;
    }
    return true;
  } catch { return false; }
}
// NextRequest normalizes numeric loopback URLs to localhost. This exception is
// server-only: Host remains the original HTTP authority, never a forwarded host.
export function allowedPreviewServerRequest(raw: string, method: string, headers: Headers) {
  try {
    assertPreviewEnvironment();
    if (headers.get('host') !== '127.0.0.1:3000' || headers.has('forwarded')) return false;
    const expected: Record<string, string> = {
      'x-forwarded-host': '127.0.0.1:3000', 'x-forwarded-port': '3000',
      'x-forwarded-proto': 'http', 'x-forwarded-for': '127.0.0.1',
    };
    // Next may insert these itself. They never establish authority, and any
    // contradictory, duplicate/comma-separated or unexpected value is denied.
    for (const [name, value] of Object.entries(expected)) {
      if (headers.has(name) && headers.get(name) !== value) return false;
    }
    if (headers.has('origin') && headers.get('origin') !== PREVIEW_ORIGIN) return false;
    const url = new URL(raw);
    if (url.username || url.password || url.hash ||
        ![PREVIEW_ORIGIN, 'http://localhost:3000'].includes(url.origin)) return false;
    return allowedPreviewRoute(PREVIEW_ORIGIN + url.pathname + url.search, method, headers);
  } catch { return false; }
}
export const previewCsp = `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: ${previewPublicImages.join(' ')}; font-src 'self'; media-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; worker-src 'none'`;
const published = new Set(['amenities','cms_documents','experience_images','experiences','gallery_items','homepage_sections','media_assets','navigation_items','page_seo','pricing_rules','properties','rates','reviews','room_images','room_types','seasonal_rate_periods','seo_metadata','site_settings','tourism_articles','tourism_categories','transfer_images','transfer_routes','translations']);
const visible = new Set(['amenities','experiences','gallery_items','homepage_sections','media_assets','navigation_items','rates','room_images','room_types','tourism_articles','tourism_categories','transfer_images','transfer_routes']);
const filterKeys = new Set(['id','property_id','entity_type','entity_id','language_id','document_key','page_key','setting_key','status','is_visible','is_public','active','enabled','placement','section_key','section_id','source_label','location','rule_type','media_asset_id','room_type_id','sort_order','created_at','published_at','is_featured','media_assets.status','media_assets.is_visible']);
export function approvedSupabaseRead(input: RequestInfo | URL, init?: RequestInit): [URL, RequestInit] {
  let url: URL;
  try { url = new URL(input instanceof Request ? input.url : input.toString()); } catch { return reject(); }
  const req = input instanceof Request ? input : undefined;
  const method = (init?.method || req?.method || 'GET').toUpperCase();
  if (url.origin !== PRODUCTION_ORIGIN || url.username || url.password || url.hash || method !== 'GET') reject();
  if (init?.body != null || req?.body != null || init?.credentials === 'include' || req?.credentials === 'include') reject();
  const table = /^\/rest\/v1\/([a-z_]+)$/.exec(url.pathname)?.[1];
  if (!table || !projections[table]) return reject();
  const select = url.searchParams.get('select') || '';
  if (!projections[table].includes(select.replace(/\s/g, ''))) reject();
  for (const [key, value] of url.searchParams) {
    if (url.searchParams.getAll(key).length !== 1) reject();
    if (key === 'select') continue;
    if (key === 'order' && /^[a-z_]+\.(asc|desc)(\.nulls(first|last))?(,[a-z_]+\.(asc|desc)(\.nulls(first|last))?)*$/.test(value)) continue;
    if (key === 'limit' && /^(?:[1-9][0-9]?|1[0-9]{2}|200)$/.test(value)) continue;
    if (filterKeys.has(key) && /^(eq|neq|in|ilike)\./.test(value) && value.length <= 10000) continue;
    reject();
  }
  // Tighten every public read regardless of the caller's filters; no draft mode.
  if (published.has(table)) url.searchParams.set('status', 'eq.published');
  if (visible.has(table)) url.searchParams.set('is_visible', 'eq.true');
  if (table === 'site_settings') url.searchParams.set('is_public', 'eq.true');
  if (table === 'languages') url.searchParams.set('enabled', 'eq.true');
  if (['rates','seasonal_rate_periods','pricing_rules','transfer_routes'].includes(table)) url.searchParams.set('active', 'eq.true');
  if (select.includes('media_assets(') || select.includes('media_assets!inner(')) {
    url.searchParams.set('media_assets.status', 'eq.published');
    url.searchParams.set('media_assets.is_visible', 'eq.true');
  }
  if (!url.searchParams.has('limit')) url.searchParams.set('limit', '200');
  const incoming = new Headers(init?.headers || req?.headers);
  if (incoming.has('cookie')) reject();
  for (const key of ['accept-profile','content-profile']) if (incoming.has(key) && incoming.get(key) !== 'public') reject();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const headers = new Headers({ apikey: key, Accept: incoming.get('accept') || 'application/json' });
  if (key.startsWith('eyJ')) headers.set('Authorization', `Bearer ${key}`);
  // Never forward caller auth, cookies, Range, method overrides or proxy headers.
  return [url, { method: 'GET', headers, credentials: 'omit', redirect: 'error', cache: 'no-store', signal: init?.signal || req?.signal }];
}
export function guardedFetch(delegate: typeof fetch): typeof fetch {
  return async (input, init) => {
    const [url, options] = approvedSupabaseRead(input, init);
    return delegate(url, options);
  };
}
