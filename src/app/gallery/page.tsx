import Link from 'next/link';
import {ContactSection} from '@/components/public/ContactSection';
import type {Metadata} from 'next';
import {GalleryExplorer} from '@/components/public/GalleryExplorer';
import {PageHero,PublicShell} from '@/components/public/PageShell';
import {createMetadata} from '@/lib/seo';
import {publicContentRepository} from '@/lib/repositories/public/content';
import {getLandingPageContent} from '@/services/site-content';
export const metadata:Metadata=createMetadata({title:'Gallery & Contact',description:'Explore Borealis and Koman in photos, contact the guesthouse and find directions for your stay.'},'/gallery');
export default async function GalleryPage() {
  const [gallery, page] = await Promise.all([
    publicContentRepository.getGallery(),
    getLandingPageContent('gallery'),
  ]);
  return <PublicShell>
    <PageHero eyebrow={page.eyebrow} title="Gallery" copy={page.description}/>
    <section id="gallery" className="shell public-section-anchor py-8 md:py-12" aria-label="Photo gallery">
      <div className="mb-5 flex justify-end">
        <Link href="#contact" className="text-sm font-bold text-lake underline underline-offset-4">Contact &amp; Directions</Link>
      </div>
      <GalleryExplorer items={gallery}/>
    </section>
    <ContactSection/>
  </PublicShell>;
}
