'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminNavigation, isAdminNavItemActive } from '@/lib/admin/navigation';

import { AdminNavIcon } from './AdminNavIcon';

export function AdminMobileNav() {
  const pathname = usePathname();
  return <nav aria-label="Admin navigation" data-admin-bottom-nav className="admin-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-[#dedbd0] bg-white lg:hidden">
    <div className="admin-bottom-nav-tabs">
    {adminNavigation.map(item=>{
      const active=isAdminNavItemActive(pathname,item);
      return <Link key={item.href} href={item.href} prefetch={false} aria-current={active?'page':undefined} className="admin-tab">
        <AdminNavIcon href={item.href}/>
        {item.label}
      </Link>;
    })}
    </div>
  </nav>;
}
