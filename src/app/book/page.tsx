import type { Metadata } from 'next';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { PublicShell } from '@/components/public/PageShell';
import { validateBookingSearch } from '@/lib/booking/search-criteria';
import { createMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';

export const metadata: Metadata = {
  ...createMetadata({ title:'Book your stay', description:'Check live availability and send a direct reservation request to Borealis Guest House.' }, '/book'),
  robots: { index:false, follow:true },
};

export default async function BookPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === 'string' ? params[key] : undefined;
  const search = validateBookingSearch({ checkIn:value('checkIn'), checkOut:value('checkOut'), guests:value('guests') });
  const guests = search?.guests || 2;
  const [experiences, transfers] = await Promise.all([contentRepository.getExperiences(), contentRepository.getTransfers()]);
  const experienceAddons = experiences.filter(item=>item.bookable).map(item=>({
    id:item.id, bookingKey:item.slug, type:'experience' as const, name:item.title, description:item.description, image:item.image,
    duration:item.duration, price:item.priceFrom||0, priceLabel:item.priceFrom===null?'On request':`${item.currency} ${item.priceFrom}`,
    perGuest:item.priceType.includes('per person'), capacity:item.maxCapacity??null, availabilityMode:item.availability.replaceAll(' ','_'),
    date:search?.checkIn||'', time:'', quantity:guests,
  }));
  const transferAddons = transfers.filter(route=>route.active&&route.bookable!==false).map(route=>{
    const origin=route.origin.toLowerCase(), destination=route.destination.toLowerCase();
    const direction=destination.includes('borealis')?'arrival' as const:origin.includes('borealis')?'departure' as const:'other' as const;
    return {
      id:route.id, type:'transfer' as const, name:`${route.origin} → ${route.destination}`, description:route.description,
      image:route.image, duration:route.duration, price:route.price||0,
      priceLabel:route.price===null||route.pricingMethod==='on_request'?'On request':`${route.currency} ${route.price}`,
      perGuest:route.pricingMethod==='per_passenger', capacity:route.capacity, availabilityMode:route.availabilityMode,
      availableDays:route.availableDays, windowStart:route.windowStart, windowEnd:route.windowEnd, direction,
      date:direction==='departure'?(search?.checkOut||''):(search?.checkIn||''), time:route.windowStart||'', quantity:guests,
    };
  });

  return <PublicShell mobileBooking={false}>
    <section className="bg-ivory py-12 md:py-20">
      <div className="shell"><p className="eyebrow">Book direct</p><h1 className="mt-4 max-w-3xl font-serif text-5xl leading-none text-lake md:text-7xl">Your Koman stay, made simple.</h1><p className="mt-5 max-w-xl leading-7 text-muted">Choose your room, add anything useful and review everything clearly before confirming.</p></div>
    </section>
    <section className="bg-[#fbfaf7] py-8 md:py-14"><div className="shell"><BookingFlow
      initialRoom={value('room')}
      initialCheckIn={search?.checkIn}
      initialCheckOut={search?.checkOut}
      initialGuests={search?.guests}
      initialTransfer={value('transfer')}
      initialExperience={value('experience')||value('addon')}
      bookingMode={value('mode')}
      autoSearch={Boolean(search)}
      addons={[...experienceAddons,...transferAddons]}
    /></div></section>
  </PublicShell>;
}
