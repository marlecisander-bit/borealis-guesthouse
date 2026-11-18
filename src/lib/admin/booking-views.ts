export const arrivalStatuses = ['pending','awaiting_payment','confirmed','checked_in'];
export const stayingStatuses = ['confirmed','checked_in'];
export const attentionStatuses = ['pending','awaiting_payment'];

const keys = ['q','status','period','room','from','to','payment','date','page'] as const;
export type BookingFilters = Partial<Record<typeof keys[number], string>>;

export function bookingListHref(filters: BookingFilters={}) {
  const search=new URLSearchParams();
  for(const key of keys) {
    if(typeof filters[key]==='string'&&filters[key]) search.set(key,filters[key]);
  }
  return '/admin/bookings'+(search.size?'?'+search.toString():'');
}

export function bookingDetailHref(id:string,filters:BookingFilters) {
  const search=new URLSearchParams(bookingListHref(filters).split('?')[1]);
  return '/admin/bookings/'+encodeURIComponent(id)+(search.size?'?'+search.toString():'');
}
