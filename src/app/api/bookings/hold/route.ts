import{NextResponse}from'next/server';
import{createServerSupabaseClient}from'@/lib/supabase/server';
import{validateBookingSearch}from'@/lib/booking/search-criteria';

type RoomRequest={roomTypeId?:string;occupancies?:unknown[];guestCounts?:unknown[]};
type OccupancyRequest={adults?:unknown;children?:unknown;infants?:unknown};

export async function POST(request:Request){
  try{
    const body=await request.json(),search=validateBookingSearch(body?.search||{}),guest=body?.guest;
    const rooms=Array.isArray(body?.rooms)?body.rooms.map((room:RoomRequest)=>{const guestCounts=Array.isArray(room.guestCounts)?room.guestCounts.map(Number):[];return{roomTypeId:room.roomTypeId,occupancies:Array.isArray(room.occupancies)?room.occupancies:guestCounts.map(adults=>({adults,children:0,infants:0})),guestCounts}}):[];
    const addons=Array.isArray(body?.addons)?body.addons.map((x:{id?:string;type?:string;date?:string;time?:string;quantity?:number})=>({id:x.id,type:x.type,date:x.date,time:x.time,quantity:x.quantity})):[];
    const occupancyRows:OccupancyRequest[]=rooms.flatMap((room:{occupancies:unknown[]})=>room.occupancies).map((value:unknown)=>value as OccupancyRequest);
    const validOccupancies=occupancyRows.every((value:OccupancyRequest)=>[value.adults,value.children,value.infants].every(Number.isInteger)&&Number(value.adults)>=1&&Number(value.children)>=0&&Number(value.infants)>=0);
    const assigned=occupancyRows.reduce((sum:number,value:OccupancyRequest)=>sum+Number(value.adults)+Number(value.children)+Number(value.infants),0);
    if(!search||!rooms.length||rooms.some((room:{roomTypeId?:string;occupancies:unknown[]})=>!room.roomTypeId||!room.occupancies.length)||!validOccupancies||assigned!==search.guests||!guest?.firstName||!guest?.lastName||!guest?.phone||!Number.isInteger(guest?.adults)||!Number.isInteger(guest?.children)||!Number.isInteger(guest?.infants)||guest.adults<1||guest.children<0||guest.infants<0||guest.adults+guest.children+guest.infants!==search.guests||guest.adults!==search.adults||guest.children!==search.children||guest.infants!==search.infants||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest?.email||''))return NextResponse.json({error:'Complete dates, a valid room allocation, adults, children, infants and guest contact details are required.'},{status:400});
    const db=await createServerSupabaseClient(),{data,error}=await db.rpc('create_multi_room_booking_package_hold',{room_data:rooms,stay_start:search.checkIn,stay_end:search.checkOut,guest_count:search.guests,guest_data:guest,addon_data:addons});
    if(error)throw error;
    const hold=Array.isArray(data)?data[0]:data;
    if(!hold)throw new Error('The rooms could not be held.');
    return NextResponse.json({id:hold.booking_id,token:hold.hold_token,reference:hold.reference,expiresAt:hold.expires_at,total:Number(hold.total),currency:hold.currency});
  }catch(error){
    const message=error instanceof Error?error.message:typeof error==='object'&&error&&'message'in error?String(error.message):'The booking hold could not be created.';
    return NextResponse.json({error:message.includes('No room remains')?'One of these rooms was just booked. Please choose another option or dates.':message},{status:409});
  }
}
