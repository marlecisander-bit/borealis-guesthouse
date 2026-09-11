import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTransfer} from '../src/lib/admin/transfer-validation.ts';

function form(values:Record<string,string>){const data=new FormData();for(const[key,value]of Object.entries(values))data.set(key,value);return data}
const publishable={status:'published',origin:'Tirana Airport',destination:'Borealis Guest House',slug:'tirana-airport-borealis',shortDescription:'A private road transfer from the airport to Borealis.',fullDescription:'Travel directly from Tirana Airport to Borealis Guest House with a private driver and confirmed pickup details.',coverMediaId:'00000000-0000-0000-0000-000000000001',duration:'2 hours 30 minutes',capacity:'6',serviceType:'Private minivan',price:'85',currency:'eur',pricingMethod:'fixed_vehicle',active:'on',featured:'on',bookable:'on'};

test('accepts a complete published transfer and normalizes currency',()=>{const result=validateTransfer(form(publishable));assert.equal(result.data?.status,'published');assert.equal(result.data?.currency,'EUR');assert.equal(result.data?.featured,true);assert.equal(result.data?.price,85)});
test('generates the slug from origin and destination when left blank',()=>{const result=validateTransfer(form({...publishable,slug:''}));assert.equal(result.data?.slug,'tirana-airport-to-borealis-guest-house');assert.equal(result.state,undefined)});
test('keeps on-request transfer price null',()=>{const result=validateTransfer(form({...publishable,pricingMethod:'on_request',price:''}));assert.equal(result.data?.price,null)});
test('allows optional operational details but requires a priced-mode price',()=>{const result=validateTransfer(form({...publishable,coverMediaId:'',duration:'',capacity:'',serviceType:'',price:''}));assert.deepEqual(Object.keys(result.state?.errors||{}),['price'])});
test('rejects invalid status, currency and scheduled time windows',()=>{const result=validateTransfer(form({...publishable,status:'live',currency:'EU',availabilityMode:'scheduled',windowStart:'18:00',windowEnd:'17:00'}));assert.deepEqual(Object.keys(result.state?.errors||{}).sort(),['availability','currency','status'])});
