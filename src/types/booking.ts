import type { Room } from './public';

export interface OccupancyCounts { adults:number;children:number;infants:number }
export interface OccupancyAgePolicy { infantMaxAge:number;childMaxAge:number;minimumBookingHolderAge:number }
export interface StaySearch extends OccupancyCounts { checkIn: string; checkOut: string; guests: number }
export interface AvailableRoom { room: Room; nightlyRate: number; nightlyRates:{date:string;amount:number;currency:string;source:'base'|'seasonal'|'weekend';sourceName?:string}[]; nights: number; subtotal: number; currency:string; minimumStay:number|null }
export interface AccommodationRoom { room:Room; quantity:number; occupancies:OccupancyCounts[]; guestCounts:number[]; subtotal:number; currency:string }
export interface AccommodationOption { id:string; rooms:AccommodationRoom[]; requestedGuests:number; requestedOccupancy:OccupancyCounts; totalRooms:number; totalCapacity:number; unusedCapacity:number; subtotal:number; currency:string; nights:number; minimumStay:number|null }
export interface BookingAddon {
  id:string; bookingKey?:string; type:'experience'|'transfer'; name:string; description:string;
  image:string; duration:string; price:number; priceLabel?:string; perGuest?:boolean;
  capacity:number|null; availabilityMode:string; availableDays?:number[];
  windowStart?:string; windowEnd?:string; direction?:'arrival'|'departure'|'other';
  date:string; time:string; quantity:number;
}
export interface GuestInformation extends OccupancyCounts { firstName: string; lastName: string; email: string; phone: string; country:string; notes: string }
export interface BookingSelection { search: StaySearch; accommodation: AccommodationOption | null; addons: BookingAddon[]; guest: GuestInformation }
export interface BookingPriceSummary { roomSubtotal: number; addonsSubtotal: number; taxesAndFees: null; totalBeforeTaxes: number; currency: string }
export interface BookingHold { id: string; token:string; expiresAt: string; reference:string; total:number; currency:string }
export interface BookingConfirmation { reference: string; status: 'pending'|'awaiting_payment'|'confirmed'; token:string }
export type AvailabilityStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface BookingService {
  searchAvailability(search: StaySearch): Promise<AccommodationOption[]>;
  createBookingHold(selection: BookingSelection): Promise<BookingHold>;
  createBooking(selection: BookingSelection, hold: BookingHold): Promise<BookingConfirmation>;
}
