'use client';

import Link, { useLinkStatus } from 'next/link';
import { useRouter } from 'next/navigation';
import { type MouseEvent, type ReactNode, useEffect } from 'react';

let bookingRoutePrefetched = false;

export function useBookingRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    if (bookingRoutePrefetched) return;
    bookingRoutePrefetched = true;
    const timer = window.setTimeout(() => router.prefetch('/book'), 2500);
    return () => { window.clearTimeout(timer); bookingRoutePrefetched = false; };
  }, [router]);
}

export function BookingLink({
  href = '/book',
  className = '',
  children,
  pendingLabel = 'Opening booking…',
  onClick,
}: {
  href?: string;
  className?: string;
  children: ReactNode;
  pendingLabel?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return <Link
    href={href}
    prefetch={false}
    onClick={onClick}
    data-booking-link
    className={`booking-link ${className}`}
  >
    <BookingLinkContent pendingLabel={pendingLabel}>{children}</BookingLinkContent>
  </Link>;
}

function BookingLinkContent({children,pendingLabel}:{children:ReactNode;pendingLabel:string}) {
  const { pending } = useLinkStatus();
  return <span className="booking-link-content" aria-live="polite" aria-busy={pending||undefined} data-pending={pending||undefined}>
    {pending&&<span className="booking-link-spinner" aria-hidden="true"/>}
    <span>{pending?pendingLabel:children}</span>
  </span>;
}
