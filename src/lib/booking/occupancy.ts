import type { OccupancyCounts } from '../../types/booking.ts';
import type { RoomOccupancyPolicy } from '../../types/public.ts';

export const DEFAULT_OCCUPANCY_AGE_POLICY = { infantMaxAge:2, childMaxAge:12 } as const;

export function totalGuests(value:OccupancyCounts) {
  return value.adults + value.children + value.infants;
}

export function capacityGuests(value:OccupancyCounts,policy:Pick<RoomOccupancyPolicy,'infantsCountTowardCapacity'>) {
  return value.adults + value.children + (policy.infantsCountTowardCapacity ? value.infants : 0);
}

export function validBookingParty(value:OccupancyCounts,maxGuests=24) {
  return [value.adults,value.children,value.infants].every(Number.isInteger)
    && value.adults >= 1 && value.children >= 0 && value.infants >= 0
    && totalGuests(value) <= maxGuests;
}

export function fitsRoomPolicy(value:OccupancyCounts,policy:RoomOccupancyPolicy) {
  return validBookingParty(value,Number.MAX_SAFE_INTEGER)
    && value.adults >= policy.minAdults
    && value.adults <= policy.maxAdults
    && value.children <= policy.maxChildren
    && value.infants <= policy.maxInfants
    && capacityGuests(value,policy) <= policy.maxTotalOccupancy;
}

export function occupancyLabel(value:OccupancyCounts) {
  const part=(count:number,singular:string,plural:string)=>`${count} ${count===1?singular:plural}`;
  return [part(value.adults,'adult','adults'),value.children?part(value.children,'child','children'):'',value.infants?part(value.infants,'infant','infants'):''].filter(Boolean).join(' · ');
}
