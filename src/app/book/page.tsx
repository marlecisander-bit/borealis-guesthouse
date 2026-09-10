import type { Metadata } from 'next';
import { createMetadata } from '@/lib/seo';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { PublicShell } from '@/components/public/PageShell';

export const metadata: Metadata = {
  ...createMetadata({ title: 'Book your stay', description: 'Check mock availability and preview a direct booking at Borealis Guest House.' }, '/book'),
  robots: { index: false, follow: true },
};

export default async function BookPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === 'string' ? params[key] as string : undefined;
  const guests = Number(value('guests'));
  return <PublicShell mobileBooking={false}>
    <section className="bg-ivory py-12 md:py-20">
      <div className="shell"><p className="eyebrow">Book direct</p><h1 className="mt-4 max-w-3xl font-serif text-5xl leading-none text-lake md:text-7xl">Your Koman stay, made simple.</h1><p className="mt-5 max-w-xl leading-7 text-muted">Choose your room, add anything useful and review everything clearly before confirming.</p></div>
    </section>
    <section className="bg-[#fbfaf7] py-8 md:py-14"><div className="shell"><BookingFlow initialRoom={value('room')} initialCheckIn={value('checkIn')} initialCheckOut={value('checkOut')} initialGuests={Number.isFinite(guests)&&guests>0?guests:undefined}/></div></section>
  </PublicShell>;
}
