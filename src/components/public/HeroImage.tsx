import {ResponsiveHeroImage} from './ResponsiveHeroImage';
import { type HeroAsset } from '@/lib/hero-image-config';

export function HeroImage({ desktopImage, mobileImage, alt, overlayIntensity, desktopAsset, mobileAsset, desktopFocal, mobileFocal, mobileAlt }: {
  desktopImage: string;
  mobileImage?: string;
  mobileAlt?: string;
  alt: string;
  overlayIntensity?: unknown;
  desktopAsset?: HeroAsset;
  mobileAsset?: HeroAsset;
  desktopFocal?: unknown;
  mobileFocal?: unknown;
}) {
  const intensity = typeof overlayIntensity === 'number' && Number.isFinite(overlayIntensity)
    ? Math.max(0, Math.min(100, overlayIntensity)) : 100;

  // On tall screens object-fit enlarges landscape images to fill the hero's height.
  // Keep the phone source sharp while limiting the extra download on narrow screens.
  const mobileSizes = 'max(100vw, min(135dvh, 600px))';

  return <>
    <ResponsiveHeroImage desktopImage={desktopImage} mobileImage={mobileImage} alt={alt} mobileAlt={mobileAlt} desktopAsset={desktopAsset} mobileAsset={mobileAsset} desktopFocal={desktopFocal} mobileFocal={mobileFocal} mobileSizes={mobileSizes} quality={85}/>
    <div aria-hidden="true" style={{ opacity: intensity / 100 }} className="absolute inset-0 homepage-hero-overlay" />
  </>;
}
