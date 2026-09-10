import type { ContentStatus } from '@/types/admin';
export const amenityCategories=['room','bathroom','food','outdoor','services','parking','accessibility','other'] as const;
export type AmenityCategory=(typeof amenityCategories)[number];
export interface AdminAmenityRecord{id:string;name:string;icon:string;category:AmenityCategory;description:string;active:boolean;sortOrder:number;status:ContentStatus;roomTypeUsage:number;physicalRoomUsage:number}
export interface AmenityInput{name:string;icon:string;category:AmenityCategory;description:string;active:boolean;sortOrder:number;status:'draft'|'published'}
export interface AmenityFormState{ok:boolean;message:string;id?:string;errors?:Record<string,string>}

