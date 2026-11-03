import {NextResponse} from 'next/server';
import {createServerSupabaseClient} from '@/lib/supabase/server';
import {validateRentalSelection} from '@/lib/rentals/validation';
export async function POST(request:Request){
 try{
  const body=await request.json(),selection=validateRentalSelection(body.selection),db=await createServerSupabaseClient();
  if(body.action==='quote'||body.action==='availability'){
   const {data,error}=await db.rpc(body.action==='availability'?'get_equipment_rental_times':'quote_equipment_rental',{selection,booking_context:body.context==='room'?'room':'standalone'});
   if(error)throw error;
   return NextResponse.json(body.action==='availability'?{quotes:data}:{quote:data},{headers:{'Cache-Control':'no-store'}});
  }
  if(body.action!=='hold')return NextResponse.json({error:'Invalid rental action.'},{status:400});
  const guest=body.guest;
  if(!guest||!String(guest.firstName||'').trim()||!String(guest.lastName||'').trim()||!String(guest.phone||'').trim()||!/^\S+@\S+\.\S+$/.test(guest.email||''))return NextResponse.json({error:'Enter valid guest contact details.'},{status:400});
  const {data,error}=await db.rpc('create_equipment_rental_hold',{selection,guest_data:{firstName:guest.firstName,lastName:guest.lastName,email:guest.email,phone:guest.phone,country:guest.country,notes:guest.notes}});
  if(error)throw error;const h=Array.isArray(data)?data[0]:data;
  if(!h)throw new Error('Rental could not be held.');
  return NextResponse.json({id:h.booking_id,token:h.hold_token,reference:h.reference,expiresAt:h.expires_at,total:Number(h.total),currency:h.currency},{headers:{'Cache-Control':'no-store'}});
 }catch(e){const message=typeof e==='object'&&e&&'message'in e?String(e.message):'Rental availability could not be checked.';return NextResponse.json({error:message},{status:409,headers:{'Cache-Control':'no-store'}})}
}
