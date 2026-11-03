/** E.164-shaped international number. Never guesses a country code or uses a fallback contact. */
export function normalizeWhatsAppNumber(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let input = value.trim();
  // Older settings accepted WhatsApp links; retain only an exact wa.me number.
  if (/^https:\/\/wa\.me\//i.test(input)) {
    try {
      const url = new URL(input);
      if (url.hostname.toLowerCase() !== 'wa.me' || url.username || url.password || url.port || url.search || url.hash) return null;
      input = url.pathname.slice(1);
    } catch { return null; }
  }
  const compact = input.replace(/[\s().-]/g, '');
  return /^\+?[1-9]\d{7,14}$/.test(compact) ? compact.replace(/^\+/, '') : null;
}
export function whatsAppHref(value: unknown): string {
  const number = normalizeWhatsAppNumber(value);
  return number ? `https://wa.me/${number}` : '';
}
