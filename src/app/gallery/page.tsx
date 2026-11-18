import Link from 'next/link';
import {getWebsiteDraft} from '@/lib/preview';
import {PreviewBanner} from '@/components/public/PreviewBanner';
import {ContactSection} from '@/components/public/ContactSection';
import type {Metadata} from 'next';
import {GalleryExplorer} from '@/components/public/GalleryExplorer';
import {PageHero,PublicShell} from '@/components/public/PageShell';
import {createMetadata} from '@/lib/seo';
import {publicContentRepository} from '@/lib/repositories/public/content';
import {getLandingPageContent} from '@/services/site-content';
export const metadata:Metadata=createMetadata({title:'Gallery & Contact',description:'Explore Borealis and Koman in photos, contact the guesthouse and find directions for your stay.'},'/gallery');
export default async function GalleryPage({searchParams}: {searchParams: Promise<{preview?: string}>}) {
  const requested = (await searchParams).preview;
  const key = requested === 'contact' ? 'contact' : 'gallery';
  const draft = await getWebsiteDraft(key, requested);
  const [gallery, live] = await Promise.all([
    publicContentRepository.getGallery(),
    getLandingPageContent('gallery'),
  ]);
  const page = key === 'gallery' && draft?.data ? {...live, ...draft.data} : live;
  return <PublicShell>
    {draft && <PreviewBanner label={draft.saved ? (key === 'contact' ? 'Contact draft preview' : 'Gallery draft preview') : draft.unavailable ? 'Draft unavailable' : 'No saved draft'} liveHref={key === 'contact' ? '/gallery#contact' : '/gallery'} showingLive={!draft.saved}/>}
    <PageHero eyebrow={page.eyebrow} title="Gallery" copy={page.description}/>
    <section id="gallery" className="shell public-section-anchor py-8 md:py-12" aria-label="Photo gallery">
      <div className="mb-5 flex justify-end">
        <Link href="#contact" className="text-sm font-bold text-lake underline underline-offset-4">Contact &amp; Directions</Link>
      </div>
      <GalleryExplorer items={gallery}/>
    </section>
    <ContactSection draft={key === 'contact' ? draft?.data : undefined}/>
  </PublicShell>;
}
