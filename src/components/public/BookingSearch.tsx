'use client';
import { useCallback, useState } from 'react';
import { DateRangeCalendar } from '@/components/public/DateRangeCalendar';
import { useDateRangePicker } from '@/hooks/useDateRangePicker';
import { formatDateOnly, type DateRangeValue } from '@/lib/date-range';
import { MAX_BOOKING_GUESTS, validateBookingSearch } from '@/lib/booking/search-criteria';

export function BookingSearch({ hero = false, ctaLabel = 'Check availability' }: { hero?: boolean; ctaLabel?: string }) {
  const [dates, setDates] = useState<DateRangeValue>({ checkIn: '', checkOut: '' });
  const [guests, setGuests] = useState(2);
  const changeDates = useCallback((value: DateRangeValue) => setDates(value), []);
  const picker = useDateRangePicker({ value: dates, onChange: changeDates });
  const validSearch = validateBookingSearch({ ...dates, guests });
  return <div className={`booking-search relative ${hero ? 'booking-search--hero' : ''}`}>
    <form action="/book" aria-label="Check room availability" className="booking-form">
      <input type="hidden" name="checkIn" value={dates.checkIn}/>
      <input type="hidden" name="checkOut" value={dates.checkOut}/>
      <button type="button" onClick={picker.openCheckInPicker} className="booking-field text-left" aria-haspopup="dialog" aria-expanded={picker.open} aria-label={`Check-in, ${formatDateOnly(dates.checkIn)}`}><span>Check-in</span><strong>{formatDateOnly(dates.checkIn)}</strong></button>
      <button type="button" onClick={picker.openCheckOutPicker} className="booking-field text-left" aria-haspopup="dialog" aria-expanded={picker.open} aria-label={`Check-out, ${formatDateOnly(dates.checkOut)}`}><span>Check-out</span><strong>{formatDateOnly(dates.checkOut)}</strong></button>
      <label className="booking-field"><span>Guests</span><select name="guests" value={guests} onChange={event=>setGuests(Number(event.target.value))} aria-label="Number of guests">{Array.from({length:MAX_BOOKING_GUESTS},(_,index)=>index+1).map(value=><option key={value} value={value}>{value} {value===1?'guest':'guests'}</option>)}</select></label>
      <button disabled={!validSearch} className="booking-submit disabled:cursor-not-allowed disabled:opacity-50">{ctaLabel}</button>
    </form>
    <DateRangeCalendar value={dates} picker={picker}/>
  </div>;
}
