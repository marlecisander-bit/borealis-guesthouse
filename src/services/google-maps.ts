import 'server-only';
import { googleMapsEmbedUrl, googleMapsQueryFromUrl, isGoogleMapsUrl, isShortGoogleMapsUrl } from '@/lib/google-maps';

async function resolveShortUrl(value: string): Promise<string | null> {
  if (!isShortGoogleMapsUrl(value)) return value;
  try {
    let current = value;
    for (let redirectCount = 0; redirectCount < 5; redirectCount += 1) {
      const response = await fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(3500),
        next: { revalidate: 86400 },
      });
      const location = response.headers.get('location');
      if (!location) return current;
      const nextUrl = new URL(location, current).toString();
      if (!isGoogleMapsUrl(nextUrl)) return null;
      current = nextUrl;
      if (!isShortGoogleMapsUrl(current)) return current;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getGoogleMapsEmbedUrl(mapsUrl: string, address: string): Promise<string | null> {
  if (!isGoogleMapsUrl(mapsUrl)) return null;
  const resolved = await resolveShortUrl(mapsUrl);
  const query = resolved ? googleMapsQueryFromUrl(resolved) : null;
  const fallbackQuery = address.trim();
  return query || fallbackQuery ? googleMapsEmbedUrl(query || fallbackQuery) : null;
}
