import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { HeroImage } from '@/components/public/HeroImage';
import Link from 'next/link';
import { BookingSearch } from '@/components/public/BookingSearch';
import { MobileBookingBar } from '@/components/public/MobileBookingBar';
import { HomepageSections } from '@/components/public/HomepageSections';
import { HomepageFooter } from '@/components/public/Footer';
import { Header } from '@/components/public/Header';
import { createPageMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';
import { getHomepageCms } from '@/services/homepage-cms';
import{localizeHomepageCms}from'@/services/homepage-translations';
import{getLanguageContext}from'@/services/translations';
import { getNavigation, getOccupancyAgePolicy, getSiteDocument } from '@/services/site-content';
import type { HomepageKey } from '@/types/homepage-cms';
import {authorizePreview} from '@/lib/preview';
import {PreviewBanner} from '@/components/public/PreviewBanner';
import {getPublishedHomepageHero} from '@/lib/repositories/public/homepage';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export async function generateMetadata():Promise<Metadata>{return createPageMetadata('homepage')}

export default async function Home({searchParams}:{searchParams:Promise<{preview?:string}>}) {
  const preview=Boolean(await authorizePreview('homepage',(await searchParams).preview));
  const [liveProperty, homepageCmsRaw, publishedHero, navigation,language,globalContent,agePolicy] = await Promise.all([
    contentRepository.getProperty(),
    getHomepageCms(preview),
    preview?Promise.resolve(null):getPublishedHomepageHero(),
    getNavigation('header'),getLanguageContext(),getSiteDocument('global'),getOccupancyAgePolicy(),
  ]);
  const homepageCms=await localizeHomepageCms(homepageCmsRaw);
  const section=(key:HomepageKey)=>homepageCms?.sections.find(item=>item.key===key);
  const visible=(key:HomepageKey)=>!section(key)||section(key)!.visible;
  const order=(key:HomepageKey,fallback:number)=>section(key)?.sortOrder??fallback;
  const draftHero=section('hero'),hero=preview?draftHero:publishedHero?{...draftHero,title:draftHero?.title||publishedHero.headline,subtitle:draftHero?.subtitle||publishedHero.subtitle,eyebrow:draftHero?.eyebrow||publishedHero.eyebrow,ctaLabel:draftHero?.ctaLabel||publishedHero.primaryCtaLabel,ctaLink:publishedHero.primaryCtaHref,visible:publishedHero.visible,sortOrder:publishedHero.sortOrder,settings:{...(draftHero?.settings||{}),showBookingSearch:publishedHero.bookingSearchVisible}}:undefined,finalSection=section('final_cta');
  const heroSettings = hero?.settings as Record<string, unknown> | undefined;
  const bookingCtaLabel=(hero?.settings as Record<string,unknown>|undefined)?.bookingCtaLabel;
  return (
    <>
      <Header overlay navigation={navigation} languages={language.enabled} selectedLanguage={language.selected?.code||''} bookingCtaLabel={globalContent.headerCtaLabel||'Book now'} mobileBookingCtaLabel={globalContent.mobileMenuCtaLabel||'Check availability'}/>
      <main className="flex flex-col">{preview&&<PreviewBanner label="Homepage draft preview"/>}
        {visible('hero')&&<section data-homepage-section="hero" style={{order:order('hero',0)}} className="hero-section relative z-30 min-h-[88svh] bg-lake text-white lg:min-h-[94svh]">
          <HeroImage desktopAsset={homepageCms?.heroAssets[String(heroSettings?.desktopHeroAssetId || '')]} mobileAsset={homepageCms?.heroAssets[String(heroSettings?.mobileHeroAssetId || '')]} desktopFocal={heroSettings?.desktopFocal} mobileFocal={heroSettings?.mobileFocal} desktopImage={!preview&&publishedHero?.imageUrl?publishedHero.imageUrl:hero?.backgroundMediaId?homepageCms?.mediaUrls[hero.backgroundMediaId]||liveProperty.heroImage:liveProperty.heroImage} mobileImage={homepageCms?.mediaUrls[String(heroSettings?.mobileMediaId || '')]} alt={String(heroSettings?.imageAlt || hero?.title || 'Koman Lake surrounded by mountain slopes')} overlayIntensity={heroSettings?.overlayIntensity} />
          <div className="hero-content shell relative flex min-h-[88svh] flex-col justify-end pb-7 pt-28 lg:min-h-[94svh] lg:pb-0">
            <div className="hero-copy max-w-3xl pb-7 md:pb-10">
              <p className="text-[.68rem] font-bold uppercase tracking-[0.26em] text-sand">{hero?.eyebrow||'Borealis Guest House · Koman, Albania'}</p>
              <h1 className="mt-4 max-w-[12ch] font-serif text-[clamp(3rem,7vw,6.8rem)] font-medium leading-[.88] tracking-[-.045em]">{hero?.title||'Wake up by the water.'}</h1>
              <p className="mt-5 max-w-xl text-[.95rem] leading-7 text-white/80 md:text-lg">{hero?.subtitle||'A lakeside stay in the heart of Koman.'}</p>
              {hero?.ctaLabel&&<Link href={hero.ctaLink||'/book'} className="mt-6 inline-block rounded-full bg-sand px-6 py-3 text-sm font-bold text-lake">{hero.ctaLabel}</Link>}
            </div>
            {hero?.settings.showBookingSearch!==false&&<div className="hero-booking md:translate-y-1/2"><BookingSearch hero ctaLabel={(typeof bookingCtaLabel==='string'&&bookingCtaLabel)||'Check availability'} infantMaxAge={agePolicy.infantMaxAge} childMaxAge={agePolicy.childMaxAge}/></div>}
          </div>
        </section>}

        <Suspense fallback={<div aria-hidden="true" className="min-h-[40rem]" style={{order:10}}/>}><HomepageSections homepageCms={homepageCms} liveProperty={liveProperty}/></Suspense>
      </main>
      <Suspense fallback={null}><HomepageFooter
        backgroundImage={finalSection?.backgroundMediaId ? homepageCms?.mediaUrls[finalSection.backgroundMediaId] || liveProperty.heroImage : liveProperty.heroImage}
        backgroundAlt={String(finalSection?.settings.imageAlt || 'Borealis Guest House beside the lake in Koman')}
        showCta={visible('final_cta')}
        ctaEyebrow={finalSection?.eyebrow}
        ctaTitle={finalSection?.title}
        ctaBody={finalSection?.body || finalSection?.subtitle}
        ctaLabel={finalSection?.ctaLabel}
        ctaHref={finalSection?.ctaLink}
      /></Suspense>
      <MobileBookingBar label={globalContent.mobileBarCtaLabel||'Check availability'} />
    </>
  );
}
