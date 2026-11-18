import {RentalInformation} from '@/components/public/RentalInformation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExperienceActions } from '@/components/public/ExperienceActions';
import { BookingLink } from '@/components/public/BookingLink';
import { ExperienceGallery } from '@/components/public/ExperienceGallery';
import { BreadcrumbJsonLd, JsonLd } from '@/components/public/JsonLd';
import { Breadcrumbs, PublicShell } from '@/components/public/PageShell';
import { RoomCard } from '@/components/public/Cards';
import { createLocalizedMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';
import { authorizePreview } from '@/lib/preview';
import { PreviewBanner } from '@/components/public/PreviewBanner';
import {formatExperiencePrice} from '@/lib/pricing/format';
import { getLandingPageContent } from '@/services/site-content';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const item = await contentRepository.getExperience(slug);
  return item ? createLocalizedMetadata({ ...item.seo, image: item.image }, `/experiences/${slug}`) : { title: 'Experience not found' };
}

export default async function ExperiencePage({ params,searchParams }: { params: Promise<{ slug: string }>;searchParams:Promise<{preview?:string}> }) {
  const { slug } = await params;
  const preview=await authorizePreview('experience',(await searchParams).preview);
  const [item, rooms, page] = await Promise.all([contentRepository.getExperience(slug,preview?.id), contentRepository.getRooms(), getLandingPageContent('experiences')]);
  if (!item) notFound();
  const canBookIndependently=item.bookable&&item.bookIndependently===true&&(!item.rental||item.rental.standalone);
  const photos = item.gallery.filter(image => image !== '/borealis-placeholder.svg');
  const productData: Record<string, unknown> = { '@context': 'https://schema.org', '@type': 'Product', name: item.title, description: item.description, image: photos, category: item.category };
  if (item.priceFrom !== null) productData.offers = { '@type': 'Offer', priceCurrency: item.currency, price: item.priceFrom, availability: 'https://schema.org/PreOrder' };
  return <PublicShell mobileBooking={false}>{preview&&<PreviewBanner label="Experience draft preview"/>}
    <BreadcrumbJsonLd items={[{ name: 'Home', url: '/' }, { name: 'Experiences', url: '/experiences' }, { name: item.title, url: `/experiences/${slug}` }]} />
    <JsonLd data={productData} />
    <section className="shell pb-20 pt-8 md:pt-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Experiences', href: '/experiences' }, { label: item.title }]} />
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-10">
        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <p className="eyebrow">{item.category}</p>
          <h1 className="mt-4 font-serif text-4xl leading-none text-lake sm:text-5xl">{item.title}</h1>

          <dl className="my-5 grid grid-cols-2 gap-4 border-y border-lake/10 py-5">
            <Fact label="Duration" value={item.duration}/>{item.capacity !== "On request" && <Fact label="Capacity" value={item.capacity}/>}
          </dl>
          <div data-booking-actions className="rounded-3xl bg-brand p-5 text-white">
            <p className="font-serif text-3xl">{formatExperiencePrice(item.priceFrom, item.currency, item.priceType)}</p>
            {canBookIndependently&&<BookingLink href={`/book/experience/${item.slug}`} className="mt-6 flex min-h-14 w-full rounded-xl bg-sand px-5 py-4 text-center text-sm font-bold text-lake">Choose a time</BookingLink>}
            {item.bookable&&(!item.rental||item.rental.roomAddon)&&<BookingLink href={`/book?addon=${item.slug}`} className="mt-3 flex min-h-14 w-full rounded-xl border border-white/25 px-5 py-4 text-center text-sm font-bold text-white">Add to a room stay</BookingLink>}
          </div>
          {item.included.length > 0 && <div className="mt-6"><InfoList title="What's included" items={item.included}/></div>}
        </div>
        {photos.length > 0 && <div className="lg:col-start-1 lg:row-start-1">
          <ExperienceGallery images={photos} title={item.title}/>
        </div>}
        <div className={photos.length > 0 ? 'lg:col-start-1' : 'lg:col-start-1 lg:row-start-1'}>
          {item.description && <p className="max-w-2xl text-lg leading-8 text-muted">{item.description}</p>}
          {item.rental && <div className="mt-6"><RentalInformation rental={item.rental} currency={item.currency}/></div>}
          {item.longDescription && item.longDescription !== item.description && <section className="py-8">
            <h2 className="font-serif text-4xl text-lake">{page.detailHeading}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{item.longDescription}</p>
          </section>}
          {item.bookingRequirements.length > 0 && <div className="py-6"><InfoList title="Booking requirements" items={item.bookingRequirements}/></div>}
          <section className="mt-6 rounded-3xl bg-ivory p-6">
            <h2 className="font-serif text-2xl text-lake">Practical information</h2>
            <dl className="mt-4 space-y-4"><InfoRow label="Meeting point" value={item.meetingPoint}/></dl>
            {item.notes.length > 0 && <div className="mt-6"><InfoList title="Notes" items={item.notes}/></div>}
          </section>
        </div>
      </div>
    </section>
    <section className="bg-ivory py-20 md:py-28"><div className="shell"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><p className="eyebrow">{page.relatedEyebrow}</p><h2 className="mt-4 font-serif text-5xl text-lake md:text-6xl">{page.relatedHeading}</h2><p className="mt-4 max-w-xl leading-7 text-muted">{page.relatedDescription}</p></div><Link href="/rooms" className="border-b-2 border-sand pb-1 text-sm font-bold text-lake">{page.relatedLinkLabel}</Link></div><div className="mt-10 grid gap-10 md:grid-cols-2">{rooms.slice(0,2).map((room)=><RoomCard key={room.id} room={room}/>)}</div></div></section>
    <ExperienceActions slug={item.slug} price={item.priceFrom} currency={item.currency} priceType={item.priceType} bookable={item.bookable && (canBookIndependently || !item.rental || item.rental.roomAddon)} bookIndependently={canBookIndependently}/>
  </PublicShell>;
}

function Fact({label,value}:{label:string;value:string}){return <div><dt className="text-xs uppercase tracking-widest text-muted">{label}</dt><dd className="mt-2 font-serif text-xl leading-tight text-lake md:text-2xl">{value}</dd></div>}
function InfoList({title,items}:{title:string;items:string[]}){return <div><h3 className="font-serif text-3xl text-lake">{title}</h3><ul className="mt-5 space-y-3">{items.map((value)=><li key={value} className="flex gap-3 text-sm leading-6 text-muted"><span className="text-green">•</span>{value}</li>)}</ul></div>}
function InfoRow({label,value}:{label:string;value:string}){return <div className="grid gap-1 sm:grid-cols-[9rem_1fr]"><dt className="text-xs font-bold uppercase tracking-widest text-muted">{label}</dt><dd className="text-sm leading-6 text-lake">{value}</dd></div>}
