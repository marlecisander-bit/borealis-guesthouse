export interface SiteDocument{id:string;key:'about'|'contact'|'footer';data:Record<string,string>;status:'draft'|'published'}
export interface NavigationItem{id:string;label:string;href:string;location:'header'|'footer';visible:boolean;sortOrder:number;status:'published'|'archived'}
export interface SiteContentState{ok:boolean;message:string}

