'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BorealisLogo } from '@/components/brand/BorealisLogo';
import { adminNavigation } from '@/lib/admin/navigation';

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = [...new Set(adminNavigation.map(item => item.group))];

  return <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[#c7dddb] bg-[#f8fbfa]">
    <div className="border-b border-[#d7e7e4] bg-gradient-to-br from-[#edf7f6] to-[#f8fbfa] px-6 py-4">
      <Link href="/admin/dashboard" onClick={onNavigate} aria-label="Borealis dashboard" className="inline-block"><BorealisLogo priority className="h-14 w-auto" /></Link>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#568087]">Property CMS</p>
    </div>
    <nav className="flex-1 overflow-y-auto p-4" aria-label="Admin navigation">
      {groups.map(group => <div key={group} className="mb-5">
        <p className="mb-2 px-3 text-[.65rem] font-bold uppercase tracking-[.16em] text-[#64878b]">{group}</p>
        <div className="space-y-1">
          {adminNavigation.filter(item => item.group === group).map(item => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active?'page':undefined} className={`block rounded-lg border-l-2 px-3 py-2.5 text-sm font-semibold transition ${active ? 'border-[#78a76f] bg-[#164b59] text-white shadow-sm' : 'border-transparent text-[#38575d] hover:border-[#8bb2ac] hover:bg-[#e5f2f1] hover:text-[#164b59]'}`}>{item.label}</Link>;
          })}
        </div>
      </div>)}
    </nav>
    <div className="border-t border-[#d7e7e4] p-4"><Link href="/" target="_blank" className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#527277] hover:bg-[#e5f2f1] hover:text-[#164b59]">View public website ↗</Link></div>
  </aside>;
}
