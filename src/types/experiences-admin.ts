export type ExperienceStatus='draft'|'published'|'archived';
export interface AdminExperience{ id:string;name:string;slug:string;shortDescription:string;fullDescription:string;coverMediaId:string;imageUrl:string;galleryMediaIds:string[];duration:string;capacity:number|null;price:number|null;currency:string;pricingType:string;meetingPoint:string;included:string[];excluded:string[];notes:string[];bookingNotice:string;active:boolean;featured:boolean;bookable:boolean;status:ExperienceStatus;sortOrder:number;availabilityMode:string;seoTitle:string;seoDescription:string;updatedAt:string }
export interface ExperienceMediaOption{id:string;label:string;url:string}
export interface ExperienceFormState{ok:boolean;message:string;id?:string;errors?:Record<string,string>}
