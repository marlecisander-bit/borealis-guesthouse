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

  return <>
    <ResponsiveHeroImage desktopImage={desktopImage} mobileImage={mobileImage} alt={alt} mobileAlt={mobileAlt} desktopAsset={desktopAsset} mobileAsset={mobileAsset} desktopFocal={desktopFocal} mobileFocal={mobileFocal} quality={93}/>
    <div aria-hidden="true" style={{ opacity: intensity / 100 }} className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,25,18,.58)_0%,rgba(10,25,18,.10)_38%,rgba(10,25,18,.72)_100%)]" />
  </>;
}
