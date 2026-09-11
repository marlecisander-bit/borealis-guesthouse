'use client';

import { useEffect, useState } from 'react';
import { BookingLink } from './BookingLink';

export function MobileBookingBar() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > window.innerHeight * 0.72);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <div className={`safe-bottom-offset fixed inset-x-3 z-30 transition duration-300 md:hidden ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-8 opacity-0'}`}><BookingLink href="/book" className="public-primary-cta flex min-h-14 rounded-full px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.12em] shadow-xl shadow-lake/25">Check availability</BookingLink></div>;
}
