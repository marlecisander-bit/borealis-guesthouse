import {NextResponse} from 'next/server';
import {contentRepository} from '@/services/content';
import{createServerSupabaseClient}from'@/lib/supabase/server';
import{MAX_BOOKING_GUESTS,validateBookingSearch}from'@/lib/booking/search-criteria';

type PriceQuote={nights:number;nightlyRates:{date:string;amount:number;currency:string;source:'base'|'seasonal'|'weekend'}[];roomSubtotal:number;currency:string;minimumStay:number|null};

export async function POST(request:Request){
  try{
    const search=validateBookingSearch(await request.json());
    if(!search)return NextResponse.json({error:`Valid future dates and a guest count between 1 and ${MAX_BOOKING_GUESTS} are required.`},{status:400});
    const{checkIn,checkOut,guests}=search;
    const db=await createServerSupabaseClient();
    const{data:property,error:propertyError}=await db.from('properties').select('id').eq('status','published').order('created_at').limit(1).maybeSingle();
    if(propertyError){
      console.error('Pricing property lookup failed',{code:propertyError.code,message:propertyError.message});
      return NextResponse.json({error:'The booking service is temporarily unavailable. Please try again.',code:'BOOKING_DATABASE_UNAVAILABLE'},{status:503});
    }
    if(!property){
      return NextResponse.json({error:'Online booking is not enabled yet. The property must be published in Admin settings.',code:'PROPERTY_NOT_PUBLISHED'},{status:503});
    }
    // Rooms may be published before their real rate is configured. Keep them
    // visible in the catalogue, but do not let one unpriced room break the
    // availability results for every other room.
    const candidates=(await contentRepository.getRooms()).filter(room=>room.capacity>=Number(guests)&&room.priceFrom!==null);
    const availability=await Promise.all(candidates.map(async room=>{const[{data:count,error:availabilityError},{data:quote,error:pricingError}]=await Promise.all([db.rpc('available_room_count',{target_property:property.id,target_room_type:room.id,stay_start:checkIn,stay_end:checkOut}),db.rpc('calculate_room_stay_price',{target_property:property.id,target_room_type:room.id,stay_start:checkIn,stay_end:checkOut,guest_count:Number(guests)})]);if(availabilityError)throw availabilityError;if(pricingError)throw pricingError;return{room,count:Number(count||0),quote:quote as PriceQuote}}));
    const priced=availability.filter(x=>x.count>0&&x.quote).map(({room,quote})=>({room,nightlyRate:quote.nightlyRates[0]?.amount??0,nightlyRates:quote.nightlyRates,nights:quote.nights,subtotal:Number(quote.roomSubtotal),currency:quote.currency,minimumStay:quote.minimumStay}));
    return NextResponse.json({rooms:priced});
  }catch(error){
    const message=error instanceof Error?error.message:typeof error==='object'&&error&&'message'in error?String(error.message):'Pricing could not be calculated.',conflict=/conflicting|different currencies/i.test(message);
    return NextResponse.json({error:conflict?'Pricing for these dates needs review. Please contact Borealis.':message},{status:conflict?409:400});
  }
}
