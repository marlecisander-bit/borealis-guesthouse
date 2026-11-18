import type { Metadata } from 'next';
import Image from 'next/image';
import { CTASection, PageHero, PublicShell } from '@/components/public/PageShell';
import { createPageMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('about');
}

export default async function AboutPage() {
  const about = await contentRepository.getAbout();
  const introduction = /\bbeing created\b/i.test(about.heroCopy)
    ? 'Borealis Guest House welcomes guests to the shores of Koman Lake in Albania.'
    : about.heroCopy;

  return <PublicShell>
    <PageHero eyebrow={about.heroEyebrow} title={about.heroTitle} copy={introduction} image={about.heroImage === '/borealis-placeholder.svg' ? undefined : about.heroImage} imageAlt={about.heroImageAlt}/>
    {about.sections.length > 0 && <section className="shell space-y-12 py-10 md:space-y-16 md:py-16">
      {about.sections.map((section, index) => {
        const hasImage = section.image !== '/borealis-placeholder.svg';
        const copy = section.id === 'story' && /\bis imagined as\b/i.test(section.copy)
          ? 'Borealis offers rooms by Koman Lake for guests who want to spend time by the water and explore the area.'
          : section.copy;
        return <article key={section.id} className={hasImage ? 'grid items-center gap-8 lg:grid-cols-2 lg:gap-16' : 'max-w-2xl'}>
          {hasImage && <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl ${index % 2 ? 'lg:order-2' : ''}`}>
            <Image src={section.image} alt={section.imageAlt} fill sizes="(max-width:1024px) 100vw,50vw" className="object-cover"/>
          </div>}
          <div>
            <p className="eyebrow">{section.eyebrow}</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight text-lake md:text-5xl">{section.title}</h2>
            <p className="mt-4 max-w-lg text-lg leading-8 text-muted">{copy}</p>
          </div>
        </article>;
      })}
    </section>}
    {about.philosophy.length > 0 && <section className="bg-lake py-12 text-white md:py-16">
      <div className="shell grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
        <div><p className="eyebrow text-sand">{about.philosophyEyebrow}</p><h2 className="mt-3 font-serif text-4xl">{about.philosophyHeading}</h2></div>
        <ul className="grid gap-5 sm:grid-cols-3">
          {about.philosophy.map(item => <li key={item} className="border-t border-white/20 pt-5 font-serif text-2xl leading-tight">{item}</li>)}
        </ul>
      </div>
    </section>}
    <CTASection label={about.ctaLabel} target={about.ctaTarget}/>
  </PublicShell>;
}
