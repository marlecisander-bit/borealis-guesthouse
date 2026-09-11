import assert from 'node:assert/strict';
import test from 'node:test';
import { bookingSearchUrl, validateBookingSearch } from '../src/lib/booking/search-criteria.ts';

const today = '2026-09-05';

test('accepts homepage criteria and builds a refresh-safe booking URL', () => {
  const search = validateBookingSearch({ checkIn:'2026-09-10', checkOut:'2026-09-13', guests:'2' }, today);
  assert.deepEqual(search, { checkIn:'2026-09-10', checkOut:'2026-09-13', guests:2 });
  assert.equal(bookingSearchUrl(search!), '/book?checkIn=2026-09-10&checkOut=2026-09-13&guests=2');
});

test('accepts a five-person search for the family room', () => {
  assert.deepEqual(
    validateBookingSearch({ checkIn:'2026-09-10', checkOut:'2026-09-13', guests:5 }, today),
    { checkIn:'2026-09-10', checkOut:'2026-09-13', guests:5 },
  );
});

test('rejects missing, malformed, reversed, past, and out-of-range criteria', () => {
  const invalid = [
    {},
    { checkIn:'not-a-date', checkOut:'2026-09-13', guests:2 },
    { checkIn:'2026-02-30', checkOut:'2026-09-13', guests:2 },
    { checkIn:'2026-09-13', checkOut:'2026-09-10', guests:2 },
    { checkIn:'2026-09-10', checkOut:'2026-09-10', guests:2 },
    { checkIn:'2026-09-01', checkOut:'2026-09-03', guests:2 },
    { checkIn:'2026-09-10', checkOut:'2026-09-13', guests:0 },
    { checkIn:'2026-09-10', checkOut:'2026-09-13', guests:11 },
  ];
  for (const input of invalid) assert.equal(validateBookingSearch(input, today), null);
});

test('preserves allowed non-sensitive booking context in the URL', () => {
  const search = { checkIn:'2026-09-10', checkOut:'2026-09-13', guests:2 };
  assert.equal(bookingSearchUrl(search, { room:'lake-view' }), '/book?checkIn=2026-09-10&checkOut=2026-09-13&guests=2&room=lake-view');
});
