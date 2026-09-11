import {formatMoney} from '@/lib/pricing/format';
import {BookingLink} from './BookingLink';
export function ExperienceActions({slug,price,currency,bookable,bookIndependently}:{slug:string;price:number|null;currency:string;bookable:boolean;bookIndependently:boolean}){
 if(!bookable)return null;
 return <div className="safe-bottom-bar fixed inset-x-0 bottom-0 z-30 border-t border-lake/10 bg-white/95 px-4 pt-3 shadow-[0_-8px_30px_rgba(23,50,77,.12)] backdrop-blur md:hidden"><div className="mx-auto flex max-w-lg items-center gap-3"><p className="text-xs text-muted">{price===null?'Price on request':<>From<br/><strong className="text-lg text-lake">{formatMoney(price,currency)}</strong></>}</p><BookingLink href={bookIndependently?`/book/experience/${slug}`:`/book?addon=${slug}`} pendingLabel="Opening…" className="public-primary-cta ml-auto min-h-14 flex-1 rounded-full px-5 py-4 text-center text-sm font-bold">{bookIndependently?'Book experience':'Add to a room stay'}</BookingLink></div></div>;
}
