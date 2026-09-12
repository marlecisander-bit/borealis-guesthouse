'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AdminSidebar from './AdminSidebar';

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current !== pathname) setOpen(false);
    previousPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const triggerElement = trigger.current;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab' || !panel.current) return;
      const controls = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      triggerElement?.focus();
    };
  }, [open]);

  return <>
    <button ref={trigger} type="button" onClick={() => setOpen(true)} className="grid size-11 shrink-0 place-items-center rounded-lg border border-[#9ebfbc] bg-[#e8f4f5] text-[#164b59] lg:hidden" aria-expanded={open} aria-controls="admin-mobile-menu" aria-label="Open admin navigation">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
    {open && <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
      <button type="button" className="absolute inset-0 size-full bg-[#123b46]/55" onClick={() => setOpen(false)} aria-label="Close navigation"/>
      <div ref={panel} id="admin-mobile-menu" className="admin-mobile-drawer relative h-[100dvh] w-[min(20rem,88vw)] overflow-hidden shadow-2xl">
        <AdminSidebar onNavigate={() => setOpen(false)}/>
        <button ref={closeButton} type="button" onClick={() => setOpen(false)} className="absolute right-3 grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-[#164b59]" style={{ top: 'max(.75rem, env(safe-area-inset-top))' }} aria-label="Close navigation">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
    </div>}
  </>;
}
