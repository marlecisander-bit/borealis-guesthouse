import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminSession } from '@/lib/admin/auth';

export interface DashboardMetric { value:number; note:string }
export interface RecentBooking { id:string; reference:string; checkIn:string; checkOut:string; status:string; total:number }
export interface RecentContent { id:string; title:string; slug:string; status:string; updatedAt:string }
export interface RecentMedia { id:string; title:string; filePath:string; createdAt:string }
export interface DashboardOverview {
  metrics:{bookingsToday:DashboardMetric;arrivals:DashboardMetric;departures:DashboardMetric;occupancy:DashboardMetric;blockedRooms:DashboardMetric;requests:DashboardMetric;experiences:DashboardMetric;transfers:DashboardMetric};
  recentBookings:RecentBooking[];recentContent:RecentContent[];recentMedia:RecentMedia[];
}

const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tirane',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

export async function getDashboardOverview(session:AdminSession):Promise<DashboardOverview>{
  const supabase=await createServerSupabaseClient();const date=today();const tomorrow=new Date(`${date}T00:00:00Z`);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);const tomorrowDate=tomorrow.toISOString().slice(0,10);
  const count=async(query:PromiseLike<{count:number|null;error:unknown}>)=>{const result=await query;return result.error?0:result.count||0};
  const [bookingsToday,arrivals,departures,requests,totalRooms,unavailableRooms,activeStays,upcomingExperiences,upcomingTransfers,blockCount,recentBookingResult,recentContentResult,recentMediaResult]=await Promise.all([
    count(supabase.from('bookings').select('id',{count:'exact',head:true}).eq('property_id',session.propertyId).gte('created_at',`${date}T00:00:00`).lt('created_at',`${tomorrowDate}T00:00:00`)),
    count(supabase.from('bookings').select('id',{count:'exact',head:true}).eq('property_id',session.propertyId).gte('check_in',date).in('status',['pending','confirmed','checked_in'])),
    count(supabase.from('bookings').select('id',{count:'exact',head:true}).eq('property_id',session.propertyId).gte('check_out',date).in('status',['confirmed','checked_in'])),
    count(supabase.from('bookings').select('id',{count:'exact',head:true}).eq('property_id',session.propertyId).eq('status','pending')),
    count(supabase.from('rooms').select('id',{count:'exact',head:true}).eq('property_id',session.propertyId)),
    count(supabase.from('rooms').select('id',{count:'exact',head:true}).eq('property_id',session.propertyId).eq('is_available',false)),
    count(supabase.from('bookings').select('id',{count:'exact',head:true}).eq('property_id',session.propertyId).lte('check_in',date).gt('check_out',date).in('status',['confirmed','checked_in'])),
    count(supabase.from('experience_availability').select('id,experiences!inner(property_id)',{count:'exact',head:true}).eq('experiences.property_id',session.propertyId).gte('available_date',date)),
    count(supabase.from('booking_items').select('id,bookings!inner(property_id)',{count:'exact',head:true}).eq('bookings.property_id',session.propertyId).eq('item_type','transfer').gte('service_date',date)),
    count(supabase.from('availability_blocks').select('id',{count:'exact',head:true}).eq('property_id',session.propertyId).lte('start_date',date).gte('end_date',date).neq('status','archived')),
    supabase.from('bookings').select('id,check_in,check_out,status,total_amount').eq('property_id',session.propertyId).order('created_at',{ascending:false}).limit(5),
    supabase.from('pages').select('id,title,slug,status,updated_at').eq('property_id',session.propertyId).order('updated_at',{ascending:false}).limit(5),
    supabase.from('media_assets').select('id,title,file_path,created_at').eq('property_id',session.propertyId).order('created_at',{ascending:false}).limit(5),
  ]);
  const occupied=Math.min(activeStays,totalRooms);const occupancy=totalRooms?Math.round((occupied/totalRooms)*100):0;
  return {metrics:{bookingsToday:{value:bookingsToday,note:'Requests received today'},arrivals:{value:arrivals,note:'From today onward'},departures:{value:departures,note:'From today onward'},occupancy:{value:occupancy,note:totalRooms?`${occupied} of ${totalRooms} rooms occupied`:'Add rooms to calculate'},blockedRooms:{value:unavailableRooms+blockCount,note:'Unavailable or blocked today'},requests:{value:requests,note:'Awaiting confirmation'},experiences:{value:upcomingExperiences,note:'Scheduled from today'},transfers:{value:upcomingTransfers,note:'Booked from today'}},recentBookings:(recentBookingResult.data||[]).map(item=>({id:item.id,reference:item.id.slice(0,8).toUpperCase(),checkIn:item.check_in,checkOut:item.check_out,status:item.status,total:Number(item.total_amount||0)})),recentContent:(recentContentResult.data||[]).map(item=>({id:item.id,title:item.title,slug:item.slug,status:item.status||'draft',updatedAt:item.updated_at})),recentMedia:(recentMediaResult.data||[]).map(item=>({id:item.id,title:item.title||'Untitled image',filePath:item.file_path,createdAt:item.created_at}))};
}
