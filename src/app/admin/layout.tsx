'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import { AdminMobileNav } from '@/components/layout/AdminMobileNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === '/admin/login') {
    return children;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:block"><AdminSidebar /></div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden"><AdminMobileNav/><span className="font-bold text-slate-950">Borealis CMS</span></div>
        <AdminHeader />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
