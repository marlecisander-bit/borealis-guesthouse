import test from 'node:test';
import assert from 'node:assert/strict';
import { amenityIconRegistry, isAmenityIconKey, normalizeAmenityName, recommendAmenityIconKey } from '../src/lib/amenities/icon-registry.ts';

const liveMappings:Record<string,string>={
  'Free Parking':'parking','Breakfast included in the price':'breakfast','Private Beach':'private-beach',
  'Coffee/Tea Maker':'coffee-maker','Non smoking room':'non-smoking','Air Conditioning':'air-conditioning',
  'Airport shuttle':'airport-shuttle','Room service':'room-service','Family room':'family-rooms','Lake view':'lake-view',
  'Bar':'bar','Private Bathroom':'private-bathroom','Balcony':'balcony','Accessible':'accessible','TV':'tv','Minibar':'minibar',
  'Private entrance':'private-entrance','Free Wi-Fi':'wifi','Wardrobe / closet':'wardrobe','Clothes rack':'clothes-rack',
  'Iron':'iron','Ironing facilities':'ironing-facilities','Outdoor furniture':'outdoor-furniture',
  'Outdoor dining area':'outdoor-dining','Dining area':'dining-area','Dining table':'dining-table',
  'Upper floors accessible by stairs only':'stairs','Sofa bed':'sofa-bed','Private kitchen':'private-kitchen',
  'Refrigerator':'refrigerator','Oven':'oven','Electric kettle':'kettle','Kitchenware':'kitchenware',
  'Washing machine':'washing-machine','Bath or shower':'bath-shower','Towels':'towels','Hairdryer':'hairdryer',
  'Toilet paper':'toilet-paper','Garden view':'garden-view','Mountain view':'mountain-view','River view':'river-view',
  'Ground-floor room':'ground-floor',
};

test('shared amenity icon registry has unique stable keys',()=>{
  const keys=amenityIconRegistry.map((item)=>item.key);
  assert.equal(keys.length,63);
  assert.equal(new Set(keys).size,keys.length);
});

test('all 42 live amenity names map deterministically to valid icons',()=>{
  assert.equal(Object.keys(liveMappings).length,42);
  for(const[name,expected]of Object.entries(liveMappings)){
    assert.equal(recommendAmenityIconKey(name),expected,name);
    assert.equal(isAmenityIconKey(expected),true,expected);
  }
});

test('normalization handles punctuation, case and common synonyms',()=>{
  assert.equal(normalizeAmenityName('  FREE Wi-Fi  '),'free wi fi');
  assert.equal(recommendAmenityIconKey('Tea & coffee making facilities'),'coffee-maker');
  assert.equal(recommendAmenityIconKey('Bath / shower'),'bath-shower');
  assert.equal(recommendAmenityIconKey('Uncatalogued detail'),'sparkles');
});
