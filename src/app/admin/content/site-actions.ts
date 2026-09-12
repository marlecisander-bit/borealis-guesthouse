'use server';
import {revalidatePath} from 'next/cache';
import {requireAdmin} from '@/lib/admin/auth';
import {isLandingPageKey,landingPageFieldNames} from '@/lib/landing-page-content';
import {adminSiteContentRepository} from '@/lib/repositories/admin/site-content';
import type {SiteContentState,SiteDocumentKey} from '@/types/site-content-cms';

const fieldsByKey:Record<SiteDocumentKey,string[]>={
  about:['heroEyebrow','heroTitle','introduction','heroImage','heroImageAlt','storyEyebrow','storyHeading','storyText','storyImage','storyImageAlt','locationEyebrow','locationHeading','locationText','locationImage','locationImageAlt','philosophyEyebrow','philosophyHeading','philosophy','ctaLabel','ctaTarget'],
  contact:['eyebrow','title','introduction','directHeading','directDescription','addressLabel','directionsText','journeyEyebrow','journeyHeading','journeyDescription','primaryCtaLabel','primaryCtaTarget','secondaryCtaLabel','secondaryCtaTarget'],
  book:['eyebrow','heading','description'],
  global:['headerCtaLabel','mobileMenuCtaLabel','mobileBarCtaLabel','sharedCtaEyebrow','sharedCtaHeading','sharedCtaLabel','sharedCtaTarget'],
  footer:['description','exploreHeading','findUsHeading','bookingCtaLabel','bookingCtaTarget','copyright','privacyLabel','privacyUrl','bookingPolicyLabel','bookingPolicyUrl','termsLabel','termsUrl'],
  rooms:landingPageFieldNames.rooms,
  experiences:landingPageFieldNames.experiences,
  transfers:landingPageFieldNames.transfers,
  'explore-koman':landingPageFieldNames['explore-koman'],
  gallery:landingPageFieldNames.gallery,
};
const text=(data:FormData,key:string)=>String(data.get(key)||'').trim();

export async function saveSiteDocument(key:SiteDocumentKey,_:SiteContentState,formData:FormData):Promise<SiteContentState>{
  const session=await requireAdmin(['owner','manager','editor']);
  const status=text(formData,'status') as 'draft'|'published';
  const data=Object.fromEntries(fieldsByKey[key].map(field=>[field,text(formData,field)]));
  if(!['draft','published'].includes(status))return{ok:false,message:'Choose draft or publish.'};
  if(key==='contact'&&['primaryCtaTarget','secondaryCtaTarget'].some(field=>data[field]&&!/^\/(?:[a-z0-9-]+\/?)*$/i.test(data[field])))return{ok:false,message:'CTA destinations must use a safe internal path.'};
  if(key==='global'&&data.sharedCtaTarget&&!/^\/(?:[a-z0-9-]+\/?)*$/i.test(data.sharedCtaTarget))return{ok:false,message:'The shared CTA destination must use a safe internal path.'};
  if(key==='footer'&&data.bookingCtaTarget&&!/^\/(?:[a-z0-9-]+\/?)*$/i.test(data.bookingCtaTarget))return{ok:false,message:'The footer CTA destination must use a safe internal path.'};
  if(isLandingPageKey(key)&&status==='published'){
    if(data.eyebrow.length<2||data.heading.length<3||data.description.length<10)return{ok:false,message:'Add the eyebrow, heading and description before publishing.'};
    if(data.heroImageId&&!/^[0-9a-f-]{36}$/i.test(data.heroImageId))return{ok:false,message:'Choose a valid image from the Media Library.'};
    if(data.heroImageId&&data.heroImageAlt.length<3)return{ok:false,message:'Add alternative text describing the hero image.'};
    if(data.ctaTarget&&!/^\/(?:[a-z0-9-]+\/?)*$/i.test(data.ctaTarget))return{ok:false,message:'CTA destinations must use a safe internal path.'};
  }
  try{
    await adminSiteContentRepository.saveDocument(session,key,data,status);
    revalidatePath('/admin/content');
    revalidatePath(`/admin/content/${key}`);
    revalidatePath(`/${key}`);
    if(key==='contact'||key==='footer'||key==='global')revalidatePath('/');
    return{ok:true,message:status==='published'?'Changes published.':'Draft saved. The public website is unchanged.'};
  }catch(error){return{ok:false,message:error instanceof Error?error.message:'Could not save changes.'}}
}

export async function saveNavigation(_:SiteContentState,formData:FormData):Promise<SiteContentState>{const session=await requireAdmin(['owner','manager','editor']),count=Number(text(formData,'count')),allowed=['/','/rooms','/experiences','/explore-koman','/transfers','/gallery','/about','/contact','/book'];const items=Array.from({length:count},(_,i)=>({id:'',label:text(formData,`label_${i}`),href:text(formData,`href_${i}`),location:(text(formData,`location_${i}`)==='footer'?'footer':'header') as 'header'|'footer',visible:formData.get(`visible_${i}`)==='on',sortOrder:Number(text(formData,`order_${i}`)||i*10),status:'published' as const})).filter(item=>item.label&&item.href);if(items.some(item=>!allowed.includes(item.href)&&!/^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/i.test(item.href)))return{ok:false,message:'Use an approved internal destination or a valid HTTPS URL.'};try{await adminSiteContentRepository.saveNavigation(session,items);revalidatePath('/');revalidatePath('/admin/content/navigation');return{ok:true,message:'Navigation published.'}}catch(error){return{ok:false,message:error instanceof Error?error.message:'Navigation could not be saved.'}}}
