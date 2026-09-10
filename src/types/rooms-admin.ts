import type { ContentStatus } from '@/types/admin';
export interface AdminAmenity { id:string;name:string;icon:string|null }
export interface AdminRoomImage { id:string;mediaAssetId:string;filePath:string;publicUrl:string;altText:string;sortOrder:number;isFeatured:boolean;status:ContentStatus }
export interface AdminRoomType { id:string;name:string;slug:string;shortDescription:string;longDescription:string;capacity:number;adults:number;children:number;bedConfiguration:string;sizeSqm:number|null;viewType:string;baseOccupancy:number;featured:boolean;visible:boolean;status:ContentStatus;sortOrder:number;basePrice:number|null;currency:string;seoTitle:string;seoDescription:string;amenityIds:string[];images:AdminRoomImage[];updatedAt:string }
export interface AdminPhysicalRoom { id:string;internalName:string;roomTypeId:string;roomTypeName:string;active:boolean;notes:string;availabilityStatus:'available'|'occupied'|'blocked'|'maintenance';status:ContentStatus }
export interface RoomFormState { ok:boolean;message:string;id?:string;errors?:Record<string,string> }
