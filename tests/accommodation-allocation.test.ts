import assert from 'node:assert/strict';
import test from 'node:test';
import {findAccommodationOptions,type AccommodationCandidate} from '../src/lib/booking/accommodation-allocation.ts';
import type {OccupancyCounts} from '../src/types/booking.ts';
import type {Room,RoomOccupancyPolicy} from '../src/types/public.ts';

const adults=(count:number):OccupancyCounts=>({adults:count,children:0,infants:0});

function room(id:string,capacity:number,policy?:Partial<RoomOccupancyPolicy>):Room{
  return{id,slug:id,name:id,eyebrow:'',description:'',longDescription:'',image:'/placeholder.svg',gallery:[],priceFrom:50,currency:'EUR',capacity,beds:String(capacity),size:'',viewType:'',amenities:[],seo:{title:id,description:''},occupancyPolicy:{maxAdults:capacity,maxChildren:capacity,maxInfants:capacity,maxTotalOccupancy:capacity,minAdults:1,infantsCountTowardCapacity:true,...policy}};
}
function candidate(id:string,capacity:number,availableUnits:number,base:number,policy?:Partial<RoomOccupancyPolicy>):AccommodationCandidate{
  const product=room(id,capacity,policy),maximum=product.occupancyPolicy.maxTotalOccupancy;
  return{room:product,availableUnits,quotes:Array.from({length:maximum},(_,index)=>({guests:index+1,subtotal:base+index*10,currency:'EUR',nights:2,minimumStay:1}))};
}

test('returns only simple single-room choices when one room fits every category',()=>{
  const options=findAccommodationOptions([candidate('family',5,1,120),candidate('triple',3,3,80)],adults(3));
  assert.ok(options.length>0);assert.ok(options.every(option=>option.totalRooms===1));
});

test('builds repeated and mixed combinations from live inventory',()=>{
  const options=findAccommodationOptions([candidate('family',5,1,120),candidate('triple',3,2,80)],adults(8));
  assert.equal(options[0].totalCapacity,8);
  assert.deepEqual(options[0].rooms.map(item=>[item.room.id,item.quantity]),[['family',1],['triple',1]]);
  assert.equal(options[0].rooms.flatMap(item=>item.occupancies).reduce((sum,value)=>sum+value.adults+value.children+value.infants,0),8);
});

test('does not fabricate unavailable units or partial accommodation',()=>{
  assert.deepEqual(findAccommodationOptions([candidate('triple',3,1,80)],adults(6)),[]);
});

test('supports complete adult allocations for guest counts one through twelve',()=>{
  const inventory=[candidate('family',5,2,120),candidate('triple',3,4,80)];
  for(let guests=1;guests<=12;guests+=1){const option=findAccommodationOptions(inventory,adults(guests))[0];assert.ok(option,`missing option for ${guests} guests`);assert.equal(option.requestedGuests,guests);assert.equal(option.rooms.flatMap(item=>item.guestCounts).reduce((sum,value)=>sum+value,0),guests);}
});

test('honors category maxima and puts an adult in every occupied room',()=>{
  const policy={maxAdults:2,maxChildren:2,maxInfants:1,maxTotalOccupancy:4,minAdults:1,infantsCountTowardCapacity:false};
  const option=findAccommodationOptions([candidate('family',4,2,100,policy)],{adults:2,children:3,infants:2})[0];
  assert.ok(option);assert.equal(option.totalRooms,2);
  for(const allocation of option.rooms[0].occupancies){assert.ok(allocation.adults>=1);assert.ok(allocation.children<=2);assert.ok(allocation.infants<=1);assert.ok(allocation.adults+allocation.children<=4);}
});

test('rejects parties that cannot satisfy the per-room adult rule',()=>{
  assert.deepEqual(findAccommodationOptions([candidate('family',4,2,100,{maxAdults:2,maxChildren:3})],{adults:1,children:4,infants:0}),[]);
});

test('ranks lower wasted capacity before price',()=>{
  const options=findAccommodationOptions([candidate('large',5,2,50),candidate('triple',3,2,100)],adults(6));
  assert.equal(options[0].totalCapacity,6);assert.equal(options[0].rooms[0].room.id,'triple');
});
