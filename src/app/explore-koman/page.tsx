import type {Metadata} from 'next';
import {ArticleCard,SectionHeader} from '@/components/public/Cards';
import {PageHero,PublicShell} from '@/components/public/PageShell';
import {publicContentRepository} from '@/lib/repositories/public/content';
import {createPageMetadata} from '@/lib/seo';
import {getLandingPageContent} from '@/services/site-content';
export async function generateMetadata():Promise<Metadata>{return createPageMetadata('explore-koman')}
export const dynamic='force-dynamic';
export default async function Page(){const[articles,property,page]=await Promise.all([publicContentRepository.getExploreArticles(),publicContentRepository.getProperty(),getLandingPageContent('explore-koman')]),fallback=articles[0]?.image||property.heroImage;return <PublicShell><PageHero eyebrow={page.eyebrow} title={page.heading} copy={page.description} image={page.heroImage||fallback} fallbackImage={fallback} imageAlt={page.heroImageAlt}/><section className="shell py-20 md:py-28"><SectionHeader eyebrow={page.introEyebrow} title={page.introHeading} copy={page.introDescription}/><div className="mt-12 grid gap-10 md:grid-cols-3">{articles.map(item=><ArticleCard key={item.id} article={item}/>)}</div></section></PublicShell>}
