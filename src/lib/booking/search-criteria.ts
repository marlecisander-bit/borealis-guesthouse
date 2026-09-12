import type { StaySearch } from '../../types/booking.ts';
import { dateOnlyToLocal, localToDateOnly, todayIso } from '../date-range.ts';

// This is a request-safety ceiling, not a room-capacity rule. Individual room
// capacity is still enforced by the pricing and booking engine.
export const MAX_BOOKING_GUESTS = 24;

type SearchInput = { checkIn?: unknown; checkOut?: unknown; guests?: unknown; adults?:unknown;children?:unknown;infants?:unknown };

export function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = dateOnlyToLocal(value);
  return !Number.isNaN(date.getTime()) && localToDateOnly(date) === value;
}

export function validateBookingSearch(input: SearchInput, today = todayIso()): StaySearch | null {
  const { checkIn, checkOut } = input;
  const hasCategories=[input.adults,input.children,input.infants].some(value=>value!==undefined&&value!==null&&value!=='');
  const legacyGuests=typeof input.guests==='number'?input.guests:Number(input.guests);
  const adults=hasCategories?Number(input.adults??0):legacyGuests;
  const children=hasCategories?Number(input.children??0):0;
  const infants=hasCategories?Number(input.infants??0):0;
  const guests=adults+children+infants;
  if (!isValidDateOnly(checkIn) || !isValidDateOnly(checkOut)) return null;
  if (checkIn < today || checkOut <= checkIn) return null;
  if (![adults,children,infants].every(Number.isInteger)||adults<1||children<0||infants<0||guests>MAX_BOOKING_GUESTS) return null;
  if(Number.isFinite(legacyGuests)&&hasCategories&&legacyGuests!==guests)return null;
  return { checkIn, checkOut, guests, adults, children, infants };
}

export function bookingSearchKey(search: StaySearch) {
  return `${search.checkIn}|${search.checkOut}|${search.adults}|${search.children}|${search.infants}`;
}

export function bookingSearchUrl(search: StaySearch, extras: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams({ checkIn:search.checkIn, checkOut:search.checkOut, guests:String(search.guests), adults:String(search.adults), children:String(search.children), infants:String(search.infants) });
  for (const [key, value] of Object.entries(extras)) if (value) params.set(key, value);
  return `/book?${params.toString()}`;
}
