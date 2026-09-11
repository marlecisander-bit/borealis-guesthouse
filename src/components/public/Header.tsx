'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BorealisLogo } from '@/components/brand/BorealisLogo';
import { HomeLink } from './HomeLink';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { LanguageRecord } from '@/types/languages';
import { isHomeNavigationItem } from '@/lib/navigation/home';

const fallbackLinks = [['Home', '/'], ['Rooms', '/rooms'], ['Experiences', '/experiences'], ['Explore Koman', '/explore-koman'], ['Transfers', '/transfers'], ['Gallery', '/gallery'], ['About', '/about'], ['Contact', '/contact']];

export function Header({ overlay = false, navigation, languages = [], selectedLanguage = '' }: { overlay?: boolean; navigation?: { label: string; href: string }[]; languages?: LanguageRecord[]; selectedLanguage?: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const links = (navigation?.length ? navigation.map(x => [x.label, x.href]) : fallbackLinks)
    .map(([label, href]) => [label, isHomeNavigationItem(label, href) ? '/' : href]);
  const transparent = overlay && !scrolled;
  const tone = transparent ? 'text-white' : 'text-lake';

  useEffect(() => {
    if (!overlay) return;
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [overlay]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return <header className={`${overlay ? 'fixed' : 'relative'} inset-x-0 top-0 z-40 transition-all duration-300 ${transparent ? 'bg-transparent' : 'bg-ivory/95 shadow-sm backdrop-blur-md'}`}>
    <div className={`shell flex h-[4.5rem] items-center justify-between border-b transition-colors ${transparent ? 'border-white/20' : 'border-lake/10'}`}>
      <HomeLink ariaLabel="Borealis Guest House — Home" className="shrink-0"><BorealisLogo priority variant={transparent ? 'light' : 'dark'} className="h-14 w-auto" /></HomeLink>
      <nav className={`hidden items-center gap-3 text-[.58rem] font-semibold uppercase tracking-[.1em] lg:flex xl:gap-5 xl:text-[.64rem] xl:tracking-[.13em] ${tone}`} aria-label="Main navigation">
        {links.map(([label, href]) => href === '/' ? <HomeLink key={`${label}-${href}`} className="transition-opacity hover:opacity-60">{label}</HomeLink> : <Link key={`${label}-${href}`} href={href} className="transition-opacity hover:opacity-60">{label}</Link>)}
      </nav>
      <div className="flex items-center gap-2">
        <LanguageSwitcher languages={languages} selectedCode={selectedLanguage} tone={transparent ? 'light' : 'dark'} />
        <Link href="/book" className={`min-h-10 rounded-full px-4 py-2.5 text-[.65rem] font-bold uppercase tracking-[.13em] sm:px-5 ${transparent ? 'bg-white text-lake' : 'bg-lake text-white'}`}>Book now</Link>
        <span className="lg:hidden">
          <button onClick={() => setOpen(true)} className={`grid size-10 place-items-center rounded-full border ${transparent ? 'border-white/45' : 'border-lake/20'} ${tone}`} aria-label="Open menu" aria-controls="mobile-menu" aria-expanded={open}>☰</button>
        </span>
      </div>
    </div>
    {open && <div id="mobile-menu" className="safe-bottom-panel fixed inset-0 z-50 flex flex-col overflow-y-auto bg-lake px-5 pt-5 text-white" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div className="flex items-center justify-between">
        <HomeLink onActivate={() => setOpen(false)} ariaLabel="Borealis Guest House — Home"><BorealisLogo variant="light" className="h-16 w-auto" /></HomeLink>
        <button ref={closeButton} onClick={() => setOpen(false)} className="size-12 rounded-full border border-white/30 text-xl" aria-label="Close menu">×</button>
      </div>
      <nav className="my-8 flex flex-col" aria-label="Mobile navigation">
        {links.map(([label, href]) => href === '/' ? <HomeLink onActivate={() => setOpen(false)} key={`${label}-${href}`} className="border-b border-white/15 py-3 font-serif text-[1.65rem] leading-tight">{label}</HomeLink> : <Link onClick={() => setOpen(false)} key={`${label}-${href}`} href={href} className="border-b border-white/15 py-3 font-serif text-[1.65rem] leading-tight">{label}</Link>)}
      </nav>
      <Link onClick={() => setOpen(false)} href="/book" className="mt-auto min-h-14 shrink-0 rounded-full bg-sand px-6 py-4 text-center text-sm font-bold uppercase tracking-[.12em] text-lake">Check availability</Link>
    </div>}
  </header>;
}
