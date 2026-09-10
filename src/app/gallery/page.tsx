import type { Metadata } from 'next';
import { GalleryExplorer } from '@/components/public/GalleryExplorer';
import { PageHero, PublicShell } from '@/components/public/PageShell';
import { images } from '@/data/public-content';
import { createMetadata } from '@/lib/seo';
import { contentRepository } from '@/services/content';
export const metadata:Metadata=createMetadata({title:'Gallery',description:'Explore an editorial gallery of rooms, water and landscapes around Borealis and Koman.',image:images.terrace},'/gallery');
export const dynamic='force-dynamic';
export default async function GalleryPage(){const liveGallery=await contentRepository.getGallery();return <PublicShell><PageHero eyebrow="The visual story" title="A sense of life by the lake." copy="Rooms, water, mountain paths and quiet outdoor moments—an evolving visual journal of Borealis." image={images.terrace}/><section className="shell py-16 md:py-24"><div className="mb-10 max-w-2xl"><p className="eyebrow">Borealis in pictures</p><h2 className="mt-4 font-serif text-5xl text-lake md:text-6xl">Look a little closer.</h2><p className="mt-5 leading-7 text-muted">Select an image to open the full gallery. Swipe on touch screens or use the arrow keys.</p></div><GalleryExplorer items={liveGallery}/></section></PublicShell>}
