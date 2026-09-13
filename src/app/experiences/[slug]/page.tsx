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
import {formatMoney} from '@/lib/pricing/format';
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
  const canBookIndependently=item.bookable&&item.bookIndependently===true;
  const productData: Record<string, unknown> = { '@context': 'https://schema.org', '@type': 'Product', name: item.title, description: item.description, image: item.gallery, category: item.category };
  if (item.priceFrom !== null) productData.offers = { '@type': 'Offer', priceCurrency: item.currency, price: item.priceFrom, availability: 'https://schema.org/PreOrder' };
  return <PublicShell mobileBooking={false}>{preview&&<PreviewBanner label="Experience draft preview"/>}
    <BreadcrumbJsonLd items={[{ name: 'Home', url: '/' }, { name: 'Experiences', url: '/experiences' }, { name: item.title, url: `/experiences/${slug}` }]} />
    <JsonLd data={productData} />
    <section className="shell pb-20 pt-8 md:pt-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Experiences', href: '/experiences' }, { label: item.title }]} />
      <ExperienceGallery images={item.gallery} title={item.title} />
      <div className="grid gap-12 py-14 lg:grid-cols-[1fr_24rem] lg:gap-20">
        <div>
          <p className="eyebrow">{item.category}</p>
          <h1 className="mt-4 font-serif text-5xl leading-[.98] text-lake sm:text-6xl md:text-8xl">{item.title}</h1>
          <p className="mt-7 max-w-2xl text-xl leading-8 text-muted">{item.description}</p>
          <dl className="mt-10 grid grid-cols-2 gap-5 border-y border-lake/10 py-7 sm:grid-cols-3">
            <Fact label="Duration" value={item.duration}/><Fact label="Capacity" value={item.capacity}/><Fact label="Starting price" value={item.priceFrom===null?item.priceType:formatMoney(item.priceFrom,item.currency)} />
          </dl>
          <section className="py-12"><p className="eyebrow">{page.detailEyebrow}</p><h2 className="mt-3 font-serif text-4xl text-lake">{page.detailHeading}</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{item.longDescription}</p></section>
          <section className="grid gap-10 border-t border-lake/10 py-12 md:grid-cols-2"><InfoList title="What's included" items={item.included}/><InfoList title="Booking requirements" items={item.bookingRequirements}/></section>
          <section className="rounded-[1.75rem] bg-ivory p-7 md:p-9"><p className="eyebrow">Practical information</p><dl className="mt-6 space-y-5"><InfoRow label="Availability" value={item.availability}/><InfoRow label="Meeting point" value={item.meetingPoint}/><InfoRow label="Price type" value={item.priceType}/></dl>{item.notes.length>0&&<div className="mt-7 border-t border-lake/10 pt-6"><InfoList title="Notes" items={item.notes}/></div>}</section>
        </div>
        <aside className="h-fit rounded-[1.75rem] bg-brand p-7 text-white lg:sticky lg:top-6">
          <p className="text-xs font-bold uppercase tracking-widest text-sand">Plan this experience</p><p className="mt-5 text-sm text-white/60">{item.priceFrom===null?item.priceType:'Starting from'}</p>{item.priceFrom!==null&&<p className="mt-1 font-serif text-4xl">{formatMoney(item.priceFrom,item.currency)}</p>}<p className="mt-5 text-sm leading-6 text-white/65">{item.bookingRequirements[0]||'Contact Borealis for current availability.'}</p>
          {canBookIndependently&&<BookingLink href={`/book/experience/${item.slug}`} className="mt-6 flex min-h-14 w-full rounded-xl bg-sand px-5 py-4 text-center text-sm font-bold text-lake">Book now</BookingLink>}
          {item.bookable&&<BookingLink href={`/book?addon=${item.slug}`} className="mt-3 flex min-h-14 w-full rounded-xl border border-white/25 px-5 py-4 text-center text-sm font-bold text-white">Add to a room stay</BookingLink>}
        </aside>
      </div>
    </section>
    <section className="bg-ivory py-20 md:py-28"><div className="shell"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><p className="eyebrow">{page.relatedEyebrow}</p><h2 className="mt-4 font-serif text-5xl text-lake md:text-6xl">{page.relatedHeading}</h2><p className="mt-4 max-w-xl leading-7 text-muted">{page.relatedDescription}</p></div><Link href="/rooms" className="border-b-2 border-sand pb-1 text-sm font-bold text-lake">{page.relatedLinkLabel}</Link></div><div className="mt-10 grid gap-10 md:grid-cols-2">{rooms.slice(0,2).map((room)=><RoomCard key={room.id} room={room}/>)}</div></div></section>
    <ExperienceActions slug={item.slug} price={item.priceFrom} currency={item.currency} bookable={item.bookable} bookIndependently={canBookIndependently}/>
  </PublicShell>;
}

function Fact({label,value}:{label:string;value:string}){return <div><dt className="text-xs uppercase tracking-widest text-muted">{label}</dt><dd className="mt-2 font-serif text-xl leading-tight text-lake md:text-2xl">{value}</dd></div>}
function InfoList({title,items}:{title:string;items:string[]}){return <div><h3 className="font-serif text-3xl text-lake">{title}</h3><ul className="mt-5 space-y-3">{items.map((value)=><li key={value} className="flex gap-3 text-sm leading-6 text-muted"><span className="text-green">•</span>{value}</li>)}</ul></div>}
function InfoRow({label,value}:{label:string;value:string}){return <div className="grid gap-1 sm:grid-cols-[9rem_1fr]"><dt className="text-xs font-bold uppercase tracking-widest text-muted">{label}</dt><dd className="text-sm leading-6 text-lake">{value}</dd></div>}
