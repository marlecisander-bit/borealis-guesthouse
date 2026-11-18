import { getAdminIdentity } from '@/lib/admin/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const identity=await getAdminIdentity();
  if(!identity?.permissions?.includes('bookings.export'))return new Response(null,{status:403});
  const db=await createServerSupabaseClient();
  const {data,error}=await db.rpc('team_workspace',{target_property:identity.propertyId,area:'bookings.export'});
  if(error || !Array.isArray(data))return new Response(null,{status:403});
  const columns=['reference','check_in','check_out','booking_status','payment_status','total_guests'];
  if(identity.permissions.includes('bookings.contacts'))columns.push('guest_contacts');
  function csv(value:unknown) {
    const text=value==null?'':typeof value==='object'?JSON.stringify(value):String(value);
    return '"'+(/^[\s]*[=+@-]|^[\t\r\n]/.test(text)?"'":"")+text.replaceAll('"','""')+'"';
  }
  return new Response([columns.join(','),...data.map(row=>columns.map(key=>csv(row[key])).join(','))].join('\r\n'),{
    headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="borealis-reservations.csv"','Cache-Control':'private, no-store'},
  });
}
