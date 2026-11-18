import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { bookingManagerArguments, type BookingManagement, type BookingManager } from './management';

export async function readBookingManagement(manager:BookingManager) {
  const db=await createServerSupabaseClient();
  const {data,error}=await db.rpc('manage_booking',{...bookingManagerArguments(manager),action:'read'});
  if(error)throw new Error('Booking management is currently unavailable.');
  return data as BookingManagement|null;
}
