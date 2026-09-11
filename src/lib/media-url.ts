const defaultBucket = 'public-media';

export function resolvePublicMediaUrl(path?: string | null, bucket = defaultBucket) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!base || !path) return '/borealis-placeholder.svg';
  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export const mediaBucket = defaultBucket;
