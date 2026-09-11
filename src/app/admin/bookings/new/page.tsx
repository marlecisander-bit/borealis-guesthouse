import Link from'next/link';
import{requireAdmin}from'@/lib/admin/auth';
import{adminBookingsRepository}from'@/lib/repositories/admin/bookings';
import{AdminPageHeader}from'@/components/admin/ui';
import{ManualBookingForm}from'@/components/admin/ManualBookingForm';
export default async function NewBookingPage(){const session=await requireAdmin(['owner','manager','staff']),rooms=await adminBookingsRepository.rooms(session);return <div className="space-y-7"><AdminPageHeader title="Add booking" description="Create a phone, walk-in or WhatsApp reservation using the same live price, availability and overbooking protection as the website." actions={<Link href="/admin/bookings" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold">Back to bookings</Link>}/>{!rooms.length&&<p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Publish a room and its base rate before creating a booking.</p>}<ManualBookingForm rooms={rooms}/></div>}
