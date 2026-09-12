import assert from 'node:assert/strict';
import test from 'node:test';
import {bookingSearchUrl,validateBookingSearch} from '../src/lib/booking/search-criteria.ts';

const today='2026-09-05';

test('keeps legacy guests URLs compatible by treating the party as adults',()=>{
  const search=validateBookingSearch({checkIn:'2026-09-10',checkOut:'2026-09-13',guests:'2'},today);
  assert.deepEqual(search,{checkIn:'2026-09-10',checkOut:'2026-09-13',guests:2,adults:2,children:0,infants:0});
  assert.equal(bookingSearchUrl(search!),'/book?checkIn=2026-09-10&checkOut=2026-09-13&guests=2&adults=2&children=0&infants=0');
});

test('accepts explicit adult, child and infant categories',()=>{
  assert.deepEqual(validateBookingSearch({checkIn:'2026-09-10',checkOut:'2026-09-13',adults:2,children:2,infants:1},today),{checkIn:'2026-09-10',checkOut:'2026-09-13',guests:5,adults:2,children:2,infants:1});
});

test('accepts multi-room searches through twelve people',()=>{
  for(let guests=1;guests<=12;guests+=1)assert.ok(validateBookingSearch({checkIn:'2026-09-10',checkOut:'2026-09-13',guests},today));
});

test('rejects invalid dates, zero adults, inconsistent totals and out-of-range parties',()=>{
  const invalid=[{}, {checkIn:'not-a-date',checkOut:'2026-09-13',guests:2},{checkIn:'2026-02-30',checkOut:'2026-09-13',guests:2},{checkIn:'2026-09-13',checkOut:'2026-09-10',guests:2},{checkIn:'2026-09-10',checkOut:'2026-09-10',guests:2},{checkIn:'2026-09-01',checkOut:'2026-09-03',guests:2},{checkIn:'2026-09-10',checkOut:'2026-09-13',adults:0,children:2,infants:0},{checkIn:'2026-09-10',checkOut:'2026-09-13',guests:4,adults:2,children:1,infants:0},{checkIn:'2026-09-10',checkOut:'2026-09-13',guests:25}];
  for(const input of invalid)assert.equal(validateBookingSearch(input,today),null);
});

test('preserves allowed non-sensitive booking context in the URL',()=>{
  const search={checkIn:'2026-09-10',checkOut:'2026-09-13',guests:2,adults:1,children:1,infants:0};
  assert.equal(bookingSearchUrl(search,{room:'lake-view'}),'/book?checkIn=2026-09-10&checkOut=2026-09-13&guests=2&adults=1&children=1&infants=0&room=lake-view');
});
