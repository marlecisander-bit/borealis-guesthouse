import type { OccupancyCounts } from '../../types/booking.ts';
import type { Room,RoomOccupancyPolicy } from '../../types/public.ts';
import { capacityGuests,totalGuests } from './occupancy.ts';

export interface OccupancyQuote { guests:number;subtotal:number;currency:string;nights:number;minimumStay:number|null }
export interface AccommodationCandidate { room:Room;availableUnits:number;quotes:OccupancyQuote[] }
export interface AccommodationRoomAllocation { room:Room;quantity:number;occupancies:OccupancyCounts[];guestCounts:number[];subtotal:number;currency:string }
export interface AccommodationOption { id:string;rooms:AccommodationRoomAllocation[];requestedGuests:number;requestedOccupancy:OccupancyCounts;totalRooms:number;totalCapacity:number;unusedCapacity:number;subtotal:number;currency:string;nights:number;minimumStay:number|null }

type CountCombination={counts:number[];totalRooms:number;totalCapacity:number};
type Distribution={subtotal:number;occupancies:OccupancyCounts[];currency:string;nights:number;minimumStay:number|null};

function policyOf(room:Room):RoomOccupancyPolicy {
  return room.occupancyPolicy||{maxAdults:room.capacity,maxChildren:room.capacity,maxInfants:0,maxTotalOccupancy:room.capacity,minAdults:1,infantsCountTowardCapacity:true};
}

function combinations(candidates:AccommodationCandidate[],party:OccupancyCounts):CountCombination[] {
  let states:CountCombination[]=[{counts:Array(candidates.length).fill(0),totalRooms:0,totalCapacity:0}];
  candidates.forEach((candidate,index)=>{
    const next:CountCombination[]=[];
    for(const state of states){
      next.push(state);
      if(state.totalRooms>=totalGuests(party))continue;
      const maximum=Math.min(candidate.availableUnits,totalGuests(party)-state.totalRooms);
      for(let quantity=1;quantity<=maximum;quantity+=1){
        const counts=[...state.counts];counts[index]=quantity;
        next.push({counts,totalRooms:state.totalRooms+quantity,totalCapacity:state.totalCapacity+quantity*policyOf(candidate.room).maxTotalOccupancy});
      }
    }
    states=next;
  });
  return states.filter(state=>state.totalRooms>0&&state.totalRooms<=totalGuests(party));
}

function roomOccupancies(policy:RoomOccupancyPolicy,remaining:OccupancyCounts):OccupancyCounts[] {
  const result:OccupancyCounts[]=[];
  for(let adults=policy.minAdults;adults<=Math.min(policy.maxAdults,remaining.adults);adults+=1){
    for(let children=0;children<=Math.min(policy.maxChildren,remaining.children);children+=1){
      for(let infants=0;infants<=Math.min(policy.maxInfants,remaining.infants);infants+=1){
        const value={adults,children,infants};
        if(totalGuests(value)>0&&capacityGuests(value,policy)<=policy.maxTotalOccupancy)result.push(value);
      }
    }
  }
  return result;
}

function priceAndDistribute(units:AccommodationCandidate[],party:OccupancyCounts) {
  let states=new Map<string,Distribution>([['0|0|0',{subtotal:0,occupancies:[],currency:'',nights:0,minimumStay:null}]]);
  for(const candidate of units){
    const next=new Map<string,Distribution>(),policy=policyOf(candidate.room);
    for(const[key,current]of states){
      const[assignedAdults,assignedChildren,assignedInfants]=key.split('|').map(Number);
      const remaining={adults:party.adults-assignedAdults,children:party.children-assignedChildren,infants:party.infants-assignedInfants};
      for(const occupancy of roomOccupancies(policy,remaining)){
        const pricedGuests=capacityGuests(occupancy,policy),quote=candidate.quotes.find(item=>item.guests===pricedGuests);
        if(!quote||(current.currency&&current.currency!==quote.currency))continue;
        const assigned={adults:assignedAdults+occupancy.adults,children:assignedChildren+occupancy.children,infants:assignedInfants+occupancy.infants};
        const stateKey=`${assigned.adults}|${assigned.children}|${assigned.infants}`;
        const option={subtotal:current.subtotal+quote.subtotal,occupancies:[...current.occupancies,occupancy],currency:quote.currency,nights:quote.nights,minimumStay:Math.max(current.minimumStay||0,quote.minimumStay||0)||null};
        const existing=next.get(stateKey);if(!existing||option.subtotal<existing.subtotal)next.set(stateKey,option);
      }
    }
    states=next;
  }
  return states.get(`${party.adults}|${party.children}|${party.infants}`)||null;
}

export function findAccommodationOptions(candidates:AccommodationCandidate[],party:OccupancyCounts,limit=5):AccommodationOption[] {
  if(![party.adults,party.children,party.infants].every(Number.isInteger)||party.adults<1||party.children<0||party.infants<0||limit<1)return[];
  const usable=candidates.filter(candidate=>candidate.availableUnits>0&&policyOf(candidate.room).maxTotalOccupancy>0&&candidate.quotes.length>0);
  const options=combinations(usable,party).flatMap(combination=>{
    const units=combination.counts.flatMap((quantity,index)=>Array.from({length:quantity},()=>usable[index]));
    const priced=priceAndDistribute(units,party);if(!priced)return[];
    let offset=0;
    const rooms=combination.counts.flatMap((quantity,index)=>{
      if(!quantity)return[];
      const occupancies=priced.occupancies.slice(offset,offset+quantity);offset+=quantity;
      const candidate=usable[index],policy=policyOf(candidate.room);
      const subtotal=occupancies.reduce((sum,occupancy)=>sum+(candidate.quotes.find(quote=>quote.guests===capacityGuests(occupancy,policy))?.subtotal||0),0);
      return[{room:candidate.room,quantity,occupancies,guestCounts:occupancies.map(totalGuests),subtotal,currency:priced.currency}];
    });
    const usedCapacity=rooms.flatMap(room=>room.occupancies.map(occupancy=>capacityGuests(occupancy,policyOf(room.room)))).reduce((sum,count)=>sum+count,0);
    return[{id:rooms.map(room=>`${room.room.id}:${room.occupancies.map(value=>`${value.adults}.${value.children}.${value.infants}`).join('-')}`).join('|'),rooms,requestedGuests:totalGuests(party),requestedOccupancy:party,totalRooms:combination.totalRooms,totalCapacity:combination.totalCapacity,unusedCapacity:combination.totalCapacity-usedCapacity,subtotal:priced.subtotal,currency:priced.currency,nights:priced.nights,minimumStay:priced.minimumStay}];
  });
  options.sort((a,b)=>a.unusedCapacity-b.unusedCapacity||a.totalRooms-b.totalRooms||a.subtotal-b.subtotal||a.id.localeCompare(b.id));
  const singleRoomExists=options.some(option=>option.totalRooms===1);
  return options.filter(option=>!singleRoomExists||option.totalRooms===1).slice(0,limit);
}
