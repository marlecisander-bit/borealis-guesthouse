import Link from 'next/link';
export function PreviewBanner({label='Draft preview'}:{label?:string}){return <div className="flex items-center justify-center gap-4 bg-amber-100 px-4 py-2 text-center text-sm font-bold text-amber-950"><span>{label} · this version is not public</span><Link href="/admin/preview/exit" className="underline">Exit preview</Link></div>}
