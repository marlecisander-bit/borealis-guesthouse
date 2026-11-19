'use client';

import Link from 'next/link';
import { AdminNavIcon } from './AdminNavIcon';
import { usePathname } from 'next/navigation';
import { BorealisLogo } from '@/components/brand/BorealisLogo';
import { adminNavigation, adminWorkspaces, isAdminNavItemActive, type AdminNavItem } from '@/lib/admin/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const workspaceActive=adminWorkspaces.some(item=>isAdminNavItemActive(pathname,item));
  function row(item:AdminNavItem, nested=false) {
    const active=isAdminNavItemActive(pathname,item);
    return <Link prefetch={false} key={item.href} href={item.href}
      aria-current={active&&!(item.href==='/admin/more'&&workspaceActive)?'page':undefined}
      data-active={active}
      className={`admin-tab flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${nested?'ml-2':''}`}>
      <AdminNavIcon href={item.href} className="size-[1.125rem] shrink-0"/>
      <span>{item.label}</span>
    </Link>;
  }

  return <aside className="flex h-full w-60 flex-col border-r border-[#dedbd0] bg-white">
    <Link prefetch={false} href="/admin/dashboard" aria-label="Borealis dashboard" className="admin-header-line flex items-center px-5"><BorealisLogo priority className="h-12 w-auto"/></Link>
    <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-4" aria-label="Admin navigation">
      {adminNavigation.map(item=>row(item))}
      <div aria-label="More workspaces" className="grid gap-1 border-l border-[#dedbd0]">{adminWorkspaces.map(item=>row(item,true))}</div>
    </nav>
    <Link href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border-t border-[#dedbd0] p-5 text-sm font-semibold text-brand"><AdminNavIcon href="/" className="size-[1.125rem] shrink-0"/>View website</Link>
  </aside>;
}
