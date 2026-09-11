'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { adminNotificationsRepository } from '@/lib/repositories/admin/notifications';

export async function markNotificationRead(id: string) {
  const session = await requireAdmin(['owner', 'manager', 'staff']);
  await adminNotificationsRepository.markRead(session, id);
  revalidatePath('/admin/notifications');
}

export async function markAllNotificationsRead() {
  const session = await requireAdmin(['owner', 'manager', 'staff']);
  await adminNotificationsRepository.markAllRead(session);
  revalidatePath('/admin/notifications');
}

