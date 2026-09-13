import type {Metadata} from 'next';
import {GalleryExplorer} from '@/components/public/GalleryExplorer';
import {PageHero,PublicShell} from '@/components/public/PageShell';
import {createMetadata} from '@/lib/seo';
import {publicContentRepository} from '@/lib/repositories/public/content';
import {getLandingPageContent} from '@/services/site-content';
export const metadata:Metadata=createMetadata({title:'Gallery',description:'Explore an editorial gallery of rooms, water and landscapes around Borealis and Koman.'},'/gallery');
export default async function GalleryPage(){const[gallery,property,page]=await Promise.all([publicContentRepository.getGallery(),publicContentRepository.getProperty(),getLandingPageContent('gallery')]),fallback=gallery[0]?.src||property.heroImage;return <PublicShell><PageHero eyebrow={page.eyebrow} title={page.heading} copy={page.description} image={page.heroImage||fallback} fallbackImage={fallback} imageAlt={page.heroImageAlt}/><section className="shell py-16 md:py-24"><div className="mb-10 max-w-2xl"><p className="eyebrow">{page.introEyebrow}</p><h2 className="mt-4 font-serif text-5xl text-lake md:text-6xl">{page.introHeading}</h2>{page.introDescription&&<p className="mt-5 leading-7 text-muted">{page.introDescription}</p>}</div><GalleryExplorer items={gallery}/></section></PublicShell>}
