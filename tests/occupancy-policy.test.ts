import assert from 'node:assert/strict';
import test from 'node:test';
import {capacityGuests,fitsRoomPolicy,occupancyLabel,totalGuests,validBookingParty} from '../src/lib/booking/occupancy.ts';

const policy={maxAdults:2,maxChildren:2,maxInfants:1,maxTotalOccupancy:4,minAdults:1,infantsCountTowardCapacity:true};

test('counts and labels each guest category explicitly',()=>{
  const party={adults:2,children:1,infants:1};
  assert.equal(totalGuests(party),4);
  assert.equal(occupancyLabel(party),'2 adults · 1 child · 1 infant');
});

test('requires an adult for a booking party and occupied room',()=>{
  assert.equal(validBookingParty({adults:0,children:2,infants:0}),false);
  assert.equal(fitsRoomPolicy({adults:0,children:1,infants:0},policy),false);
  assert.equal(fitsRoomPolicy({adults:1,children:2,infants:1},policy),true);
});

test('applies category maxima and the infant capacity switch',()=>{
  assert.equal(fitsRoomPolicy({adults:2,children:3,infants:0},policy),false);
  assert.equal(fitsRoomPolicy({adults:2,children:2,infants:1},policy),false);
  const infantFree={...policy,infantsCountTowardCapacity:false};
  assert.equal(capacityGuests({adults:2,children:2,infants:1},infantFree),4);
  assert.equal(fitsRoomPolicy({adults:2,children:2,infants:1},infantFree),true);
});
