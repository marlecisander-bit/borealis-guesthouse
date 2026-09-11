'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function setPropertyPublication(data: FormData) {
  const session = await requireAdmin(['owner','manager']);
  const status = data.get('published') === 'true' ? 'published' : 'draft';
  const db = await createServerSupabaseClient();
  const { error } = await db.from('properties').update({ status, updated_by: session.userId }).eq('id', session.propertyId);
  if (error) throw error;
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  revalidatePath('/sitemap.xml');
}

