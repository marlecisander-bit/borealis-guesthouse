import type {Metadata} from 'next';
import {Cormorant_Garamond,Manrope} from 'next/font/google';
import {JsonLd} from '@/components/public/JsonLd';
import {publicContentRepository} from '@/lib/repositories/public/content';
import {getGlobalSeo} from '@/services/global-seo';
import{getLanguageContext}from'@/services/translations';
import './globals.css';
import './control-alignment.css';
const sans=Manrope({variable:'--font-manrope',subsets:['latin'],display:'swap'});
const serif=Cormorant_Garamond({variable:'--font-cormorant',subsets:['latin'],weight:['400','500','600'],display:'swap'});
export async function generateMetadata():Promise<Metadata>{const seo=await getGlobalSeo();return{metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),title:{default:seo.defaultTitle,template:seo.titleTemplate},description:seo.defaultDescription,icons:{icon:[{url:'/brand/borealis-logo-dark.svg',type:'image/svg+xml'}]},openGraph:{type:'website',siteName:seo.siteName,images:seo.defaultOgUrl?[{url:seo.defaultOgUrl}]:[]},robots:{index:seo.robotsIndex,follow:seo.robotsFollow}}}
export default async function RootLayout({children}:{children:React.ReactNode}){const[property,language]=await Promise.all([publicContentRepository.getProperty(),getLanguageContext()]);return <html lang={language.selected?.code||language.defaultLanguage?.code||'und'} data-scroll-behavior="smooth" className={`${sans.variable} ${serif.variable} antialiased`}><body><JsonLd data={{'@context':'https://schema.org','@type':'LodgingBusiness',name:property.name,description:property.description,address:{'@type':'PostalAddress',streetAddress:property.location,addressCountry:'AL'}}}/>{children}</body></html>}
