import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const timePattern=/^\d{2}:\d{2}(?::\d{2})?$/;
type SlotRow={slot_id:string|null;service_date:string;start_time:string|null;end_time:string|null;remaining:number|string};

export async function GET(request:Request){
  try{
    const params=new URL(request.url).searchParams,experienceId=params.get('experienceId')||'',fromDate=params.get('fromDate')||new Date().toISOString().slice(0,10);
    if(!uuid.test(experienceId)||!datePattern.test(fromDate))return NextResponse.json({error:'Invalid availability request.'},{status:400});
    const db=await createServerSupabaseClient(),{data,error}=await db.rpc('get_public_experience_slots',{target_experience:experienceId,from_date:fromDate});
    if(error)throw error;
    return NextResponse.json({slots:((data||[])as SlotRow[]).map(row=>({slotId:row.slot_id||null,date:row.service_date,startTime:(row.start_time||'').slice(0,5),endTime:(row.end_time||'').slice(0,5),remaining:Number(row.remaining)}))});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Availability could not be loaded.'},{status:503})}
}

export async function POST(request:Request){
  try{
    const body=await request.json(),serviceTime=body.serviceTime?String(body.serviceTime):null;
    if(!uuid.test(String(body.experienceId||''))||!datePattern.test(String(body.serviceDate||''))||(serviceTime&&!timePattern.test(serviceTime))||!Number.isInteger(body.participants)||body.participants<1||!body.guest){
      return NextResponse.json({error:'Choose a valid date, time and quantity.'},{status:400});
    }
    const db=await createServerSupabaseClient(),{data,error}=await db.rpc('create_experience_booking_hold',{target_experience:body.experienceId,requested_date:body.serviceDate,requested_time:serviceTime,participant_count:body.participants,guest_data:body.guest});
    if(error)throw error;const hold=Array.isArray(data)?data[0]:data;if(!hold)throw new Error('The experience could not be held.');
    return NextResponse.json({id:hold.booking_id,token:hold.hold_token,reference:hold.reference,expiresAt:hold.expires_at,total:Number(hold.total),currency:hold.currency});
  }catch(error){const message=typeof error==='object'&&error&&'message'in error?String(error.message):'The experience could not be held.';return NextResponse.json({error:message},{status:409})}
}
