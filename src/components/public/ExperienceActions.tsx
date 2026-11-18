import { formatExperiencePrice } from '@/lib/pricing/format';
import { BookingLink } from './BookingLink';

export function ExperienceActions({ slug, price, currency, priceType, bookable, bookIndependently }: {
  slug: string;
  price: number | null;
  currency: string;
  priceType: string;
  bookable: boolean;
  bookIndependently: boolean;
}) {
  if (!bookable) return null;
  return <div className="safe-bottom-bar fixed inset-x-0 bottom-0 z-30 border-t border-lake/10 bg-white/95 px-4 pt-3 shadow-[0_-8px_30px_rgba(23,50,77,.12)] backdrop-blur md:hidden">
    <div className="mx-auto flex max-w-lg items-center gap-3">
      <p className="max-w-[45%] text-sm font-bold leading-tight text-lake">{formatExperiencePrice(price, currency, priceType)}</p>
      <BookingLink href={bookIndependently ? `/book/experience/${slug}` : `/book?addon=${slug}`} pendingLabel="Opening…" className="public-primary-cta ml-auto min-h-14 flex-1 rounded-full px-5 py-4 text-center text-sm font-bold">
        {bookIndependently ? 'Choose a time' : 'Add to a room stay'}
      </BookingLink>
    </div>
  </div>;
}
