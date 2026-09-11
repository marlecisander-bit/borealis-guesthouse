import assert from 'node:assert/strict';
import test from 'node:test';
import { bookingSourceLabel } from '../src/lib/booking/source-labels.ts';
import { bookingNotificationEmail } from '../src/lib/notifications/email-template.ts';

test('source labels are centralized and future sources remain readable', () => {
  assert.equal(bookingSourceLabel('direct'), 'Direct website');
  assert.equal(bookingSourceLabel('admin'), 'Manual admin booking');
  assert.equal(bookingSourceLabel('booking_com'), 'Booking.com / iCal');
  assert.equal(bookingSourceLabel('future_partner'), 'Future Partner');
});

test('booking email contains one complete package and no internal notes', () => {
  const email = bookingNotificationEmail({
    type: 'booking_created', reference: 'BRL-2026-00001', status: 'confirmed', source: 'direct',
    guestName: 'Test Guest', guestEmail: 'guest@example.invalid', guestPhone: '+355111',
    checkIn: '2026-10-10', checkOut: '2026-10-12', adults: 2, children: 0,
    currency: 'EUR', total: 230, roomTitle: 'Lake room', bookingUrl: 'https://example.invalid/admin/bookings/id',
    items: [
      { type: 'room', title: 'Lake room', quantity: 1, total: 120 },
      { type: 'experience', title: 'Paddle', quantity: 2, total: 60, date: '2026-10-10' },
      { type: 'transfer', title: 'Shkoder transfer', quantity: 2, total: 50, date: '2026-10-10', time: '10:00' },
    ],
  });
  assert.match(email.subject, /BRL-2026-00001/);
  assert.match(email.html, /Lake room/);
  assert.match(email.html, /Paddle/);
  assert.match(email.html, /Shkoder transfer/);
  assert.match(email.html, /View booking/);
  assert.doesNotMatch(email.html, /internal note/i);
});

test('email renderer supports a booking without a room', () => {
  const email = bookingNotificationEmail({
    type: 'booking_created', reference: 'ACT-1', status: 'confirmed', source: 'admin', guestName: 'Activity Guest',
    guestEmail: 'guest@example.invalid', guestPhone: '', checkIn: null, checkOut: null, adults: 1, children: 0,
    currency: 'EUR', total: 30, bookingUrl: 'https://example.invalid/admin/bookings/id',
    items: [{ type: 'experience', title: 'Kayak', quantity: 1, total: 30 }],
  });
  assert.match(email.subject, /New experience booking/);
  assert.match(email.text, /Kayak/);
  assert.doesNotMatch(email.text, /Room:|Stay:/);
});
