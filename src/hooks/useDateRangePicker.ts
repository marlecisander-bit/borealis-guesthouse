'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { dateOnlyToLocal, localToDateOnly, selectDateRangeValue, todayIso, type DateRangeField, type DateRangeValue } from '@/lib/date-range';

export function useDateRangePicker({ value, onChange, minimumNights = 1 }: { value: DateRangeValue; onChange: (value: DateRangeValue) => void; minimumNights?: number }) {
  const currentMonth = useMemo(() => { const date = dateOnlyToLocal(todayIso()); return new Date(date.getFullYear(), date.getMonth(), 1); }, []);
  const [month, setMonth] = useState(currentMonth);
  const [activeField, setActiveField] = useState<DateRangeField>('checkin');
  const [open, setOpen] = useState(false);
  const [selectionMinimum, setSelectionMinimum] = useState(Math.max(1, minimumNights));

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);

  const openAt = useCallback((field: DateRangeField) => {
    const anchor = field === 'checkin' ? value.checkIn : value.checkOut || value.checkIn;
    const date = anchor ? dateOnlyToLocal(anchor) : dateOnlyToLocal(todayIso());
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectionMinimum(Math.max(1, minimumNights));
    setActiveField(field);
    setOpen(true);
  }, [minimumNights, value.checkIn, value.checkOut]);

  const select = useCallback((date: Date) => {
    const result = selectDateRangeValue(value, activeField, localToDateOnly(date), selectionMinimum);
    if (!result.accepted) return;
    onChange(result.value);
    setActiveField(result.activeField);
    if (result.complete) setOpen(false);
  }, [activeField, onChange, selectionMinimum, value]);

  return {
    open, activeField, month, currentMonth, selectionMinimum,
    openCheckInPicker: () => openAt('checkin'),
    openCheckOutPicker: () => openAt('checkout'),
    selectDate: select,
    close: () => setOpen(false),
    previousMonth: () => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1)),
    nextMonth: () => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1)),
  };
}

export type DateRangePickerController = ReturnType<typeof useDateRangePicker>;
