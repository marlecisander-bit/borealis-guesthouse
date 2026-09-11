'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BorealisLogo } from '@/components/brand/BorealisLogo';
import { HomeLink } from './HomeLink';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { LanguageRecord } from '@/types/languages';
import { isHomeNavigationItem } from '@/lib/navigation/home';

const fallbackLinks = [['Home', '/'], ['Rooms', '/rooms'], ['Experiences', '/experiences'], ['Explore Koman', '/explore-koman'], ['Transfers', '/transfers'], ['Gallery', '/gallery'], ['About', '/about'], ['Contact', '/contact']];
const mobileFocusable = 'a[href],button:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Header({ overlay = false, navigation, languages = [], selectedLanguage = '' }: { overlay?: boolean; navigation?: { label: string; href: string }[]; languages?: LanguageRecord[]; selectedLanguage?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const links = (navigation?.length ? navigation.map(x => [x.label, x.href]) : fallbackLinks)
    .map(([label, href]) => [label, isHomeNavigationItem(label, href) ? '/' : href]);
  const transparent = overlay && !scrolled;
  const desktopTone = transparent ? 'text-white' : 'text-lake';

  useEffect(() => {
    if (!overlay) return;
    let frame = 0;
    let current = false;
    const update = () => {
      frame = 0;
      const next = current ? window.scrollY > 8 : window.scrollY > 32;
      if (next !== current) {
        current = next;
        setScrolled(next);
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [overlay]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    desktop.addEventListener('change', closeAtDesktop);
    return () => desktop.removeEventListener('change', closeAtDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;
    const trigger = menuButton.current;
    const scrollY = window.scrollY;
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
    };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(menu.current?.querySelectorAll<HTMLElement>(mobileFocusable) || []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      document.body.style.paddingRight = previous.paddingRight;
      window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  const closeMenu = () => setOpen(false);
  const active = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  const scrolledOverlay = overlay && scrolled;

  return <header
    data-public-header
    data-state={open ? 'menu-open' : transparent ? 'hero' : 'scrolled'}
    className={`public-header ${overlay ? 'fixed' : 'sticky'} inset-x-0 top-0 z-40 transition-[background-color,box-shadow] duration-300 ${transparent ? 'bg-transparent' : scrolledOverlay ? 'bg-lake/98 shadow-[0_8px_28px_rgba(9,25,15,.16)] lg:bg-ivory/95 lg:backdrop-blur-md' : 'bg-ivory/95 shadow-sm lg:backdrop-blur-md'}`}
  >
    <div className={`public-header-bar shell flex items-center justify-between border-b transition-[height,border-color] duration-300 ${transparent ? 'border-white/20' : scrolledOverlay ? 'border-white/10 lg:border-lake/10' : 'border-lake/10'}`}>
      <HomeLink ariaLabel="Borealis Guest House — Home" className="flex h-full shrink-0 items-center">
        {scrolledOverlay ? <>
          <BorealisLogo priority variant="light" className="block h-14 w-auto -translate-y-0.5 lg:hidden" />
          <BorealisLogo priority variant="dark" className="hidden h-14 w-auto lg:block" />
        </> : <BorealisLogo priority variant={transparent ? 'light' : 'dark'} className="block h-14 w-auto -translate-y-0.5 sm:translate-y-0" />}
      </HomeLink>
      <nav className={`hidden items-center gap-3 text-[.58rem] font-semibold uppercase tracking-[.1em] lg:flex xl:gap-5 xl:text-[.64rem] xl:tracking-[.13em] ${desktopTone}`} aria-label="Main navigation">
        {links.map(([label, href]) => href === '/' ? <HomeLink key={`${label}-${href}`} ariaCurrent={active(href) ? 'page' : undefined} className="transition-opacity hover:opacity-60">{label}</HomeLink> : <Link key={`${label}-${href}`} href={href} aria-current={active(href) ? 'page' : undefined} className="transition-opacity hover:opacity-60">{label}</Link>)}
      </nav>
      <div className="flex items-center gap-2">
        <span className={scrolledOverlay ? '[&_select]:border-white/40 [&_select]:text-white lg:[&_select]:border-lake/20 lg:[&_select]:text-lake' : ''}>
          <LanguageSwitcher languages={languages} selectedCode={selectedLanguage} tone={transparent ? 'light' : 'dark'} />
        </span>
        <Link href="/book" className={`min-h-11 rounded-full px-3 py-2.5 text-[.62rem] font-bold uppercase tracking-[.13em] min-[360px]:px-4 min-[360px]:text-[.65rem] sm:px-5 ${transparent ? 'bg-white text-lake' : scrolledOverlay ? 'bg-white text-lake lg:bg-lake lg:text-white' : 'bg-lake text-white'}`}>Book now</Link>
        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen(value => !value)}
          className={`public-menu-toggle relative size-11 shrink-0 rounded-full border lg:hidden ${transparent || scrolledOverlay ? 'border-white/45 text-white' : 'border-lake/20 text-lake'}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-controls="mobile-menu"
          aria-expanded={open}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span aria-hidden="true" className="absolute left-1/2 top-1/2 block h-px w-4 -translate-x-1/2 -translate-y-[5px] bg-current transition-transform duration-300 data-[open=true]:translate-y-0 data-[open=true]:rotate-45" data-open={open} />
          <span aria-hidden="true" className="absolute left-1/2 top-1/2 block h-px w-4 -translate-x-1/2 bg-current transition-opacity duration-200 data-[open=true]:opacity-0" data-open={open} />
          <span aria-hidden="true" className="absolute left-1/2 top-1/2 block h-px w-4 -translate-x-1/2 translate-y-[5px] bg-current transition-transform duration-300 data-[open=true]:translate-y-0 data-[open=true]:-rotate-45" data-open={open} />
        </button>
      </div>
    </div>

    <div
      ref={menu}
      id="mobile-menu"
      inert={!open}
      aria-hidden={!open}
      className={`public-mobile-menu fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-contain bg-lake px-5 text-white transition-[opacity,transform,visibility] duration-300 ease-out lg:hidden ${open ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-3 opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-white/15">
        <HomeLink onActivate={closeMenu} ariaCurrent={pathname === '/' ? 'page' : undefined} ariaLabel="Borealis Guest House — Home" className="flex h-full items-center"><BorealisLogo variant="light" className="block h-14 w-auto" /></HomeLink>
        <button ref={closeButton} type="button" onClick={closeMenu} className="grid size-11 place-items-center rounded-full border border-white/30" aria-label="Close menu">
          <span aria-hidden="true" className="relative block size-4 before:absolute before:left-1/2 before:top-1/2 before:h-px before:w-5 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-45 before:bg-current after:absolute after:left-1/2 after:top-1/2 after:h-px after:w-5 after:-translate-x-1/2 after:-translate-y-1/2 after:-rotate-45 after:bg-current" />
        </button>
      </div>
      <nav className="my-5 flex flex-col sm:my-8" aria-label="Mobile navigation">
        {links.map(([label, href], index) => {
          const current = active(href);
          const className = `group flex min-h-12 items-center justify-between border-b border-white/15 py-2.5 font-serif text-[1.55rem] leading-tight transition-[color,opacity] hover:text-sand sm:min-h-14 sm:py-3 sm:text-[1.65rem] ${current ? 'text-sand' : 'text-white'}`;
          const marker = <span aria-hidden="true" className={`text-xs font-sans tracking-widest transition-opacity ${current ? 'opacity-70' : 'opacity-0 group-hover:opacity-50'}`}>{String(index + 1).padStart(2, '0')}</span>;
          return href === '/' ? <HomeLink onActivate={closeMenu} key={`${label}-${href}`} ariaCurrent={current ? 'page' : undefined} className={className}><span>{label}</span>{marker}</HomeLink> : <Link onClick={closeMenu} key={`${label}-${href}`} href={href} aria-current={current ? 'page' : undefined} className={className}><span>{label}</span>{marker}</Link>;
        })}
      </nav>
      <Link onClick={closeMenu} href="/book" className="mt-auto min-h-14 shrink-0 rounded-full bg-sand px-6 py-4 text-center text-sm font-bold uppercase tracking-[.12em] text-lake">Check availability</Link>
    </div>
  </header>;
}
