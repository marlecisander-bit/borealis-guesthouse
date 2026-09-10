import Image from 'next/image';
import Link from 'next/link';
import type { TransferRoute } from '@/types/public';

export function TransferCard({ route }: { route: TransferRoute }) {
  const price = route.pricingMethod === 'quote' || route.price === null ? 'Price on request' : `${route.pricingMethod === 'from' ? 'From ' : ''}€${route.price}`;
  return <article className="overflow-hidden rounded-[1.75rem] bg-ivory">
    <div className="relative aspect-[16/10]"><Image src={route.image} alt={`Landscape associated with the transfer from ${route.origin} to ${route.destination}`} fill sizes="(max-width:768px) 100vw,50vw" className="object-cover"/><span className="absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-lake backdrop-blur">{route.vehicleServiceType}</span></div>
    <div className="p-6 md:p-8">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3"><div><p className="text-[.65rem] font-bold uppercase tracking-widest text-muted">From</p><h2 className="mt-1 font-serif text-2xl leading-tight text-lake md:text-3xl">{route.origin}</h2></div><span aria-hidden="true" className="rotate-90 justify-self-start text-2xl text-green sm:rotate-0">→</span><div><p className="text-[.65rem] font-bold uppercase tracking-widest text-muted">To</p><p className="mt-1 font-serif text-2xl leading-tight text-lake md:text-3xl">{route.destination}</p></div></div>
      <p className="mt-5 text-sm leading-6 text-muted">{route.description}</p>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-lake/10 py-5 text-sm"><div><dt className="text-xs text-muted">Journey time</dt><dd className="mt-1 font-semibold text-lake">{route.duration}</dd></div><div><dt className="text-xs text-muted">Capacity</dt><dd className="mt-1 font-semibold text-lake">{route.capacity===null?'To be confirmed':`Up to ${route.capacity} guests`}</dd></div></dl>
      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs text-muted">Transfer price</p><p className="mt-1 font-serif text-2xl text-lake">{price}</p></div><Link href={`/book?transfer=${route.id}`} className="min-h-14 rounded-xl bg-lake px-5 py-4 text-center text-sm font-bold text-white">Book transfer</Link></div>
      <p className="mt-4 text-xs leading-5 text-muted">{route.bookingNotice}</p>
    </div>
  </article>;
}
