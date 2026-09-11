'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { isCleanHomepageLocation } from '@/lib/navigation/home';

const pendingHomeScrollKey = 'borealis:home-scroll-top';

function scrollToHomepageTop(behavior: ScrollBehavior) {
  window.scrollTo({ top: 0, left: 0, behavior });
}

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export function HomeLink({ children, className, ariaLabel, ariaCurrent, onActivate }: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaCurrent?: 'page';
  onActivate?: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/' || sessionStorage.getItem(pendingHomeScrollKey) !== '1') return;
    sessionStorage.removeItem(pendingHomeScrollKey);
    scrollToHomepageTop('auto');
  }, [pathname]);

  return <Link
    href="/"
    scroll
    aria-label={ariaLabel}
    aria-current={ariaCurrent}
    className={className}
    onNavigate={(event) => {
      onActivate?.();
      const alreadyOnCleanHomepage = isCleanHomepageLocation(pathname, window.location.search, window.location.hash);
      if (alreadyOnCleanHomepage) {
        event.preventDefault();
        window.requestAnimationFrame(() => scrollToHomepageTop(preferredScrollBehavior()));
        return;
      }
      sessionStorage.setItem(pendingHomeScrollKey, '1');
    }}
  >{children}</Link>;
}
