export type HeroAssetKind = 'desktop_hero' | 'mobile_hero';
export type HeroFocalPoint = { x: number; y: number };
export type HeroVariant = { url: string; width: number; height: number };
export type HeroAsset = { id: string; kind: HeroAssetKind; filename: string; width: number; height: number; sizeBytes: number; variants: HeroVariant[] };

export const HERO_IMAGE_CONFIG = {
  maxBytes: 24 * 1024 * 1024,
  maxPixels: 60_000_000,
  webpQuality: 93,
  preserveBelowBytes: 4 * 1024 * 1024,
  widths: { desktop_hero: [1920, 2560, 3000], mobile_hero: [1080, 1440, 1600] },
  mimeExtensions: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' },
} as const;

export function heroWidths(kind: HeroAssetKind, sourceWidth: number) {
  const widths = HERO_IMAGE_CONFIG.widths[kind];
  return [...new Set([...widths.filter(width => width < sourceWidth), Math.min(sourceWidth, widths[widths.length - 1])])];
}

export function heroFocalPoint(value: unknown, mobile = false): HeroFocalPoint {
  const fallback = { x: 50, y: mobile ? 42 : 50 };
  if (!value || typeof value !== 'object') return fallback;
  const { x, y } = value as HeroFocalPoint;
  return Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 100 && y >= 0 && y <= 100 ? { x, y } : fallback;
}

export function heroResolutionWarning(kind: HeroAssetKind, width: number) {
  return width < (kind === 'desktop_hero' ? 1920 : 1080)
    ? 'Image resolution is lower than recommended and may appear soft on Retina displays.' : '';
}
