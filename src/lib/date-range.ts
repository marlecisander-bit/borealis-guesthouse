export type DateRangeField = 'checkin' | 'checkout';
export interface DateRangeValue { checkIn: string; checkOut: string }

export const todayIso = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function dateOnlyToLocal(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function localToDateOnly(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addDateOnlyDays(value: string, days: number) {
  const date = dateOnlyToLocal(value);
  date.setDate(date.getDate() + days);
  return localToDateOnly(date);
}

export function earliestCheckout(checkIn: string, minimumNights = 1) {
  return checkIn ? addDateOnlyDays(checkIn, Math.max(1, minimumNights)) : '';
}

export function selectDateRangeValue(value: DateRangeValue, field: DateRangeField, selected: string, minimumNights = 1) {
  if (field === 'checkout' && value.checkIn) {
    if (selected < earliestCheckout(value.checkIn, minimumNights)) {
      return { value, activeField: 'checkout' as const, accepted: false, complete: false };
    }
    return { value: { ...value, checkOut: selected }, activeField: 'checkout' as const, accepted: true, complete: true };
  }

  // Checkout cannot exist without an arrival. A checkout-field click on an
  // empty range therefore establishes arrival first, then awaits departure.
  const preservedCheckout = value.checkOut && value.checkOut >= earliestCheckout(selected, minimumNights)
    ? value.checkOut
    : '';
  return {
    value: { checkIn: selected, checkOut: preservedCheckout },
    activeField: 'checkout' as const,
    accepted: true,
    complete: false,
  };
}

export function formatDateOnly(value: string, style: 'short' | 'numeric' = 'short') {
  if (!value) return 'Select date';
  const date = dateOnlyToLocal(value);
  return style === 'numeric'
    ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

