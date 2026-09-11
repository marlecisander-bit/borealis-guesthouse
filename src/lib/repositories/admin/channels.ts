import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminSession } from '@/lib/admin/auth';
import type { CalendarDirection,CalendarProvider,ExternalCalendarAdmin } from '@/types/channels-admin';

function applicationUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL||process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/\/$/,'');
}
function safeHost(raw:string|null) { try{return raw?new URL(raw).hostname:'—';}catch{return 'Saved private URL';} }

export const adminChannelsRepository={
  async list(session:AdminSession,provider?:CalendarProvider):Promise<ExternalCalendarAdmin[]> {
    const db=await createServerSupabaseClient();
    let query=db.from('external_calendars').select('id,provider,name,calendar_url,export_token,direction,enabled,room_id,room_type_id,last_synced_at,last_sync_status,last_sync_error,created_at').eq('property_id',session.propertyId).order('created_at');
    if(provider)query=query.eq('provider',provider);
    const [{data,error},{data:rooms},{data:types},{data:events}]=await Promise.all([
      query,
      db.from('rooms').select('id,title,room_number').eq('property_id',session.propertyId).neq('status','archived').order('room_number'),
      db.from('room_types').select('id,name').eq('property_id',session.propertyId).neq('status','archived').order('sort_order'),
      db.from('external_calendar_events').select('external_calendar_id').eq('status','active'),
    ]);
    if(error)throw error;
    return(data||[]).map(row=>({
      id:row.id,provider:row.provider as CalendarProvider,name:row.name,direction:row.direction as CalendarDirection,enabled:row.enabled,
      roomId:row.room_id,roomTypeId:row.room_type_id,
      targetName:row.room_id?(rooms||[]).find(x=>x.id===row.room_id)?.title||(rooms||[]).find(x=>x.id===row.room_id)?.room_number||'Physical room':(types||[]).find(x=>x.id===row.room_type_id)?.name||'Room type',
      importHost:safeHost(row.calendar_url),exportUrl:`${applicationUrl()}/api/calendars/${row.export_token}.ics`,lastSyncedAt:row.last_synced_at,
      lastSyncStatus:row.last_sync_status,lastSyncError:row.last_sync_error||'',activeEventCount:(events||[]).filter(x=>x.external_calendar_id===row.id).length,
    }));
  },
  async targets(session:AdminSession) {
    const db=await createServerSupabaseClient();
    const [{data:rooms,error:roomsError},{data:types,error:typesError}]=await Promise.all([
      db.from('rooms').select('id,title,room_number').eq('property_id',session.propertyId).neq('status','archived').order('room_number'),
      db.from('room_types').select('id,name').eq('property_id',session.propertyId).neq('status','archived').order('sort_order'),
    ]);
    if(roomsError||typesError)throw roomsError||typesError;
    return{rooms:(rooms||[]).map(x=>({id:x.id,name:x.title||x.room_number})),roomTypes:(types||[]).map(x=>({id:x.id,name:x.name}))};
  },
  async save(session:AdminSession,input:{id:string|null;name:string;provider:CalendarProvider;direction:CalendarDirection;roomId:string|null;roomTypeId:string|null;calendarUrl:string|null;enabled:boolean}) {
    const db=await createServerSupabaseClient();
    const values={property_id:session.propertyId,name:input.name,provider:input.provider,direction:input.direction,room_id:input.roomId,room_type_id:input.roomTypeId,enabled:input.enabled,updated_by:session.userId};
    if(input.id){
      const update={...values,...(input.calendarUrl?{calendar_url:input.calendarUrl}:{})};
      const{error}=await db.from('external_calendars').update(update).eq('id',input.id).eq('property_id',session.propertyId);if(error)throw error;return input.id;
    }
    const{data,error}=await db.from('external_calendars').insert({...values,calendar_url:input.calendarUrl,created_by:session.userId}).select('id').single();if(error)throw error;return data.id;
  },
  async setEnabled(session:AdminSession,id:string,enabled:boolean){const db=await createServerSupabaseClient();const{error}=await db.from('external_calendars').update({enabled,updated_by:session.userId}).eq('id',id).eq('property_id',session.propertyId);if(error)throw error;},
};

