import {emptyRentalConfig,type RentalConfig} from './model.ts';
const lakeside='Beginners and non-swimmers require adult supervision. Children must not be left unsupervised. Never swim alone. Keep the lakeside clean.';
const paddle='Follow staff instructions for launching, handling, paddling and returning equipment. Follow staff life-jacket requirements; life jackets must be available for every participant. Inspect equipment before use and report damage. Observe the agreed return time and location.';
export const rentalCatalogue=[
 {key:'boat',name:'Boat rental',slug:'boat-rental',quantity:1,people:5,adults:5,children:5,minAdults:1,hourly:20,daily:50,unit:'boat'},
 {key:'sup',name:'SUP rental',slug:'sup-rental',quantity:3,people:null,adults:null,children:null,minAdults:0,hourly:5,daily:10,unit:'SUP'},
 {key:'single_kayak',name:'Single kayak',slug:'single-kayak',quantity:1,people:1,adults:1,children:1,minAdults:0,hourly:5,daily:15,unit:'kayak'},
 {key:'double_kayak',name:'Double kayak',slug:'double-kayak',quantity:2,people:2,adults:2,children:1,minAdults:1,hourly:10,daily:25,unit:'kayak'},
] as const;
export function catalogueRentalConfig(key:string):RentalConfig {
 const p=rentalCatalogue.find(p=>p.key===key);if(!p)throw new Error('Unknown catalogue product.');
 const c=emptyRentalConfig();
 return {...c,kind:p.key,unitLabel:p.unit,peoplePerItem:p.people,maxAdultsPerItem:p.adults,maxChildrenPerItem:p.children,minAdultsPerItem:p.minAdults,
  // Starting values are draft suggestions. An owner must review before booking.
  hourlyPrice:p.hourly,dailyPrice:p.daily,occupancyReviewed:false,
  units:[...Array.from({length:p.quantity},(_,i)=>({key:`${p.key}-${i+1}`,label:`${p.name} ${i+1}`,active:true,verified:true})),...(key==='double_kayak'?[1,2].map(i=>({key:`unverified-double-${i}`,label:`Additional kayak ${i} — classification unverified`,active:false,verified:false})):[])],
  fuel:key==='boat'?'excluded':'not_applicable',fuelExplanation:key==='boat'?'Fuel is excluded. The tank is full at departure. Staff inspect and photograph the boat before departure. On return staff refill the tank, measure consumption and charge the fuel consumed separately.':'',
  policies:{...c.policies,safety:`${lakeside}\n${key==='boat'?'Self-drive; no skipper supplied. Maximum 5 people. Follow operating and docking instructions. Respect speed limits and other lake users. Life jackets must be available for everyone. No nighttime boating. Follow fuel, cleaning and issue-reporting procedures. Return at the agreed time and location. Guests may bring their own food and drinks. Suggested items: sunglasses and towels.':paddle}`,excluded:key==='boat'?'Fuel; skipper not supplied.':''}};
}
