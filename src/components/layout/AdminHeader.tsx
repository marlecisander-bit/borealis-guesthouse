'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { adminNavigation } from '@/lib/admin/navigation';
import { NotificationBell } from '@/components/admin/NotificationBell';
import { AdminMobileNav } from '@/components/layout/AdminMobileNav';

export default function AdminHeader() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const active = [...adminNavigation]
    .sort((a, b) => b.href.length - a.href.length)
    .find(item => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const section = active?.label || 'Administration';
  const accountName = user?.email?.split('@')[0] || 'Administrator';

  useOutsideClick(menuRef, () => setShowMenu(false), showMenu);
  useEffect(() => {
    if (!showMenu) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowMenu(false);
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [showMenu]);

  async function handleLogout() {
    try {
      await signOut();
      router.replace('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#c7dddb] bg-[#f9fcfb]/95 px-3 py-2 backdrop-blur sm:px-6 sm:py-3">
      <div className="flex min-h-11 items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <AdminMobileNav />
          <div className="min-w-0">
            <p className="hidden text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#568087] sm:block">Borealis administration</p>
            <p className="truncate text-base font-bold text-[#164b59]">{section}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
        <NotificationBell />
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(current => !current)}
            aria-expanded={showMenu}
            aria-haspopup="menu"
            className="flex min-h-11 min-w-11 items-center justify-center gap-3 rounded-xl border border-[#d3e4e2] bg-[#eaf4f3] px-1.5 text-left transition hover:bg-[#deeeec] sm:justify-start sm:px-3"
          >
            <span className="grid size-8 place-items-center rounded-full bg-[#257d86] text-sm font-bold text-white">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-40 truncate text-sm font-semibold text-slate-900">{accountName}</span>
              <span className="block text-xs text-slate-500">Admin account</span>
            </span>
            <span aria-hidden="true" className={`hidden text-xs text-[#568087] transition sm:inline ${showMenu ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showMenu && (
            <div role="menu" className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 p-4">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.email || 'Signed-in administrator'}</p>
                <p className="mt-1 text-xs text-slate-500">Secure Borealis CMS session</p>
              </div>
              <div className="space-y-1 p-2">
                <Link role="menuitem" href="/admin/settings" onClick={() => setShowMenu(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#e8f4f5] hover:text-[#164b59]">Settings</Link>
                <Link role="menuitem" href="/" target="_blank" onClick={() => setShowMenu(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#e8f4f5] hover:text-[#164b59]">View public website ↗</Link>
              </div>
              <div className="border-t border-slate-100 p-2">
                <button role="menuitem" type="button" onClick={() => void handleLogout()} className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50">Sign out</button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}
