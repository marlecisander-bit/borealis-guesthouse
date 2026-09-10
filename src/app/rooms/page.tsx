import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Amenities } from '@/components/public/Amenities';
import { BookingSearch } from '@/components/public/BookingSearch';
import { CTASection, PublicShell } from '@/components/public/PageShell';
import { images } from '@/data/public-content';
import { createMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';

export const metadata: Metadata = createMetadata({ title: 'Rooms', description: 'Explore spacious rooms by Koman Lake at Borealis Guest House.', image: images.room }, '/rooms');
export const dynamic = 'force-dynamic';

export default async function RoomsPage() {
  const rooms = await contentRepository.getRooms();
  return <PublicShell>
    <section className="bg-ivory pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="shell grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
        <div><p className="eyebrow">Stay at Borealis</p><h1 className="mt-4 font-serif text-5xl leading-[.98] text-lake sm:text-6xl md:text-8xl">Rooms made for slower mornings.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-muted">Thoughtful comfort, natural textures and the landscape just beyond your window.</p></div>
        <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem]"><Image src={images.room} alt="A warm Borealis guest room" fill priority sizes="(max-width:1024px) 100vw,60vw" className="object-cover" /></div>
      </div>
    </section>
    <section className="relative z-10 -mt-6 pb-14 md:-mt-8"><div className="shell"><BookingSearch /></div></section>
    <section className="shell pb-20 md:pb-28">
      <div className="mb-12 max-w-2xl"><p className="eyebrow">Choose your room</p><h2 className="mt-4 font-serif text-5xl text-lake md:text-6xl">Space to settle in.</h2></div>
      <div className="space-y-14 md:space-y-24">
        {rooms.map((room, index) => <article key={room.id} className="grid gap-7 md:grid-cols-2 md:items-center md:gap-12">
          <Link href={`/rooms/${room.slug}`} className={`group relative aspect-[4/5] overflow-hidden rounded-[1.75rem] md:aspect-[5/4] ${index % 2 ? 'md:order-2' : ''}`}><Image src={room.image} alt={room.name} fill sizes="(max-width:768px) 100vw,50vw" className="object-cover transition duration-700 group-hover:scale-105"/><span className="absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-lake backdrop-blur">{room.viewType}</span></Link>
          <div className={index % 2 ? 'md:order-1' : ''}><p className="eyebrow">{room.eyebrow}</p><div className="mt-3 flex items-start justify-between gap-4"><h2 className="font-serif text-4xl text-lake md:text-5xl">{room.name}</h2><p className="shrink-0 text-right text-xs text-muted">From<br/><strong className="text-xl text-lake">€{room.priceFrom}</strong></p></div><p className="mt-5 leading-7 text-muted">{room.description}</p><div className="mt-6 grid grid-cols-2 gap-4 border-y border-lake/10 py-5 text-sm sm:grid-cols-3"><div><strong>{room.capacity}</strong><p className="text-xs text-muted">Guests</p></div><div><strong>{room.beds}</strong><p className="text-xs text-muted">Beds</p></div><div><strong>{room.size}</strong><p className="text-xs text-muted">Room size</p></div></div><div className="mt-6"><Amenities items={room.amenities.slice(0,4)} compact /></div><div className="mt-7 grid gap-3 min-[360px]:grid-cols-2"><Link href={`/rooms/${room.slug}`} className="min-h-14 rounded-xl bg-ivory px-5 py-4 text-center text-sm font-bold text-lake">View room</Link><Link href={`/book?room=${room.slug}`} className="min-h-14 rounded-xl bg-lake px-5 py-4 text-center text-sm font-bold text-white">Check availability</Link></div></div>
        </article>)}
      </div>
    </section>
    <CTASection />
  </PublicShell>;
}
