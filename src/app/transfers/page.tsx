import type {Metadata} from 'next';
import Link from 'next/link';
import {PageHero,PublicShell} from '@/components/public/PageShell';
import {TransferCard} from '@/components/public/TransferCard';
import {getAdminSession} from '@/lib/admin/auth';
import {adminTransfersRepository} from '@/lib/repositories/admin/transfers';
import {createPageMetadata} from '@/lib/seo';
import {contentRepository} from '@/services/content';
import {getLandingPageContent} from '@/services/site-content';
import type {TransferRoute} from '@/types/public';

const images={boat:'/borealis-placeholder.svg'};
export async function generateMetadata():Promise<Metadata>{return createPageMetadata('transfers')}

export default async function TransfersPage({searchParams}:{searchParams:Promise<{preview?:string}>}){
  const{preview}=await searchParams;
  const[page,liveRoutes]=await Promise.all([getLandingPageContent('transfers'),contentRepository.getTransfers()]);
  let routes=liveRoutes.filter(route=>route.active),previewing=false;
  if(preview){const session=await getAdminSession();if(session?.role==='owner'){const item=await adminTransfersRepository.get(session,preview);if(item){const image=item.imageUrl||images.boat,draft:TransferRoute={id:item.id,slug:item.slug,origin:item.origin,destination:item.destination,description:item.shortDescription,fullDescription:item.fullDescription,duration:item.duration,capacity:item.capacity,vehicleServiceType:item.serviceType,pricingMethod:item.pricingMethod,currency:item.currency,price:item.price,bookingNotice:item.bookingNotice,active:item.active,featured:item.featured,bookable:item.bookable,availabilityMode:item.availabilityMode,availableDays:item.availableDays,windowStart:item.windowStart,windowEnd:item.windowEnd,image,gallery:[image],seo:{title:item.seoTitle||`${item.origin} to ${item.destination} transfer`,description:item.seoDescription||item.shortDescription,image}};routes=[draft,...routes.filter(route=>route.id!==draft.id)];previewing=true}}}
  return <PublicShell>
    {previewing&&<div className="bg-amber-100 px-4 py-2 text-center text-sm font-bold text-amber-900">Owner preview · unpublished changes may be visible</div>}
    <PageHero eyebrow={page.eyebrow} title={page.heading} copy={page.description} image={page.heroImage||images.boat} imageAlt={page.heroImageAlt}/>
    <section className="shell py-20 md:py-28"><div className="grid gap-8 md:grid-cols-[.7fr_1.3fr] md:items-end"><div><p className="eyebrow">{page.introEyebrow}</p><h2 className="mt-4 font-serif text-5xl leading-none text-lake md:text-6xl">{page.introHeading}</h2></div>{page.introDescription&&<p className="max-w-xl leading-7 text-muted">{page.introDescription}</p>}</div><div className="mt-12 grid gap-6 lg:grid-cols-2">{routes.map(route=><TransferCard key={route.id} route={route}/>)}</div></section>
    <section className="bg-lake py-20 text-white md:py-24"><div className="shell grid gap-10 md:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow text-sand">{page.processEyebrow}</p><h2 className="mt-4 font-serif text-5xl">{page.processHeading}</h2></div><ol className="grid gap-5 sm:grid-cols-3"><Step number="01" title={page.processStep1Title||''} copy={page.processStep1Description||''}/><Step number="02" title={page.processStep2Title||''} copy={page.processStep2Description||''}/><Step number="03" title={page.processStep3Title||''} copy={page.processStep3Description||''}/></ol></div></section>
    <section className="bg-ivory py-20 md:py-24"><div className="shell rounded-[2rem] bg-white p-7 md:p-12"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><p className="eyebrow">{page.ctaEyebrow}</p><h2 className="mt-3 font-serif text-4xl text-lake md:text-5xl">{page.ctaHeading}</h2><p className="mt-4 max-w-2xl leading-7 text-muted">{page.ctaDescription}</p></div><Link href={page.ctaTarget||'/contact'} className="min-h-14 rounded-full bg-lake px-7 py-4 text-center text-sm font-bold text-white">{page.ctaLabel}</Link></div></div></section>
  </PublicShell>;
}
function Step({number,title,copy}:{number:string;title:string;copy:string}){return <li className="border-t border-white/20 pt-5"><span className="font-serif text-3xl text-sand/60">{number}</span><h3 className="mt-5 font-serif text-2xl">{title}</h3><p className="mt-2 text-sm leading-6 text-white/60">{copy}</p></li>}
