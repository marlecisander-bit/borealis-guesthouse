import { approvedSupabaseRead, previewEnabled } from '../readonly-preview/policy';
const DEFAULT_SUPABASE_TIMEOUT_MS = 3500;

/** Prevent server-rendered pages from hanging when Supabase is unreachable. */
export function fetchSupabase(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (previewEnabled()) {
    const [url, options] = approvedSupabaseRead(input, init);
    return fetch(url, { ...options, signal: AbortSignal.timeout(DEFAULT_SUPABASE_TIMEOUT_MS) });
  }
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  const privateCms = /^\/rest\/v1\/rpc\/borealis_(?:admin_cms_documents|save_cms_document)$/.test(url.pathname);
  return fetch(input, {
    cache: 'no-store', // Live/authenticated callers stay fresh; only the public CMS wrapper opts in.
    ...init,
    ...(privateCms ? {cache: 'no-store' as const, next: {revalidate: 0}} : {}),
    signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(DEFAULT_SUPABASE_TIMEOUT_MS)])
      : AbortSignal.timeout(DEFAULT_SUPABASE_TIMEOUT_MS),
  });
}
