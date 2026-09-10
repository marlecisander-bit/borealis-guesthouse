import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BookingSearch } from '@/components/public/BookingSearch';
import { MobileBookingBar } from '@/components/public/MobileBookingBar';
import { ExperienceCard, SectionHeader } from '@/components/public/Cards';
import { Footer } from '@/components/public/Footer';
import { Header } from '@/components/public/Header';
import { gallery, images, property, reviews } from '@/data/public-content';
import { createMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';
import { getPublishedPageContent } from '@/services/cms-content';
import { getHomepageCms } from '@/services/homepage-cms';
import type { HomepageKey } from '@/types/homepage-cms';

export const metadata: Metadata = createMetadata({ title: 'Borealis Guest House | Lakeside Stay in Koman', description: 'Wake up by the water at Borealis Guest House in Koman, Albania. Book rooms directly and discover lake experiences and transfers.', image: property.heroImage }, '/');

const highlights = [
  { mark: '01', label: 'Lakefront location' },
  { mark: '02', label: 'Breakfast included' },
  { mark: '03', label: 'Private parking' },
  { mark: '04', label: 'Local experiences' },
  { mark: '05', label: 'Guest transfers' },
];

export const dynamic = 'force-dynamic';

export default async function Home({searchParams}:{searchParams:Promise<{preview?:string}>}) {
  const preview=(await searchParams).preview==='homepage';
  const [liveProperty, allRooms, allExperiences, allGallery, homepageContent, homepageCms, liveArticles, liveTransfers] = await Promise.all([
    contentRepository.getProperty(),
    contentRepository.getRooms(),
    contentRepository.getExperiences(),
    contentRepository.getGallery(),
    getPublishedPageContent('homepage'),
    getHomepageCms(preview),
    contentRepository.getArticles(),
    contentRepository.getTransfers(),
  ]);
  const section=(key:HomepageKey)=>homepageCms?.sections.find(item=>item.key===key);
  const visible=(key:HomepageKey)=>!section(key)||section(key)!.visible;
  const order=(key:HomepageKey,fallback:number)=>section(key)?.sortOrder??fallback;
  const selected=<T extends {id:string}>(items:T[],key:HomepageKey)=>{const links=section(key)?.links||[];return links.length?links.flatMap(link=>{const item=items.find(candidate=>candidate.id===link.id);return item?[item]:[]}):items};
  const liveRooms=selected(allRooms,'featured_rooms'),liveExperiences=selected(allExperiences,'featured_experiences'),liveGallery=selected(allGallery,'gallery'),liveReviews=homepageCms?.reviews.length?homepageCms.reviews:reviews;
  const hero=section('hero'),intro=section('intro'),roomSection=section('featured_rooms'),experienceSection=section('featured_experiences'),exploreSection=section('explore_koman'),transferSection=section('transfers'),gallerySection=section('gallery'),reviewSection=section('reviews'),locationSection=section('location'),finalSection=section('final_cta');
  return (
    <>
      <main className="flex flex-col overflow-hidden">
        {visible('hero')&&<section style={{order:order('hero',0)}} className="relative min-h-[100svh] bg-lake text-white">
          <Image src={hero?.backgroundMediaId?homepageCms?.mediaUrls[hero.backgroundMediaId]||liveProperty.heroImage:liveProperty.heroImage} alt="Koman Lake surrounded by mountain slopes" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-lake/60 via-lake/5 to-lake/85" />
          <Header overlay />
          <div className="shell relative flex min-h-[100svh] flex-col justify-end pb-6 pt-28 md:pb-0">
            <div className="max-w-4xl pb-7 md:pb-10">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-sand">{hero?.eyebrow||homepageContent?.eyebrow||'Borealis Guest House · Koman, Albania'}</p>
              <h1 className="mt-4 font-serif text-[3.5rem] leading-[0.92] sm:text-6xl md:text-8xl lg:text-[7rem]">{hero?.title||homepageContent?.heroHeading||'Wake up by the water.'}</h1>
              <p className="mt-5 text-base text-white/80 md:text-lg">{hero?.subtitle||homepageContent?.heroCopy||'A lakeside stay in the heart of Koman.'}</p>
              {hero?.ctaLabel&&<Link href={hero.ctaLink||'/book'} className="mt-6 inline-block rounded-full bg-sand px-6 py-3 text-sm font-bold text-lake">{hero.ctaLabel}</Link>}
            </div>
            {hero?.settings.showBookingSearch!==false&&<div className="md:translate-y-1/2"><BookingSearch hero /></div>}
          </div>
        </section>}

        {visible('property_highlights')&&<section style={{order:order('property_highlights',10)}} className="bg-ivory pb-16 pt-16 md:pb-20 md:pt-24" aria-label="Property highlights">
          <div className="shell grid grid-cols-2 gap-y-7 sm:grid-cols-3 md:grid-cols-5">
            {(homepageCms?.highlights.length?homepageCms.highlights:highlights.map((item,index)=>({id:item.label,title:item.label,description:'',icon:item.mark,sortOrder:index,visible:true,status:'published' as const}))).map((item,index) => (
              <div key={item.id} className="pr-4 md:border-r md:border-lake/10 md:last:border-0 md:last:pl-7">
                <span className="font-serif text-2xl text-green/55">{item.icon||String(index+1).padStart(2,'0')}</span>
                <p className="mt-2 text-sm font-semibold leading-5 text-lake">{item.title}</p>{item.description&&<p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>}
              </div>
            ))}
          </div>
        </section>}

        {visible('intro')&&<section style={{order:order('intro',20)}} className="py-20 md:py-32">
          <div className="shell grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr] lg:gap-20">
            <div className="relative min-h-[32rem] overflow-hidden rounded-[2rem] md:min-h-[42rem]">
              <Image src={intro?.backgroundMediaId?homepageCms?.mediaUrls[intro.backgroundMediaId]||images.terrace:images.terrace} alt="A peaceful terrace surrounded by nature" fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" />
              <div className="absolute bottom-5 left-5 rounded-xl bg-white/90 px-4 py-3 text-xs font-bold uppercase tracking-widest text-lake backdrop-blur">Slow mornings · Open air</div>
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
              <SectionHeader eyebrow={roomSection?.eyebrow||'Stay at Borealis'} title={roomSection?.title||'A room for every rhythm.'} copy={roomSection?.subtitle||roomSection?.body||'Natural textures, quiet comfort and the lake always close by.'} />
              <Link href="/rooms" className="hidden border-b-2 border-sand pb-1 text-sm font-bold text-lake md:block">See all rooms</Link>
            </div>
            <div className="-mx-4 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-5 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
              {liveRooms.map((room) => (
                <article key={room.id} className="w-[84vw] shrink-0 snap-center md:w-auto">
                  <Link href={`/rooms/${room.slug}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]"><Image src={room.image} alt={room.name} fill sizes="(max-width: 768px) 84vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />{room.slug.includes('lake') && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-lake">Lake view</span>}</div>
                  </Link>
                  <div className="px-1 pt-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-3xl text-lake">{room.name}</h3><p className="mt-1 text-sm text-muted">Up to {room.capacity} guests · {room.beds}</p></div><p className="text-right text-xs text-muted">From<br /><strong className="text-lg text-lake">€{room.priceFrom}</strong></p></div><div className="mt-5 grid grid-cols-2 gap-2"><Link href={`/rooms/${room.slug}`} className="rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-lake">View room</Link><Link href={`/book?room=${room.slug}`} className="rounded-xl bg-lake px-4 py-3 text-center text-sm font-bold text-white">Check availability</Link></div></div>
                </article>
              ))}
            </div>
          </div>
        </section>}

        {visible('featured_experiences')&&<section style={{order:order('featured_experiences',40)}} className="py-20 md:py-28">
          <div className="shell"><SectionHeader eyebrow={experienceSection?.eyebrow||'Experience Koman'} title={experienceSection?.title||'The lake is only the beginning.'} copy={experienceSection?.subtitle||experienceSection?.body||'Paddle quiet coves, travel hidden shores and see the landscape with local perspective.'} /><div className="mt-12 grid gap-5 md:grid-cols-3">{liveExperiences.map((item) => <ExperienceCard key={item.id} item={item} />)}</div>{experienceSection?.ctaLabel&&<Link href={experienceSection.ctaLink||'/experiences'} className="mt-8 inline-block border-b-2 border-sand pb-1 text-sm font-bold text-lake">{experienceSection.ctaLabel}</Link>}</div>
        </section>}

        {visible('explore_koman')&&<section style={{order:order('explore_koman',50)}} className="bg-lake py-20 text-white md:py-28">
          <div className="shell">
            <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end"><div><p className="eyebrow text-sand">{exploreSection?.eyebrow||'Explore Koman'}</p><h2 className="mt-4 font-serif text-5xl leading-none md:text-7xl">{exploreSection?.title||'A destination worth staying for.'}</h2><p className="mt-6 max-w-md leading-7 text-white/65">{exploreSection?.body||exploreSection?.subtitle||'Travel notes for Koman Lake, the Shala River, the ferry and the mountain paths beyond the shore.'}</p><Link href={exploreSection?.ctaLink||'/explore-koman'} className="mt-8 inline-block rounded-full bg-sand px-6 py-3 text-sm font-bold text-lake">{exploreSection?.ctaLabel||'Explore Koman'}</Link></div><div className="grid gap-5 sm:grid-cols-2">{selected(liveArticles,'explore_koman').slice(0,2).map((article,index)=><Link key={article.id} href={`/explore-koman/${article.slug}`} className={`group ${index===1?'sm:translate-y-10':''}`}><div className="relative aspect-[4/5] overflow-hidden rounded-2xl"><Image src={article.image} alt={article.title} fill sizes="(max-width: 640px) 100vw, 30vw" className="object-cover transition duration-700 group-hover:scale-105"/></div><p className="mt-4 text-xs font-bold uppercase tracking-widest text-sand">{article.category.name} · {article.readTime}</p><h3 className="mt-2 font-serif text-3xl">{article.title}</h3></Link>)}</div></div>
          </div>
        </section>}

        {visible('transfers')&&<section style={{order:order('transfers',60)}} className="py-20 md:py-24">
          <div className="shell rounded-[2rem] bg-sand/55 p-7 md:p-12">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><p className="eyebrow">{transferSection?.eyebrow||'Transfers to Borealis'}</p><h2 className="mt-3 font-serif text-4xl text-lake md:text-5xl">{transferSection?.title||'Arrive easily. Leave the logistics to us.'}</h2><p className="mt-4 max-w-2xl leading-7 text-muted">{transferSection?.body||transferSection?.subtitle||'Plan connections from Tirana Airport, Shkoder and local lake destinations.'}</p><div className="mt-4 flex flex-wrap gap-2">{selected(liveTransfers,'transfers').slice(0,3).map(route=><span key={route.id} className="rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-lake">{route.origin} → {route.destination}</span>)}</div></div><Link href={transferSection?.ctaLink||'/transfers'} className="rounded-full bg-lake px-7 py-4 text-center text-sm font-bold text-white">{transferSection?.ctaLabel||'View transfers'}</Link></div>
          </div>
        </section>}

        {visible('gallery')&&<section style={{order:order('gallery',70)}} className="pb-20 md:pb-28">
          <div className="shell"><div className="mb-10 flex items-end justify-between"><SectionHeader eyebrow={gallerySection?.eyebrow||'The visual story'} title={gallerySection?.title||'Life beside the lake.'}/><Link href={gallerySection?.ctaLink||'/gallery'} className="hidden border-b-2 border-sand pb-1 text-sm font-bold text-lake md:block">{gallerySection?.ctaLabel||'Open gallery'}</Link></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{liveGallery.slice(0,4).map((item,index)=><Photo key={item.id} item={item} className={index===0?'col-span-2 aspect-[16/11] md:row-span-2':index===3?'col-span-2 aspect-[16/8]':'aspect-square'}/>)}</div></div>
        </section>}

        {visible('reviews')&&<section style={{order:order('reviews',80)}} className="bg-ivory py-20 md:py-28">
          <div className="shell grid gap-10 lg:grid-cols-[.6fr_1.4fr]"><div><p className="eyebrow">{reviewSection?.eyebrow||'Guest notes'}</p><h2 className="mt-4 font-serif text-5xl text-lake">{reviewSection?.title||'The feeling stays with you.'}</h2><p className="mt-4 text-xs leading-5 text-muted">{reviewSection?.subtitle||'Manual testimonial content supplied by Borealis.'}</p></div><div className="grid gap-5 md:grid-cols-2">{liveReviews.map(review=><blockquote key={review.id} className="rounded-[1.75rem] bg-white p-7 shadow-sm"><span className="font-serif text-5xl leading-none text-green/30">“</span><p className="mt-3 font-serif text-3xl leading-snug text-lake">{review.quote}</p><footer className="mt-7 text-xs font-bold uppercase tracking-widest text-muted">{('author' in review&&review.author)||'Guest testimonial'} · {review.origin}</footer></blockquote>)}</div></div>
        </section>}

        {visible('location')&&<section style={{order:order('location',90)}} className="py-20 md:py-28">
          <div className="shell grid gap-10 lg:grid-cols-2 lg:items-center"><div><p className="eyebrow">{locationSection?.eyebrow||'Koman, Albania'}</p><h2 className="mt-4 font-serif text-5xl text-lake md:text-6xl">{locationSection?.title||'At the edge of the water.'}</h2><p className="mt-6 max-w-lg leading-8 text-muted">{locationSection?.body||locationSection?.subtitle||'Borealis is set in Koman, a mountain gateway known for its lake journeys and dramatic northern Albanian landscape.'}</p><Link href={locationSection?.ctaLink||'/contact'} className="mt-7 inline-block rounded-full bg-lake px-7 py-4 text-sm font-bold text-white">{locationSection?.ctaLabel||'Contact & directions'}</Link></div><div className="relative min-h-[26rem] overflow-hidden rounded-[2rem] bg-green"><div className="absolute inset-5 rounded-[1.4rem] border border-white/20 bg-[radial-gradient(circle_at_70%_25%,rgba(232,222,208,.35),transparent_24%),linear-gradient(135deg,rgba(255,255,255,.08),transparent)]"/><div className="absolute inset-0 grid place-items-center text-center text-white"><div><span className="mx-auto grid size-14 place-items-center rounded-full bg-sand font-serif text-2xl text-lake">B</span><p className="mt-4 font-serif text-3xl">Borealis · Koman</p><p className="mt-2 text-sm text-white/60">{locationSection?.settings.mapLink?'Open map from the directions link':'Map reference managed by Borealis'}</p></div></div></div></div>
        </section>}

        {visible('final_cta')&&<section style={{order:order('final_cta',100)}} className="relative min-h-[34rem] text-white"><Image src={finalSection?.backgroundMediaId?homepageCms?.mediaUrls[finalSection.backgroundMediaId]||images.lakeBlue:images.lakeBlue} alt="Mountain lake in Koman" fill sizes="100vw" className="object-cover"/><div className="absolute inset-0 bg-lake/65"/><div className="shell relative flex min-h-[34rem] flex-col items-center justify-center py-20 text-center"><p className="eyebrow text-sand">{finalSection?.eyebrow||'Book direct'}</p><h2 className="mt-4 max-w-3xl font-serif text-5xl leading-none md:text-7xl">{finalSection?.title||'Your stay in Koman starts here.'}</h2>{finalSection?.body&&<p className="mt-5 max-w-xl text-white/75">{finalSection.body}</p>}<Link href={finalSection?.ctaLink||'/book'} className="mt-8 rounded-full bg-sand px-8 py-4 text-sm font-bold uppercase tracking-widest text-lake">{finalSection?.ctaLabel||'Check availability'}</Link></div></section>}
      </main>
      <Footer />
      <MobileBookingBar />
    </>
  );
}

function Photo({ item, className }: { item: (typeof gallery)[number]; className: string }) {
  return <figure className={`relative overflow-hidden rounded-2xl ${className}`}><Image src={item.src} alt={item.alt} fill sizes="(max-width: 768px) 50vw, 50vw" className="object-cover" /></figure>;
}
