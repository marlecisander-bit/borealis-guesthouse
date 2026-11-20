'use client';

import { AdminNavLink } from '@/components/admin/AdminNavLink';
import { usePathname } from 'next/navigation';
import { adminNavigationFor, isAdminNavItemActive } from '@/lib/admin/navigation';

import type { AdminRole } from '@/lib/admin/auth';
import { AdminNavIcon } from './AdminNavIcon';

export function AdminMobileNav({ role = 'owner' }: { role?: AdminRole | null }) {
  const pathname = usePathname();
  return <nav aria-label="Admin navigation" data-admin-bottom-nav className="admin-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-[#dedbd0] bg-white lg:hidden">
    <div className="admin-bottom-nav-tabs">
    {adminNavigationFor(role).map(item=>{
      const active=isAdminNavItemActive(pathname,item);
      return <AdminNavLink key={item.href} href={item.href} aria-current={active?'page':undefined} className="admin-tab">
        <AdminNavIcon href={item.href}/>
        {item.label}
      </AdminNavLink>;
    })}
    </div>
  </nav>;
}
