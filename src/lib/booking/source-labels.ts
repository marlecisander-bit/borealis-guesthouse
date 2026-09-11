const labels: Record<string, string> = {
  direct: 'Direct website',
  website: 'Direct website',
  admin: 'Manual admin booking',
  booking_com: 'Booking.com / iCal',
  airbnb: 'Airbnb / iCal',
  ical: 'External iCal',
};

export function bookingSourceLabel(source?: string | null) {
  if (!source) return 'Direct website';
  return labels[source] || source.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

