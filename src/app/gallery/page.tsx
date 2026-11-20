import Link from 'next/link';
import {getWebsiteDraft} from '@/lib/preview';
import {PreviewBanner} from '@/components/public/PreviewBanner';
import {ContactSection} from '@/components/public/ContactSection';
import type {Metadata} from 'next';
import {GalleryExplorer} from '@/components/public/GalleryExplorer';
import {PageHero,PublicShell} from '@/components/public/PageShell';
import {createPageMetadata} from '@/lib/seo';
import {publicContentRepository} from '@/lib/repositories/public/content';
import {landingHeroImageProps} from '@/lib/landing-page-content';
import {getLandingPageContent} from '@/services/site-content';
export async function generateMetadata(): Promise<Metadata> { return createPageMetadata('contact'); }
export default async function GalleryPage({searchParams}: {searchParams: Promise<{preview?: string}>}) {
  const requested = (await searchParams).preview;
  const key = requested === 'contact' ? 'contact' : 'gallery';
  const draft = await getWebsiteDraft(key, requested);
  const [gallery, page] = await Promise.all([
    publicContentRepository.getGallery(),
    getLandingPageContent('gallery', key === 'gallery' ? draft?.data : undefined),
  ]);
  return <PublicShell>
    {draft && <PreviewBanner label={draft.saved ? (key === 'contact' ? 'Contact draft preview' : 'Gallery draft preview') : draft.unavailable ? 'Draft unavailable' : 'No saved draft'} liveHref={key === 'contact' ? '/gallery#contact' : '/gallery'} showingLive={!draft.saved}/>}
    <PageHero {...landingHeroImageProps(page)} eyebrow={page.eyebrow} title={page.heading} copy={page.description} image={page.heroImage} imageAlt={page.heroImageAlt}/>
    <section id="gallery" className="shell public-section-anchor py-8 md:py-12" aria-label="Photo gallery">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{page.introEyebrow}</p>
          <h2 className="mt-2 font-serif text-3xl text-lake">{page.introHeading}</h2>
          {page.introDescription && <p className="mt-2 max-w-xl text-sm text-muted">{page.introDescription}</p>}
        </div>
        <Link href="#contact" className="text-sm font-bold text-lake underline underline-offset-4">Contact &amp; Directions</Link>
      </div>
      <GalleryExplorer items={gallery}/>
    </section>
    <ContactSection draft={key === 'contact' ? draft?.data : undefined}/>
  </PublicShell>;
}
