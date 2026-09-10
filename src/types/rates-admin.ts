export const pricingRuleTypes=['weekend_price','minimum_stay','maximum_stay','extra_guest_fee','discount_percentage','fixed_discount','closed_to_arrival','closed_to_departure'] as const;
export type PricingRuleType=(typeof pricingRuleTypes)[number];
export interface RateRoomType{id:string;name:string;basePrice:number|null;currency:string}
export interface SeasonalRate{id:string;name:string;startDate:string;endDate:string;price:number;currency:string;active:boolean;status:'draft'|'published'|'archived';roomTypeIds:string[];roomTypeNames:string[];conflictIds:string[]}
export interface PricingRule{id:string;name:string;roomTypeId:string|null;roomTypeName:string;type:PricingRuleType;startDate:string;endDate:string;amount:number|null;percentage:number|null;nights:number|null;active:boolean;status:'draft'|'published'|'archived'}
export interface RateActionState{ok:boolean;message:string;errors?:Record<string,string>}

