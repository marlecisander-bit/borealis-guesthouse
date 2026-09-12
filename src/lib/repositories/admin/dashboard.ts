import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminSession } from '@/lib/admin/auth';

export interface TodayMetric { value: number; note: string }
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
export interface DashboardOverview {
  today: { arrivals: TodayMetric; departures: TodayMetric; guestsStaying: TodayMetric };
  upcomingBookings: UpcomingBooking[];
  attention: AttentionItem[];
}

type Guest = { first_name: string; last_name: string; is_primary: boolean };
type BookingItem = { item_type: string; title_snapshot: string | null };
const propertyTimeZone = 'Europe/Tirane';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: propertyTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const count = async (query: PromiseLike<{ count: number | null; error: unknown }>) => { const result=await query; return result.error ? 0 : result.count || 0; };

export async function getDashboardOverview(session: AdminSession): Promise<DashboardOverview> {
  const db = await createServerSupabaseClient();
  const date = today();
  const activeStatuses = ['pending', 'awaiting_payment', 'confirmed', 'checked_in'];
  const [arrivals, departures, stayingResult, pending, awaitingPayment, failedPayments, unreadNotifications, upcomingResult] = await Promise.all([
    count(db.from('bookings').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('check_in', date).in('booking_status', activeStatuses)),
    count(db.from('bookings').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('check_out', date).in('booking_status', ['confirmed', 'checked_in'])),
    db.from('bookings').select('total_guests,adults,children').eq('property_id', session.propertyId).lte('check_in', date).gt('check_out', date).in('booking_status', ['confirmed', 'checked_in']),
    count(db.from('bookings').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('booking_status', 'pending')),
    count(db.from('bookings').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('booking_status', 'awaiting_payment')),
    count(db.from('bookings').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('payment_status', 'failed').neq('booking_status', 'cancelled')),
    count(db.from('notifications').select('id', { count: 'exact', head: true }).eq('property_id', session.propertyId).eq('is_read', false)),
    db.from('bookings').select('id,reference,check_in,check_out,booking_status,total_amount,currency,booking_guests(first_name,last_name,is_primary),booking_items(item_type,title_snapshot)').eq('property_id', session.propertyId).gte('check_in', date).in('booking_status', activeStatuses).order('check_in', { ascending: true }).limit(5),
  ]);

  const guestsStaying = (stayingResult.data || []).reduce((sum, booking) => sum + Number(booking.total_guests ?? Number(booking.adults || 0) + Number(booking.children || 0)), 0);
  const attention: AttentionItem[] = [];
  if (pending) attention.push({ label: 'Booking requests', detail: 'Review and confirm new requests.', count: pending, href: '/admin/bookings?status=pending' });
  if (awaitingPayment) attention.push({ label: 'Awaiting payment', detail: 'Follow up before arrival.', count: awaitingPayment, href: '/admin/bookings?status=awaiting_payment' });
  if (failedPayments) attention.push({ label: 'Payment issues', detail: 'A payment needs review.', count: failedPayments, href: '/admin/bookings' });
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
    today: {
      arrivals: { value: arrivals, note: arrivals === 1 ? 'arrival today' : 'arrivals today' },
      departures: { value: departures, note: departures === 1 ? 'departure today' : 'departures today' },
      guestsStaying: { value: guestsStaying, note: guestsStaying === 1 ? 'guest in house' : 'guests in house' },
    },
    upcomingBookings,
    attention,
  };
}
