/** Keep sign-in and verification continuations inside the admin app. */
export function adminReturnTo(value: string | null | undefined, fallback = '/admin/dashboard'): string {
  if (!value || !value.startsWith('/') || value.includes('\\')) return fallback;
  if ([...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return fallback;
  const origin = 'https://admin.invalid';
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || (url.pathname !== '/admin' && !url.pathname.startsWith('/admin/'))) return fallback;
    if (['/admin/login','/admin/mfa'].includes(url.pathname.replace(/\/$/, ''))) return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}
