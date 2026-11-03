export type RentalMode = 'hourly' | 'daily';
export type RentalPaymentMethod = 'cash' | 'pos' | 'advance' | 'online';
export interface RentalUnit { key:string; label:string; active:boolean; verified:boolean }
export interface RentalOverride { from:string; to:string; closed:boolean; open:string; close:string; daylightReviewed:boolean }
export interface RentalMaintenance { unitKey:string; from:string; to:string; start:string; end:string }
export interface RentalCharge { label:string; amount:number; basis:'equipment'|'person'|'booking'; modes:RentalMode[]; collection:'booking'|'return' }
export interface RentalConfig {
  version:1; kind:'boat'|'sup'|'single_kayak'|'double_kayak'|'other'; category:string; unitLabel:string;
  units:RentalUnit[]; peoplePerItem:number|null; maxAdultsPerItem:number|null; maxChildrenPerItem:number|null; minAdultsPerItem:number;
  minAge:number|null; maxWeightKg:number|null; occupancyReviewed:boolean;
  modes:RentalMode[]; hourlyPrice:number|null; dailyPrice:number|null; minHours:number; maxHours:number; incrementHours:number;
  days:number[]; open:string; close:string; dailyStart:string; dailyEnd:string; dailyHoursReviewed:boolean;
  cutoffHours:number; bufferMinutes:number; overrides:RentalOverride[]; maintenance:RentalMaintenance[];
  roomAddon:boolean; standalone:boolean; fuel:'excluded'|'included'|'not_applicable'; fuelExplanation:string;
  policies:Record<'safety'|'included'|'excluded'|'meetingPoint'|'collection'|'return'|'cancellation'|'weather'|'lateReturn'|'damageDeposit',string>;
  paymentMethods:RentalPaymentMethod[]; advanceType:'amount'|'percent'|null; advanceValue:number|null; balanceRule:string;
  beachFee:number; beachApplicability:'unresolved'|'none'|'non_staying_all'|'non_staying_adults'; extraCharges:RentalCharge[];
}
export interface RentalSelection { experienceId:string; date:string; startTime:string; mode:RentalMode; hours:number; quantity:number; adults:number; children:number; participantAges?:number[]; participantWeightsKg?:number[]; paymentMethod:RentalPaymentMethod; stayingGuest?:boolean }
export interface RentalQuote { total:number; currency:string; startTime:string; endTime:string; mode:RentalMode; hours:number; quantity:number; adults:number; children:number; remaining:number; fuelExplanation:string; separatelyPayable:string[]; advanceDue:number; balanceDue:number; paymentMethod:RentalPaymentMethod; policies:RentalConfig['policies']; priceVersion:string }
export type PublicRentalConfig = Omit<RentalConfig,'units'|'maintenance'>;
export function publicRentalConfig(config:RentalConfig):PublicRentalConfig {
  const {units: _units, maintenance: _maintenance, ...publicConfig}=config;
  void _units; void _maintenance;
  return publicConfig;
}
export function tiranaToday(now=new Date()):string {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tirane',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function rentalSummary(q:Pick<RentalQuote,'mode'|'startTime'|'endTime'|'quantity'|'adults'|'children'>):string {
  return `${q.mode} · ${q.startTime}–${q.endTime} · ${q.quantity} equipment item(s) · ${q.adults} adult(s), ${q.children} child(ren)`;
}
export function emptyRentalConfig():RentalConfig {
  return {version:1,kind:'other',category:'Equipment rental',unitLabel:'item',units:[],peoplePerItem:null,maxAdultsPerItem:null,maxChildrenPerItem:null,minAdultsPerItem:0,minAge:null,maxWeightKg:null,occupancyReviewed:false,modes:['hourly','daily'],hourlyPrice:null,dailyPrice:null,minHours:1,maxHours:11,incrementHours:1,days:[0,1,2,3,4,5,6],open:'10:00',close:'21:00',dailyStart:'10:00',dailyEnd:'21:00',dailyHoursReviewed:false,cutoffHours:0,bufferMinutes:0,overrides:[],maintenance:[],roomAddon:false,standalone:false,fuel:'not_applicable',fuelExplanation:'',policies:{safety:'',included:'',excluded:'',meetingPoint:'',collection:'',return:'',cancellation:'',weather:'',lateReturn:'',damageDeposit:''},paymentMethods:[],advanceType:null,advanceValue:null,balanceRule:'',beachFee:5,beachApplicability:'unresolved',extraCharges:[]};
}
export function rentalSnapshotDescription(q:RentalQuote):string {
  return `${rentalSummary(q)} · Rental subtotal ${q.total} ${q.currency} · Payment method ${q.paymentMethod}${q.advanceDue?` · Advance required at booking ${q.advanceDue} ${q.currency} · Remaining ${q.balanceDue} ${q.currency}`:''}${q.separatelyPayable.length?` · ${q.separatelyPayable.join(' · ')}`:''}`;
}
