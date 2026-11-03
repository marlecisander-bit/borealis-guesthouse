/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as criteria from '../src/lib/booking/search-criteria.ts';
import { allowedPreviewRoute } from '../src/lib/readonly-preview/policy.ts';
import { calculateStayPriceFromCatalog } from '../src/lib/pricing/core.ts';
import { formatMoney } from '../src/lib/pricing/format.ts';
const url = 'http://127.0.0.1:3000/book?checkIn=2026-11-16&checkOut=2026-11-20&guests=2&adults=2&children=0&infants=0';
const query = Object.fromEntries(new URL(url).searchParams);
const search = criteria.validateBookingSearch(query, '2026-10-21')!;
function load(file: string, mocks: Record<string, unknown> = {}): any {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const m = { exports: {} }; new Function('require','module','exports',code)((id: string) => { if (id in mocks) return mocks[id]; throw Error('Unexpected dependency '+id); },m,m.exports); return m.exports;
}
function jsx(type: any, props: any) { return { type, props }; }
function find(node: any, predicate: (value: any) => boolean): any {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  const children = node.props?.children; for (const child of Array.isArray(children) ? children : [children]) { const match = find(child,predicate); if (match) return match; } return null;
}
function hook(initial = search) {
  let state: any, reduce: any;
  const hookModule = load('src/hooks/useBooking.ts', { react: { useReducer: (fn: any, init: any) => { state=init; reduce=fn; return [state,()=>{}]; } } });
  hookModule.useBooking(initial); return { state: () => state, dispatch: (action: any) => { state=reduce(state,action); } };
}
test('exact reported URL has valid future dates and consistent category counts; preview deliberately denies it', () => {
  assert.deepEqual(search,{checkIn:'2026-11-16',checkOut:'2026-11-20',guests:2,adults:2,children:0,infants:0});
  assert.equal(criteria.bookingSearchUrl(search),new URL(url).pathname+new URL(url).search);
  assert.equal(allowedPreviewRoute(url,'GET',new Headers()),false);
  assert.equal(allowedPreviewRoute('http://127.0.0.1:3000/','GET',new Headers()),true);
  assert.equal(allowedPreviewRoute('http://127.0.0.1:3000/api/pricing','POST',new Headers()),false);
});
test('actual BookPage transfers validated URL props through configurator into BookingFlow offline', async () => {
  const page = load('src/app/book/page.tsx', {
    'react/jsx-runtime': { jsx,jsxs:jsx }, react:{Suspense:'Suspense'}, '@/components/booking/BookingFlow':{BookingFlow:'BookingFlow'}, '@/components/public/PageShell':{PublicShell:'PublicShell'},
    '@/lib/booking/search-criteria':{...criteria,validateBookingSearch:(input:any)=>criteria.validateBookingSearch(input,'2026-10-21')}, '@/lib/seo':{createMetadata:()=>({})},
    '@/services/content':{contentRepository:{getExperiences:async()=>[],getTransfers:async()=>[]}}, '@/services/site-content':{getSiteDocument:async()=>({}),getOccupancyAgePolicy:async()=>({infantMaxAge:2,childMaxAge:12})},
  });
  const tree = await page.default({searchParams:Promise.resolve(query)});
  const config = find(tree,node=>typeof node.type==='function' && node.type.name==='BookingConfigurator'); assert.ok(config);
  const flow = await config.type(config.props); assert.equal(flow.type,'BookingFlow');
  assert.deepEqual([flow.props.initialCheckIn,flow.props.initialCheckOut,flow.props.initialGuests,flow.props.initialAdults,flow.props.initialChildren,flow.props.initialInfants,flow.props.autoSearch],['2026-11-16','2026-11-20',2,2,0,0,true]);
});
test('invalid date ranges and inconsistent categories reject; valid infant/child counts remain intact', () => {
  for (const patch of [{checkOut:'2026-11-16'},{checkOut:'2026-11-15'},{checkIn:'2026-02-30'},{adults:'0'},{guests:'3'},{children:'-1'},{infants:'1.5'}]) assert.equal(criteria.validateBookingSearch({...query,...patch},'2026-10-21'),null);
  assert.deepEqual(criteria.validateBookingSearch({...query,guests:'4',children:'1',infants:'1'},'2026-10-21'),{...search,guests:4,children:1,infants:1});
});
test('actual booking reducer preserves prefill, loading/empty/error and room-selection stages', () => {
  const h = hook(); assert.deepEqual(h.state().search,search); assert.equal(h.state().guest.adults,2);
  h.dispatch({type:'searching'}); assert.equal(h.state().status,'loading');
  h.dispatch({type:'options',value:[]}); assert.equal(h.state().status,'empty');
  const option = {id:'synthetic-option',rooms:[],subtotal:400,currency:'EUR',totalRooms:2};
  h.dispatch({type:'options',value:[option]}); assert.equal(h.state().status,'success'); h.dispatch({type:'select-accommodation',value:option}); assert.equal(h.state().step,2); assert.equal(h.state().selectedAccommodation.id,option.id);
  h.dispatch({type:'error',value:'Synthetic hold conflict'}); assert.equal(h.state().status,'error'); assert.equal(h.state().error,'Synthetic hold conflict');
});
test('changed stay/category counts clear old selection/hold and keep guest counts synchronized', () => {
  const h=hook(); h.dispatch({type:'select-accommodation',value:{id:'old'}});h.dispatch({type:'hold',value:{id:'synthetic-hold'}});
  h.dispatch({type:'set-search',value:{...search,adults:2,children:1,guests:3,checkOut:'2026-11-21'}});
  assert.equal(h.state().selectedAccommodation,null);assert.equal(h.state().hold,null);assert.equal(h.state().guest.children,1);assert.equal(h.state().step,1);
});
test('availability service delegates only to the mocked pricing endpoint; no inventory is invented', async () => {
  const service=load('src/services/booking.ts').bookingService, original=globalThis.fetch;const calls:any[]=[];
  globalThis.fetch=async(input,init)=>{calls.push([input,init]);return Response.json({options:[]});};
  try { assert.deepEqual(await service.searchAvailability(search),[]);assert.equal(calls.length,1);assert.equal(calls[0][0],'/api/pricing');assert.deepEqual(JSON.parse(calls[0][1].body),search); } finally {globalThis.fetch=original;}
});
test('mocked pricing/hold/confirmation failures reject without automatic retries or hidden fallback', async () => {
  const service=load('src/services/booking.ts').bookingService,original=globalThis.fetch;const calls:any[]=[];
  globalThis.fetch=async(input)=>{calls.push(input);return Response.json({error:'Synthetic conflict'},{status:409});};
  try {
    await assert.rejects(service.searchAvailability(search),/Synthetic conflict/);
    await assert.rejects(service.createBookingHold({search,accommodation:{rooms:[]},addons:[],guest:{}}),/Synthetic conflict/);
    await assert.rejects(service.createBooking({}, {id:'fixture',token:'not-real'}),/Synthetic conflict/);
    assert.deepEqual(calls,['/api/pricing','/api/bookings/hold','/api/bookings/confirm']);
  } finally {globalThis.fetch=original;}
  // No retry is not an idempotency guarantee; real duplicate/concurrent booking protection remains untested.
});
test('synthetic seasonal pricing and selectable currency formatting do not require live SQL', () => {
  for (const currency of ['EUR','USD','GBP','ALL']) {
    const quote=calculateStayPriceFromCatalog({currency,baseRates:[{roomTypeId:'fixture',amount:80,currency,active:true}],seasonalRates:[{id:'season',name:'Fixture',roomTypeIds:['fixture'],startDate:'2026-11-17',endDate:'2026-11-20',amount:100,currency,active:true}],minimumStayRules:[]},'fixture','2026-11-16','2026-11-20');
    assert.equal(quote?.subtotal,380);assert.equal(quote?.currency,currency);assert.ok(formatMoney(380,currency).length>0);
  }
});
