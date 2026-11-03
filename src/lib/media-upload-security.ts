import type { AdminSession } from '@/lib/admin/auth';
import { HERO_IMAGE_CONFIG, type HeroAssetKind } from './hero-image-config.ts';

const canonicalUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const isCanonicalMediaId = (value: unknown): value is string => typeof value === 'string' && canonicalUuid.test(value);
// Call only with getCurrentAdmin(), which verifies the user and active membership.
export function canUploadMedia(session: AdminSession | null): session is AdminSession {
  return !!session && ['owner', 'manager', 'editor'].includes(session.role) && isCanonicalMediaId(session.propertyId) && isCanonicalMediaId(session.userId);
}
export function heroOriginalPath(propertyId: string, kind: HeroAssetKind, id: string, mime: string) {
  if (!isCanonicalMediaId(propertyId) || !isCanonicalMediaId(id) || !['desktop_hero', 'mobile_hero'].includes(kind) || !Object.hasOwn(HERO_IMAGE_CONFIG.mimeExtensions, mime)) throw new Error('Invalid Hero source.');
  return `${propertyId}/hero/${kind}/${id}/original/source.${HERO_IMAGE_CONFIG.mimeExtensions[mime as keyof typeof HERO_IMAGE_CONFIG.mimeExtensions]}`;
}
export function validHeroSize(size: unknown): size is number {
  return typeof size === 'number' && Number.isInteger(size) && size > 0 && size <= HERO_IMAGE_CONFIG.maxBytes;
}
export function detectMediaImage(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value)) return { mime: 'image/png', ext: 'png' };
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length >= 12 && text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  if (bytes.length >= 12 && text(4, 8) === 'ftyp' && ['avif', 'avis'].includes(text(8, 12))) return { mime: 'image/avif', ext: 'avif' };
  return null;
}
