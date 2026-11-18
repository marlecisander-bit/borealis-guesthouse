import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/public/PageShell';
import { ManageBookingForm } from '@/components/booking/ManageBookingForm';
import { manageBookingAction } from '@/app/booking/management-actions';
import { bookingUuid } from '@/lib/booking/management';
import { readBookingManagement } from '@/lib/booking/management-reader';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/pricing/format';

export const metadata={title:'Manage booking | Borealis Guest House',robots:{index:false,follow:false},referrer:'no-referrer' as const};

export default async function Page({params}:{params:Promise<{token:string}>}) {
  const {token}=await params;
  if(!bookingUuid.test(token))notFound();
  const db=await createServerSupabaseClient();
  const [booking,confirmation]=await Promise.all([
    readBookingManagement({token}).catch(()=>undefined),
    db.rpc('get_booking_confirmation_package',{target_token:token}),
  ]);
  if(booking===null||(!confirmation.error&&!confirmation.data))notFound();
  if(!booking||confirmation.error)return <PublicShell mobileBooking={false}><section className="shell py-10"><h1 className="font-serif text-4xl">Booking management unavailable</h1><p className="mt-3">Try opening your private booking link again.</p></section></PublicShell>;
  const items=confirmation.data.items as {title:string;type:string;quantity:number}[];
  return <PublicShell mobileBooking={false}><section className="shell py-8"><div className="mx-auto max-w-2xl space-y-5">
    <Link href={'/booking/confirmation/'+token} prefetch={false} className="inline-flex min-h-11 items-center text-sm font-bold text-brand">← Booking details</Link>
    <h1 className="font-serif text-4xl text-lake">Manage booking</h1>
    <div className="space-y-2 rounded-xl bg-ivory p-4">
      <p className="font-bold capitalize">{booking.status.replaceAll('_',' ')}</p>
      {booking.checkIn&&<p>{booking.checkIn} to {booking.checkOut}</p>}
      <p>{booking.adults} adults · {booking.children} children · {booking.infants} infants</p>
      {!!items.length&&<ul className="list-inside list-disc">{items.map((item,index)=><li key={index}>{item.title}</li>)}</ul>}
      <p>Total <strong>{formatMoney(booking.total,booking.currency)}</strong></p>
    </div>
    <div><h2 className="font-bold">Cancellation policy</h2><p className="whitespace-pre-wrap text-sm">{booking.policy||'Contact Borealis for the terms that apply to this booking.'}</p>
      {booking.cancelHours!==null&&booking.policy&&<p className="text-sm">Eligible online cancellations must be made at least {booking.cancelHours} hours before the arrival date begins in Tirane.</p>}
    </div>
    <ManageBookingForm booking={booking} action={manageBookingAction.bind(null,{token})}/>
  </div></section></PublicShell>;
}
