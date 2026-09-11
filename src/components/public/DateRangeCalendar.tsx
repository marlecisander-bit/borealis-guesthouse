'use client';
import { useEffect, useRef } from 'react';
import { earliestCheckout, formatDateOnly, localToDateOnly, todayIso, type DateRangeValue } from '@/lib/date-range';
import type { DateRangePickerController } from '@/hooks/useDateRangePicker';
import { useOutsideClick } from '@/hooks/useOutsideClick';

const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function CalendarMonth({ month, value, picker }: { month: Date; value: DateRangeValue; picker: DateRangePickerController }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const leading = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: leading + days }, (_, index) => index < leading ? null : new Date(month.getFullYear(), month.getMonth(), index - leading + 1, 12));
  const earliest = picker.activeField === 'checkout' && value.checkIn ? earliestCheckout(value.checkIn, picker.selectionMinimum) : '';
  return <div className="calendar-month">
    <h3 className="mb-5 text-center font-serif text-2xl text-lake">{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h3>
    <div className="calendar-grid mb-2" aria-hidden="true">{weekdays.map(day => <span key={day} className="text-[.62rem] font-bold uppercase tracking-widest text-muted">{day}</span>)}</div>
    <div className="calendar-grid">{cells.map((date, index) => {
      if (!date) return <span key={`blank-${index}`}/>;
      const iso = localToDateOnly(date);
      const disabled = iso < todayIso() || Boolean(earliest && iso < earliest);
      const selectedStart = iso === value.checkIn;
      const selectedEnd = iso === value.checkOut;
      const inRange = Boolean(value.checkIn && value.checkOut && iso > value.checkIn && iso < value.checkOut);
      return <button key={iso} type="button" disabled={disabled} onClick={() => picker.selectDate(date)} aria-label={date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} aria-pressed={selectedStart || selectedEnd} className={`calendar-day ${inRange ? 'is-range' : ''} ${selectedStart ? 'is-start' : ''} ${selectedEnd ? 'is-end' : ''} ${iso === todayIso() ? 'is-today' : ''}`}>{date.getDate()}</button>;
    })}</div>
  </div>;
}

export function DateRangeCalendar({ value, picker }: { value: DateRangeValue; picker: DateRangePickerController }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useOutsideClick(panelRef, picker.close, picker.open);
  useEffect(() => { if (picker.open) panelRef.current?.focus(); }, [picker.open]);
  if (!picker.open) return null;
  const instruction = picker.activeField === 'checkout' ? 'Choose a new departure date' : 'Choose arrival, then departure';
  return <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Choose your stay dates" className="booking-calendar">
    <div className="flex items-center justify-between border-b border-lake/10 px-5 py-4 md:px-7"><div><p className="text-[.65rem] font-bold uppercase tracking-[.16em] text-green">Select your stay</p><p className="mt-1 text-sm text-muted">{instruction}</p></div><button type="button" onClick={picker.close} className="grid size-10 place-items-center rounded-full border border-lake/15 text-xl text-lake" aria-label="Close calendar">×</button></div>
    <div className="relative grid gap-8 p-5 md:grid-cols-2 md:p-7">
      <button type="button" onClick={picker.previousMonth} disabled={picker.month <= picker.currentMonth} className="calendar-arrow left-5 md:left-7" aria-label="Previous month">←</button>
      <button type="button" onClick={picker.nextMonth} className="calendar-arrow right-5 md:right-7" aria-label="Next month">→</button>
      <CalendarMonth month={picker.month} value={value} picker={picker}/>
      <div className="hidden md:block"><CalendarMonth month={new Date(picker.month.getFullYear(), picker.month.getMonth() + 1, 1)} value={value} picker={picker}/></div>
    </div>
    <div className="flex items-center justify-between border-t border-lake/10 px-5 py-4 text-sm md:px-7"><span className="text-muted">{formatDateOnly(value.checkIn)} <span aria-hidden="true">→</span> {formatDateOnly(value.checkOut)}</span><button type="button" onClick={picker.close} disabled={!value.checkIn || !value.checkOut} className="rounded-full bg-lake px-5 py-2.5 font-bold text-white disabled:opacity-35">Done</button></div>
  </div>;
}
