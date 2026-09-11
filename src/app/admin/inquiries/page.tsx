import { requireAdmin } from '@/lib/admin/auth';
import { adminInquiriesRepository } from '@/lib/repositories/admin/inquiries';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin/ui';
import { setInquiryStatus } from './actions';

export default async function InquiriesPage() {
  const session = await requireAdmin(['owner','manager','staff']);
  let inquiries;
  try {
    inquiries = await adminInquiriesRepository.list(session);
  } catch {
    return <div className="space-y-6"><AdminPageHeader title="Contact enquiries" description="Messages submitted through the public contact form."/><AdminEmptyState title="Contact database update required" description="Apply migration 20260904_022_frontend_readiness.sql, then reload this page."/></div>;
  }
  return <div className="space-y-6"><AdminPageHeader title="Contact enquiries" description="Messages submitted through the public contact form."/>{inquiries.length?<div className="grid gap-4">{inquiries.map(item=><article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-950">{item.subject}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.status==='new'?'bg-amber-100 text-amber-800':'bg-slate-100 text-slate-600'}`}>{item.status}</span></div><p className="mt-2 text-sm text-slate-600">{item.name} · <a className="underline" href={`mailto:${item.email}`}>{item.email}</a>{item.phone&&<> · <a className="underline" href={`tel:${item.phone}`}>{item.phone}</a></>}</p><p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p></div><form action={setInquiryStatus.bind(null,item.id)} className="flex gap-2"><select name="status" defaultValue={item.status} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm"><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archive</option></select><button className="rounded-lg bg-slate-950 px-3 text-sm font-bold text-white">Save</button></form></div><p className="mt-5 whitespace-pre-wrap border-t border-slate-100 pt-5 text-sm leading-6 text-slate-700">{item.message}</p></article>)}</div>:<AdminEmptyState title="No contact enquiries" description="New public contact messages will appear here."/>}</div>;
}

