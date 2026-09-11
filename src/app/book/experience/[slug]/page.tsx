import { notFound } from 'next/navigation';
import { ExperienceBookingFlow } from '@/components/booking/ExperienceBookingFlow';
import { PublicShell } from '@/components/public/PageShell';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { contentRepository } from '@/services/content';

export const metadata={title:'Book an experience | Borealis Guest House',robots:{index:false,follow:true}};
type SlotRow={slot_id:string|null;service_date:string;start_time:string|null;end_time:string|null;remaining:number};

export default async function Page({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{date?:string;time?:string;quantity?:string}>}){
  const{slug}=await params,requested=await searchParams,item=await contentRepository.getExperience(slug);
  if(!item||!item.bookable||!item.bookIndependently)notFound();
  const db=await createServerSupabaseClient(),fromDate=/^\d{4}-\d{2}-\d{2}$/.test(requested.date||'')?requested.date!:new Date().toISOString().slice(0,10);
  const{data,error}=await db.rpc('get_public_experience_slots',{target_experience:item.id,from_date:fromDate});
  if(error)throw error;
  const slots=((data||[])as SlotRow[]).map(row=>({slotId:row.slot_id,date:row.service_date,startTime:row.start_time||'',endTime:row.end_time||'',remaining:Number(row.remaining)}));
  const initialQuantity=Number(requested.quantity);
  return <PublicShell mobileBooking={false}><main className="bg-[#fbfaf7] py-12 md:py-20"><div className="shell"><ExperienceBookingFlow experience={{id:item.id,title:item.title,price:item.priceFrom,currency:item.currency,priceType:item.priceType,minimumQuantity:item.minimumQuantity||1,maxCapacity:item.maximumQuantity||item.maxCapacity||null,slots}} initialDate={requested.date||''} initialTime={requested.time||''} initialQuantity={Number.isInteger(initialQuantity)&&initialQuantity>0?initialQuantity:undefined}/></div></main></PublicShell>;
}
