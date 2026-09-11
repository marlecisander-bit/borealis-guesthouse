import { createClient } from '@supabase/supabase-js';
import { buildICalendar,type ExportCalendarEvent } from '@/lib/ical/feed';
import { fetchSupabase } from '@/lib/supabase/fetch';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(_request:Request,{params}:{params:Promise<{filename:string}>}){
  const{filename}=await params,token=filename.endsWith('.ics')?filename.slice(0,-4):'';
  if(!/^[a-f0-9]{64}$/.test(token))return new Response('Calendar not found.',{status:404});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return new Response('Calendar service is not configured.',{status:503});
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:fetchSupabase}});
  const{data:enabled,error:enabledError}=await db.rpc('is_external_calendar_export_enabled',{target_token:token});
  if(enabledError||!enabled)return new Response('Calendar not found.',{status:404});
  const{data,error}=await db.rpc('get_external_calendar_export_events',{target_token:token});
  if(error)return new Response('Calendar not found.',{status:404});
  return new Response(buildICalendar((data||[]) as ExportCalendarEvent[]),{headers:{'content-type':'text/calendar; charset=utf-8','content-disposition':'inline; filename="borealis-availability.ics"','cache-control':'private, no-store, max-age=0','x-content-type-options':'nosniff'}});
}
