import type { AvailabilityBlock, AvailabilityBooking, AvailabilityRoom } from '@/types/availability-admin';
export function validDay(value?: string): value is string { return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value); }
export function shiftDay(day: string, amount: number) { const d = new Date(day + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + amount); return d.toISOString().slice(0, 10); }
export function nights(start: string, end: string) { return validDay(start) && validDay(end) ? Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 86400000)) : 0; }
export function tiraneDay(now: Date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Tirane', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
export function liveStay(b: AvailabilityBooking, now: number) { return ['held', 'pending', 'awaiting_payment', 'confirmed', 'checked_in'].includes(b.status) && (b.status !== 'held' || Boolean(b.holdExpiresAt && Date.parse(b.holdExpiresAt) > now)); }
export function pendingStay(b: AvailabilityBooking) { return ['held', 'pending', 'awaiting_payment'].includes(b.status); }
export function occupies(b: AvailabilityBooking, day: string) { return b.checkIn <= day && b.checkOut > day; }
export function assignedTo(b: AvailabilityBooking, r: AvailabilityRoom) { return b.roomIds.includes(r.id); }
export function unassignedTo(b: AvailabilityBooking, type: string) { return b.unassignedTypeIds ? b.unassignedTypeIds.includes(type) : !b.roomIds.length && b.roomTypeIds.includes(type); }
export function closuresFor(r: AvailabilityRoom, blocks: AvailabilityBlock[]) { return blocks.filter(b => b.status === 'published' && (b.roomId === r.id || b.roomTypeId === r.roomTypeId)); }
export function cellState(r: AvailabilityRoom, day: string, blocks: AvailabilityBlock[], bookings: AvailabilityBooking[]) { if (!r.active)
    return 'Inactive'; if (closuresFor(r, blocks).some(b => b.startDate <= day && b.endDate >= day))
    return 'Closed'; if (bookings.some(b => assignedTo(b, r) && occupies(b, day)))
    return 'Occupied'; if (bookings.some(b => unassignedTo(b, r.roomTypeId) && occupies(b, day)))
    return 'Category reservation — check allocation'; return 'Available'; }
export function spanWithin(start: string, endExclusive: string, from: string, count: number) { const left = Math.max(0, nights(from, start)); const right = Math.min(count, Math.round((Date.parse(endExclusive) - Date.parse(from)) / 86400000)); return right > left ? { start: left, length: right - left } : null; }
export function bookingHref(r: AvailabilityRoom, start: string, end: string) { return '/admin/bookings/new?' + new URLSearchParams({ roomTypeId: r.roomTypeId, checkIn: start, checkOut: end }); }
