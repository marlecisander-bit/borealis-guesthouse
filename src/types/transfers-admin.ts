export type TransferStatus='draft'|'published'|'archived';
export type TransferPricingMethod='fixed_vehicle'|'per_passenger'|'on_request';
export type TransferAvailabilityMode='always'|'scheduled'|'on_request';
export interface AdminTransfer{id:string;origin:string;destination:string;slug:string;shortDescription:string;fullDescription:string;coverMediaId:string;imageUrl:string;galleryMediaIds:string[];duration:string;capacity:number|null;serviceType:string;price:number|null;currency:string;pricingMethod:TransferPricingMethod;bookingNotice:string;active:boolean;featured:boolean;bookable:boolean;status:TransferStatus;sortOrder:number;availabilityMode:TransferAvailabilityMode;availableDays:number[];windowStart:string;windowEnd:string;seoTitle:string;seoDescription:string;updatedAt:string}
export interface TransferMediaOption{id:string;label:string;url:string}
export interface TransferFormState{ok:boolean;message:string;id?:string;errors?:Record<string,string>}
