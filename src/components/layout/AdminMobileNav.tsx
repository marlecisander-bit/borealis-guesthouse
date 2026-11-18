'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminNavigation, isAdminNavItemActive } from '@/lib/admin/navigation';

const icons = [
  'M3 10l9-7 9 7v10H3zM9 20v-6h6v6',
  'M4 5h16v15H4zM8 9h8M8 13h8M8 17h5',
  'M4 6h16v14H4zM8 3v6m8-6v6M4 11h16',
  'M4 12h.01M12 12h.01M20 12h.01',
];

export function AdminMobileNav() {
  const pathname = usePathname();
  return <nav aria-label="Admin navigation" data-admin-bottom-nav className="admin-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-[#dedbd0] bg-white lg:hidden">
    <div className="admin-bottom-nav-tabs">
    {adminNavigation.map((item,index)=>{
      const active=isAdminNavItemActive(pathname,item);
      return <Link key={item.href} href={item.href} prefetch={false} aria-current={active?'page':undefined} className="admin-tab">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={index===3?3:1.7} strokeLinecap="round" strokeLinejoin="round"><path d={icons[index]}/></svg>
        {item.label}
      </Link>;
    })}
    </div>
  </nav>;
}
