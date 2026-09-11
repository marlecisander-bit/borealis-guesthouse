import type { AvailableRoom, BookingConfirmation, BookingService } from '@/types/booking';

export const bookingService: BookingService = {
  async searchAvailability(search) { const response=await fetch('/api/pricing',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(search)});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Pricing could not be loaded.');return payload.rooms as AvailableRoom[]; },
  async getRoomRate(roomId, search) { const rooms=await this.searchAvailability(search);const room=rooms.find(item=>item.room.id===roomId);if(!room)throw new Error('Room is unavailable for these dates.');return room; },
  async createBookingHold(selection) {const response=await fetch('/api/bookings/hold',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({search:selection.search,roomTypeId:selection.room?.room.id,addons:selection.addons,guest:selection.guest})}),payload=await response.json();if(!response.ok)throw new Error(payload.error||'The room could not be held.');return payload;},
  async createBooking(_selection,hold): Promise<BookingConfirmation> {const response=await fetch('/api/bookings/confirm',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:hold.id,token:hold.token})}),payload=await response.json();if(!response.ok)throw new Error(payload.error||'The booking could not be created.');return payload;},
};
