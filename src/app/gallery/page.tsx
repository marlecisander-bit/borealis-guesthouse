import Link from 'next/link';
import {ContactSection} from '@/components/public/ContactSection';
import type {Metadata} from 'next';
import {GalleryExplorer} from '@/components/public/GalleryExplorer';
import {PageHero,PublicShell} from '@/components/public/PageShell';
import {createMetadata} from '@/lib/seo';
import {publicContentRepository} from '@/lib/repositories/public/content';
import {getLandingPageContent} from '@/services/site-content';
export const metadata:Metadata=createMetadata({title:'Discover — Gallery & Contact',description:'Explore Borealis and Koman in photos, contact the guesthouse and find directions for your stay.'},'/gallery');
export default async function GalleryPage(){const[gallery,property,page]=await Promise.all([publicContentRepository.getGallery(),publicContentRepository.getProperty(),getLandingPageContent('gallery')]),fallback=gallery[0]?.src||property.heroImage;return <PublicShell><PageHero eyebrow={page.eyebrow} title="Discover" copy={page.description} image={page.heroImage||fallback} fallbackImage={fallback} imageAlt={page.heroImageAlt}/><nav aria-label="Discover sections" className="shell flex flex-wrap gap-3 pt-8"><Link href="#gallery" className="rounded-full bg-lake px-6 py-3 text-sm font-bold text-white">Gallery</Link><Link href="#contact" className="rounded-full bg-sand px-6 py-3 text-sm font-bold text-lake">Contact</Link></nav><section id="gallery" className="shell scroll-mt-24 py-16 md:py-24"><div className="mb-10 max-w-2xl"><p className="eyebrow">{page.introEyebrow}</p><h2 className="mt-4 font-serif text-5xl text-lake md:text-6xl">{page.introHeading}</h2>{page.introDescription&&<p className="mt-5 leading-7 text-muted">{page.introDescription}</p>}</div><GalleryExplorer items={gallery}/></section><ContactSection/></PublicShell>}
