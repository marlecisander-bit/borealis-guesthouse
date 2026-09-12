import { getImageProps } from 'next/image';
import type { CSSProperties } from 'react';
import { heroFocalPoint, type HeroAsset } from '@/lib/hero-image-config';

export function HeroImage({ desktopImage, mobileImage, alt, overlayIntensity, desktopAsset, mobileAsset, desktopFocal, mobileFocal }: {
  desktopImage: string;
  mobileImage?: string;
  alt: string;
  overlayIntensity?: unknown;
  desktopAsset?: HeroAsset;
  mobileAsset?: HeroAsset;
  desktopFocal?: unknown;
  mobileFocal?: unknown;
}) {
  const common = { alt, fill: true, quality: 93, sizes: '100vw', loading: 'eager' as const, fetchPriority: 'high' as const, className: 'hero-responsive-image object-cover' };
  const { props: desktop } = getImageProps({ ...common, src: desktopImage });
  const { props: mobile } = getImageProps({ ...common, src: mobileImage || desktopImage });
  const desktopVariants = desktopAsset?.variants;
  const mobileVariants = mobileAsset?.variants || (!mobileImage ? desktopVariants : undefined);
  const srcSet = (variants: NonNullable<typeof desktopVariants>) => variants.map(item => `${item.url} ${item.width}w`).join(', ');
  const desktopPoint = heroFocalPoint(desktopFocal);
  const mobilePoint = heroFocalPoint(mobileFocal, true);
  const intensity = typeof overlayIntensity === 'number' && Number.isFinite(overlayIntensity)
    ? Math.max(0, Math.min(100, overlayIntensity)) : 100;

  return <>
    <picture style={{ '--hero-desktop-position': `${desktopPoint.x}% ${desktopPoint.y}%`, '--hero-mobile-position': `${mobilePoint.x}% ${mobilePoint.y}%` } as CSSProperties}>
      <source media="(max-width: 767px)" srcSet={mobileVariants?.length ? srcSet(mobileVariants) : mobile.srcSet || mobile.src} sizes="100vw" />
      {/* getImageProps supplies optimized responsive URLs without preloading the wrong image. */}
      <img {...desktop} src={desktopVariants?.length ? desktopVariants[desktopVariants.length - 1].url : desktop.src} srcSet={desktopVariants?.length ? srcSet(desktopVariants) : desktop.srcSet} alt={alt} />
    </picture>
    <div aria-hidden="true" style={{ opacity: intensity / 100 }} className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,25,18,.58)_0%,rgba(10,25,18,.10)_38%,rgba(10,25,18,.72)_100%)]" />
  </>;
}
