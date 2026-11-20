'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notificationService } from '@/lib/notifications/service';
import { bookingManagerArguments, bookingUuid, type BookingManager, type BookingManagementState } from '@/lib/booking/management';

const messages:Record<string,string>={
  modified:'Booking updated.', cancelled:'Booking cancelled. Payment and refund arrangements are handled separately.',
  requested:'Request received. Your booking stays as confirmed until Borealis reviews it.',
  already_requested:'A request is already awaiting review. Your booking remains unchanged.',
  reviewed:'Request marked reviewed. The reservation was not changed by this action.',
  review_required:'This action requires staff review. The booking has not changed.',
  invalid:'Check the dates, booking window and guest counts.',
  conflict:'The assigned room is unavailable for those dates. Your original booking is unchanged.',
  unchanged:'These dates and guest counts match your booking.',
  requote:'The booking or price changed. Review a new quote before confirming.',
  unavailable:'This booking no longer accepts requests.',
};
const successes=new Set(['modified','cancelled','requested','reviewed']);

export async function manageBookingAction(manager:BookingManager,_:BookingManagementState,form:FormData):Promise<BookingManagementState> {
  const args=bookingManagerArguments(manager),identity=args.target_token??args.target_booking??'';
  if(!bookingUuid.test(identity))return {message:'Booking unavailable.'};
  if(args.target_booking)await requireAdmin(['owner','manager','staff']);
  const value=(name:string)=>String(form.get(name)||'');
  const action=value('action');
  if(!['quote','modify','cancel','request_change','request_cancel','review'].includes(action))return {message:'Choose a booking action.'};
  const operationId=value('operationId');
  if(action!=='quote'&&!bookingUuid.test(operationId))return {message:'Refresh this page before retrying.'};
  const stay={checkIn:value('checkIn'),checkOut:value('checkOut'),adults:value('adults'),children:value('children'),infants:value('infants')};
  let payload:Record<string,string|boolean>={};
  if(action==='quote'||action==='modify') {
    if(![stay.checkIn,stay.checkOut].every(date=>/^\d{4}-\d{2}-\d{2}$/.test(date))||![stay.adults,stay.children,stay.infants].every(count=>/^\d{1,2}$/.test(count)))return {message:messages.invalid};
    payload={...stay,...(action==='modify'?{version:value('version')}:{})};
  } else if(action.startsWith('request_')) {
    const message=value('message').trim();
    if(message.length<3||message.length>1000)return {message:'Enter 3–1,000 characters describing your request.'};
    payload={message};
  } else if(action==='cancel') {
    if(value('confirmed')!=='on')return {message:'Confirm that you want to cancel this booking.'};
    payload={confirmed:true};
  }
  const db=await createServerSupabaseClient();
  const {data,error}=await db.rpc('manage_booking',{...args,action,operation_id:action==='quote'?null:operationId,payload});
  if(error)return {message:error.code==='22023'||error.code?.startsWith('22')?'These dates, guest counts or pricing rules do not support this change. Your booking is unchanged.':'The booking action could not be completed. Check the current booking before retrying.'};
  if(!data)return {message:'Booking unavailable.'};
  if(data.result==='quoted')return {message:'Review the revised total before applying the change.',quote:{stay,total:Number(data.total),currency:data.currency,version:data.version,operationId:randomUUID()}};
  if(successes.has(data.result)) {
    if(args.target_token)revalidatePath('/booking/confirmation/'+args.target_token,'layout');
    if(args.target_booking)revalidatePath('/admin/bookings/'+args.target_booking);
    revalidatePath('/admin/bookings/requests');
    revalidatePath('/admin/dashboard');
    if(data.result==='modified'||data.result==='cancelled') {
      revalidatePath('/admin/bookings');
      revalidatePath('/admin/availability');
      revalidatePath('/rooms');
      revalidatePath('/');
      revalidatePath('/book');
      // Dispatch only after commit. Guest calls never pass a private token to the mail channel.
      after(async()=>{
        try {
          const bookingId=args.target_booking||data.bookingId;
          if(bookingId)await notificationService.dispatchForBooking(bookingId,data.result==='modified'?'booking_modified':'booking_cancelled');
        } catch {
          console.error('Booking management email dispatch failed.');
        }
      });
    }
  }
  return {message:messages[data.result]||'The booking action could not be completed.',success:successes.has(data.result)};
}
