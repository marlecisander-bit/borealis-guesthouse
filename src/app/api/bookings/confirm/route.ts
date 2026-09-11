import { after, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { id, token } = await request.json();
    if (!id || !token) return NextResponse.json({ error: 'Booking hold credentials are required.' }, { status: 400 });
    const db = await createServerSupabaseClient();
    const { data, error } = await db.rpc('confirm_booking_hold', { target_booking: id, target_token: token });
    if (error) throw error;
    const booking = Array.isArray(data) ? data[0] : data;
    after(async () => {
      try { await notificationService.dispatchForBooking(id, 'booking_created'); }
      catch (deliveryError) { console.error('Owner notification dispatch failed:', deliveryError); }
    });
    return NextResponse.json({ reference: booking.reference, status: booking.status, token });
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : 'The booking could not be created.';
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
