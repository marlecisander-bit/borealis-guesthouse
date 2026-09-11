'use client';
import { useReducer } from 'react';
import type { AvailableRoom, BookingAddon, BookingConfirmation, BookingHold, GuestInformation, StaySearch } from '@/types/booking';

interface BookingState { step:1|2|3|4; search:StaySearch; rooms:AvailableRoom[]; selectedRoom:AvailableRoom|null; addons:BookingAddon[]; guest:GuestInformation; hold:BookingHold|null; confirmation:BookingConfirmation|null; status:'idle'|'loading'|'success'|'empty'|'error'; error:string|null }
type Action = {type:'set-search';value:StaySearch}|{type:'searching'}|{type:'rooms';value:AvailableRoom[]}|{type:'error';value:string}|{type:'select-room';value:AvailableRoom}|{type:'toggle-addon';value:BookingAddon}|{type:'update-addon';value:BookingAddon}|{type:'set-guest';value:GuestInformation}|{type:'step';value:1|2|3|4}|{type:'holding'}|{type:'hold';value:BookingHold}|{type:'confirmed';value:BookingConfirmation};

function updateAddonForStay(item: BookingAddon, search: StaySearch) {
  if (item.type === 'transfer') {
    if (item.direction === 'departure') return { ...item, date: search.checkOut, quantity: search.guests };
    if (item.direction === 'arrival') return { ...item, date: search.checkIn, quantity: search.guests };
    return { ...item, quantity: search.guests };
  }
  const dateIsInStay = Boolean(item.date && search.checkIn && search.checkOut && item.date >= search.checkIn && item.date < search.checkOut);
  return { ...item, date: dateIsInStay ? item.date : search.checkIn, quantity: search.guests };
}
function reducer(state: BookingState, action: Action): BookingState {
  switch (action.type) {
    case 'set-search': {
      const changed = action.value.checkIn !== state.search.checkIn || action.value.checkOut !== state.search.checkOut || action.value.guests !== state.search.guests;
      if (!changed) return state;
      return {
        ...state,
        search: action.value,
        rooms: [],
        selectedRoom: null,
        addons: state.addons.map(item => updateAddonForStay(item, action.value)),
        guest: state.guest.adults + state.guest.children === action.value.guests ? state.guest : { ...state.guest, adults: action.value.guests, children: 0 },
        hold: null,
        confirmation: null,
        status: 'idle',
        error: null,
        step: 1,
      };
    }
    case 'searching': return { ...state, status:'loading', error:null };
    case 'rooms': {
      const selected = state.selectedRoom ? action.value.find(item => item.room.id === state.selectedRoom?.room.id) || null : null;
      return { ...state, rooms:action.value, selectedRoom:selected, hold:null, status:action.value.length ? 'success' : 'empty', step:1 };
    }
    case 'error': return { ...state, status:'error', error:action.value };
    case 'select-room': return { ...state, selectedRoom:action.value, hold:null, step:2 };
    case 'toggle-addon': {
      const key = (item: BookingAddon) => `${item.type}:${item.id}`;
      const exists = state.addons.some(item => key(item) === key(action.value));
      return { ...state, hold:null, addons:exists ? state.addons.filter(item => key(item) !== key(action.value)) : [...state.addons,action.value] };
    }
    case 'update-addon': return { ...state, hold:null, addons:state.addons.map(item => item.type === action.value.type && item.id === action.value.id ? action.value : item) };
    case 'set-guest': return { ...state, guest:action.value, hold:null };
    case 'step': return { ...state, step:action.value, error:null, status:'success' };
    case 'holding': return { ...state, status:'loading', error:null };
    case 'hold': return { ...state, hold:action.value, status:'success' };
    case 'confirmed': return { ...state, confirmation:action.value, status:'success', step:4 };
  }
}

export function useBooking(initial: Partial<StaySearch> = {}) {
  const initialGuests = initial.guests || 2;
  const [state, dispatch] = useReducer(reducer, {
    step:1,
    search:{ checkIn:initial.checkIn || '', checkOut:initial.checkOut || '', guests:initialGuests },
    rooms:[], selectedRoom:null, addons:[],
    guest:{ firstName:'', lastName:'', email:'', phone:'', country:'', adults:initialGuests, children:0, notes:'' },
    hold:null, confirmation:null, status:'idle', error:null,
  });
  return { state, dispatch };
}
