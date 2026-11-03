// Synthetic UI-only transport. SQL allocation is tested separately with PGlite.
import React from 'react';
import {BookingFlow} from '@/components/booking/BookingFlow';
import {RentalBookingFlow} from '@/components/booking/RentalBookingFlow';
import {ExperienceCatalogueCard} from '@/components/public/ExperienceCatalogueCard';
import {EditorWorkspace} from '@/components/admin/EditorWorkspace';
import {RentalFields} from '@/components/admin/RentalFields';
import {catalogueRentalConfig,rentalCatalogue} from '@/lib/rentals/catalogue';
export function mountRentalFixture({root,scenario,legacy,libs}){
 const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#24523e"/><text x="70" y="300" fill="white" font-size="36">SYNTHETIC TEST IMAGE</text></svg>');
 const id='22222222-2222-4222-8222-222222222222';
 function config(key='double_kayak'){const c=catalogueRentalConfig(key);c.occupancyReviewed=true;c.dailyHoursReviewed=true;c.roomAddon=true;c.standalone=true;c.paymentMethods=['cash','pos'];c.policies.meetingPoint='Synthetic reception';c.policies.cancellation='Synthetic cancellation rules';c.policies.weather='Synthetic weather rules';c.policies.collection='Collect from fixture reception.';c.policies.return='Return to fixture reception.';return c}
 const c=config();let held=false,lastQuote;
 const old=legacy.createFixtureTransport({...libs,scenario:'available'}),calls=[],violations=[];
 const json=(v,status=200)=>Promise.resolve(new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json'}}));
 const transport={calls,violations,state:()=>({held}),fetch:(input,init={})=>{const url=String(input);const body=JSON.parse(init.body||'{}');calls.push({url,body});
  if(url==='/api/bookings/rental'){
   if(body.action==='availability'){const s=body.selection;lastQuote={total:(s.mode==='daily'?c.dailyPrice:c.hourlyPrice*s.hours)*s.quantity,currency:'EUR',startTime:'10:00',endTime:s.mode==='daily'?'21:00':`${String(10+s.hours).padStart(2,'0')}:00`,mode:s.mode,hours:s.hours,quantity:s.quantity,adults:s.adults,children:s.children,remaining:2,fuelExplanation:'',separatelyPayable:['Beach applicability requires owner confirmation; no entry fee collected.'],advanceDue:0,balanceDue:0,paymentMethod:s.paymentMethod,policies:c.policies,priceVersion:'SYNTHETIC'};return json({quotes:[lastQuote]})}
   if(body.action==='hold'){held=true;return json({id:'FIXTURE-HOLD-ONLY',token:'FIXTURE-TOKEN-NOT-VALID',reference:'FICTIONAL-RENTAL',total:lastQuote.total,currency:'EUR'})}
  }
  if(url==='/api/bookings/hold'&&body.addons?.some(a=>a.rentalSelection)){held=true;return json({id:'FIXTURE-HOLD-ONLY',token:'FIXTURE-TOKEN-NOT-VALID',reference:'FICTIONAL-PACKAGE',total:360+lastQuote.total,currency:'EUR'})}
  if(url==='/api/bookings/confirm'&&held)return json({token:'FIXTURE-TOKEN-NOT-VALID',reference:'FICTIONAL-RENTAL',status:'confirmed'});
  if(url.startsWith('/api/pricing'))return old.fetch(input,init);
  violations.push(url);return json({error:'Fixture denies this request'},403);
 }};
 const item=(p)=>({id:p.key,slug:'synthetic-'+p.key,title:p.name,description:'Synthetic catalogue fixture — no real inventory.',longDescription:'',image,gallery:[image],duration:'Hourly / daily',capacity:'Equipment rental',priceFrom:p.hourly,currency:'EUR',priceType:'per equipment',availability:'Draft review',meetingPoint:'Fixture',included:[],notes:[],bookingRequirements:[],category:'Equipment rental',featured:false,bookable:true,bookIndependently:true,seo:{title:p.name,description:'Fixture'},rental:config(p.key)});
 const node=scenario==='catalogue'?React.createElement('div',{className:'grid gap-6 sm:grid-cols-2 xl:grid-cols-3'},rentalCatalogue.map(p=>React.createElement(ExperienceCatalogueCard,{key:p.key,item:item(p)}))):scenario==='admin'?React.createElement(EditorWorkspace,{tabs:['Equipment','Pricing','Availability','Guest rules']},React.createElement(RentalFields,{initial:catalogueRentalConfig('double_kayak'),enabled:true,onChange:()=>{}})):scenario==='standalone'?React.createElement(RentalBookingFlow,{experience:{id,title:'Synthetic double kayak',currency:'EUR',rental:c},initialDate:'2026-11-16'}):React.createElement(BookingFlow,{initialCheckIn:'2026-11-16',initialCheckOut:'2026-11-20',initialGuests:2,initialAdults:2,initialChildren:0,initialInfants:0,autoSearch:true,addons:[{id,type:'experience',name:'Synthetic double kayak',description:'Synthetic room add-on using the shared picker',image,duration:'Hourly / daily',price:10,priceLabel:'EUR 10',currency:'EUR',capacity:null,availabilityMode:'always',date:'2026-11-16',time:'',quantity:1,rentalConfig:c}]});
 root.render(React.createElement(React.Fragment,{key:scenario+'-'+Math.random()},node));return transport;
}
