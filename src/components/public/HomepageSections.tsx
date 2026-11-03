import {Suspense} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {MapFallback, MapPlaceholder} from '@/components/public/MapPlaceholder';
import {ExperienceCard, RoomCard, SectionHeader} from '@/components/public/Cards';
import {contentRepository} from '@/services/content';
import {getContactInfo} from '@/services/site-content';
import type {PublicHomepageCms} from '@/services/homepage-cms';
import type {Property} from '@/types/public';
import type {HomepageKey} from '@/types/homepage-cms';
export async function HomepageSections({homepageCms,liveProperty}:{homepageCms:PublicHomepageCms|null;liveProperty:Property}) {
  const show=(key:HomepageKey)=>homepageCms?.sections.find(item=>item.key===key)?.visible!==false;
  const ids=(key:HomepageKey)=>homepageCms?.sections.find(item=>item.key===key)?.links.map(link=>link.id);
  const [allRooms,allExperiences,contact]=await Promise.all([
    show('featured_rooms')?contentRepository.getRooms():[],
    show('featured_experiences')?contentRepository.getExperiences(undefined,3,ids('featured_experiences')):[],
    getContactInfo(),
  ]);
  const section=(key:HomepageKey)=>homepageCms?.sections.find(item=>item.key===key);
  const visible=(key:HomepageKey)=>!section(key)||section(key)!.visible;
  const order=(key:HomepageKey,fallback:number)=>section(key)?.sortOrder??fallback;
  const selected=<T extends {id:string}>(items:T[],key:HomepageKey)=>{const links=section(key)?.links||[];return links.length?links.flatMap(link=>{const item=items.find(candidate=>candidate.id===link.id);return item?[item]:[]}):items};
  const liveRooms=selected(allRooms,'featured_rooms'),featuredExperiences=allExperiences.filter(item=>item.featured),liveExperiences=featuredExperiences.length?featuredExperiences:selected(allExperiences,'featured_experiences');
  const intro=section('intro'),roomSection=section('featured_rooms'),experienceSection=section('featured_experiences'),locationSection=section('location');
  return <>        {visible('intro')&&<section data-homepage-section="intro" style={{order:order('intro',20)}} className="py-20 md:py-32">
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

        {visible('location')&&<section style={{order:order('location',90)}} className="py-20 md:py-28">
          <div className="shell grid gap-10 lg:grid-cols-2 lg:items-center"><div><p className="eyebrow">{locationSection?.eyebrow||'Koman, Albania'}</p><h2 className="mt-4 font-serif text-5xl text-lake md:text-6xl">{locationSection?.title||'At the edge of the water.'}</h2><p className="mt-6 max-w-lg leading-8 text-muted">{locationSection?.body||locationSection?.subtitle||'Borealis is set in Koman, a mountain gateway known for its lake journeys and dramatic northern Albanian landscape.'}</p><Link href={locationSection?.ctaLink||'/contact'} className="mt-7 inline-block rounded-full bg-lake px-7 py-4 text-sm font-bold text-white">{locationSection?.ctaLabel||'Contact & directions'}</Link></div><Suspense fallback={<MapFallback contact={contact} className="min-h-[26rem] rounded-[2rem]"/>}><MapPlaceholder contact={contact} className="min-h-[26rem] rounded-[2rem]"/></Suspense></div>
        </section>}

</>;
}
