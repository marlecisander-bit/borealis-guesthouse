import Link from 'next/link';
import {notFound} from 'next/navigation';
import {AdminPageHeader} from '@/components/admin/ui';
import {TransferForm} from '@/components/admin/TransferForm';
import {requireAdmin} from '@/lib/admin/auth';
import {previewHref} from '@/lib/preview';
import {adminTransfersRepository} from '@/lib/repositories/admin/transfers';
export default async function Page({params}:{params:Promise<{id:string}>}){const session=await requireAdmin(['owner']),{id}=await params,[item,media]=await Promise.all([adminTransfersRepository.get(session,id),adminTransfersRepository.media(session)]);if(!item)notFound();return <div className="space-y-8"><AdminPageHeader title={`${item.origin} → ${item.destination}`} description="Edit route details, media, availability, booking configuration and SEO." actions={<><Link href={previewHref('transfer',item.id,'/transfers')} target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-lg text-center border border-slate-300 bg-white px-4 text-sm font-semibold">Preview</Link><Link href="/admin/transfers" className="inline-flex min-h-11 items-center justify-center rounded-lg text-center border border-slate-300 bg-white px-4 text-sm font-semibold">Back</Link></>}/><TransferForm item={item} media={media}/></div>}
