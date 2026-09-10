import type { Room } from './public';

export interface StaySearch { checkIn: string; checkOut: string; guests: number }
export interface AvailableRoom { room: Room; nightlyRate: number; nights: number; subtotal: number }
export interface BookingAddon { id: string; type: 'experience' | 'transfer'; name: string; description: string; price: number }
export interface GuestInformation { firstName: string; lastName: string; email: string; phone: string; notes: string }
export interface BookingSelection { search: StaySearch; room: AvailableRoom | null; addons: BookingAddon[]; guest: GuestInformation }
export interface BookingPriceSummary { roomSubtotal: number; addonsSubtotal: number; taxesAndFees: null; totalBeforeTaxes: number; currency: 'EUR' }
export interface BookingHold { id: string; expiresAt: string }
export interface BookingConfirmation { reference: string; status: 'placeholder-confirmed' }
export type AvailabilityStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface BookingService {
  searchAvailability(search: StaySearch): Promise<AvailableRoom[]>;
  getRoomRate(roomId: string, search: StaySearch): Promise<AvailableRoom>;
  createBookingHold(selection: BookingSelection): Promise<BookingHold>;
  createBooking(selection: BookingSelection, hold: BookingHold): Promise<BookingConfirmation>;
}
