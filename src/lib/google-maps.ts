const directGoogleMapsHosts = new Set(['google.com', 'www.google.com', 'maps.google.com']);
const shortGoogleMapsHosts = new Set(['maps.app.goo.gl', 'goo.gl']);

function parsedGoogleMapsUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    const hostname = url.hostname.toLowerCase();
    if (shortGoogleMapsHosts.has(hostname)) {
      return hostname !== 'goo.gl' || url.pathname.startsWith('/maps') ? url : null;
    }
    if (!directGoogleMapsHosts.has(hostname)) return null;
    return url.pathname.startsWith('/maps') || hostname === 'maps.google.com' ? url : null;
  } catch {
    return null;
  }
}

export function isGoogleMapsUrl(value: string): boolean {
  return parsedGoogleMapsUrl(value.trim()) !== null;
}

export function isShortGoogleMapsUrl(value: string): boolean {
  const url = parsedGoogleMapsUrl(value.trim());
  return Boolean(url && shortGoogleMapsHosts.has(url.hostname.toLowerCase()));
}

function decoded(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

export function googleMapsQueryFromUrl(value: string): string | null {
  const url = parsedGoogleMapsUrl(value.trim());
  if (!url) return null;
  for (const key of ['q', 'query', 'destination', 'daddr']) {
    const query = url.searchParams.get(key)?.trim();
    if (query) return query;
  }
  const coordinates = url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
    || url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (coordinates) return `${coordinates[1]},${coordinates[2]}`;
  const place = url.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/i)?.[1];
  return place ? decoded(place).trim() || null : null;
}

export function googleMapsEmbedUrl(query: string): string {
  const params = new URLSearchParams({ q: query, output: 'embed', z: '15' });
  return `https://www.google.com/maps?${params.toString()}`;
}
