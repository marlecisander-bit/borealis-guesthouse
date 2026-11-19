import React from 'react';import {AdminPageHeader} from '@/components/admin/ui';import AdminSidebar from '@/components/layout/AdminSidebar';import{AvailabilityCalendar}from'@/components/admin/AvailabilityCalendar';import{ManualBookingForm}from'@/components/admin/ManualBookingForm';
const rooms=[{id:'left',name:'Triple Room L',roomTypeId:'triple',roomTypeName:'Triple room',active:true},{id:'right',name:'Triple Room R',roomTypeId:'triple',roomTypeName:'Triple room',active:true},{id:'family',name:'Family Room',roomTypeId:'family-type',roomTypeName:'Family category',active:true}];
const booking=(id,room,checkIn,checkOut,status='confirmed')=>({id,reference:'SYNTHETIC-'+id,roomIds:[room],roomTypeIds:[room==='family'?'family-type':'triple'],checkIn,checkOut,status,guestName:id==='a'?'Alex Example':id==='turnover'?'Jamie Example':'Synthetic Guest '+id,guestCount:3});
const bookings=[booking('a','left','2026-10-19','2026-10-22'),booking('turnover','left','2026-10-22','2026-10-25'),{...booking('hold','right','2026-10-20','2026-10-23','held'),holdExpiresAt:'2026-10-21T12:01:00Z'},booking('departure','family','2026-10-18','2026-10-21'),booking('arrival','family','2026-10-21','2026-10-23')];
const initialBlocks=[{id:'sync',roomId:'right',roomTypeId:null,targetName:'Triple Room R',startDate:'2026-10-24',endDate:'2026-10-25',reasonCode:'external_calendar',reason:'Reserved via external channel',notes:'',source:'ical',sourceName:'Sample partner calendar',status:'published'},{id:'closure',roomId:'family',roomTypeId:null,targetName:'Family Room',startDate:'2026-10-25',endDate:'2026-10-26',reasonCode:'maintenance',reason:'Annual inspection',notes:'Synthetic internal note',source:'manual',status:'published'}];
function Calendar({scenario}) {
  const [blocks,setBlocks]=React.useState(initialBlocks);
  const [query,setQuery]=React.useState(() => new URLSearchParams(location.search));
  React.useEffect(()=>{
    const navigate=event=>setQuery(new URL(event.detail,'https://fixture.invalid').searchParams);
    window.addEventListener('fixture-calendar-navigation',navigate);
    window.__calendarCommit=block=>setBlocks(xs=>[...xs,block]);
    window.__calendarReopen=id=>setBlocks(xs=>xs.filter(x=>x.id!==id));
    return()=>{window.removeEventListener('fixture-calendar-navigation',navigate);delete window.__calendarCommit;delete window.__calendarReopen};
  },[]);
  const restricted=scenario==='restricted';
  const data=restricted?bookings.map(booking=>({...booking,guestName:undefined,guestCount:undefined,reference:''})):bookings;
  return React.createElement('div',{'data-admin-shell':true,className:'flex'},React.createElement('div',{className:'hidden shrink-0 lg:block'},React.createElement(AdminSidebar)),React.createElement('main',{'data-availability-page':true,className:'min-w-0 flex-1 space-y-5 p-3 sm:p-6'},React.createElement(AdminPageHeader,{title:'Availability calendar',description:'Room inventory and closures · Europe/Tirane'}),React.createElement(AvailabilityCalendar,{
    rooms:scenario==='empty'?[]:rooms,bookings:scenario==='empty'?[]:data,blocks,restricted,
    from:query.get('from')||(scenario==='year'?'2026-12-30':'2026-10-19'),
    periodDays:query.has('to')?Math.round((Date.parse(query.get('to'))-Date.parse(query.get('from')))/86400000)+1:14,
    today:'2026-10-21',initialView:query.get('view')||'room',selectedRoom:query.get('room')||undefined,
    blockStart:scenario==='deep'?'2026-10-27':undefined,blockEnd:scenario==='deep'?'2026-10-29':undefined,
  })));
}
export async function mountCalendarFixture({root,scenario}){window.__adminPath='/admin/availability';window.__calendarCalls=[];window.__calendarConflict=false;const node=scenario==='prefill'?React.createElement('div',{'data-admin-shell':true},React.createElement(ManualBookingForm,{rooms:[{id:'triple',name:'Triple room',capacity:3}],prefill:{roomTypeId:'triple',checkIn:'2026-10-27',checkOut:'2026-10-30'}})):React.createElement(Calendar,{key:scenario,scenario});root.render(node);return{calls:[],violations:[],state:()=>({synthetic:true}),fetch:()=>{throw Error('Calendar fixture network denied')}}}
