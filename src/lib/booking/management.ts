export const bookingUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type BookingManager = { token: string } | { bookingId: string };
export type StayChange = { checkIn:string; checkOut:string; adults:string; children:string; infants:string };
export type BookingOperation = {
  id:string; operation:string; createdAt:string; actorId:string|null; status:'pending'|'reviewed'|null;
  input:Partial<StayChange> & {message?:string}; outcome:{total?:number;previous?:{checkIn:string;checkOut:string;total:number}};
};
export type BookingManagement = {
  status:string; policy:string|null; canChange:boolean; canCancel:boolean; canRequest:boolean;
  changeHours:number|null; cancelHours:number|null; requestStatus:'pending'|'reviewed'|null;
  history:BookingOperation[]; checkIn:string|null; checkOut:string|null; adults:number; children:number;
  infants:number; total:number; currency:string;
};
export type BookingManagementState = {
  message:string; success?:boolean;
  quote?:{ stay:StayChange; total:number; currency:string; version:string; operationId:string };
};

export function bookingManagerArguments(manager:BookingManager) {
  return 'token' in manager
    ? {target_token:manager.token,target_booking:null}
    : {target_token:null,target_booking:manager.bookingId};
}
