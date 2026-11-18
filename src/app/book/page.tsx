import type { Metadata } from 'next';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { BookingFlowSkeleton, BookingStage } from '@/components/booking/BookingStage';
import { PublicShell } from '@/components/public/PageShell';
import { validateBookingSearch } from '@/lib/booking/search-criteria';
import { createMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';
import { getOccupancyAgePolicy, getSiteDocument, getStayBookingNotice } from '@/services/site-content';
import { Suspense } from 'react';

export const metadata: Metadata = {
  ...createMetadata({ title:'Book your stay', description:'Check live availability and send a direct reservation request to Borealis Guest House.' }, '/book'),
  robots: { index:false, follow:true },
};

export default async function BookPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const [page,agePolicy,notice] = await Promise.all([getSiteDocument('book'),getOccupancyAgePolicy(),getStayBookingNotice()]);
  const value = (key: string) => typeof params[key] === 'string' ? params[key] : undefined;
  const search = validateBookingSearch({ checkIn:value('checkIn'), checkOut:value('checkOut'), guests:value('guests'),adults:value('adults'),children:value('children'),infants:value('infants') });
  return <PublicShell mobileBooking={false}>
    <BookingStage intro={page} notice={notice}><Suspense fallback={<BookingFlowSkeleton/>}><BookingConfigurator
      initialRoom={value('room')}
      initialTransfer={value('transfer')}
      initialExperience={value('experience')||value('addon')}
      bookingMode={value('mode')}
      search={search}
      infantMaxAge={agePolicy.infantMaxAge}
      childMaxAge={agePolicy.childMaxAge}
    /></Suspense></BookingStage>
  </PublicShell>;
}

async function BookingConfigurator({initialRoom,initialTransfer,initialExperience,bookingMode,search,infantMaxAge,childMaxAge}:{initialRoom?:string;initialTransfer?:string;initialExperience?:string;bookingMode?:string;search:ReturnType<typeof validateBookingSearch>;infantMaxAge:number;childMaxAge:number}) {
  const guests = search?.guests || 2;
  const [experiences, transfers] = await Promise.all([contentRepository.getExperiences(), contentRepository.getTransfers()]);
  const experienceAddons = experiences.filter(item=>item.bookable&&(!item.rental||item.rental.roomAddon)).map(item=>({
    currency:item.currency,rentalConfig:item.rental||undefined,id:item.id, bookingKey:item.slug, type:'experience' as const, name:item.title, description:item.description, image:item.image,
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

  return <BookingFlow
      initialRoom={initialRoom}
      initialCheckIn={search?.checkIn}
      initialCheckOut={search?.checkOut}
      initialGuests={search?.guests}
      initialAdults={search?.adults}
      initialChildren={search?.children}
      initialInfants={search?.infants}
      infantMaxAge={infantMaxAge}
      childMaxAge={childMaxAge}
      initialTransfer={initialTransfer}
      initialExperience={initialExperience}
      bookingMode={bookingMode}
      autoSearch={Boolean(search)}
      addons={[...experienceAddons,...transferAddons]}
    />;
}
