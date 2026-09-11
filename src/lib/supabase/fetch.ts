const DEFAULT_SUPABASE_TIMEOUT_MS = 3500;

/** Prevent server-rendered pages from hanging when Supabase is unreachable. */
export function fetchSupabase(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(DEFAULT_SUPABASE_TIMEOUT_MS)])
      : AbortSignal.timeout(DEFAULT_SUPABASE_TIMEOUT_MS),
  });
}
