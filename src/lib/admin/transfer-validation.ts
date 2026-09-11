import type{TransferAvailabilityMode,TransferPricingMethod,TransferStatus}from '@/types/transfers-admin';
import{isSupportedCurrency}from '../currencies.ts';
import{slugFrom}from '../slugs.ts';
const text=(data:FormData,key:string)=>String(data.get(key)||'').trim();

export function validateTransfer(data:FormData){
  const errors:Record<string,string>={},origin=text(data,'origin'),destination=text(data,'destination'),slug=slugFrom(text(data,'slug'),`${origin} to ${destination}`),shortDescription=text(data,'shortDescription'),fullDescription=text(data,'fullDescription'),coverMediaId=text(data,'coverMediaId')||null,duration=text(data,'duration'),serviceType=text(data,'serviceType'),status=text(data,'status')as TransferStatus,priceValue=text(data,'price'),capacityValue=text(data,'capacity'),currency=(text(data,'currency')||'EUR').toUpperCase(),pricingMethod=(text(data,'pricingMethod')||'fixed_vehicle')as TransferPricingMethod,availabilityMode=(text(data,'availabilityMode')||'on_request')as TransferAvailabilityMode,windowStart=text(data,'windowStart'),windowEnd=text(data,'windowEnd');
  if(!origin)errors.origin='Origin is required.';
  if(!destination)errors.destination='Destination is required.';
  if(!slug)errors.slug='Enter an origin and destination that can generate the URL slug.';
  if(!['draft','published','archived'].includes(status))errors.status='Choose transfer status is invalid.';
  if(!['fixed_vehicle','per_passenger','on_request'].includes(pricingMethod))errors.price='Pricing method is invalid.';
  if(!isSupportedCurrency(currency))errors.currency='Choose EUR, USD, GBP or ALL.';
  if(priceValue&&(!Number.isFinite(Number(priceValue))||Number(priceValue)<0))errors.price='Price cannot be negative.';
  if(pricingMethod!=='on_request'&&!priceValue)errors.price='A price is required for this pricing method.';
  if(capacityValue&&(!Number.isInteger(Number(capacityValue))||Number(capacityValue)<1))errors.capacity='Capacity must be a whole number of at least 1.';
  if(availabilityMode==='scheduled'&&(!windowStart||!windowEnd))errors.availability='Scheduled transfers require a start and end time.';
  if(windowStart&&windowEnd&&windowEnd<=windowStart)errors.availability='The end time must be after the start time.';
  if(status==='published'){
    if(!shortDescription||!fullDescription)errors.description='Short and full descriptions are required to publish.';
  }
  if(Object.keys(errors).length)return{state:{ok:false,message:'Review the highlighted fields.',errors}as const};
  return{data:{origin,destination,slug,shortDescription,fullDescription,coverMediaId,galleryMediaIds:data.getAll('galleryMediaIds').map(String),duration,capacity:capacityValue?Number(capacityValue):null,serviceType,price:pricingMethod==='on_request'?null:Number(priceValue),currency,pricingMethod,bookingNotice:text(data,'bookingNotice'),active:data.get('active')==='on',featured:data.get('featured')==='on',bookable:data.get('bookable')==='on',status,sortOrder:Number(text(data,'sortOrder')||0),availabilityMode,availableDays:data.getAll('availableDays').map(Number),windowStart:windowStart||null,windowEnd:windowEnd||null,seoTitle:text(data,'seoTitle'),seoDescription:text(data,'seoDescription')}};
}
