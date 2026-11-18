import Image from 'next/image';
import Link from 'next/link';
import type { Experience } from '@/types/public';
import { formatExperiencePrice } from '@/lib/pricing/format';
import { RentalPrices } from './RentalInformation';

const cardClass = 'flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-lake/10 bg-white';
const imageClass = 'relative block aspect-[4/3] overflow-hidden bg-ivory';

export function isKayakOption(item: Experience) {
  return item.rental?.kind === 'single_kayak' || item.rental?.kind === 'double_kayak';
}

function CatalogueImage({ item }: { item: Experience }) {
  return <Image src={item.image} alt={item.title} fill sizes="(max-width:639px) 100vw,(max-width:1279px) 50vw,33vw" className="object-cover" />;
}

function ExperienceOffer({ item, kayakOption = false }: { item: Experience; kayakOption?: boolean }) {
  const { rental } = item;
  const canBook = item.bookable && item.bookIndependently &&
    (!rental || (rental.standalone && rental.occupancyReviewed && rental.peoplePerItem));
  const details = `/experiences/${item.slug}`;

  return <>
    {kayakOption ? (
      <h4 className="font-serif text-2xl text-lake">{rental?.kind === 'single_kayak' ? 'Single kayak' : 'Double kayak'}</h4>
    ) : (
      <>
        <p className="eyebrow">{item.category}</p>
        <h3 className="mt-2 font-serif text-3xl text-lake">{item.title}</h3>
      </>
    )}
    <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
    <p className="mt-3 text-sm text-lake">
      {rental ? (rental.peoplePerItem
        ? `Up to ${rental.peoplePerItem} ${rental.peoplePerItem === 1 ? 'person' : 'people'} / ${rental.unitLabel}`
        : 'Occupancy awaiting review') : item.capacity}
    </p>
    {rental && rental.minAdultsPerItem > 0 && (
      <p className="mt-1 text-xs text-muted">
        At least {rental.minAdultsPerItem} adult(s) / {rental.unitLabel}
        {rental.maxChildrenPerItem !== null && ` · Maximum ${rental.maxChildrenPerItem} child(ren)`}
      </p>
    )}
    <div className="mb-5 mt-4">
      {rental ? <RentalPrices rental={rental} currency={item.currency} compact /> :
        <p className="text-sm font-bold text-lake">{formatExperiencePrice(item.priceFrom, item.currency, item.priceType)}</p>}
    </div>
    <div className="mt-auto grid grid-cols-2 gap-3">
      <Link href={canBook ? `/book/experience/${item.slug}` : details}
        aria-label={kayakOption ? `${canBook ? 'Choose a time' : 'Enquire'} for ${item.title}` : undefined}
        className="flex min-h-12 items-center justify-center rounded-full bg-lake px-3 text-center text-sm font-bold text-white">
        {canBook ? 'Choose a time' : 'Enquire'}
      </Link>
      <Link href={details} aria-label={kayakOption ? `${item.title} details` : undefined}
        className="flex min-h-12 items-center justify-center rounded-full border border-lake/20 px-3 text-sm font-bold text-lake">
        Details
      </Link>
    </div>
  </>;
}

export function ExperienceCatalogueCard({ item }: { item: Experience }) {
  return <article className={cardClass}>
    <Link href={`/experiences/${item.slug}`} className={imageClass}><CatalogueImage item={item} /></Link>
    <div className="flex flex-1 flex-col p-5 sm:p-6"><ExperienceOffer item={item} /></div>
  </article>;
}

export function KayakCatalogueCard({ options }: { options: Experience[] }) {
  const cover = options.find(item => item.image !== '/borealis-placeholder.svg') ?? options[0];
  if (!cover) return null;

  return <article className={cardClass}>
    <div className={imageClass}><CatalogueImage item={cover} /></div>
    <div className="p-5 sm:p-6">
      <p className="eyebrow">{cover.category}</p>
      <h3 className="mt-2 font-serif text-3xl text-lake">Kayak</h3>
      <ul className="mt-4 space-y-4">
        {options.map(option => (
          <li key={option.id} className="border-t border-lake/10 pt-4">
            <ExperienceOffer item={option} kayakOption />
          </li>
        ))}
      </ul>
    </div>
  </article>;
}
