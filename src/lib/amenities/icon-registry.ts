export type AmenityIconCategory='room'|'connectivity'|'bathroom'|'food'|'outdoor'|'view'|'parking'|'accessibility'|'services'|'activity'|'general';

export interface AmenityIconDefinition{key:string;label:string;category:AmenityIconCategory;drawAs:string}

// The single catalogue used by Admin selection, validation, automatic name
// mapping and public rendering. drawAs permits related concepts to share one
// intentionally designed SVG without storing component code in the database.
export const amenityIconRegistry=[
  {key:'wifi',label:'Wi-Fi',category:'connectivity',drawAs:'wifi'},
  {key:'internet',label:'Internet',category:'connectivity',drawAs:'wifi'},
  {key:'parking',label:'Parking',category:'parking',drawAs:'parking'},
  {key:'airport-shuttle',label:'Airport shuttle',category:'services',drawAs:'airport-shuttle'},
  {key:'shuttle',label:'Shuttle / transfer',category:'services',drawAs:'airport-shuttle'},
  {key:'non-smoking',label:'Non-smoking room',category:'room',drawAs:'non-smoking'},
  {key:'room-service',label:'Room service',category:'services',drawAs:'room-service'},
  {key:'family-rooms',label:'Family room',category:'room',drawAs:'family-rooms'},
  {key:'coffee-maker',label:'Coffee / tea maker',category:'food',drawAs:'coffee-maker'},
  {key:'breakfast',label:'Breakfast',category:'food',drawAs:'utensils'},
  {key:'restaurant',label:'Restaurant / dining',category:'food',drawAs:'utensils'},
  {key:'bar',label:'Bar',category:'food',drawAs:'bar'},
  {key:'private-beach',label:'Private beach',category:'outdoor',drawAs:'private-beach'},
  {key:'lake-access',label:'Lake access',category:'outdoor',drawAs:'waves'},
  {key:'lake-view',label:'Lake view',category:'view',drawAs:'lake-view'},
  {key:'mountain-view',label:'Mountain view',category:'view',drawAs:'mountain'},
  {key:'river-view',label:'River view',category:'view',drawAs:'waves'},
  {key:'garden-view',label:'Garden view',category:'view',drawAs:'leaf'},
  {key:'air-conditioning',label:'Air conditioning',category:'room',drawAs:'air-conditioning'},
  {key:'heating',label:'Heating',category:'room',drawAs:'heating'},
  {key:'private-entrance',label:'Private entrance',category:'room',drawAs:'door'},
  {key:'private-bathroom',label:'Private bathroom',category:'bathroom',drawAs:'private-bathroom'},
  {key:'bath',label:'Bath',category:'bathroom',drawAs:'private-bathroom'},
  {key:'shower',label:'Shower',category:'bathroom',drawAs:'shower'},
  {key:'bath-shower',label:'Bath or shower',category:'bathroom',drawAs:'shower'},
  {key:'hairdryer',label:'Hairdryer',category:'bathroom',drawAs:'wind'},
  {key:'towels',label:'Towels',category:'bathroom',drawAs:'towel'},
  {key:'toilet-paper',label:'Toilet paper',category:'bathroom',drawAs:'toilet-paper'},
  {key:'toiletries',label:'Toiletries',category:'bathroom',drawAs:'toiletries'},
  {key:'balcony',label:'Balcony',category:'outdoor',drawAs:'balcony'},
  {key:'terrace',label:'Terrace',category:'outdoor',drawAs:'balcony'},
  {key:'outdoor-furniture',label:'Outdoor furniture',category:'outdoor',drawAs:'armchair'},
  {key:'outdoor-dining',label:'Outdoor dining area',category:'outdoor',drawAs:'utensils'},
  {key:'garden',label:'Garden',category:'outdoor',drawAs:'leaf'},
  {key:'bbq',label:'Barbecue',category:'outdoor',drawAs:'bbq'},
  {key:'accessible',label:'Accessible',category:'accessibility',drawAs:'accessible'},
  {key:'ground-floor',label:'Ground floor',category:'accessibility',drawAs:'building'},
  {key:'stairs',label:'Upper floor / stairs',category:'accessibility',drawAs:'stairs'},
  {key:'tv',label:'Television',category:'room',drawAs:'tv'},
  {key:'flat-screen-tv',label:'Flat-screen television',category:'room',drawAs:'tv'},
  {key:'minibar',label:'Minibar',category:'room',drawAs:'minibar'},
  {key:'wardrobe',label:'Wardrobe / closet',category:'room',drawAs:'door'},
  {key:'clothes-rack',label:'Clothes rack',category:'room',drawAs:'shirt'},
  {key:'iron',label:'Iron',category:'room',drawAs:'iron'},
  {key:'ironing-facilities',label:'Ironing facilities',category:'room',drawAs:'iron'},
  {key:'sofa-bed',label:'Sofa bed',category:'room',drawAs:'bed'},
  {key:'desk',label:'Desk',category:'room',drawAs:'table'},
  {key:'seating-area',label:'Seating area',category:'room',drawAs:'armchair'},
  {key:'private-kitchen',label:'Private kitchen',category:'food',drawAs:'kitchen'},
  {key:'refrigerator',label:'Refrigerator',category:'food',drawAs:'refrigerator'},
  {key:'oven',label:'Oven',category:'food',drawAs:'oven'},
  {key:'kettle',label:'Electric kettle',category:'food',drawAs:'coffee-maker'},
  {key:'kitchenware',label:'Kitchenware',category:'food',drawAs:'utensils'},
  {key:'washing-machine',label:'Washing machine',category:'room',drawAs:'washing'},
  {key:'dining-table',label:'Dining table',category:'food',drawAs:'table'},
  {key:'dining-area',label:'Dining area',category:'food',drawAs:'utensils'},
  {key:'tour-desk',label:'Tour desk',category:'services',drawAs:'map'},
  {key:'luggage',label:'Luggage storage',category:'services',drawAs:'luggage'},
  {key:'fishing',label:'Fishing',category:'activity',drawAs:'fishing'},
  {key:'hiking',label:'Hiking',category:'activity',drawAs:'hiking'},
  {key:'kayaking',label:'Kayaking / paddle',category:'activity',drawAs:'kayaking'},
  {key:'water-activities',label:'Water activities',category:'activity',drawAs:'waves'},
  {key:'sparkles',label:'General amenity',category:'general',drawAs:'fallback'},
] as const satisfies readonly AmenityIconDefinition[];

