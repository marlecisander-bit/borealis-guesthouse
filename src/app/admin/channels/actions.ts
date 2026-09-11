'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { validateExternalCalendar } from '@/lib/admin/channel-validation';
import { adminChannelsRepository } from '@/lib/repositories/admin/channels';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { synchronizeExternalCalendar } from '@/services/ical-sync';
import type { ChannelActionState } from '@/types/channels-admin';
const refresh=()=>{revalidatePath('/admin/channels');revalidatePath('/admin/channels/booking-com');revalidatePath('/admin/availability');revalidatePath('/book');};

export async function saveExternalCalendar(_:ChannelActionState,data:FormData):Promise<ChannelActionState>{
  const session=await requireAdmin(['owner']),validated=validateExternalCalendar(data);if(!validated.data)return validated.state!;
  try{await adminChannelsRepository.save(session,validated.data);refresh();return{ok:true,message:'Calendar connection saved.'};}
  catch(error){return{ok:false,message:error instanceof Error?error.message:'Calendar connection could not be saved.'};}
}
export async function setExternalCalendarEnabled(id:string,enabled:boolean){const session=await requireAdmin(['owner']);await adminChannelsRepository.setEnabled(session,id,enabled);refresh();}
export async function syncExternalCalendarNow(id:string){await requireAdmin(['owner']);const db=await createServerSupabaseClient();try{await synchronizeExternalCalendar(db,id);}catch{/* Status and safe error are persisted for the owner. */}refresh();}

