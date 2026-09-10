'use client';
import { useReducer } from 'react';
import type { AvailableRoom, BookingAddon, BookingConfirmation, BookingHold, GuestInformation, StaySearch } from '@/types/booking';

interface BookingState { step: 1|2|3|4; search: StaySearch; rooms: AvailableRoom[]; selectedRoom: AvailableRoom|null; addons: BookingAddon[]; guest: GuestInformation; hold: BookingHold|null; confirmation: BookingConfirmation|null; status: 'idle'|'loading'|'success'|'empty'|'error'; error: string|null }
type Action = {type:'set-search';value:StaySearch}|{type:'searching'}|{type:'rooms';value:AvailableRoom[]}|{type:'error';value:string}|{type:'select-room';value:AvailableRoom}|{type:'toggle-addon';value:BookingAddon}|{type:'set-guest';value:GuestInformation}|{type:'step';value:1|2|3|4}|{type:'holding'}|{type:'hold';value:BookingHold}|{type:'confirmed';value:BookingConfirmation};
const emptyGuest={firstName:'',lastName:'',email:'',phone:'',notes:''};
export function useBooking(initial:Partial<StaySearch>={}){
  const [state,dispatch]=useReducer((state:BookingState,action:Action):BookingState=>{switch(action.type){case'set-search':return{...state,search:action.value};case'searching':return{...state,status:'loading',error:null};case'rooms':return{...state,rooms:action.value,status:action.value.length?'success':'empty',step:1};case'error':return{...state,status:'error',error:action.value};case'select-room':return{...state,selectedRoom:action.value,step:2};case'toggle-addon':return{...state,addons:state.addons.some(x=>x.id===action.value.id)?state.addons.filter(x=>x.id!==action.value.id):[...state.addons,action.value]};case'set-guest':return{...state,guest:action.value};case'step':return{...state,step:action.value};case'holding':return{...state,status:'loading'};case'hold':return{...state,hold:action.value,status:'success'};case'confirmed':return{...state,confirmation:action.value,status:'success',step:4};}}, {step:1,search:{checkIn:initial.checkIn||'',checkOut:initial.checkOut||'',guests:initial.guests||2},rooms:[],selectedRoom:null,addons:[],guest:emptyGuest,hold:null,confirmation:null,status:'idle',error:null});
  return {state,dispatch};
}
