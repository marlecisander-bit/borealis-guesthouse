import type { SupabaseClient } from '@supabase/supabase-js';
import { heroOriginalPath, isCanonicalMediaId, validHeroSize } from './media-upload-security';
import { type HeroAssetKind } from './hero-image-config';

/** Direct transport with the current browser session; never a signed capability. */
export async function uploadHeroOriginal(db: SupabaseClient, started: { id: string; propertyId: string; path: string }, file: File, kind: HeroAssetKind) {
  if (!started || !isCanonicalMediaId(started.id) || !validHeroSize(file.size) || started.path !== heroOriginalPath(started.propertyId, kind, started.id, file.type)) throw new Error('Invalid Hero upload. Choose the image again.');
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) throw new Error('Your Admin session has expired. Sign in again, then retry.');
  const membership = await db.from('admin_profiles').select('property_id,role,is_active').eq('user_id', user.id).eq('property_id', started.propertyId).eq('is_active', true).in('role', ['owner', 'manager', 'editor']).maybeSingle();
  if (membership.error || !membership.data || membership.data.property_id !== started.propertyId || !membership.data.is_active || !['owner', 'manager', 'editor'].includes(membership.data.role)) throw new Error('You no longer have permission to upload this image.');
  const uploaded = await db.storage.from('public-media').upload(started.path, file, { upsert: false, contentType: file.type, cacheControl: '31536000' });
  if (uploaded.error) throw new Error('Upload interrupted or permission expired. Sign in if needed, then choose the image again.');
}
