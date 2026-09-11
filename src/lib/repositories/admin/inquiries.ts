import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminSession } from '@/lib/admin/auth';

export type ContactInquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new'|'read'|'replied'|'archived';
  createdAt: string;
};

export const adminInquiriesRepository = {
  async list(session: AdminSession): Promise<ContactInquiry[]> {
    const db = await createServerSupabaseClient();
    const { data, error } = await db.from('contact_inquiries')
      .select('id,name,email,phone,subject,message,status,created_at')
      .eq('property_id', session.propertyId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => ({ id: row.id, name: row.name, email: row.email, phone: row.phone || '', subject: row.subject, message: row.message, status: row.status, createdAt: row.created_at }));
  },
  async setStatus(session: AdminSession, id: string, status: ContactInquiry['status']) {
    const db = await createServerSupabaseClient();
    const { error } = await db.from('contact_inquiries').update({ status }).eq('property_id', session.propertyId).eq('id', id);
    if (error) throw error;
  },
};

