export interface AvailabilityRoom{id:string;name:string;roomTypeId:string;roomTypeName:string;active:boolean}
export interface AvailabilityBlock{id:string;roomId:string|null;roomTypeId:string|null;targetName:string;startDate:string;endDate:string;reasonCode:string;reason:string;notes:string;source:string;status:'published'|'archived'}
export interface AvailabilityBooking{id:string;reference:string;checkIn:string;checkOut:string;status:string;roomIds:string[];roomTypeIds:string[]}
export interface AvailabilityState{ok:boolean;message:string;errors?:Record<string,string>}
export type DayStatus='available'|'booked'|'blocked'|'pending_hold';

