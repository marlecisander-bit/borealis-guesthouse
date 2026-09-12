import 'server-only';
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { bookingNotificationEmail } from './email-template';
import { ResendEmailChannel } from './resend-channel';
import type { NotificationChannel, NotificationType } from '@/types/notifications';

type GuestRow = { first_name: string; last_name: string; email: string | null; phone: string | null; is_primary: boolean };
type ItemRow = { item_type: string; title_snapshot: string | null; quantity: number; total_price: number | string; service_date: string | null; service_time: string | null; metadata?: { requestedQuantity?: number;guestCount?:number;capacity?:number;occupancy?:{adults:number;children:number;infants:number} } | null };

export class NotificationService {
  constructor(private readonly channels: NotificationChannel[] = [new ResendEmailChannel()]) {}

  async dispatchForBooking(bookingId: string, type: NotificationType) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Notification delivery is pending: SUPABASE_SERVICE_ROLE_KEY is not configured.');
      return;
    }
    const db = createServiceSupabaseClient();
    const { data: notification, error: notificationError } = await db.from('notifications')
      .select('id,type,booking_id').eq('booking_id', bookingId).eq('type', type).maybeSingle();
    if (notificationError || !notification) return;
    const [{ data: booking, error: bookingError }, { data: settings }, { data: deliveries }] = await Promise.all([
      db.from('bookings').select('id,property_id,reference,booking_status,source,check_in,check_out,adults,children,infants,total_guests,total_amount,currency,booking_guests(first_name,last_name,email,phone,is_primary),booking_items(item_type,title_snapshot,quantity,total_price,service_date,service_time,metadata)').eq('id', bookingId).single(),
      db.from('site_settings').select('setting_key,value_text').eq('property_id', (await db.from('bookings').select('property_id').eq('id', bookingId).single()).data?.property_id || '').in('setting_key', ['reply_to_email']),
      db.from('notification_deliveries').select('id,channel,recipient,status').eq('notification_id', notification.id).eq('status', 'pending'),
    ]);
    if (bookingError || !booking || !deliveries?.length) return;
    const guests = booking.booking_guests as unknown as GuestRow[];
    const guest = guests.find(item => item.is_primary) || guests[0];
    const items = booking.booking_items as unknown as ItemRow[];
    const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const replyTo = settings?.find(item => item.setting_key === 'reply_to_email')?.value_text || '';
    const email = bookingNotificationEmail({
      type: notification.type as NotificationType,
      reference: booking.reference || booking.id.slice(0, 8).toUpperCase(),
      status: booking.booking_status,
      source: booking.source || 'direct',
      guestName: guest ? `${guest.first_name} ${guest.last_name}`.trim() : 'Guest',
      guestEmail: guest?.email || 'Not provided',
      guestPhone: guest?.phone || 'Not provided',
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      adults: Number(booking.adults || 0),
      children: Number(booking.children || 0),
      infants: booking.infants==null?null:Number(booking.infants),
      totalGuests: booking.total_guests==null?null:Number(booking.total_guests),
      total: Number(booking.total_amount || 0),
      currency: booking.currency || 'EUR',
      roomTitle: items.find(item => item.item_type === 'room')?.title_snapshot || undefined,
      items: items.map(item => ({ type: item.item_type, title: item.title_snapshot || item.item_type, quantity: Number(item.metadata?.requestedQuantity || item.quantity), total: Number(item.total_price), date: item.service_date || undefined, time: item.service_time?.slice(0, 5) || undefined,guestCount:item.metadata?.guestCount,capacity:item.metadata?.capacity,occupancy:item.metadata?.occupancy })),
      bookingUrl: `${appUrl}/admin/bookings/${booking.id}`,
      replyTo,
    });
    for (const delivery of deliveries) {
      const channel = this.channels.find(item => item.name === delivery.channel);
      if (!channel) continue;
      try {
        const result = await channel.send(delivery.recipient, email);
        await db.from('notification_deliveries').update({ status: 'sent', attempt_count: 1, attempted_at: new Date().toISOString(), sent_at: new Date().toISOString(), provider_message_id: result.providerId || null, error_summary: null, updated_at: new Date().toISOString() }).eq('id', delivery.id);
      } catch (error) {
        const summary = (error instanceof Error ? error.message : 'Email delivery failed.').slice(0, 500);
        await db.from('notification_deliveries').update({ status: 'failed', attempt_count: 1, attempted_at: new Date().toISOString(), error_summary: summary, updated_at: new Date().toISOString() }).eq('id', delivery.id);
        console.error(`Notification ${notification.id} delivery failed: ${summary}`);
      }
    }
  }
}

export const notificationService = new NotificationService();
