import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleCard } from '@/components/public/Cards';
import { PageHero, PublicShell } from '@/components/public/PageShell';
import { landingHeroImageProps } from '@/lib/landing-page-content';
import { publicContentRepository } from '@/lib/repositories/public/content';
import { createPageMetadata } from '@/lib/seo';
import { getLandingPageContent } from '@/services/site-content';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('explore-koman');
}

export default async function ExploreKomanPage() {
  const [articles, property, page] = await Promise.all([
    publicContentRepository.getExploreArticles(),
    publicContentRepository.getProperty(),
    getLandingPageContent('explore-koman'),
  ]);
  const destination = articles.find(article => article.image !== property.heroImage && article.image !== '/borealis-placeholder.svg');
  const usePageImage = page.heroImage && page.heroImage !== property.heroImage && page.heroImage !== '/borealis-placeholder.svg';
  const ferryArticles = articles.filter(article => /ferry|lake trips?/.test(`${article.category.slug} ${article.slug.replaceAll('-', ' ')}`));
  const arrivalArticles = articles.filter(article => !ferryArticles.includes(article) && /getting.here|getting.to|transport|directions/.test(`${article.category.slug} ${article.slug}`));
  const nearbyArticles = articles.filter(article => !ferryArticles.includes(article) && !arrivalArticles.includes(article));

  return <PublicShell>
    <PageHero
      {...(usePageImage ? landingHeroImageProps(page) : {})}
      eyebrow={page.eyebrow}
      title={page.heading}
      copy={page.description}
      image={usePageImage ? page.heroImage : destination?.image}
      imageAlt={usePageImage ? page.heroImageAlt : destination?.heroImageAlt}
    />
    <div className="shell grid gap-8 py-10 md:gap-12 md:py-16">
      <section className="border-b border-lake/10 pb-8">
        <h2 className="font-serif text-4xl text-lake">Getting here</h2>
        <p className="mt-3 max-w-xl leading-7 text-muted">Find the guesthouse on the map or ask us about the best route for your travel dates.</p>
        <Link href="/gallery#contact" className="mt-4 inline-block font-bold text-green underline underline-offset-4">Contact &amp; Directions</Link>
        {arrivalArticles.length > 0 && <div className="mt-6 grid gap-6 md:grid-cols-3">{arrivalArticles.map(item => <ArticleCard key={item.id} article={item}/>)}</div>}
      </section>
      <section className="border-b border-lake/10 pb-8">
        <h2 className="font-serif text-4xl text-lake">Ferry and lake trips</h2>
        <p className="mt-3 max-w-xl leading-7 text-muted">Check ferry times with your operator before travelling. If you need help planning a connection, contact the guesthouse.</p>
        <Link href="/experiences#transfers" className="mt-4 inline-block font-bold text-green underline underline-offset-4">Transfer options</Link>
        {ferryArticles.length > 0 && <div className="mt-6 grid gap-6 md:grid-cols-3">{ferryArticles.map(item => <ArticleCard key={item.id} article={item}/>)}</div>}
      </section>
      <section>
        <h2 className="font-serif text-4xl text-lake">What to do nearby</h2>
        {nearbyArticles.length ? <div className="mt-6 grid gap-6 md:grid-cols-3">{nearbyArticles.map(item => <ArticleCard key={item.id} article={item}/>)}</div>
          : <Link href="/experiences#experiences" className="mt-4 inline-block font-bold text-green underline underline-offset-4">Explore experiences in Koman</Link>}
      </section>
    </div>
  </PublicShell>;
}
