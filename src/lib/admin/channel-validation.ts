import type { CalendarDirection,CalendarProvider,ChannelActionState } from '@/types/channels-admin';
const providers:CalendarProvider[]=['booking_com','airbnb','other'];
const directions:CalendarDirection[]=['import','export','both'];
const text=(d:FormData,key:string)=>String(d.get(key)||'').trim();

export function validateExternalCalendar(d:FormData) {
  const id=text(d,'id')||null,name=text(d,'name'),provider=text(d,'provider') as CalendarProvider,direction=text(d,'direction') as CalendarDirection;
  const target=text(d,'target'),calendarUrl=text(d,'calendarUrl'),enabled=d.get('enabled')==='on',errors:Record<string,string>={};
  const [targetKind,targetId]=target.split(':');
  if (name.length<2 || name.length>120) errors.name='Enter a calendar name between 2 and 120 characters.';
  if (!providers.includes(provider)) errors.provider='Choose a supported provider.';
  if (!directions.includes(direction)) errors.direction='Choose import, export or both.';
  if (!['room','type'].includes(targetKind) || !/^[0-9a-f-]{36}$/i.test(targetId||'')) errors.target='Choose a room or room type.';
  if (direction!=='export' && !calendarUrl && !id) errors.calendarUrl='Paste the private HTTPS iCal URL.';
  if (calendarUrl) { try { if(new URL(calendarUrl).protocol!=='https:') throw new Error(); } catch { errors.calendarUrl='Use a valid HTTPS iCal URL.'; } }
  return Object.keys(errors).length
    ? {state:{ok:false,message:'Check the calendar details.',errors} as ChannelActionState}
    : {data:{id,name,provider,direction,roomId:targetKind==='room'?targetId:null,roomTypeId:targetKind==='type'?targetId:null,calendarUrl:calendarUrl||null,enabled}};
}

