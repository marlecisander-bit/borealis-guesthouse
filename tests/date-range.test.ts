import assert from 'node:assert/strict';
import test from 'node:test';
import { earliestCheckout, selectDateRangeValue } from '../src/lib/date-range.ts';

test('normal range selection moves from check-in to check-out', () => {
  const arrival = selectDateRangeValue({ checkIn:'', checkOut:'' }, 'checkin', '2026-09-09');
  assert.deepEqual(arrival.value, { checkIn:'2026-09-09', checkOut:'' });
  assert.equal(arrival.activeField, 'checkout');
  const departure = selectDateRangeValue(arrival.value, arrival.activeField, '2026-09-12');
  assert.deepEqual(departure.value, { checkIn:'2026-09-09', checkOut:'2026-09-12' });
  assert.equal(departure.complete, true);
});

test('editing checkout replaces only departure with a later or earlier valid date', () => {
  const later = selectDateRangeValue({ checkIn:'2026-09-09', checkOut:'2026-09-12' }, 'checkout', '2026-09-14');
  assert.deepEqual(later.value, { checkIn:'2026-09-09', checkOut:'2026-09-14' });
  const earlier = selectDateRangeValue(later.value, 'checkout', '2026-09-11');
  assert.deepEqual(earlier.value, { checkIn:'2026-09-09', checkOut:'2026-09-11' });
});

test('checkout rejects arrival day, earlier days and dates below minimum stay', () => {
  const current = { checkIn:'2026-09-09', checkOut:'2026-09-14' };
  for (const selected of ['2026-09-08','2026-09-09','2026-09-10']) {
    const result = selectDateRangeValue(current, 'checkout', selected, 2);
    assert.equal(result.accepted, false);
    assert.deepEqual(result.value, current);
  }
  assert.equal(earliestCheckout(current.checkIn, 2), '2026-09-11');
});

test('changing check-in preserves a still-valid checkout', () => {
  const result = selectDateRangeValue({ checkIn:'2026-09-09', checkOut:'2026-09-14' }, 'checkin', '2026-09-10');
  assert.deepEqual(result.value, { checkIn:'2026-09-10', checkOut:'2026-09-14' });
  assert.equal(result.activeField, 'checkout');
});

test('changing check-in past checkout clears departure and awaits checkout', () => {
  const result = selectDateRangeValue({ checkIn:'2026-09-09', checkOut:'2026-09-12' }, 'checkin', '2026-09-13');
  assert.deepEqual(result.value, { checkIn:'2026-09-13', checkOut:'' });
  assert.equal(result.activeField, 'checkout');
  assert.equal(result.complete, false);
});

test('checkout editing remains stable across month boundaries', () => {
  const result = selectDateRangeValue({ checkIn:'2026-09-29', checkOut:'2026-10-03' }, 'checkout', '2026-10-05');
  assert.deepEqual(result.value, { checkIn:'2026-09-29', checkOut:'2026-10-05' });
});

