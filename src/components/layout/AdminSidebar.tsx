'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BorealisLogo } from '@/components/brand/BorealisLogo';
import { adminNavigation, isAdminNavItemActive } from '@/lib/admin/navigation';

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const settingsActive=adminNavigation.some(item=>item.group==='System'&&isAdminNavItemActive(pathname,item));


  return <aside className="flex h-full w-64 max-w-full shrink-0 flex-col border-r border-[#c7dddb] bg-[#f8fbfa]">
    <div className="border-b border-[#d7e7e4] bg-gradient-to-br from-[#edf7f6] to-[#f8fbfa] px-6 py-4">
      <Link prefetch={false} href="/admin/dashboard" onClick={onNavigate} aria-label="Borealis dashboard" className="inline-block"><BorealisLogo priority className="h-14 w-auto" /></Link>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#568087]">Owner workspace</p>
    </div>
    <nav className="flex-1 overflow-y-auto p-4" aria-label="Admin navigation">
      <div className="space-y-1">{adminNavigation.filter(item=>item.group!=='System').map(item=>{const active=isAdminNavItemActive(pathname,item);return <Link prefetch={false} key={item.href} href={item.href} onClick={onNavigate} aria-current={active?'page':undefined} className={`flex min-h-12 w-full items-center rounded-lg px-3 text-sm font-semibold ${active?'bg-[#164b59] text-white':'text-[#38575d] hover:bg-[#e5f2f1]'}`}>{item.label}</Link>})}</div>
    </nav>
    <div className="space-y-1 border-t border-[#d7e7e4] p-4"><Link prefetch={false} href="/admin/settings" onClick={onNavigate} aria-current={settingsActive?'page':undefined} className={`flex min-h-11 w-full items-center rounded-lg px-3 text-sm font-semibold ${settingsActive?'bg-[#164b59] text-white':'text-[#38575d] hover:bg-[#e5f2f1]'}`}>Settings</Link><Link prefetch={false} href="/" target="_blank" className="flex min-h-11 w-full items-center rounded-lg px-3 text-sm font-semibold text-[#527277] hover:bg-[#e5f2f1]">View website ↗</Link></div>
  </aside>;
}
