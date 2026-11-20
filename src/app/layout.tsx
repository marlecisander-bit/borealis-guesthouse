import {PublicWhatsAppContact} from '@/components/public/PublicWhatsAppContact';
import {getContactInfo} from '@/services/site-content';
import type {Metadata} from 'next';
import { headers } from 'next/headers';
import localFont from 'next/font/local';
import { preload } from 'react-dom';
import {JsonLd} from '@/components/public/JsonLd';
import {publicContentRepository} from '@/lib/repositories/public/content';
import {getGlobalSeo} from '@/services/global-seo';
import{getLanguageContext}from'@/services/translations';
import './site.css';
const sans=localFont({src:'./fonts/manrope/Manrope-variable.woff2',variable:'--font-manrope',weight:'200 800',style:'normal',display:'swap',adjustFontFallback:'Arial'});
const releaseMetadata = {
  other: {
    'borealis-release-sha': process.env.BOREALIS_RELEASE_SHA || 'local',
    'borealis-deploy-id': process.env.BOREALIS_DEPLOY_ID || 'local',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
};
const isAdminSurface = async () => (await headers()).get('x-borealis-surface') === 'admin';

export async function generateMetadata():Promise<Metadata>{
  if (await isAdminSurface()) return {
    ...releaseMetadata,
    title: { default: 'Borealis Admin', template: '%s | Borealis Admin' },
    robots: { index: false, follow: false },
    icons: { icon: '/brand/borealis-logo-dark.svg' },
  };
  const seo=await getGlobalSeo();return{...releaseMetadata,title:{default:seo.defaultTitle,template:seo.titleTemplate},description:seo.defaultDescription,icons:{icon:[{url:'/brand/borealis-logo-dark.svg',type:'image/svg+xml'}]},openGraph:{type:'website',siteName:seo.siteName,images:seo.defaultOgUrl?[{url:seo.defaultOgUrl}]:[]},robots:{index:seo.robotsIndex,follow:seo.robotsFollow}}}
export default async function RootLayout({children}:{children:React.ReactNode}){
  const typography = `${sans.variable} antialiased`;
  if (await isAdminSurface()) {
    return <html lang="en" className={typography}><body>{children}</body></html>;
  }
  preload('/fonts/cormorant-garamond-ae1ccee3fa8d.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  const[property,language,contact]=await Promise.all([publicContentRepository.getProperty(),getLanguageContext(),getContactInfo()]);return <html lang={language.selected?.code||language.defaultLanguage?.code||'und'} data-scroll-behavior="smooth" className={typography}><body><JsonLd data={{'@context':'https://schema.org','@type':'LodgingBusiness',name:property.name,description:property.description,address:{'@type':'PostalAddress',streetAddress:property.location,addressCountry:'AL'}}}/>{children}<PublicWhatsAppContact value={contact.whatsapp}/></body></html>}
