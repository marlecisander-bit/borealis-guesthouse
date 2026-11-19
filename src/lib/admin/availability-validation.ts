import { nights, validDay } from '@/lib/admin/availability-calendar';
import type { AvailabilityState } from '@/types/availability-admin';

const text = (data: FormData, key: string) => String(data.get(key) || '').trim();

export function validateBlock(data: FormData) {
  const [kind, id] = text(data, 'target').split(':');
  const startDate = text(data, 'startDate');
  const endDate = text(data, 'endDate');
  const reasonCode = text(data, 'reasonCode') || 'other';
  const reason = text(data, 'reason');
  const notes = text(data, 'notes');
  const errors: Record<string, string> = {};

  if (!['room', 'type'].includes(kind) || !id) errors.target = 'Choose a room or room type.';
  if (!validDay(startDate)) errors.startDate = 'Choose a valid start date.';
  if (!validDay(endDate) || endDate < startDate) errors.endDate = 'Choose a last night on or after the start.';
  else if (nights(startDate, endDate) > 366) errors.endDate = 'Shorten the closure to 367 nights or fewer.';
  if (!['maintenance', 'owner_use', 'other'].includes(reasonCode)) errors.reasonCode = 'Choose a valid reason.';
  if (reason.length > 300) errors.reason = 'Use 300 characters or fewer.';
  if (notes.length > 2000) errors.notes = 'Use 2,000 characters or fewer.';

  if (Object.keys(errors).length) return { state: { ok: false, message: 'Check the block details.', errors } as AvailabilityState };
  return { data: { kind: kind as 'room' | 'type', id, startDate, endDate, reasonCode, reason, notes } };
}
