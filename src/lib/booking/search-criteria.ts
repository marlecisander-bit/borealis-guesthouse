import type { StaySearch } from '../../types/booking.ts';
import { dateOnlyToLocal, localToDateOnly, todayIso } from '../date-range.ts';

// This is a request-safety ceiling, not a room-capacity rule. Individual room
// capacity is still enforced by the pricing and booking engine.
export const MAX_BOOKING_GUESTS = 10;

type SearchInput = { checkIn?: unknown; checkOut?: unknown; guests?: unknown };

export function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = dateOnlyToLocal(value);
  return !Number.isNaN(date.getTime()) && localToDateOnly(date) === value;
}

export function validateBookingSearch(input: SearchInput, today = todayIso()): StaySearch | null {
  const { checkIn, checkOut } = input;
  const guests = typeof input.guests === 'number' ? input.guests : Number(input.guests);
  if (!isValidDateOnly(checkIn) || !isValidDateOnly(checkOut)) return null;
  if (checkIn < today || checkOut <= checkIn) return null;
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_BOOKING_GUESTS) return null;
  return { checkIn, checkOut, guests };
}

export function bookingSearchKey(search: StaySearch) {
  return `${search.checkIn}|${search.checkOut}|${search.guests}`;
}

export function bookingSearchUrl(search: StaySearch, extras: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams({ checkIn:search.checkIn, checkOut:search.checkOut, guests:String(search.guests) });
  for (const [key, value] of Object.entries(extras)) if (value) params.set(key, value);
  return `/book?${params.toString()}`;
}
