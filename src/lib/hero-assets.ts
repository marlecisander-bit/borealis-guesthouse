import type { SupabaseClient } from '@supabase/supabase-js';
import { resolvePublicMediaUrl } from '@/lib/media-url';
import type { HeroAsset, HeroAssetKind } from '@/lib/hero-image-config';

export type HeroAssetRow = { id: string; kind: HeroAssetKind; filename: string; width: number; height: number; size_bytes: number; variants: { path: string; width: number; height: number }[] };
export const heroAssetColumns = 'id,kind,filename,width,height,size_bytes,variants';
export function mapHeroAsset(row: HeroAssetRow): HeroAsset {
  return { id: row.id, kind: row.kind, filename: row.filename, width: row.width, height: row.height, sizeBytes: row.size_bytes,
    variants: row.variants.map(item => ({ url: resolvePublicMediaUrl(item.path), width: item.width, height: item.height })) };
}
export async function readHeroAssets(db: Pick<SupabaseClient, 'from'>, sections: { settings: Record<string, unknown> }[]): Promise<Record<string, HeroAsset>> {
  const ids = sections.flatMap(section => [section.settings.desktopHeroAssetId, section.settings.mobileHeroAssetId]).filter((id): id is string => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id));
  if (!ids.length) return {};
  const { data } = await db.from('homepage_hero_assets').select(heroAssetColumns).in('id', ids).eq('status', 'ready');
  // Preserve legacy images if this additive migration has not been applied yet.
  return Object.fromEntries(((data || []) as HeroAssetRow[]).map(row => [row.id, mapHeroAsset(row)]));
}
