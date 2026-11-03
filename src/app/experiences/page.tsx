import type { Metadata } from 'next';
import {ExperienceCatalogueCard} from '@/components/public/ExperienceCatalogueCard';
import Link from 'next/link';
import { CTASection, PageHero, PublicShell } from '@/components/public/PageShell';
const images={kayak:'/borealis-placeholder.svg'};
import { createPageMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';
import {getLandingPageContent} from '@/services/site-content';
import {TransfersSection} from '@/components/public/TransfersSection';


export async function generateMetadata():Promise<Metadata>{const metadata = await createPageMetadata('experiences'); return {...metadata, title: 'Journey — Experiences & Transfers | Borealis Guest House', openGraph: {...metadata.openGraph, title: 'Journey — Experiences & Transfers'}, twitter: {...metadata.twitter, title: 'Journey — Experiences & Transfers'}}}

export default async function ExperiencesPage({searchParams}:{searchParams:Promise<{preview?:string}>}) {
  const [experiences,page] = await Promise.all([contentRepository.getExperiences(),getLandingPageContent('experiences')]);
  return <PublicShell>
    <PageHero eyebrow={page.eyebrow} title="Journey" copy={page.description} image={page.heroImage||images.kayak} imageAlt={page.heroImageAlt} />
    <nav aria-label="Journey sections" className="shell flex flex-wrap gap-3 pt-8"><Link href="#experiences" className="rounded-full bg-lake px-6 py-3 text-sm font-bold text-white">Experiences</Link><Link href="#transfers" className="rounded-full bg-sand px-6 py-3 text-sm font-bold text-lake">Transfers</Link></nav>
    <section id="experiences" className="shell scroll-mt-24 py-20 md:py-28">
      <div className="max-w-2xl"><p className="eyebrow">{page.introEyebrow}</p><h2 className="mt-4 font-serif text-5xl leading-tight text-lake md:text-6xl">{page.introHeading}</h2>{page.introDescription&&<p className="mt-5 leading-7 text-muted">{page.introDescription}</p>}</div>
      <div className="mt-12 grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">{experiences.map(item=><ExperienceCatalogueCard key={item.id} item={item}/>)}</div>
    </section>
    <section className="bg-ivory py-20 md:py-24"><div className="shell grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><p className="eyebrow">{page.ctaEyebrow}</p><h2 className="mt-3 font-serif text-4xl text-lake md:text-5xl">{page.ctaHeading}</h2><p className="mt-4 max-w-2xl text-muted">{page.ctaDescription}</p></div><Link href={page.ctaTarget||'/book'} className="rounded-full bg-lake px-7 py-4 text-center text-sm font-bold text-white">{page.ctaLabel}</Link></div></section>
    <TransfersSection searchParams={searchParams} />
    <CTASection />
  </PublicShell>;
}
