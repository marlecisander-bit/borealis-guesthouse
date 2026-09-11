import type { Metadata } from 'next';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookingSearch } from '@/components/public/BookingSearch';
import { MobileBookingBar } from '@/components/public/MobileBookingBar';
import { MapFallback, MapPlaceholder } from '@/components/public/MapPlaceholder';
import { ExperienceCard, RoomCard, SectionHeader } from '@/components/public/Cards';
import { Footer } from '@/components/public/Footer';
import { Header } from '@/components/public/Header';
import type { GalleryItem,Review } from '@/types/public';
import { createPageMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';
import { getHomepageCms } from '@/services/homepage-cms';
import{localizeHomepageCms}from'@/services/homepage-translations';
import{getLanguageContext}from'@/services/translations';
import { getContactInfo, getNavigation, getSiteDocument } from '@/services/site-content';
import type { HomepageKey } from '@/types/homepage-cms';
import {authorizePreview} from '@/lib/preview';
import {PreviewBanner} from '@/components/public/PreviewBanner';
import {getPublishedHomepageHero} from '@/lib/repositories/public/homepage';

const reviews:Review[]=[];
export async function generateMetadata():Promise<Metadata>{return createPageMetadata('homepage')}

export default async function Home({searchParams}:{searchParams:Promise<{preview?:string}>}) {
  const preview=Boolean(await authorizePreview('homepage',(await searchParams).preview));
  const [liveProperty, allRooms, allExperiences, allGallery, homepageCmsRaw, publishedHero, liveArticles, liveTransfers, navigation,language,globalContent,contact] = await Promise.all([
    contentRepository.getProperty(),
    contentRepository.getRooms(),
    contentRepository.getExperiences(),
    contentRepository.getGallery(),
    getHomepageCms(preview),
    preview?Promise.resolve(null):getPublishedHomepageHero(),
    contentRepository.getArticles(),
    contentRepository.getTransfers(),
    getNavigation('header'),getLanguageContext(),getSiteDocument('global'),getContactInfo(),
  ]);
  const homepageCms=await localizeHomepageCms(homepageCmsRaw);
  const section=(key:HomepageKey)=>homepageCms?.sections.find(item=>item.key===key);
  const visible=(key:HomepageKey)=>!section(key)||section(key)!.visible;
  const order=(key:HomepageKey,fallback:number)=>section(key)?.sortOrder??fallback;
  const selected=<T extends {id:string}>(items:T[],key:HomepageKey)=>{const links=section(key)?.links||[];return links.length?links.flatMap(link=>{const item=items.find(candidate=>candidate.id===link.id);return item?[item]:[]}):items};
  const liveRooms=selected(allRooms,'featured_rooms'),featuredExperiences=allExperiences.filter(item=>item.featured),liveExperiences=featuredExperiences.length?featuredExperiences:selected(allExperiences,'featured_experiences'),featuredTransfers=liveTransfers.filter(item=>item.featured),homepageTransfers=featuredTransfers.length?featuredTransfers:selected(liveTransfers,'transfers'),liveGallery=selected(allGallery,'gallery'),liveReviews=homepageCms?.reviews.length?homepageCms.reviews:reviews;
  const draftHero=section('hero'),hero=preview?draftHero:publishedHero?{...draftHero,title:draftHero?.title||publishedHero.headline,subtitle:draftHero?.subtitle||publishedHero.subtitle,eyebrow:draftHero?.eyebrow||publishedHero.eyebrow,ctaLabel:draftHero?.ctaLabel||publishedHero.primaryCtaLabel,ctaLink:publishedHero.primaryCtaHref,visible:publishedHero.visible,sortOrder:publishedHero.sortOrder,settings:{...(draftHero?.settings||{}),showBookingSearch:publishedHero.bookingSearchVisible}}:undefined,intro=section('intro'),roomSection=section('featured_rooms'),experienceSection=section('featured_experiences'),exploreSection=section('explore_koman'),transferSection=section('transfers'),gallerySection=section('gallery'),reviewSection=section('reviews'),locationSection=section('location'),finalSection=section('final_cta');
  const bookingCtaLabel=(hero?.settings as Record<string,unknown>|undefined)?.bookingCtaLabel;
  return (
    <>
      <Header overlay navigation={navigation} languages={language.enabled} selectedLanguage={language.selected?.code||''} bookingCtaLabel={globalContent.headerCtaLabel||'Book now'} mobileBookingCtaLabel={globalContent.mobileMenuCtaLabel||'Check availability'}/>
      <main className="flex flex-col">{preview&&<PreviewBanner label="Homepage draft preview"/>}
        {visible('hero')&&<section data-homepage-section="hero" style={{order:order('hero',0)}} className="hero-section relative z-30 min-h-[88svh] bg-lake text-white lg:min-h-[94svh]">
          <Image src={!preview&&publishedHero?.imageUrl?publishedHero.imageUrl:hero?.backgroundMediaId?homepageCms?.mediaUrls[hero.backgroundMediaId]||liveProperty.heroImage:liveProperty.heroImage} alt={String((hero?.settings as Record<string,unknown>|undefined)?.imageAlt||'Koman Lake surrounded by mountain slopes')} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,25,18,.58)_0%,rgba(10,25,18,.10)_38%,rgba(10,25,18,.72)_100%)]" />
          <div className="shell relative flex min-h-[88svh] flex-col justify-end pb-7 pt-28 lg:min-h-[94svh] lg:pb-0">
            <div className="max-w-3xl pb-7 md:pb-10">
              <p className="text-[.68rem] font-bold uppercase tracking-[0.26em] text-sand">{hero?.eyebrow||'Borealis Guest House · Koman, Albania'}</p>
              <h1 className="mt-4 max-w-[12ch] font-serif text-[clamp(3rem,7vw,6.8rem)] font-medium leading-[.88] tracking-[-.045em]">{hero?.title||'Wake up by the water.'}</h1>
              <p className="mt-5 max-w-xl text-[.95rem] leading-7 text-white/80 md:text-lg">{hero?.subtitle||'A lakeside stay in the heart of Koman.'}</p>
              {hero?.ctaLabel&&<Link href={hero.ctaLink||'/book'} className="mt-6 inline-block rounded-full bg-sand px-6 py-3 text-sm font-bold text-lake">{hero.ctaLabel}</Link>}
            </div>
            {hero?.settings.showBookingSearch!==false&&<div className="md:translate-y-1/2"><BookingSearch hero ctaLabel={(typeof bookingCtaLabel==='string'&&bookingCtaLabel)||'Check availability'} /></div>}
          </div>
        </section>}

        {visible('intro')&&<section data-homepage-section="intro" style={{order:order('intro',20)}} className="py-20 md:py-32">
          <div className="shell grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr] lg:gap-20">
            <div className="relative min-h-[32rem] overflow-hidden rounded-[2rem] md:min-h-[42rem]">
              <Image src={intro?.backgroundMediaId?homepageCms?.mediaUrls[intro.backgroundMediaId]||liveProperty.heroImage:liveProperty.heroImage} alt={String(intro?.settings.imageAlt||'A peaceful terrace surrounded by nature')} fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" />
              <div className="absolute bottom-5 left-5 rounded-xl bg-white/90 px-4 py-3 text-xs font-bold uppercase tracking-widest text-lake backdrop-blur">{String(intro?.settings.imageLabel||'Slow mornings · Open air')}</div>
            </div>
            <div>
              <p className="eyebrow">{intro?.eyebrow||'Welcome to Borealis'}</p>
              <h2 className="mt-4 font-serif text-5xl leading-[1.02] text-lake md:text-6xl">{intro?.title||'Close to nature. Warm by design.'}</h2>
              <p className="mt-7 max-w-md text-lg leading-8 text-muted">{intro?.body||intro?.subtitle||'A small lakeside guesthouse for restful rooms, generous breakfasts and days that unfold on the water.'}</p>
              <Link href={intro?.ctaLink||'/about'} className="mt-8 inline-block border-b-2 border-sand pb-1 text-sm font-bold text-lake">{intro?.ctaLabel||'Our story'}</Link>
            </div>
          </div>
        </section>}

        {visible('featured_rooms')&&<section style={{order:order('featured_rooms',30)}} className="bg-ivory py-20 md:py-28">
          <div className="shell">
            <div className="flex items-end justify-between gap-6">
              <SectionHeader eyebrow={roomSection?.eyebrow||'Stay at Borealis'} title={roomSection?.title||'Our Rooms'} copy={roomSection?.subtitle||roomSection?.body||'Natural textures, quiet comfort and the lake always close by.'} />
              <Link href={roomSection?.ctaLink||'/rooms'} className="hidden border-b-2 border-sand pb-1 text-sm font-bold text-lake md:block">{roomSection?.ctaLabel||'See all rooms'}</Link>
            </div>
            <div className="-mx-4 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-5 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
              {liveRooms.map((room) => <RoomCard key={room.id} room={room} variant="featured"/>)}
            </div>
          </div>
        </section>}

        {visible('featured_experiences')&&<section style={{order:order('featured_experiences',40)}} className="py-20 md:py-28">
          <div className="shell"><SectionHeader eyebrow={experienceSection?.eyebrow||'Experience Koman'} title={experienceSection?.title||'The lake is only the beginning.'} copy={experienceSection?.subtitle||experienceSection?.body||'Paddle quiet coves, travel hidden shores and see the landscape with local perspective.'} /><div className="mt-12 grid gap-5 md:grid-cols-3">{liveExperiences.slice(0,3).map((item) => <ExperienceCard key={item.id} item={item} />)}</div>{experienceSection?.ctaLabel&&<Link href={experienceSection.ctaLink||'/experiences'} className="mt-8 inline-block border-b-2 border-sand pb-1 text-sm font-bold text-lake">{experienceSection.ctaLabel}</Link>}</div>
        </section>}

        {visible('explore_koman')&&<section style={{order:order('explore_koman',50)}} className="bg-lake py-20 text-white md:py-28">
          <div className="shell">
            <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end"><div><p className="eyebrow text-sand">{exploreSection?.eyebrow||'Explore Koman'}</p><h2 className="mt-4 font-serif text-5xl leading-none md:text-7xl">{exploreSection?.title||'A destination worth staying for.'}</h2><p className="mt-6 max-w-md leading-7 text-white/65">{exploreSection?.body||exploreSection?.subtitle||'Travel notes for Koman Lake, the Shala River, the ferry and the mountain paths beyond the shore.'}</p><Link href={exploreSection?.ctaLink||'/explore-koman'} className="mt-8 inline-block rounded-full bg-sand px-6 py-3 text-sm font-bold text-lake">{exploreSection?.ctaLabel||'Explore Koman'}</Link></div><div className="grid gap-5 sm:grid-cols-2">{selected(liveArticles,'explore_koman').slice(0,2).map((article,index)=><Link key={article.id} href={`/explore-koman/${article.slug}`} className={`group ${index===1?'sm:translate-y-10':''}`}><div className="relative aspect-[4/5] overflow-hidden rounded-2xl"><Image src={article.image} alt={article.title} fill sizes="(max-width: 640px) 100vw, 30vw" className="object-cover transition duration-700 group-hover:scale-105"/></div><p className="mt-4 text-xs font-bold uppercase tracking-widest text-sand">{article.category.name} · {article.readTime}</p><h3 className="mt-2 font-serif text-3xl">{article.title}</h3></Link>)}</div></div>
          </div>
        </section>}

        {visible('transfers')&&<section style={{order:order('transfers',60)}} className="py-20 md:py-24">
          <div className="shell rounded-[2rem] bg-sand/55 p-7 md:p-12">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><p className="eyebrow">{transferSection?.eyebrow||'Transfers to Borealis'}</p><h2 className="mt-3 font-serif text-4xl text-lake md:text-5xl">{transferSection?.title||'Arrive easily. Leave the logistics to us.'}</h2><p className="mt-4 max-w-2xl leading-7 text-muted">{transferSection?.body||transferSection?.subtitle||'Plan connections from Tirana Airport, Shkoder and local lake destinations.'}</p><div className="mt-4 flex flex-wrap gap-2">{homepageTransfers.slice(0,3).map(route=><span key={route.id} className="rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-lake">{route.origin} → {route.destination}</span>)}</div></div><Link href={transferSection?.ctaLink||'/transfers'} className="rounded-full bg-lake px-7 py-4 text-center text-sm font-bold text-white">{transferSection?.ctaLabel||'View transfers'}</Link></div>
          </div>
        </section>}

        {visible('gallery')&&<section style={{order:order('gallery',70)}} className="pb-20 md:pb-28">
          <div className="shell"><div className="mb-10 flex items-end justify-between"><SectionHeader eyebrow={gallerySection?.eyebrow||'The visual story'} title={gallerySection?.title||'Life beside the lake.'} copy={gallerySection?.body||gallerySection?.subtitle}/><Link href={gallerySection?.ctaLink||'/gallery'} className="hidden border-b-2 border-sand pb-1 text-sm font-bold text-lake md:block">{gallerySection?.ctaLabel||'Open gallery'}</Link></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{liveGallery.slice(0,4).map((item,index)=><Photo key={item.id} item={item} className={index===0?'col-span-2 aspect-[16/11] md:row-span-2':index===3?'col-span-2 aspect-[16/8]':'aspect-square'}/>)}</div></div>
        </section>}

        {visible('reviews')&&<section style={{order:order('reviews',80)}} className="bg-ivory py-20 md:py-28">
          <div className="shell grid gap-10 lg:grid-cols-[.6fr_1.4fr]"><div><p className="eyebrow">{reviewSection?.eyebrow||'Guest notes'}</p><h2 className="mt-4 font-serif text-5xl text-lake">{reviewSection?.title||'The feeling stays with you.'}</h2><p className="mt-4 text-xs leading-5 text-muted">{reviewSection?.body||reviewSection?.subtitle||'Manual testimonial content supplied by Borealis.'}</p></div><div className="grid gap-5 md:grid-cols-2">{liveReviews.map(review=><blockquote key={review.id} className="rounded-[1.75rem] bg-white p-7 shadow-sm"><span className="font-serif text-5xl leading-none text-green/30">“</span><p className="mt-3 font-serif text-3xl leading-snug text-lake">{review.quote}</p><footer className="mt-7 text-xs font-bold uppercase tracking-widest text-muted">{('author' in review&&review.author)||'Guest testimonial'} · {review.origin}</footer></blockquote>)}</div></div>
        </section>}

        {visible('location')&&<section style={{order:order('location',90)}} className="py-20 md:py-28">
          <div className="shell grid gap-10 lg:grid-cols-2 lg:items-center"><div><p className="eyebrow">{locationSection?.eyebrow||'Koman, Albania'}</p><h2 className="mt-4 font-serif text-5xl text-lake md:text-6xl">{locationSection?.title||'At the edge of the water.'}</h2><p className="mt-6 max-w-lg leading-8 text-muted">{locationSection?.body||locationSection?.subtitle||'Borealis is set in Koman, a mountain gateway known for its lake journeys and dramatic northern Albanian landscape.'}</p><Link href={locationSection?.ctaLink||'/contact'} className="mt-7 inline-block rounded-full bg-lake px-7 py-4 text-sm font-bold text-white">{locationSection?.ctaLabel||'Contact & directions'}</Link></div><Suspense fallback={<MapFallback contact={contact} className="min-h-[26rem] rounded-[2rem]"/>}><MapPlaceholder contact={contact} className="min-h-[26rem] rounded-[2rem]"/></Suspense></div>
        </section>}

        {visible('final_cta')&&<section style={{order:order('final_cta',100)}} className="relative min-h-[34rem] text-white"><Image src={finalSection?.backgroundMediaId?homepageCms?.mediaUrls[finalSection.backgroundMediaId]||liveProperty.heroImage:liveProperty.heroImage} alt={String(finalSection?.settings.imageAlt||'Mountain lake in Koman')} fill sizes="100vw" className="object-cover"/><div className="absolute inset-0 bg-lake/65"/><div className="shell relative flex min-h-[34rem] flex-col items-center justify-center py-20 text-center"><p className="eyebrow text-sand">{finalSection?.eyebrow||'Book direct'}</p><h2 className="mt-4 max-w-3xl font-serif text-5xl leading-none md:text-7xl">{finalSection?.title||'Your stay in Koman starts here.'}</h2>{finalSection?.body&&<p className="mt-5 max-w-xl text-white/75">{finalSection.body}</p>}<Link href={finalSection?.ctaLink||'/book'} className="mt-8 rounded-full bg-sand px-8 py-4 text-sm font-bold uppercase tracking-widest text-lake">{finalSection?.ctaLabel||'Check availability'}</Link></div></section>}
      </main>
      <Footer />
      <MobileBookingBar label={globalContent.mobileBarCtaLabel||'Check availability'} />
    </>
  );
}

function Photo({ item, className }: { item: GalleryItem; className: string }) {
  return <figure className={`relative overflow-hidden rounded-2xl ${className}`}><Image src={item.src} alt={item.alt} fill sizes="(max-width: 768px) 50vw, 50vw" className="object-cover" /></figure>;
}
