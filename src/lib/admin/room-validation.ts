import type { ContentStatus } from '@/types/admin';
import { isSupportedCurrency } from '../currencies.ts';
import { slugFrom } from '../slugs.ts';
import type { RoomFormState } from '@/types/rooms-admin';

export interface RoomTypeInput {
  name:string;slug:string;shortDescription:string;longDescription:string;capacity:number;adults:number;children:number;
  maxAdults:number;maxChildren:number;maxInfants:number;maxTotalOccupancy:number;minAdults:number;infantsCountTowardCapacity:boolean;
  beds:number;bedConfiguration:string;sizeSqm:number|null;viewType:string;baseOccupancy:number;inventoryCount:number;
  featured:boolean;visible:boolean;status:ContentStatus;sortOrder:number;basePrice:number|null;currency:string;seoTitle:string;seoDescription:string;amenityIds:string[];
}
const text=(data:FormData,key:string)=>String(data.get(key)||'').trim();
const number=(data:FormData,key:string)=>Number(text(data,key));

export function validateRoomType(data:FormData):{data?:RoomTypeInput;state?:RoomFormState}{
  const status=text(data,'status') as ContentStatus,name=text(data,'name'),slug=slugFrom(text(data,'slug'),name),maxTotalOccupancy=number(data,'maxTotalOccupancy');
  const value:RoomTypeInput={name,slug,shortDescription:text(data,'shortDescription'),longDescription:text(data,'longDescription'),capacity:maxTotalOccupancy,adults:number(data,'maxAdults'),children:0,maxAdults:number(data,'maxAdults'),maxChildren:number(data,'maxChildren'),maxInfants:number(data,'maxInfants'),maxTotalOccupancy,minAdults:number(data,'minAdults'),infantsCountTowardCapacity:data.get('infantsCountTowardCapacity')==='on',beds:number(data,'beds'),bedConfiguration:text(data,'bedConfiguration'),sizeSqm:text(data,'sizeSqm')?number(data,'sizeSqm'):null,viewType:text(data,'viewType'),baseOccupancy:number(data,'baseOccupancy'),inventoryCount:text(data,'inventoryCount')?number(data,'inventoryCount'):1,featured:data.get('featured')==='on',visible:data.get('visible')==='on',status,sortOrder:number(data,'sortOrder')||0,basePrice:text(data,'basePrice')?number(data,'basePrice'):null,currency:(text(data,'currency')||'EUR').toUpperCase(),seoTitle:text(data,'seoTitle'),seoDescription:text(data,'seoDescription'),amenityIds:data.getAll('amenityIds').map(String)};
  const errors:Record<string,string>={};
  if(value.name.length<2)errors.name='Enter a room name.';
  if(!value.slug)errors.slug='Enter a valid URL slug or a room name that can be used to generate one.';
  if(!Number.isInteger(value.maxTotalOccupancy)||value.maxTotalOccupancy<1)errors.maxTotalOccupancy='Maximum total guests must be at least 1.';
  if(!Number.isInteger(value.beds)||value.beds<1)errors.beds='Bed count must be at least 1.';
  if(![value.maxAdults,value.maxChildren,value.maxInfants,value.minAdults].every(Number.isInteger)||value.maxAdults<1||value.maxChildren<0||value.maxInfants<0||value.minAdults<1)errors.maxAdults='Use whole, non-negative occupancy limits and require at least one adult.';
  if(value.maxAdults>value.maxTotalOccupancy)errors.maxAdults='Maximum adults cannot exceed maximum total guests.';
  if(value.maxChildren>value.maxTotalOccupancy)errors.maxChildren='Maximum children cannot exceed maximum total guests.';
  if(value.infantsCountTowardCapacity&&value.maxInfants>value.maxTotalOccupancy)errors.maxInfants='Maximum infants cannot exceed maximum total guests when infants count toward capacity.';
  if(value.minAdults>value.maxAdults)errors.minAdults='Minimum adults cannot exceed maximum adults.';
  if(value.baseOccupancy<1||value.baseOccupancy>value.maxTotalOccupancy)errors.baseOccupancy='Base occupancy must be within maximum total guests.';
  if(!Number.isInteger(value.inventoryCount)||value.inventoryCount<1||value.inventoryCount>100)errors.inventoryCount='Inventory must be between 1 and 100.';
  if(value.basePrice!==null&&value.basePrice<0)errors.basePrice='Base price cannot be negative.';
  if(!['draft','published'].includes(status))errors.status='Choose draft or published.';
  if(!isSupportedCurrency(value.currency))errors.currency='Choose EUR, USD, GBP or ALL.';
  if(status==='published'){
    if(value.shortDescription.length<20)errors.shortDescription='A published room needs a short description.';
    if(value.longDescription.length<40)errors.longDescription='A published room needs a full description.';
    if(!value.bedConfiguration)errors.bedConfiguration='Add the bed configuration.';
    if(value.seoTitle.length<3)errors.seoTitle='Add an SEO title before publishing.';
    if(value.seoDescription.length<20)errors.seoDescription='Add an SEO description before publishing.';
  }
  if(value.seoTitle.length>70)errors.seoTitle='Use 70 characters or fewer.';
  if(value.seoDescription.length>180)errors.seoDescription='Use 180 characters or fewer.';
  const messages=Object.values(errors);
  return messages.length?{state:{ok:false,message:`Publication blocked: ${messages[0]}${messages.length>1?` (${messages.length-1} more field${messages.length===2?'':'s'} need attention.)`:''}`,errors}}:{data:value};
}

export interface PhysicalRoomInput{internalName:string;roomTypeId:string;active:boolean;notes:string;availabilityStatus:'available'|'occupied'|'blocked'|'maintenance';status:ContentStatus}
export function validatePhysicalRoom(data:FormData):{data?:PhysicalRoomInput;state?:RoomFormState}{
  const value:PhysicalRoomInput={internalName:text(data,'internalName'),roomTypeId:text(data,'roomTypeId'),active:data.get('active')==='on',notes:text(data,'notes'),availabilityStatus:text(data,'availabilityStatus') as PhysicalRoomInput['availabilityStatus'],status:text(data,'status') as ContentStatus};
  const errors:Record<string,string>={};if(!value.internalName)errors.internalName='Enter an internal room name or number.';if(!value.roomTypeId)errors.roomTypeId='Choose a room type.';if(!['available','occupied','blocked','maintenance'].includes(value.availabilityStatus))errors.availabilityStatus='Choose an availability status.';if(!['draft','published'].includes(value.status))errors.status='Choose draft or active.';
  return Object.keys(errors).length?{state:{ok:false,message:'Check the highlighted fields.',errors}}:{data:value};
}
