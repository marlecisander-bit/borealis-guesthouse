import {NextResponse} from 'next/server';
import {contentRepository} from '@/services/content';
import {createServerSupabaseClient} from '@/lib/supabase/server';
import {findAccommodationOptions,type OccupancyQuote} from '@/lib/booking/accommodation-allocation';
import {MAX_BOOKING_GUESTS,validateBookingSearch} from '@/lib/booking/search-criteria';

type PriceQuote={nights:number;roomSubtotal:number;currency:string;minimumStay:number|null};

export async function POST(request:Request){
  try{
    const search=validateBookingSearch(await request.json());
    if(!search)return NextResponse.json({error:`Valid future dates and a guest count between 1 and ${MAX_BOOKING_GUESTS} are required.`},{status:400});
    const{checkIn,checkOut,guests}=search,db=await createServerSupabaseClient();
    const{data:property,error:propertyError}=await db.from('properties').select('id').eq('status','published').order('created_at').limit(1).maybeSingle();
    if(propertyError){console.error('Pricing property lookup failed',{code:propertyError.code,message:propertyError.message});return NextResponse.json({error:'The booking service is temporarily unavailable. Please try again.',code:'BOOKING_DATABASE_UNAVAILABLE'},{status:503});}
    if(!property)return NextResponse.json({error:'Online booking is not enabled yet. The property must be published in Admin settings.',code:'PROPERTY_NOT_PUBLISHED'},{status:503});
    const{data:propertyTypes,error:typesError}=await db.from('room_types').select('id').eq('property_id',property.id).eq('status','published').eq('is_visible',true);
    if(typesError)throw typesError;
    const propertyRoomIds=new Set((propertyTypes||[]).map(type=>type.id));
    const rooms=(await contentRepository.getRooms()).filter(room=>propertyRoomIds.has(room.id)&&room.priceFrom!==null&&room.capacity>0);
    const candidates=await Promise.all(rooms.map(async room=>{
      const{data:count,error:availabilityError}=await db.rpc('available_room_count',{target_property:property.id,target_room_type:room.id,stay_start:checkIn,stay_end:checkOut});
      if(availabilityError)throw availabilityError;
      const availableUnits=Number(count||0);
      if(availableUnits<1)return null;
      const occupancies=Array.from({length:Math.min(room.occupancyPolicy.maxTotalOccupancy,guests)},(_,index)=>index+1);
      const quotes=(await Promise.all(occupancies.map(async guestCount=>{
        const{data,error}=await db.rpc('calculate_room_stay_price',{target_property:property.id,target_room_type:room.id,stay_start:checkIn,stay_end:checkOut,guest_count:guestCount});
        if(error)throw error;
        const quote=data as PriceQuote;
        return quote?{guests:guestCount,subtotal:Number(quote.roomSubtotal),currency:quote.currency,nights:quote.nights,minimumStay:quote.minimumStay} satisfies OccupancyQuote:null;
      }))).filter((quote):quote is OccupancyQuote=>quote!==null);
      return{room,availableUnits,quotes};
    }));
    return NextResponse.json({options:findAccommodationOptions(candidates.filter(candidate=>candidate!==null),search)});
  }catch(error){
    const message=error instanceof Error?error.message:typeof error==='object'&&error&&'message'in error?String(error.message):'Pricing could not be calculated.',conflict=/conflicting|different currencies/i.test(message);
    return NextResponse.json({error:conflict?'Pricing for these dates needs review. Please contact Borealis.':message},{status:conflict?409:400});
  }
}
