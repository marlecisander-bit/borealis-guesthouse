import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ExperienceGallery} from '@/components/public/ExperienceGallery';
import {BreadcrumbJsonLd,JsonLd} from '@/components/public/JsonLd';
import {Breadcrumbs,PublicShell} from '@/components/public/PageShell';
import {createLocalizedMetadata} from '@/lib/seo';
import {formatMoney} from '@/lib/pricing/format';
import {contentRepository} from '@/services/content';
import {getLandingPageContent} from '@/services/site-content';


export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const{slug}=await params,item=await contentRepository.getTransfer(slug);return item?createLocalizedMetadata({...item.seo,image:item.image},`/transfers/${slug}`):{title:'Transfer route not found'}}

export default async function TransferPage({params}:{params:Promise<{slug:string}>}){
  const{slug}=await params,[item,page]=await Promise.all([contentRepository.getTransfer(slug),getLandingPageContent('transfers')]);if(!item)notFound();
  const price=item.price===null||item.pricingMethod==='on_request'?'Price on request':`${formatMoney(item.price,item.currency)}${item.pricingMethod==='per_passenger'?' per passenger':' per vehicle'}`;
  const product:Record<string,unknown>={'@context':'https://schema.org','@type':'Service',name:`${item.origin} to ${item.destination} transfer`,description:item.description,image:item.gallery,provider:{'@type':'LodgingBusiness',name:'Borealis Guest House'}};if(item.price!==null)product.offers={'@type':'Offer',price:item.price,priceCurrency:item.currency};
  return <PublicShell><BreadcrumbJsonLd items={[{name:'Home',url:'/'},{name:'Transfers',url:'/transfers'},{name:`${item.origin} to ${item.destination}`,url:`/transfers/${slug}`}]}/><JsonLd data={product}/><section className="shell pb-20 pt-8"><Breadcrumbs items={[{label:'Home',href:'/'},{label:'Transfers',href:'/transfers'},{label:`${item.origin} to ${item.destination}`}]}/><ExperienceGallery images={item.gallery} title={`${item.origin} to ${item.destination}`}/><div className="grid gap-12 py-14 lg:grid-cols-[1fr_24rem] lg:gap-20"><main><p className="eyebrow">Transfer by Borealis</p><h1 className="mt-4 font-serif text-5xl leading-none text-lake md:text-7xl">{item.origin} <span className="text-green">→</span> {item.destination}</h1><p className="mt-7 max-w-2xl text-xl leading-8 text-muted">{item.description}</p><dl className="mt-10 grid grid-cols-2 gap-5 border-y border-lake/10 py-7 sm:grid-cols-3"><Fact label="Duration" value={item.duration}/><Fact label="Capacity" value={item.capacity===null?'To be confirmed':`Up to ${item.capacity} guests`}/><Fact label="Service" value={item.vehicleServiceType}/></dl><section className="py-12"><p className="eyebrow">{page.detailEyebrow}</p><h2 className="mt-3 font-serif text-4xl text-lake">{page.detailHeading}</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{item.fullDescription}</p></section></main><aside className="h-fit rounded-[1.75rem] bg-lake p-7 text-white lg:sticky lg:top-6"><p className="text-xs font-bold uppercase tracking-widest text-sand">Transfer price</p><p className="mt-4 font-serif text-4xl">{price}</p>{item.bookingNotice&&<p className="mt-5 text-sm leading-6 text-white/65">{item.bookingNotice}</p>}{item.bookable&&<Link href={`/book?transfer=${item.id}`} className="mt-6 block min-h-14 rounded-xl bg-sand px-5 py-4 text-center text-sm font-bold text-lake">Book transfer</Link>}</aside></div></section></PublicShell>;
}
function Fact({label,value}:{label:string;value:string}){return <div><dt className="text-xs uppercase tracking-widest text-muted">{label}</dt><dd className="mt-2 font-serif text-xl leading-tight text-lake">{value}</dd></div>}
