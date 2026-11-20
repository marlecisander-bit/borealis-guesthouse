import Link from 'next/link';
import { WorkspaceAccount } from '@/components/admin/WorkspaceAccount';
import { AdminPageHeader, AdminEmptyState } from '@/components/admin/ui';
import { AvailabilityCalendar } from '@/components/admin/AvailabilityCalendar';
import { requireCalendarAccess } from '@/lib/admin/calendar-access';
import { adminAvailabilityRepository } from '@/lib/repositories/admin/availability';
import { nights, propertyDay, shiftDay, validDay } from '@/lib/admin/availability-calendar';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AvailabilityBlock, AvailabilityBooking, AvailabilityRoom } from '@/types/availability-admin';

export const metadata = { title: 'Calendar | Borealis Admin' };

export default async function AvailabilityPage({ searchParams }: {
    searchParams: Promise<{ from?: string; to?: string; view?: string; room?: string; blockStart?: string; blockEnd?: string }>;
}) {
    const [{ session, restricted }, query, db] = await Promise.all([
        requireCalendarAccess(), searchParams, createServerSupabaseClient(),
    ]);
    let calendar: { rooms: AvailabilityRoom[]; blocks: AvailabilityBlock[]; occupancy: AvailabilityBooking[] };
    let bookings: AvailabilityBooking[], today: string, from: string, timeZone: string, periodDays: number;
    try {
        const { data: property, error: propertyError } = await db.rpc('admin_calendar_inventory', { property: session.propertyId, first_day: null, last_day: null });
        if (propertyError) throw propertyError;
        timeZone = property?.timeZone || 'Europe/Tirane';
        today = propertyDay(new Date(), timeZone);
        from = validDay(query.from) ? query.from : today;
        periodDays = validDay(query.to) && query.to >= from && nights(from, query.to) < 28 ? nights(from, query.to) + 1 : 14;
        const [inventory, details] = await Promise.all([
            db.rpc('admin_calendar_inventory', { property: session.propertyId, first_day: from, last_day: shiftDay(from, Math.max(periodDays, 7) - 1) }),
            restricted ? [] : adminAvailabilityRepository.bookings(session, from, shiftDay(from, Math.max(periodDays, 7))),
        ]);
        if (inventory.error || !inventory.data) throw inventory.error;
        calendar = inventory.data;
        const byId = new Map(details.map(detail => [detail.id, detail]));
        bookings = calendar.occupancy.filter(item => item.roomIds.length || item.unassignedTypeIds?.length).map(item => {
            const detail = byId.get(item.id);
            return detail ? { ...item, reference: detail.reference, guestName: detail.guestName, guestCount: detail.guestCount } : item;
        });
    } catch {
        return <div className="space-y-5"><AdminPageHeader title="Calendar"/><AdminEmptyState title="Calendar unavailable" description="Room availability could not be loaded. Refresh before making changes."/><a href="/admin/availability" className="inline-flex min-h-11 items-center rounded-lg border px-4">Reload calendar</a></div>;
    }
    return <div data-availability-page data-restricted-calendar={restricted || undefined} className="space-y-5">
        <AdminPageHeader title="Availability calendar" description={'Room inventory and closures · ' + timeZone}
            actions={restricted ? <div className="flex flex-wrap items-center gap-3"><Link className="underline" href="/admin/workspace">My workspace</Link><WorkspaceAccount/></div> : session.role === 'owner' ? <Link href="/admin/channels/booking-com" className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-brand">Booking.com calendar sync</Link> : undefined}/>
        <AvailabilityCalendar rooms={calendar.rooms} blocks={calendar.blocks} bookings={bookings} from={from} today={today}
            periodDays={periodDays} timeZone={timeZone} restricted={restricted}
            selectedRoom={calendar.rooms.some(room => room.id === query.room || 'type:' + room.roomTypeId === query.room) ? query.room : undefined} initialView={query.view === 'type' ? 'type' : 'room'}
            blockStart={validDay(query.blockStart) ? query.blockStart : undefined} blockEnd={validDay(query.blockEnd) ? query.blockEnd : undefined}/>
    </div>;
}
