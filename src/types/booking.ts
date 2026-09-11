import type { Room } from './public';

export interface StaySearch { checkIn: string; checkOut: string; guests: number }
export interface AvailableRoom { room: Room; nightlyRate: number; nightlyRates:{date:string;amount:number;currency:string;source:'base'|'seasonal'|'weekend';sourceName?:string}[]; nights: number; subtotal: number; currency:string; minimumStay:number|null }
export interface BookingAddon {
  id:string; bookingKey?:string; type:'experience'|'transfer'; name:string; description:string;
  image:string; duration:string; price:number; priceLabel?:string; perGuest?:boolean;
  capacity:number|null; availabilityMode:string; availableDays?:number[];
  windowStart?:string; windowEnd?:string; direction?:'arrival'|'departure'|'other';
  date:string; time:string; quantity:number;
}
export interface GuestInformation { firstName: string; lastName: string; email: string; phone: string; country:string; adults:number; children:number; notes: string }
export interface BookingSelection { search: StaySearch; room: AvailableRoom | null; addons: BookingAddon[]; guest: GuestInformation }
export interface BookingPriceSummary { roomSubtotal: number; addonsSubtotal: number; taxesAndFees: null; totalBeforeTaxes: number; currency: string }
export interface BookingHold { id: string; token:string; expiresAt: string; reference:string; total:number; currency:string }
export interface BookingConfirmation { reference: string; status: 'pending'|'awaiting_payment'|'confirmed'; token:string }
export type AvailabilityStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface BookingService {
  searchAvailability(search: StaySearch): Promise<AvailableRoom[]>;
  getRoomRate(roomId: string, search: StaySearch): Promise<AvailableRoom>;
  createBookingHold(selection: BookingSelection): Promise<BookingHold>;
  createBooking(selection: BookingSelection, hold: BookingHold): Promise<BookingConfirmation>;
}
