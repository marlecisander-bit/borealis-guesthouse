import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminSession } from '@/lib/admin/auth';
import type { AdminNotification } from '@/types/notifications';

export const adminNotificationsRepository = {
  async list(session: AdminSession, page = 1, pageSize = 25): Promise<{ items: AdminNotification[]; total: number }> {
    const db = await createServerSupabaseClient();
    const from = (page - 1) * pageSize;
    const { data, error, count } = await db.from('notifications')
      .select('id,type,title,message,booking_id,is_read,created_at,notification_deliveries(status)', { count: 'exact' })
      .eq('property_id', session.propertyId)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    return {
      total: count || 0,
      items: (data || []).map(row => ({
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        bookingId: row.booking_id,
        isRead: row.is_read,
        createdAt: row.created_at,
        deliveryStatus: (row.notification_deliveries as unknown as Array<{ status: AdminNotification['deliveryStatus'] }> | null)?.[0]?.status || null,
      })),
    };
  },

  async markRead(session: AdminSession, id: string) {
    const db = await createServerSupabaseClient();
    const { error } = await db.from('notifications').update({ is_read: true, read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('property_id', session.propertyId).eq('id', id);
    if (error) throw error;
  },

  async markAllRead(session: AdminSession) {
    const db = await createServerSupabaseClient();
    const now = new Date().toISOString();
    const { error } = await db.from('notifications').update({ is_read: true, read_at: now, updated_at: now })
      .eq('property_id', session.propertyId).eq('is_read', false);
    if (error) throw error;
  },
};

