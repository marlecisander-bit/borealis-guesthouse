import type { RentalConfig, RentalSelection } from './model.ts';
const date=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(`${v}T00:00:00Z`))&&new Date(`${v}T00:00:00Z`).toISOString().slice(0,10)===v;
const time=(v:unknown)=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const integer=(v:unknown,min:number,max:number)=>Number.isInteger(v)&&Number(v)>=min&&Number(v)<=max;
const money=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1000000&&Math.abs(v*100-Math.round(v*100))<1e-6;
export function validateRentalConfig(value:unknown):RentalConfig {
  const c=value as RentalConfig;
  const fail=(message:string):never=>{throw new Error(message)};
  if(!c||c.version!==1||!['boat','sup','single_kayak','double_kayak','other'].includes(c.kind)||!c.unitLabel?.trim()||!c.category?.trim())fail('Choose a rental type, category and equipment label.');
  if(!Array.isArray(c.units)||c.units.length>100||new Set(c.units.map(u=>u.key)).size!==c.units.length||c.units.some(u=>!/^[-\w]{1,64}$/.test(u.key)||!u.label?.trim()||typeof u.active!=='boolean'||typeof u.verified!=='boolean'))fail('Equipment needs unique stable identifiers and a verification state.');
  if(c.units.some(u=>u.active&&!u.verified))fail('Unverified equipment must remain inactive.');
  for(const v of [c.peoplePerItem,c.maxAdultsPerItem,c.maxChildrenPerItem,c.minAge])if(v!==null&&!integer(v,0,100))fail('Enter valid occupancy or age limits.');
  if(!integer(c.minAdultsPerItem,0,100)||c.peoplePerItem===0||(c.maxWeightKg!==null&&(!Number.isFinite(c.maxWeightKg)||c.maxWeightKg<=0)))fail('Enter valid safety limits.');
  if(!Array.isArray(c.modes)||!c.modes.length||c.modes.some(m=>!['hourly','daily'].includes(m)))fail('Choose hourly and/or daily rental.');
  if((c.hourlyPrice!==null&&!money(c.hourlyPrice))||(c.dailyPrice!==null&&!money(c.dailyPrice)))fail('Enter valid rental prices.');
  if(!integer(c.minHours,1,24)||!integer(c.maxHours,c.minHours,24)||!integer(c.incrementHours,1,24)||!integer(c.cutoffHours,0,8760)||!integer(c.bufferMinutes,0,1440))fail('Rental durations must be whole hours; cutoff and buffer cannot be negative.');
  if(!Array.isArray(c.days)||c.days.some(d=>!integer(d,0,6))||![c.open,c.close,c.dailyStart,c.dailyEnd].every(time)||c.close<=c.open||c.dailyEnd<=c.dailyStart)fail('Enter valid operating and daily collection/return times.');
  if(!Array.isArray(c.overrides)||c.overrides.length>366||c.overrides.some(o=>!date(o.from)||!date(o.to)||o.to<o.from||!time(o.open)||!time(o.close)||o.close<=o.open||typeof o.closed!=='boolean'||typeof o.daylightReviewed!=='boolean'))fail('Review date overrides, including opening and closing times.');
  if(c.overrides.some((a,i)=>!a.closed&&c.overrides.some((b,j)=>j>i&&!b.closed&&a.from<=b.to&&b.from<=a.to)))fail('Open date ranges must not overlap; use a closure to block dates within a season.');
  if(!Array.isArray(c.maintenance)||c.maintenance.length>1000||c.maintenance.some(b=>!c.units.some(u=>u.key===b.unitKey)||!date(b.from)||!date(b.to)||b.to<b.from||!time(b.start)||!time(b.end)||b.end<=b.start))fail('Maintenance blocks must refer to equipment and valid date/time intervals.');
  const keys=['safety','included','excluded','meetingPoint','collection','return','cancellation','weather','lateReturn','damageDeposit'];
  if(!c.policies||keys.some(k=>typeof c.policies[k as keyof typeof c.policies]!=='string')||Object.values(c.policies).some(v=>v.length>10000))fail('Enter valid policy text.');
  if(!['excluded','included','not_applicable'].includes(c.fuel)||typeof c.fuelExplanation!=='string')fail('Review the fuel setting.');
  if(!Array.isArray(c.paymentMethods)||c.paymentMethods.some(p=>!['cash','pos','advance','online'].includes(p)))fail('Choose valid payment methods.');
  if(c.paymentMethods.includes('online'))fail('Online payment is unavailable until a verified provider and webhook integration is installed.');
  if(c.paymentMethods.includes('advance')&&(!['amount','percent'].includes(c.advanceType||'')||!money(c.advanceValue)||!c.advanceValue||(c.advanceType==='percent'&&c.advanceValue>100)||!c.balanceRule?.trim()))fail('Configure the advance amount or percentage and remaining balance instructions.');
  if(!money(c.beachFee)||!['unresolved','none','non_staying_all','non_staying_adults'].includes(c.beachApplicability))fail('Review the beach entry applicability.');
  if(!Array.isArray(c.extraCharges)||c.extraCharges.length>30||c.extraCharges.some(e=>!e.label?.trim()||!money(e.amount)||!['equipment','person','booking'].includes(e.basis)||!['booking','return'].includes(e.collection)||!Array.isArray(e.modes)||!e.modes.length||e.modes.some(m=>!['hourly','daily'].includes(m))))fail('Each extra charge needs a label, amount, charging unit, rental modes and collection stage.');
  if(typeof c.roomAddon!=='boolean'||typeof c.standalone!=='boolean'||typeof c.occupancyReviewed!=='boolean'||typeof c.dailyHoursReviewed!=='boolean')fail('Review booking switches.');
  if(c.roomAddon||c.standalone){
    if(!c.occupancyReviewed||!c.peoplePerItem||!c.units.some(u=>u.active&&u.verified)||!c.days.length)fail('Confirm occupancy and activate verified equipment before enabling bookings.');
    if(c.modes.includes('hourly')&&c.hourlyPrice===null)fail('Set the hourly price.');
    if(c.modes.includes('daily')&&(c.dailyPrice===null||!c.dailyHoursReviewed||c.dailyStart<c.open||c.dailyEnd>c.close))fail('Review the daily price and collection/return hours.');
    if(!c.paymentMethods.length)fail('Configure at least one offline payment method.');
    if(['safety','meetingPoint','collection','return','cancellation','weather'].some(k=>!c.policies[k as keyof typeof c.policies].trim()))fail('Configure safety, meeting point, collection/return, cancellation and bad-weather instructions.');
    if(c.kind==='boat'&&(c.fuel==='not_applicable'||!c.fuelExplanation.trim()||!c.overrides.some(o=>!o.closed&&o.daylightReviewed)))fail('Boat bookings require fuel instructions and reviewed date-specific daylight closing hours.');
  }
  return c;
}
export function validateRentalSelection(value:unknown):RentalSelection {
  const s=value as RentalSelection;
  if(!s||!/^[-\da-f]{36}$/i.test(s.experienceId)||!date(s.date)||!time(s.startTime)||!['hourly','daily'].includes(s.mode)||!integer(s.hours,1,24)||!integer(s.quantity,1,100)||!integer(s.adults,1,100)||!integer(s.children,0,100)||!['cash','pos','advance','online'].includes(s.paymentMethod))throw new Error('Choose valid equipment, date, duration, participants and payment method.');
  for(const [values,max] of [[s.participantAges,120],[s.participantWeightsKg,500]] as const)if(values!==undefined&&(!Array.isArray(values)||values.length!==s.adults+s.children||values.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0||n>max)))throw new Error('Enter safety details for every participant.');
  return {experienceId:s.experienceId,date:s.date,startTime:s.startTime,mode:s.mode,hours:s.hours,quantity:s.quantity,adults:s.adults,children:s.children,paymentMethod:s.paymentMethod,participantAges:s.participantAges,participantWeightsKg:s.participantWeightsKg};
}
