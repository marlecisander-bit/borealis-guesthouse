import type{ExperienceStatus}from'@/types/experiences-admin';
import{isSupportedCurrency}from'../currencies.ts';
import{slugFrom}from'../slugs.ts';
const t=(d:FormData,k:string)=>String(d.get(k)||'').trim(),lines=(v:string)=>v.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
export function validateExperience(d:FormData){
 const status=t(d,'status')as ExperienceStatus,errors:Record<string,string>={},name=t(d,'name'),slug=slugFrom(t(d,'slug'),name),priceText=t(d,'price'),capacityText=t(d,'capacity'),pricingType=t(d,'pricingType')||'fixed',coverMediaId=t(d,'coverMediaId')||null,duration=t(d,'duration'),currency=(t(d,'currency')||'EUR').toUpperCase(),minimumQuantity=Number(t(d,'minimumQuantity')||1),maximumQuantity=t(d,'maximumQuantity')?Number(t(d,'maximumQuantity')):null,bookingCutoffHours=Number(t(d,'bookingCutoffHours')||0),operatingDays=d.getAll('operatingDays').map(Number),operatingStartTime=t(d,'operatingStartTime'),operatingEndTime=t(d,'operatingEndTime'),slotIntervalMinutes=t(d,'slotIntervalMinutes')?Number(t(d,'slotIntervalMinutes')):null,activeDateStart=t(d,'activeDateStart'),activeDateEnd=t(d,'activeDateEnd');
 if(!name)errors.name='Name is required.';
 if(!slug)errors.slug='Enter a name that can be used to generate the URL slug.';
 if(priceText&&(!Number.isFinite(Number(priceText))||Number(priceText)<0))errors.price='Price cannot be negative.';
 if(capacityText&&(!Number.isInteger(Number(capacityText))||Number(capacityText)<1))errors.capacity='Capacity must be at least 1.';
 if(!Number.isInteger(minimumQuantity)||minimumQuantity<1)errors.quantity='Minimum quantity must be at least 1.';
 if(maximumQuantity!==null&&(!Number.isInteger(maximumQuantity)||maximumQuantity<minimumQuantity))errors.quantity='Maximum quantity must be at least the minimum.';
 if(!Number.isInteger(bookingCutoffHours)||bookingCutoffHours<0)errors.availability='Booking cutoff must be zero or more hours.';
 if(slotIntervalMinutes!==null&&(!Number.isInteger(slotIntervalMinutes)||slotIntervalMinutes<5||slotIntervalMinutes>1440))errors.availability='Slot interval must be between 5 and 1440 minutes.';
 if(operatingStartTime&&operatingEndTime&&operatingEndTime<=operatingStartTime)errors.availability='Operating end time must be after the start time.';
 if(activeDateStart&&activeDateEnd&&activeDateEnd<activeDateStart)errors.availability='Active end date must not be before the start date.';
 if(d.get('bookIndependently')==='on'&&['always','recurring'].includes(t(d,'availabilityMode'))&&!operatingDays.length)errors.availability='Choose at least one operating day for standalone booking.';
 if(slotIntervalMinutes!==null&&(!operatingStartTime||!operatingEndTime))errors.availability='Slot intervals require operating start and end times.';
 if(!isSupportedCurrency(currency))errors.currency='Choose EUR, USD, GBP or ALL.';
 if(status==='published'){
  if(!t(d,'shortDescription')||!t(d,'fullDescription'))errors.description='Short and full descriptions are required to publish.';
  if(!coverMediaId)errors.coverMediaId='Select a cover image before publishing.';
  if(!duration)errors.duration='Add a duration before publishing.';
  if(!capacityText)errors.capacity='Add capacity before publishing.';
  if(pricingType!=='on_request'&&!priceText)errors.price='Add a price or choose on request.';
 }
 if(Object.keys(errors).length)return{state:{ok:false,message:'Review the highlighted fields.',errors}as const};
 return{data:{name,slug,shortDescription:t(d,'shortDescription'),fullDescription:t(d,'fullDescription'),coverMediaId,galleryMediaIds:d.getAll('galleryMediaIds').map(String),duration,capacity:capacityText?Number(capacityText):null,price:pricingType==='on_request'?null:priceText?Number(priceText):null,currency,pricingType,meetingPoint:t(d,'meetingPoint'),included:lines(t(d,'included')),excluded:lines(t(d,'excluded')),notes:lines(t(d,'notes')),bookingNotice:t(d,'bookingNotice'),active:d.get('active')==='on',featured:d.get('featured')==='on',bookable:d.get('bookable')==='on',bookIndependently:d.get('bookIndependently')==='on',minimumQuantity,maximumQuantity,bookingCutoffHours,operatingDays,operatingStartTime,operatingEndTime,slotIntervalMinutes,activeDateStart,activeDateEnd,status,sortOrder:Number(t(d,'sortOrder')||0),availabilityMode:t(d,'availabilityMode')||'on_request',seoTitle:t(d,'seoTitle'),seoDescription:t(d,'seoDescription')}};
}
