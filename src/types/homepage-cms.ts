import type {ContentStatus} from '@/types/admin';
export const homepageKeys=['hero','property_highlights','intro','featured_rooms','featured_experiences','explore_koman','transfers','gallery','reviews','location','final_cta'] as const;export type HomepageKey=(typeof homepageKeys)[number];
export interface HomepageSection{id:string;key:HomepageKey;title:string;subtitle:string;body:string;eyebrow:string;ctaLabel:string;ctaLink:string;backgroundMediaId:string;settings:Record<string,unknown>;status:ContentStatus;visible:boolean;sortOrder:number;links:{type:string;id:string;sortOrder:number}[]}
export interface HomepageHighlight{id:string;title:string;description:string;icon:string;visible:boolean;sortOrder:number;status:ContentStatus}
export interface HomepageReview{id:string;author:string;origin:string;quote:string;visible:boolean;sortOrder:number;status:ContentStatus}
export interface CmsOption{id:string;label:string;imageUrl?:string}
export interface HomepageEditorData{sections:HomepageSection[];highlights:HomepageHighlight[];reviews:HomepageReview[];media:CmsOption[];rooms:CmsOption[];experiences:CmsOption[];articles:CmsOption[];transfers:CmsOption[];workflow?:{hasDraft:boolean;updatedAt:string;publishedAt:string}}
export interface HomepageCmsState{ok:boolean;message:string;errors?:Record<string,string>}
