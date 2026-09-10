import type { Metadata } from 'next';
import type { SEOData } from '@/types/public';
export function createMetadata(seo:SEOData,path:string):Metadata{return{title:seo.title,description:seo.description,alternates:{canonical:path},openGraph:{type:'website',siteName:'Borealis Guest House',locale:'en_US',title:seo.title,description:seo.description,url:path,images:seo.image?[{url:seo.image}]:[]},twitter:{card:'summary_large_image',title:seo.title,description:seo.description,images:seo.image?[seo.image]:[]}}}
