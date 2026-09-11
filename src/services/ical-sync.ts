import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { downloadCalendarFeed } from '@/lib/ical/fetch-feed';
import { parseICalendar } from '@/lib/ical/parser';
import { createServiceSupabaseClient } from '@/lib/supabase/service';

export async function synchronizeExternalCalendar(db:SupabaseClient, calendarId:string) {
  const {data:calendar,error}=await db.from('external_calendars').select('id,calendar_url,direction,enabled').eq('id',calendarId).single();
  if (error || !calendar) throw error || new Error('External calendar not found.');
  if (!calendar.enabled || !['import','both'].includes(calendar.direction) || !calendar.calendar_url) throw new Error('Calendar import is disabled.');
  await db.from('external_calendars').update({last_sync_status:'syncing',last_sync_error:null}).eq('id',calendarId);
  try {
    const feed=await downloadCalendarFeed(calendar.calendar_url);
    const events=parseICalendar(feed);
    const {data,error:syncError}=await db.rpc('sync_external_calendar_events',{target_calendar:calendarId,event_payload:events});
    if (syncError) throw syncError;
    return data as {seen:number;removed:number;synced_at:string};
  } catch (error) {
    const message=(error instanceof Error?error.message:'Calendar synchronization failed.').slice(0,1000);
    await db.from('external_calendars').update({last_sync_status:'error',last_sync_error:message}).eq('id',calendarId);
    throw new Error(message);
  }
}

export async function synchronizeEnabledExternalCalendars() {
  const db=createServiceSupabaseClient();
  const {data,error}=await db.from('external_calendars').select('id').eq('enabled',true).in('direction',['import','both']);
  if (error) throw error;
  const results=[] as {id:string;ok:boolean;error?:string}[];
  for (const calendar of data||[]) {
    try { await synchronizeExternalCalendar(db,calendar.id); results.push({id:calendar.id,ok:true}); }
    catch (error) { results.push({id:calendar.id,ok:false,error:error instanceof Error?error.message:'Sync failed.'}); }
  }
  return results;
}

