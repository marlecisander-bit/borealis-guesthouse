import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAmenity } from '../src/lib/admin/amenity-validation.ts';

function form(icon:string,name='Free Wi-Fi'){
  const data=new FormData();
  for(const[key,value]of Object.entries({name,icon,category:'services',description:'',sortOrder:'0',status:'draft'}))data.set(key,value);
  data.set('active','on');
  return data;
}

test('automatically assigns a mapped icon when no override is selected',()=>{
  assert.equal(validateAmenity(form('')).data?.icon,'wifi');
});

test('preserves a valid manual icon override',()=>{
  assert.equal(validateAmenity(form('internet')).data?.icon,'internet');
});

test('uses the neutral fallback for an unknown amenity name',()=>{
  assert.equal(validateAmenity(form('','Uncatalogued detail')).data?.icon,'sparkles');
});

test('rejects obsolete or arbitrary icon keys',()=>{
  assert.equal(validateAmenity(form('made-up-icon')).state?.errors?.icon,'Choose an icon from the shared library.');
});
