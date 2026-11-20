'use server';

import { revalidatePath } from 'next/cache';
import { requireCalendarAccess } from '@/lib/admin/calendar-access';
import { validateBlock } from '@/lib/admin/availability-validation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AvailabilityState } from '@/types/availability-admin';

function refresh() {
  revalidatePath('/admin/availability');
  revalidatePath('/admin/workspace/calendar');
  revalidatePath('/book');
}

export async function createAvailabilityBlock(_: AvailabilityState, data: FormData): Promise<AvailabilityState> {
  const { session, restricted } = await requireCalendarAccess();
  const value = validateBlock(data);
  if (!value.data) return value.state!;
  if (restricted && value.data.kind !== 'room') return { ok: false, message: 'Choose a physical room unit.' };
  const db = await createServerSupabaseClient();
  const { error } = await db.rpc('admin_calendar_change', {
    property: session.propertyId, operation: value.data.kind, target: value.data.id,
    payload: { startDate: value.data.startDate, endDate: value.data.endDate, reasonCode: value.data.reasonCode, reason: value.data.reason, notes: value.data.notes },
  });
  if (error) return { ok: false, message: error.code === '23P01' ? error.message : 'Dates could not be blocked. Check the room and dates, then try again.' };
  refresh();
  return { ok: true, message: 'Dates blocked. Availability has been updated.' };
}

async function reopenAvailability(id: string) {
  const { session } = await requireCalendarAccess();
  const db = await createServerSupabaseClient();
  const { error } = await db.rpc('admin_calendar_change', { property: session.propertyId, operation: 'reopen', target: id });
  if (error) throw error;
  refresh();
}

export async function reopenAvailabilityState(_: AvailabilityState, data: FormData): Promise<AvailabilityState> {
  const id = String(data.get('id') || '');
  if (!id) return { ok: false, message: 'Choose a closure.' };
  try {
    await reopenAvailability(id);
    return { ok: true, message: 'Dates reopened. Availability has been updated.' };
  } catch {
    return { ok: false, message: 'Only an active manual block can be reopened. Refresh and try again.' };
  }
}
