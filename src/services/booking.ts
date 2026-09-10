import { experiences, rooms } from '@/data/public-content';
import type { AvailableRoom, BookingAddon, BookingConfirmation, BookingService, StaySearch } from '@/types/booking';

function nightsBetween(checkIn: string, checkOut: string) { return Math.ceil((new Date(`${checkOut}T12:00:00`).getTime() - new Date(`${checkIn}T12:00:00`).getTime()) / 86400000); }
function rateFor(roomId: string, search: StaySearch): AvailableRoom {
  const room = rooms.find((item) => item.id === roomId); if (!room) throw new Error('Room not found.');
  const nights = nightsBetween(search.checkIn, search.checkOut); if (nights < 1) throw new Error('Check-out must be after check-in.');
  return { room, nightlyRate: room.priceFrom, nights, subtotal: room.priceFrom * nights };
}
const pause = () => new Promise((resolve) => setTimeout(resolve, 450));

export const mockBookingService: BookingService = {
  async searchAvailability(search) { await pause(); return rooms.filter((room) => room.capacity >= search.guests).map((room) => rateFor(room.id, search)); },
  async getRoomRate(roomId, search) { await pause(); return rateFor(roomId, search); },
  async createBookingHold() { await pause(); return { id: 'mock-hold', expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() }; },
  async createBooking(): Promise<BookingConfirmation> { await pause(); return { reference: 'BOREALIS-PREVIEW', status: 'placeholder-confirmed' }; },
};

export const mockBookingAddons: BookingAddon[] = [
  { id: 'kayak', type: 'experience', name: experiences[0].title, description: 'A quiet paddle on Koman Lake.', price: 18 },
  { id: 'boat', type: 'experience', name: experiences[1].title, description: 'Explore remote shores from the water.', price: 35 },
  { id: 'airport', type: 'transfer', name: 'Tirana Airport transfer', description: 'Arrival transfer enquiry for your party.', price: 45 },
];
