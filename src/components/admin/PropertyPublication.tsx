import { setPropertyPublication } from '@/app/admin/settings/publication-actions';

export function PropertyPublication({ published }: { published: boolean }) {
  return <section className={`rounded-2xl border p-5 ${published?'border-emerald-200 bg-emerald-50':'border-amber-200 bg-amber-50'}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-950">Public website status</h2><p className="mt-1 text-sm text-slate-600">{published?'The property is published and public inventory can be searched.':'The property is in draft. Public catalog and booking queries cannot use it.'}</p></div><form action={setPropertyPublication}><input type="hidden" name="published" value={published?'false':'true'}/><button className={`min-h-11 rounded-lg px-5 text-sm font-bold text-white ${published?'bg-slate-700':'bg-emerald-700'}`}>{published?'Move property to draft':'Publish property'}</button></form></div></section>;
}
