import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero, PublicShell } from '@/components/public/PageShell';
import { TransferCard } from '@/components/public/TransferCard';
import { images } from '@/data/public-content';
import { createMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';

export const metadata: Metadata = createMetadata({ title: 'Transfers to and from Koman', description: 'Preview bookable transfer services connecting Borealis Guest House with Tirana, Shkoder and local destinations.', image: images.boat }, '/transfers');
export const dynamic = 'force-dynamic';

export default async function TransfersPage() {
  const routes = (await contentRepository.getTransfers()).filter((route) => route.active);
  return <PublicShell>
    <PageHero eyebrow="Transfers by Borealis" title="The simple way to reach the lake." copy="Request a transfer as part of your stay, with one clear journey from pickup to Borealis—or onward to your next destination." image={images.boat} />
    <section className="shell py-20 md:py-28">
      <div className="grid gap-8 md:grid-cols-[.7fr_1.3fr] md:items-end"><div><p className="eyebrow">Available route concepts</p><h2 className="mt-4 font-serif text-5xl leading-none text-lake md:text-6xl">Choose where you are coming from.</h2></div><p className="max-w-xl leading-7 text-muted">Each route is structured as a bookable service. Timings, vehicles and prices shown as placeholders will be confirmed when live operations are connected.</p></div>
      <div className="mt-12 grid gap-6 lg:grid-cols-2">{routes.map((route)=><TransferCard key={route.id} route={route}/>)}</div>
    </section>
    <section className="bg-lake py-20 text-white md:py-24"><div className="shell grid gap-10 md:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow text-sand">How it will work</p><h2 className="mt-4 font-serif text-5xl">A clearer arrival.</h2></div><ol className="grid gap-5 sm:grid-cols-3"><Step number="01" title="Choose a route" copy="Select the connection that fits your journey."/><Step number="02" title="Add your details" copy="Share timing and passenger information."/><Step number="03" title="Receive confirmation" copy="Final service details will be confirmed directly."/></ol></div></section>
    <section className="bg-ivory py-20 md:py-24"><div className="shell rounded-[2rem] bg-white p-7 md:p-12"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><p className="eyebrow">Travelling a different route?</p><h2 className="mt-3 font-serif text-4xl text-lake md:text-5xl">Tell us where you need to go.</h2><p className="mt-4 max-w-2xl leading-7 text-muted">The route model supports additional origins and destinations. Ask about a connection that is not listed yet.</p></div><Link href="/contact" className="min-h-14 rounded-full bg-lake px-7 py-4 text-center text-sm font-bold text-white">Request another route</Link></div></div></section>
  </PublicShell>;
}

function Step({number,title,copy}:{number:string;title:string;copy:string}){return <li className="border-t border-white/20 pt-5"><span className="font-serif text-3xl text-sand/60">{number}</span><h3 className="mt-5 font-serif text-2xl">{title}</h3><p className="mt-2 text-sm leading-6 text-white/60">{copy}</p></li>}
