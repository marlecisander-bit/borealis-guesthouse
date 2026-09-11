export interface GlobalSeoSettings{defaultTitle:string;titleTemplate:string;defaultDescription:string;defaultOgMediaId:string;defaultOgUrl:string;siteName:string;robotsIndex:boolean;robotsFollow:boolean}
export interface SeoPageRow{id:string;page:string;url:string;title:string;description:string;indexed:boolean;updatedAt:string;editHref:string;status:string}
export interface AltAuditRow{id:string;label:string;editHref:string}
export interface SeoDashboardData{settings:GlobalSeoSettings;pages:SeoPageRow[];media:{id:string;label:string;url:string}[];missingAlt:AltAuditRow[]}
export interface SeoFormState{ok:boolean;message:string}
export type SeoPageKey='homepage'|'rooms'|'experiences'|'transfers'|'explore-koman'|'about'|'contact';
export interface PageSeoRecord{id:string;pageKey:SeoPageKey;label:string;slug:string;seoTitle:string;metaDescription:string;ogTitle:string;ogDescription:string;ogMediaId:string;canonicalOverride:string;noindex:boolean;status:string;updatedAt:string}
