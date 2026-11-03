import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFixtureTransport } from '../tools/booking-fixture/fixtures.mjs';
import { assertFixtureBuildEnvironment } from '../tools/booking-fixture/build.mjs';
import { validateBookingSearch } from '../src/lib/booking/search-criteria.ts';
import { findAccommodationOptions } from '../src/lib/booking/accommodation-allocation.ts';
import { calculateStayPriceFromCatalog } from '../src/lib/pricing/core.ts';
const search={checkIn:'2026-11-16',checkOut:'2026-11-20',guests:2,adults:2,children:0,infants:0};
const setup=(scenario='available')=>createFixtureTransport({validateBookingSearch,findAccommodationOptions,calculateStayPriceFromCatalog,scenario});
const post=(body:unknown)=>({method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
test('fixture uses actual pricing/allocation with known synthetic availability and seasonal total',async()=>{
 const t=setup();const value=await(await t.fetch('/api/pricing',post(search))).json();assert.ok(value.options.length);assert.equal(value.options[0].subtotal,360);assert.equal(value.options[0].nights,4);assert.equal(value.options[0].requestedGuests,2);
 const multi=await(await t.fetch('/api/pricing',post({...search,guests:6,adults:6}))).json();assert.equal(multi.options[0].totalRooms,2);assert.equal(multi.options[0].requestedGuests,6);
});
test('fixture returns empty, validation and pricing failures without backend fallback',async()=>{
 assert.deepEqual(await(await setup('empty').fetch('/api/pricing',post(search))).json(),{options:[]});
 assert.equal((await setup('pricing-error').fetch('/api/pricing',post(search))).status,503);
 assert.equal((await setup().fetch('/api/pricing',post({...search,adults:0}))).status,400);
});
test('fictional hold/confirmation/cancellation mutate in-memory state only',async()=>{
 const t=setup();const hold=await(await t.fetch('/api/bookings/hold',post({search,rooms:[{}],guest:{firstName:'Fixture',lastName:'Guest',phone:'000',email:'fixture@example.test'}}))).json();
 assert.match(hold.reference,/^FICTIONAL-/);const result=await(await t.fetch('/api/bookings/confirm',post({id:hold.id,token:hold.token}))).json();assert.equal(result.reference,hold.reference);
 assert.equal((await t.fetch('/__fixtures/cancel',post({reference:hold.reference}))).status,200);assert.deepEqual(t.state(),{confirmed:true,cancelled:true,hasHold:true});assert.equal(setup().state().hasHold,false);
});
test('unexpected hosts, ports, RPCs, actions, auth headers, queries and methods fail closed',async()=>{
 const t=setup();for(const url of ['https://rlqyruulxyanfgvnzkpe.supabase.co/rest/v1/rpc/create_booking_hold','http://127.0.0.1:3000/api/pricing','/rest/v1/rpc/anything','/api/pricing?test=1','/api/%70ricing','/admin/action','file:///etc/passwd'])await assert.rejects(t.fetch(url,post(search)),/FIXTURE BOUNDARY/);
 for(const headers of [{'content-type':'application/json','next-action':'bad'},{'content-type':'application/json',authorization:'never-forward'},{'content-type':'application/json',cookie:'no'}])await assert.rejects(t.fetch('/api/pricing',{...post(search),headers}),/FIXTURE BOUNDARY/);
 await assert.rejects(t.fetch('/api/pricing',{...post(search),method:'GET'}),/FIXTURE BOUNDARY/);assert.equal(t.calls.length,0);assert.equal(t.state().hasHold,false);
});
test('fixture build cannot be enabled in production/hosting or credential-bearing environments',()=>{
 const valid={BOREALIS_BOOKING_FIXTURE:'1',NODE_ENV:'development'};assert.doesNotThrow(()=>assertFixtureBuildEnvironment(valid));
 for(const env of [{},{...valid,NODE_ENV:'production'},{...valid,NETLIFY:'true'},{...valid,CONTEXT:'dev'},{...valid,VERCEL:'1'},{...valid,SUPABASE_SERVICE_ROLE_KEY:'synthetic-deny'}])assert.throws(()=>assertFixtureBuildEnvironment(env));
});
test('standalone harness has no Next entry point and denies native network primitives',()=>{
 const source=readFileSync('tools/booking-fixture/build.mjs','utf8');assert.match(source,/connect-src 'none'/);assert.match(source,/form-action 'none'/);assert.match(source,/location\.protocol==='file:'/);assert.match(source,/Object\.defineProperty\(window,'fetch'/);assert.match(source,/Unexpected import/);assert.doesNotMatch(source,/nativeFetch|window\.fetch\s*\(/);
 const fixture=readFileSync('tools/booking-fixture/fixtures.mjs','utf8');assert.doesNotMatch(fixture,/supabase-js|createServerSupabaseClient|\.rpc\(/);
});
