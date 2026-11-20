import {landingHeroImageProps} from '@/lib/landing-page-content';
import type { Metadata } from 'next';
import {ExperienceCatalogueCard, isKayakOption, KayakCatalogueCard} from '@/components/public/ExperienceCatalogueCard';
import Link from 'next/link';
import { CTASection, PageHero, PublicShell } from '@/components/public/PageShell';
import { createPageMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';
import {getLandingPageContent} from '@/services/site-content';
import {getWebsiteDraft} from '@/lib/preview';
import {PreviewBanner} from '@/components/public/PreviewBanner';
import {TransfersSection} from '@/components/public/TransfersSection';


export async function generateMetadata():Promise<Metadata>{const metadata = await createPageMetadata('experiences'); return {...metadata, title: 'Experiences & Transfers | Borealis Guest House', openGraph: {...metadata.openGraph, title: 'Experiences & Transfers'}, twitter: {...metadata.twitter, title: 'Experiences & Transfers'}}}

export default async function ExperiencesPage({searchParams}:{searchParams:Promise<{preview?:string}>}) {
  const draft = await getWebsiteDraft('experiences', (await searchParams).preview);
  const [experiences,page] = await Promise.all([contentRepository.getExperiences(),getLandingPageContent('experiences', draft?.data)]);
  const kayakOptions = experiences.filter(isKayakOption);
  const firstKayakId = kayakOptions[0]?.id;
  kayakOptions.sort((a, b) => Number(b.rental?.kind === 'single_kayak') - Number(a.rental?.kind === 'single_kayak'));
  const cover = experiences.find(item => item.image !== '/borealis-placeholder.svg');
  return <PublicShell>
    {draft && <PreviewBanner label={draft.saved ? 'Experiences draft preview' : draft.unavailable ? 'Draft unavailable' : 'No saved draft'} liveHref="/experiences" showingLive={!draft.saved}/>}
    <PageHero {...landingHeroImageProps(page)} eyebrow={page.eyebrow} title="Experiences & Transfers" copy={page.description} image={page.heroImage || cover?.image} imageAlt={page.heroImage ? page.heroImageAlt : cover?.title} />
    <nav aria-label="Experiences and transfers sections" className="shell flex flex-wrap gap-3 pt-8"><Link href="#experiences" className="rounded-full bg-lake px-6 py-3 text-sm font-bold text-white">Experiences</Link><Link href="#transfers" className="rounded-full bg-sand px-6 py-3 text-sm font-bold text-lake">Transfers</Link></nav>
    <section id="experiences" className="shell public-section-anchor py-9 md:py-14">
      <div className="max-w-2xl"><p className="eyebrow">{page.introEyebrow}</p><h2 className="mt-4 font-serif text-5xl leading-tight text-lake md:text-6xl">{page.introHeading}</h2>{page.introDescription&&<p className="mt-5 leading-7 text-muted">{page.introDescription}</p>}</div>
      <div className="mt-12 grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">{experiences.map(item => {
        if (item.id === firstKayakId) return <KayakCatalogueCard key={item.id} options={kayakOptions} />;
        if (isKayakOption(item)) return null;
        return <ExperienceCatalogueCard key={item.id} item={item} />;
      })}</div>
    </section>
    <TransfersSection searchParams={searchParams} />
    <section className="bg-ivory py-20 md:py-24"><div className="shell grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><p className="eyebrow">{page.ctaEyebrow}</p><h2 className="mt-3 font-serif text-4xl text-lake md:text-5xl">{page.ctaHeading}</h2><p className="mt-4 max-w-2xl text-muted">{page.ctaDescription}</p></div><Link href={page.ctaTarget||'/book'} className="rounded-full bg-lake px-7 py-4 text-center text-sm font-bold text-white">{page.ctaLabel}</Link></div></section>
    <CTASection />
  </PublicShell>;
}
