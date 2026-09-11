import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CTASection, PageHero, PublicShell } from '@/components/public/PageShell';
const images={kayak:'/borealis-placeholder.svg'};
import { createPageMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';
import {getLandingPageContent} from '@/services/site-content';
import {formatMoney} from '@/lib/pricing/format';

export async function generateMetadata():Promise<Metadata>{return createPageMetadata('experiences')}
export const dynamic = 'force-dynamic';

export default async function ExperiencesPage() {
  const [experiences,page] = await Promise.all([contentRepository.getExperiences(),getLandingPageContent('experiences')]);
  return <PublicShell>
    <PageHero eyebrow={page.eyebrow} title={page.heading} copy={page.description} image={page.heroImage||images.kayak} imageAlt={page.heroImageAlt} />
    <section className="shell py-20 md:py-28">
      <div className="max-w-2xl"><p className="eyebrow">{page.introEyebrow}</p><h2 className="mt-4 font-serif text-5xl leading-tight text-lake md:text-6xl">{page.introHeading}</h2>{page.introDescription&&<p className="mt-5 leading-7 text-muted">{page.introDescription}</p>}</div>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {experiences.map((item, index) => <article key={item.id} className={`group ${index%2===1?'md:translate-y-12':''}`}>
          <Link href={`/experiences/${item.slug}`} className="block"><div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]"><Image src={item.image} alt={item.title} fill sizes="(max-width:768px) 100vw,50vw" className="object-cover transition duration-700 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-lake/80 via-transparent to-transparent"/><div className="absolute inset-x-0 bottom-0 p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-sand">{item.category} · {item.duration}</p><h2 className="mt-3 font-serif text-4xl">{item.title}</h2></div></div></Link>
          <div className="px-1 pt-5"><p className="leading-7 text-muted">{item.description}</p><div className="mt-5 flex items-center justify-between gap-4"><p className="text-sm text-muted">{item.priceFrom===null?item.priceType:<>From <strong className="text-lake">{formatMoney(item.priceFrom,item.currency)}</strong> · {item.priceType}</>}</p><Link href={`/experiences/${item.slug}`} className="border-b-2 border-sand pb-1 text-sm font-bold text-lake">View experience</Link></div></div>
        </article>)}
      </div>
    </section>
    <section className="bg-ivory py-20 md:py-24"><div className="shell grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><p className="eyebrow">{page.ctaEyebrow}</p><h2 className="mt-3 font-serif text-4xl text-lake md:text-5xl">{page.ctaHeading}</h2><p className="mt-4 max-w-2xl text-muted">{page.ctaDescription}</p></div><Link href={page.ctaTarget||'/book'} className="rounded-full bg-lake px-7 py-4 text-center text-sm font-bold text-white">{page.ctaLabel}</Link></div></section>
    <CTASection />
  </PublicShell>;
}
