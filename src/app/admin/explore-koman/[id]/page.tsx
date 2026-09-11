import Link from 'next/link';
import {notFound} from 'next/navigation';
import {AdminPageHeader} from '@/components/admin/ui';
import {ArticleForm} from '@/components/admin/ArticleForm';
import {requireAdmin} from '@/lib/admin/auth';
import {previewHref} from '@/lib/preview';
import {adminExploreRepository} from '@/lib/repositories/admin/explore';
export default async function Page({params}:{params:Promise<{id:string}>}){const session=await requireAdmin(['owner']),{id}=await params,[item,data]=await Promise.all([adminExploreRepository.get(session,id),adminExploreRepository.editor(session,id)]);if(!item)notFound();return <div className="space-y-8"><AdminPageHeader title={item.title} description="Edit structured content, relationships, media, SEO and publication settings." actions={<><Link href={previewHref('article',item.id,`/explore-koman/${item.slug}`)} target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-lg text-center border border-slate-300 bg-white px-4 text-sm font-semibold">Preview</Link><Link href="/admin/explore-koman" className="inline-flex min-h-11 items-center justify-center rounded-lg text-center border border-slate-300 bg-white px-4 text-sm font-semibold">Back</Link></>}/><ArticleForm item={item} data={data}/></div>}
