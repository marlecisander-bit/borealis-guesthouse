'use client';
import Form from 'next/form';
import { useCallback, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { DateRangeCalendar } from '@/components/public/DateRangeCalendar';
import { useDateRangePicker } from '@/hooks/useDateRangePicker';
import { formatDateOnly, type DateRangeValue } from '@/lib/date-range';
import { validateBookingSearch } from '@/lib/booking/search-criteria';
import { GuestSelector } from './GuestSelector';
import type { OccupancyCounts } from '@/types/booking';

export function BookingSearch({ hero = false, ctaLabel = 'Check availability',infantMaxAge=2,childMaxAge=12 }: { hero?: boolean; ctaLabel?: string;infantMaxAge?:number;childMaxAge?:number }) {
  const [dates, setDates] = useState<DateRangeValue>({ checkIn: '', checkOut: '' });
  const [party,setParty]=useState<OccupancyCounts>({adults:2,children:0,infants:0});
  const changeDates = useCallback((value: DateRangeValue) => setDates(value), []);
  const picker = useDateRangePicker({ value: dates, onChange: changeDates });
  const validSearch = validateBookingSearch({ ...dates, ...party });
  return <div className={`booking-search relative ${hero ? 'booking-search--hero' : ''}`}>
    <Form action="/book" aria-label="Check room availability" className="booking-form">
      <input type="hidden" name="checkIn" value={dates.checkIn}/>
      <input type="hidden" name="checkOut" value={dates.checkOut}/>
      <button type="button" onClick={picker.openCheckInPicker} className="booking-field text-left" aria-haspopup="dialog" aria-expanded={picker.open} aria-label={`Check-in, ${formatDateOnly(dates.checkIn)}`}><span>Check-in</span><strong>{formatDateOnly(dates.checkIn)}</strong></button>
      <button type="button" onClick={picker.openCheckOutPicker} className="booking-field text-left" aria-haspopup="dialog" aria-expanded={picker.open} aria-label={`Check-out, ${formatDateOnly(dates.checkOut)}`}><span>Check-out</span><strong>{formatDateOnly(dates.checkOut)}</strong></button>
      <GuestSelector value={party} onChange={setParty} infantMaxAge={infantMaxAge} childMaxAge={childMaxAge} submitNames fieldClassName="booking-field w-full text-left"/>
      <BookingSubmit valid={Boolean(validSearch)} label={ctaLabel}/>
    </Form>
    <DateRangeCalendar value={dates} picker={picker}/>
  </div>;
}

function BookingSubmit({valid,label}:{valid:boolean;label:string}) {
  const { pending } = useFormStatus();
  return <button disabled={!valid||pending} aria-busy={pending||undefined} data-pending={pending||undefined} className="booking-submit disabled:cursor-not-allowed disabled:opacity-60"><span className="booking-link-content">{pending&&<span className="booking-link-spinner" aria-hidden="true"/>}<span>{pending?'Opening booking…':label}</span></span></button>;
}
