import sharp from 'sharp';
import { HERO_IMAGE_CONFIG, heroWidths, type HeroAssetKind } from './hero-image-config.ts';

// Every variant is decoded from the untouched source, never from another variant.
export async function processHeroImage(source: Buffer, kind: HeroAssetKind) {
  if (!source.length || source.length > HERO_IMAGE_CONFIG.maxBytes) throw new Error('Choose an image up to 24 MB.');
  const options = { limitInputPixels: HERO_IMAGE_CONFIG.maxPixels, failOn: 'error' as const };
  const metadata = await sharp(source, options).metadata();
  if (!['jpeg', 'png', 'webp', 'heif', 'avif'].includes(metadata.format || '') || (metadata.pages || 1) > 1) throw new Error('Choose a still JPEG, PNG, WebP or AVIF image.');
  if (metadata.format === 'heif' && metadata.compression !== 'av1') throw new Error('Use AVIF rather than HEIC.');
  const rotated = (metadata.orientation || 1) >= 5;
  const width = (rotated ? metadata.height : metadata.width)!;
  const height = (rotated ? metadata.width : metadata.height)!;
  if (!width || !height) throw new Error('This image could not be read.');
  if (width * height > HERO_IMAGE_CONFIG.maxPixels) throw new Error('Choose an image with fewer than 60 megapixels.');
  const originalExt = metadata.format === 'jpeg' ? 'jpg' : metadata.format === 'heif' ? 'avif' : metadata.format!;
  const variants = [];
  for (const target of heroWidths(kind, width)) {
    if (target === width && source.length <= HERO_IMAGE_CONFIG.preserveBelowBytes && (!metadata.orientation || metadata.orientation === 1)) {
      // Validate the pixels as well as the header before preserving bytes unchanged.
      await sharp(source, options).stats();
      variants.push({ bytes: source, width, height, ext: originalExt, mime: `image/${originalExt === 'jpg' ? 'jpeg' : originalExt}` });
    } else {
      const { data, info } = await sharp(source, options).autoOrient().resize({ width: target, withoutEnlargement: true })
        .withIccProfile('srgb').webp({ quality: HERO_IMAGE_CONFIG.webpQuality, effort: 4 }).timeout({ seconds: 25 }).toBuffer({ resolveWithObject: true });
      variants.push({ bytes: data, width: info.width, height: info.height, ext: 'webp', mime: 'image/webp' });
    }
  }
  return { width, height, variants };
}