export type AmenityIconKey=(typeof amenityIconRegistry)[number]['key'];
const keys=new Set<string>(amenityIconRegistry.map(item=>item.key));

export function isAmenityIconKey(value:string):value is AmenityIconKey{return keys.has(value)}

export function normalizeAmenityName(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}

const nameMap:Record<string,AmenityIconKey>={
  'free parking':'parking','parking':'parking',
  'breakfast included in the price':'breakfast','breakfast':'breakfast',
  'private beach':'private-beach','coffee tea maker':'coffee-maker','tea and coffee making facilities':'coffee-maker',
  'non smoking room':'non-smoking','non smoking rooms':'non-smoking',
  'air conditioning':'air-conditioning','airport shuttle':'airport-shuttle','room service':'room-service',
  'family room':'family-rooms','family rooms':'family-rooms','lake view':'lake-view','bar':'bar',
  'private bathroom':'private-bathroom','balcony':'balcony','accessible':'accessible','tv':'tv',
  'television':'tv','flat screen tv':'flat-screen-tv','minibar':'minibar','private entrance':'private-entrance',
  'free wi fi':'wifi','wi fi':'wifi','wifi':'wifi','internet':'internet','wardrobe closet':'wardrobe',
  'wardrobe':'wardrobe','clothes rack':'clothes-rack','iron':'iron','ironing facilities':'ironing-facilities',
  'outdoor furniture':'outdoor-furniture','outdoor dining area':'outdoor-dining','dining area':'dining-area',
  'dining table':'dining-table','upper floors accessible by stairs only':'stairs','upper floor stairs':'stairs',
  'sofa bed':'sofa-bed','private kitchen':'private-kitchen','kitchen':'private-kitchen',
  'refrigerator':'refrigerator','oven':'oven','electric kettle':'kettle','kitchenware':'kitchenware',
  'washing machine':'washing-machine','bath or shower':'bath-shower','bath shower':'bath-shower',
  'bath':'bath','shower':'shower','towels':'towels','hairdryer':'hairdryer','toilet paper':'toilet-paper',
  'toiletries':'toiletries','garden view':'garden-view','mountain view':'mountain-view','river view':'river-view',
  'ground floor room':'ground-floor','ground floor':'ground-floor','entire unit located on ground floor':'ground-floor',
  'heating':'heating','desk':'desk','seating area':'seating-area','terrace':'terrace','garden':'garden',
  'lake access':'lake-access','bbq':'bbq','barbecue':'bbq','restaurant':'restaurant','tour desk':'tour-desk',
  'luggage':'luggage','luggage storage':'luggage','shuttle':'shuttle','transfer':'shuttle','fishing':'fishing',
  'hiking':'hiking','kayaking':'kayaking','paddle':'kayaking','water activities':'water-activities',
};

export function recommendAmenityIconKey(name:string):AmenityIconKey{return nameMap[normalizeAmenityName(name)]||'sparkles'}
