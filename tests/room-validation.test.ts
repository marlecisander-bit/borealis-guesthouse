import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRoomType } from '../src/lib/admin/room-validation.ts';

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const publishable = {
  status: 'published',
  name: 'Lake View Double',
  slug: '',
  shortDescription: 'A quiet double room overlooking the lake and surrounding mountains.',
  longDescription: 'A comfortable double room with a peaceful lake view, generous natural light, and everything needed for a relaxing stay.',
  maxAdults: '2',
  maxChildren: '2',
  maxInfants: '1',
  maxTotalOccupancy: '2',
  minAdults: '1',
  infantsCountTowardCapacity: 'on',
  beds: '1',
  baseOccupancy: '2',
  inventoryCount: '1',
  bedConfiguration: '1 queen bed',
  basePrice: '125',
  seoTitle: 'Lake View Double Room at Borealis',
  seoDescription: 'Stay in a comfortable lake-view double room at Borealis Guest House in Koman, Albania.',
  visible: 'on',
};

test('generates a safe slug from the room name when publishing', () => {
  const result = validateRoomType(form(publishable));
  assert.equal(result.state, undefined);
  assert.equal(result.data?.slug, 'lake-view-double');
  assert.equal(result.data?.status, 'published');
});

test('normalizes accented room slugs', () => {
  const result = validateRoomType(form({ ...publishable, slug: 'Dhomë Familjare' }));
  assert.equal(result.data?.slug, 'dhome-familjare');
});

test('reports the first publication blocker in the visible status message', () => {
  const result = validateRoomType(form({ ...publishable, shortDescription: '', longDescription: '' }));
  assert.match(result.state?.message || '', /published room needs a short description/i);
  assert.equal(result.state?.errors?.longDescription, 'A published room needs a full description.');
});

test('accepts multiple interchangeable rooms as one inventory product', () => {
  const result = validateRoomType(form({ ...publishable, inventoryCount: '3' }));
  assert.equal(result.state, undefined);
  assert.equal(result.data?.inventoryCount, 3);
});

test('allows publication without inventing a base rate', () => {
  const result = validateRoomType(form({ ...publishable, basePrice: '' }));
  assert.equal(result.state, undefined);
  assert.equal(result.data?.basePrice, null);
});

test('preserves the editable numeric bed count', () => {
  const result = validateRoomType(form({ ...publishable, beds: '3', bedConfiguration: '3 single beds' }));
  assert.equal(result.state, undefined);
  assert.equal(result.data?.beds, 3);
});

test('rejects an empty or excessive explicit inventory', () => {
  assert.equal(validateRoomType(form({ ...publishable, inventoryCount: '0' })).state?.errors?.inventoryCount, 'Inventory must be between 1 and 100.');
  assert.equal(validateRoomType(form({ ...publishable, inventoryCount: '101' })).state?.errors?.inventoryCount, 'Inventory must be between 1 and 100.');
});

test('rejects impossible room occupancy policies',()=>{
  assert.equal(validateRoomType(form({...publishable,maxAdults:'3'})).state?.errors?.maxAdults,'Maximum adults cannot exceed maximum total guests.');
  assert.equal(validateRoomType(form({...publishable,minAdults:'3'})).state?.errors?.minAdults,'Minimum adults cannot exceed maximum adults.');
  assert.equal(validateRoomType(form({...publishable,maxInfants:'3'})).state?.errors?.maxInfants,'Maximum infants cannot exceed maximum total guests when infants count toward capacity.');
});

test('allows infants outside capacity only when the policy says so',()=>{
  const result=validateRoomType(form({...publishable,maxInfants:'3',infantsCountTowardCapacity:''}));
  assert.equal(result.state,undefined);
  assert.equal(result.data?.infantsCountTowardCapacity,false);
});
