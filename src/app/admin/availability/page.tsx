import { AdminPageHeader, AdminEmptyState } from '@/components/admin/ui';
import { AvailabilityCalendar } from '@/components/admin/AvailabilityCalendar';
import { requireAdmin } from '@/lib/admin/auth';
import { adminAvailabilityRepository } from '@/lib/repositories/admin/availability';
import { shiftDay, tiraneDay, validDay } from '@/lib/admin/availability-calendar';
export const metadata = { title: 'Calendar | Borealis Admin' };
export default async function AvailabilityPage({ searchParams }: {
    searchParams: Promise<{
        from?: string;
        view?: string;
        blockStart?: string;
        blockEnd?: string;
    }>;
}) {
    const session = await requireAdmin(['owner', 'manager', 'staff']), query = await searchParams, today = tiraneDay(), from = validDay(query.from) ? query.from : today;
    let rooms, blocks, bookings, daily;
    try {
        rooms = await adminAvailabilityRepository.inventory(session);
        [blocks, bookings, daily] = await Promise.all([adminAvailabilityRepository.blocks(session, from, shiftDay(from, 13), rooms), adminAvailabilityRepository.bookings(session, from, shiftDay(from, 14)), adminAvailabilityRepository.bookings(session, today, shiftDay(today, 1), true)]);
    }
    catch {
        return <div className="space-y-5"><AdminPageHeader title="Calendar"/><AdminEmptyState title="Calendar unavailable" description="Room availability could not be loaded. Refresh before making changes."/><a href="/admin/availability" className="inline-flex min-h-11 items-center rounded-lg border px-4">Reload calendar</a></div>;
    }
    return <div data-availability-page className="space-y-5"><AdminPageHeader title="Calendar" description="Stays, arrivals and room closures · Europe/Tirane"/><AvailabilityCalendar rooms={rooms} blocks={blocks} bookings={bookings} daily={daily} from={from} today={today} initialView={query.view === 'type' ? 'type' : 'room'} blockStart={validDay(query.blockStart) ? query.blockStart : undefined} blockEnd={validDay(query.blockEnd) ? query.blockEnd : undefined}/></div>;
}
