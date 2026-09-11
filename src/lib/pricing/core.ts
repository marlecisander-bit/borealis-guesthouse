export interface BaseRate { roomTypeId:string; amount:number; currency?:string; active:boolean }
export interface SeasonalRateRule { id:string; name:string; roomTypeIds:string[]; startDate:string; endDate:string; amount:number; currency?:string; active:boolean }
export interface MinimumStayRule { id:string; roomTypeId:string|null; startDate:string|null; endDate:string|null; nights:number; active:boolean }
export interface PricingCatalog { currency:string; baseRates:BaseRate[]; seasonalRates:SeasonalRateRule[]; minimumStayRules:MinimumStayRule[] }
export interface NightlyRate { date:string; amount:number; currency:string; source:'base'|'seasonal'; sourceId?:string; sourceName?:string }
export interface StayPrice { roomTypeId:string; checkIn:string; checkOut:string; nights:number; nightlyRates:NightlyRate[]; subtotal:number; currency:string; minimumStay:number|null }

export class PricingConflictError extends Error {
  readonly roomTypeId:string;readonly date:string;readonly ruleIds:string[];
  constructor(roomTypeId:string,date:string,ruleIds:string[]){super(`Overlapping seasonal rates for room type ${roomTypeId} on ${date}: ${ruleIds.join(', ')}`);this.name='PricingConflictError';this.roomTypeId=roomTypeId;this.date=date;this.ruleIds=ruleIds}
}
export class PricingCurrencyConflictError extends Error {
  constructor(){super('A stay cannot combine nightly rates in different currencies.');this.name='PricingCurrencyConflictError'}
}

const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const asUtc=(date:string)=>{if(!datePattern.test(date))throw new Error(`Invalid date: ${date}`);return new Date(`${date}T00:00:00Z`)};
const dateString=(date:Date)=>date.toISOString().slice(0,10);
export function nightsBetween(checkIn:string,checkOut:string){const nights=Math.round((asUtc(checkOut).getTime()-asUtc(checkIn).getTime())/86400000);if(nights<1)throw new Error('Check-out must be after check-in.');return nights}

export function getBaseRate(catalog:PricingCatalog,roomTypeId:string):NightlyRate|null{const rate=catalog.baseRates.find(item=>item.roomTypeId===roomTypeId&&item.active);return rate?{date:'',amount:rate.amount,currency:rate.currency||catalog.currency,source:'base'}:null}

export function getNightlyRateFromCatalog(catalog:PricingCatalog,roomTypeId:string,date:string):NightlyRate|null{
  asUtc(date);
  const matches=catalog.seasonalRates.filter(rule=>rule.active&&rule.roomTypeIds.includes(roomTypeId)&&rule.startDate<=date&&rule.endDate>=date);
  if(matches.length>1)throw new PricingConflictError(roomTypeId,date,matches.map(rule=>rule.id));
  if(matches.length===1){const base=getBaseRate(catalog,roomTypeId);return{date,amount:matches[0].amount,currency:matches[0].currency||base?.currency||catalog.currency,source:'seasonal',sourceId:matches[0].id,sourceName:matches[0].name}}
  const base=getBaseRate(catalog,roomTypeId);return base?{...base,date}:null;
}

export function calculateStayPriceFromCatalog(catalog:PricingCatalog,roomTypeId:string,checkIn:string,checkOut:string):StayPrice|null{
  const nights=nightsBetween(checkIn,checkOut),start=asUtc(checkIn),nightlyRates:Array<NightlyRate>=[];
  for(let index=0;index<nights;index++){const date=new Date(start);date.setUTCDate(start.getUTCDate()+index);const rate=getNightlyRateFromCatalog(catalog,roomTypeId,dateString(date));if(!rate)return null;nightlyRates.push(rate)}
  const applicableMinimums=catalog.minimumStayRules.filter(rule=>rule.active&&(!rule.roomTypeId||rule.roomTypeId===roomTypeId)&&(!rule.startDate||checkIn>=rule.startDate)&&(!rule.endDate||checkIn<=rule.endDate));
  const minimumStay=applicableMinimums.length?Math.max(...applicableMinimums.map(rule=>rule.nights)):null;
  if(minimumStay&&nights<minimumStay)throw new Error(`A minimum stay of ${minimumStay} nights applies to these dates.`);
  const currencies=[...new Set(nightlyRates.map(rate=>rate.currency))];if(currencies.length!==1)throw new PricingCurrencyConflictError();
  return{roomTypeId,checkIn,checkOut,nights,nightlyRates,subtotal:Number(nightlyRates.reduce((sum,rate)=>sum+rate.amount,0).toFixed(2)),currency:currencies[0],minimumStay};
}

export function findSeasonalConflicts(rules:SeasonalRateRule[]){return rules.flatMap((rule,index)=>rules.slice(index+1).filter(other=>rule.active&&other.active&&rule.startDate<=other.endDate&&other.startDate<=rule.endDate&&rule.roomTypeIds.some(id=>other.roomTypeIds.includes(id))).map(other=>({firstId:rule.id,secondId:other.id,roomTypeIds:rule.roomTypeIds.filter(id=>other.roomTypeIds.includes(id))}))) }
