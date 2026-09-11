export interface LanguageRecord{id:string;code:string;name:string;nativeName:string;icon:string;enabled:boolean;isDefault:boolean;sortOrder:number}
export interface TranslationEntity{id:string;type:string;label:string;editHref:string;fields:string[]}
export interface TranslationValue{id:string;languageId:string;entityType:string;entityId:string;fieldName:string;value:string;status:'draft'|'published'|'archived';complete:boolean}
export interface TranslationCompleteness{languageId:string;code:string;percent:number;state:'complete'|'partial'|'missing'}
export interface LanguagesDashboard{languages:LanguageRecord[];entities:TranslationEntity[];translations:TranslationValue[];completeness:Record<string,TranslationCompleteness[]>}
export interface LanguageActionState{ok:boolean;message:string}
