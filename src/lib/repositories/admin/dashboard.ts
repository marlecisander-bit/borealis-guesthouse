import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { arrivalStatuses, stayingStatuses, bookingListHref } from '@/lib/admin/booking-views';
import { tiraneDay } from '@/lib/admin/availability-calendar';
import type { AdminSession } from '@/lib/admin/auth';

export interface TodayMetric { value: number | null; href: string }
export interface UpcomingBooking {
  id: string;
  reference: string;
  guestName: string;
  booking: string;
  checkIn: string;
  checkOut: string;
  status: string;
  total: number;
  currency: string;
}
export interface AttentionItem { label: string; detail: string; count: number; href: string }
type PendingGuestRequest = { booking_id: string; reference: string; operation: string };
export interface DashboardOverview {
  today: { arrivals: TodayMetric; departures: TodayMetric; guestsStaying: TodayMetric };
  upcomingBookings: UpcomingBooking[];
  attention: AttentionItem[];
  guestRequests: PendingGuestRequest[];
  guestRequestCount: number | null;
  date: string;
  attentionUnavailable: boolean;
  arrivalsUnavailable: boolean;
}

type Guest = { first_name: string; last_name: string; is_primary: boolean };
type BookingItem = { item_type: string; title_snapshot: string | null };
const count = async (query: PromiseLike<{ count: number | null; error: unknown }>) => {
  try { const result=await query; return result.error ? null : result.count; }
  catch { return null; }
};

export async function getDashboardOverview(session: AdminSession): Promise<DashboardOverview> {
  const db = await createServerSupabaseClient();
  const date = tiraneDay();
  const canReview = session.role !== 'editor';
  const [reviewQueue, arrivals, departures, stayingResult, pending, awaitingPayment, failedPayments, unreadNotifications, upcomingResult] = await Promise.all([
    canReview
      ? db.rpc('booking_review_queue', { target_property: session.propertyId }, { count: 'exact' }).limit(3).then(
        ({ data, count, error }) => ({ rows: error ? [] : (data ?? []) as PendingGuestRequest[], count: error ? null : count }),
        () => ({ rows: [], count: null }),
      )
      : { rows: [], count: 0 },
    count(db.from('bookings').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('check_in', date).in('booking_status', arrivalStatuses)),
    count(db.from('bookings').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('check_out', date).in('booking_status', stayingStatuses)),
    db.from('bookings').select('total_guests,adults,children').eq('property_id', session.propertyId).lte('check_in', date).gt('check_out', date).in('booking_status', stayingStatuses),
    count(db.from('bookings').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('booking_status', 'pending')),
    count(db.from('bookings').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('booking_status', 'awaiting_payment')),
    count(db.from('bookings').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('payment_status', 'failed').neq('booking_status', 'cancelled')),
    count(db.from('notifications').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('is_read', false)),
    db.from('bookings').select('id,reference,check_in,check_out,booking_status,total_amount,currency,booking_guests(first_name,last_name,is_primary),booking_items(item_type,title_snapshot)').eq('property_id', session.propertyId).gte('check_in', date).in('booking_status', arrivalStatuses).order('check_in', { ascending: true }).limit(5),
  ]);

  const guestsStaying = (stayingResult.data || []).reduce((sum, booking) => sum + Number(booking.total_guests ?? Number(booking.adults || 0) + Number(booking.children || 0)), 0);
  const attention: AttentionItem[] = [];
  if (pending) attention.push({ label: 'New reservations', detail: 'Review and confirm new requests.', count: pending, href: '/admin/bookings?status=pending' });
  if (awaitingPayment) attention.push({ label: 'Awaiting payment', detail: 'Follow up before arrival.', count: awaitingPayment, href: '/admin/bookings?status=awaiting_payment' });
  if (failedPayments) attention.push({ label: 'Payment issues', detail: 'A payment needs review.', count: failedPayments, href: '/admin/bookings?payment=failed' });
  if (unreadNotifications) attention.push({ label: 'Unread notifications', detail: 'Check recent booking activity.', count: unreadNotifications, href: '/admin/notifications' });

  const upcomingBookings = (upcomingResult.data || []).map((row) => {
    const guests = (row.booking_guests || []) as unknown as Guest[];
    const items = (row.booking_items || []) as unknown as BookingItem[];
    const guest = guests.find((item) => item.is_primary) || guests[0];
    const roomItems = items.filter((item) => item.item_type === 'room');
    const booking = roomItems.length ? roomItems.map((item) => item.title_snapshot || 'Room').join(' + ') : items[0]?.title_snapshot || 'Service booking';
    return {
      id: row.id,
      reference: row.reference || row.id.slice(0, 8).toUpperCase(),
      guestName: guest ? `${guest.first_name} ${guest.last_name}` : 'Guest',
      booking,
      checkIn: row.check_in,
      checkOut: row.check_out,
      status: row.booking_status,
      total: Number(row.total_amount || 0),
      currency: row.currency || 'EUR',
    };
  });

  return {
    date,
    today: {
      arrivals: { value: arrivals, href: bookingListHref({period:'arrivals',date}) },
      departures: { value: departures, href: bookingListHref({period:'departures',date}) },
      guestsStaying: { value: stayingResult.error ? null : guestsStaying, href: bookingListHref({period:'in-house',date}) },
    },
    upcomingBookings,
    attention,
    guestRequests: reviewQueue.rows,
    guestRequestCount: reviewQueue.count,
    attentionUnavailable: [pending,awaitingPayment,failedPayments,unreadNotifications,reviewQueue.count].some(value=>value===null),
    arrivalsUnavailable: Boolean(upcomingResult.error),
  };
}
