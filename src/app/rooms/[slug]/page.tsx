import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Amenities } from '@/components/public/Amenities';
import { ExperienceCard, RoomCard } from '@/components/public/Cards';
import { BreadcrumbJsonLd, JsonLd } from '@/components/public/JsonLd';
import { Breadcrumbs, PublicShell } from '@/components/public/PageShell';
import { RoomBookingBar } from '@/components/public/RoomBookingBar';
import { BookingLink } from '@/components/public/BookingLink';
import { RoomGallery } from '@/components/public/RoomGallery';
import { createLocalizedMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';
import { authorizePreview } from '@/lib/preview';
import { PreviewBanner } from '@/components/public/PreviewBanner';
import { getAdminSession } from '@/lib/admin/auth';
import { adminRoomsRepository } from '@/lib/repositories/admin/rooms';
import {formatRoomRate} from '@/lib/pricing/format';
import { getLandingPageContent } from '@/services/site-content';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const room = await contentRepository.getRoom(slug);
  return room ? createLocalizedMetadata({ ...room.seo, image: room.image }, `/rooms/${slug}`) : { title: 'Room not found' };
}

export default async function RoomPage({ params,searchParams }: { params: Promise<{ slug: string }>;searchParams:Promise<{preview?:string}> }) {
  const { slug } = await params;
  const requested=(await searchParams).preview;
  const session=requested?null:await getAdminSession();
  const implicit=session?(await adminRoomsRepository.listRoomTypes(session)).find(item=>item.slug===slug&&item.status!=='published'):null;
  const preview=await authorizePreview('room',requested||implicit?.id);
  const [room, allRooms, experiences, page] = await Promise.all([contentRepository.getRoom(slug,preview?.id), contentRepository.getRooms(preview?.id), contentRepository.getExperiences(), getLandingPageContent('rooms')]);
  if (!room) notFound();
  const otherRooms = allRooms.filter((item) => item.id !== room.id).slice(0, 2);
  return <PublicShell mobileBooking={false}>{preview&&<PreviewBanner label="Room draft preview"/>}
    <BreadcrumbJsonLd items={[{ name: 'Home', url: '/' }, { name: 'Rooms', url: '/rooms' }, { name: room.name, url: `/rooms/${slug}` }]} />
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'HotelRoom', name: room.name, description: room.description, image: room.gallery, occupancy: { '@type': 'QuantitativeValue', maxValue: room.capacity }, bed: room.beds, containedInPlace: { '@type': 'LodgingBusiness', name: 'Borealis Guest House' } }} />
    <section className="shell pb-20 pt-8 md:pt-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Rooms', href: '/rooms' }, { label: room.name }]} />
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-10">
        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
          {room.viewType && !room.name.toLowerCase().includes(room.viewType.toLowerCase()) && <p className="eyebrow">{room.viewType}</p>}
          <h1 className="mt-4 font-serif text-4xl leading-none text-lake sm:text-5xl">{room.name}</h1>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-y border-lake/10 py-4 sm:grid-cols-3 lg:grid-cols-2">
            <div><dt className="text-xs uppercase tracking-widest text-muted">Guests</dt><dd className="mt-2 font-serif text-2xl text-lake">Up to {room.capacity}</dd></div>
            <div><dt className="text-xs uppercase tracking-widest text-muted">Beds</dt><dd className="mt-2 font-serif text-2xl text-lake">{room.beds}</dd></div>
            <div><dt className="text-xs uppercase tracking-widest text-muted">Size</dt><dd className="mt-2 font-serif text-2xl text-lake">{room.size}</dd></div>
          </dl>
          <aside data-booking-actions className="mt-5 rounded-3xl bg-ivory p-5">
          <p className="eyebrow">Book direct</p><div className="mt-5 flex items-baseline justify-between"><p className="text-sm text-muted">{room.priceFrom===null?'Pricing':'From'}</p><p className="font-serif text-4xl text-lake">{formatRoomRate(room.priceFrom,room.currency)}{room.priceFrom!==null&&<span className="font-sans text-xs text-muted"> / night</span>}</p></div>
          <div className="my-6 h-px bg-lake/10"/><p className="text-sm leading-6 text-muted">{room.priceFrom===null ? "Choose dates to check availability and pricing." : "Choose your dates to see availability and the rate for your stay."}</p>
          <BookingLink href={`/book?room=${room.slug}`} pendingLabel="Opening…" className="public-primary-cta mt-6 flex min-h-14 w-full rounded-xl px-6 py-4 text-center text-sm font-bold">Check availability</BookingLink>
          <p className="mt-4 text-center text-xs text-muted">Direct enquiry · No payment taken</p>
          </aside>
        </div>
        {room.gallery.length > 0 && <div className="lg:col-start-1 lg:row-start-1"><RoomGallery images={room.gallery} roomName={room.name} /></div>}
        <div className={room.gallery.length ? "lg:col-start-1" : "lg:col-start-1 lg:row-start-1"}>
          {room.description && <p className="max-w-2xl text-lg leading-8 text-muted">{room.description}</p>}
          {room.longDescription && room.longDescription !== room.description && <section className="py-10"><p className="eyebrow">{page.detailEyebrow}</p><h2 className="mt-3 font-serif text-4xl text-lake">{page.detailHeading}</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{room.longDescription}</p></section>}
          {room.amenities.length > 0 && <section className="mt-8 border-t border-lake/10 pt-8"><p className="eyebrow">Included</p><h2 className="mt-3 font-serif text-4xl text-lake">Room amenities</h2><div className="mt-7"><Amenities items={room.amenities} /></div></section>}
        </div>
      </div>
    </section>

    <section className="bg-lake py-20 text-white md:py-28"><div className="shell"><div className="max-w-2xl"><p className="eyebrow text-sand">Beyond the room</p><h2 className="mt-4 font-serif text-5xl md:text-6xl">Experience the lake.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-3">{experiences.map((item) => <ExperienceCard key={item.id} item={item} />)}</div></div></section>

    <section className="shell py-20 md:py-28"><div className="flex items-end justify-between gap-5"><div><p className="eyebrow">{page.relatedEyebrow}</p><h2 className="mt-4 font-serif text-5xl text-lake">{page.relatedHeading}</h2></div><Link href="/rooms" className="hidden border-b-2 border-sand pb-1 text-sm font-bold text-lake md:block">{page.relatedLinkLabel}</Link></div><div className="mt-10 grid gap-10 md:grid-cols-2">{otherRooms.map((item) => <RoomCard key={item.id} room={item} />)}</div></section>
    <RoomBookingBar slug={room.slug} price={room.priceFrom} currency={room.currency}/>
  </PublicShell>;
}
