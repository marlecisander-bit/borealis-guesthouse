import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/ui';
import { ExperienceForm } from '@/components/admin/ExperienceForm';
import { requireAdmin } from '@/lib/admin/auth';
import { previewHref } from '@/lib/preview';
import { adminExperiencesRepository } from '@/lib/repositories/admin/experiences';

export default async function Page({params}:{params:Promise<{id:string}>}){
  const session=await requireAdmin(['owner','manager','editor']);
  const {id}=await params;
  const [item,media]=await Promise.all([adminExperiencesRepository.get(session,id),adminExperiencesRepository.media(session)]);
  if(!item)notFound();
  return <div className="space-y-8"><AdminPageHeader title={item.name} description="Edit product details, booking settings, media, availability mode and SEO." actions={<><Link href={previewHref('experience',item.id,`/experiences/${item.slug}`)} target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-lg text-center border border-slate-300 bg-white px-4 text-sm font-semibold">Preview</Link><Link href="/admin/experiences" className="inline-flex min-h-11 items-center justify-center rounded-lg text-center border border-slate-300 bg-white px-4 text-sm font-semibold">Back</Link></>}/><ExperienceForm item={item} media={media}/></div>
}
