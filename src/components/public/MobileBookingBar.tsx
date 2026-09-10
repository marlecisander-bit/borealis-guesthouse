'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function MobileBookingBar() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > window.innerHeight * 0.72);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <div className={`fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-30 transition duration-300 md:hidden ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-8 opacity-0'}`}><Link href="/book" className="block min-h-14 rounded-full bg-sand px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.12em] text-lake shadow-xl shadow-lake/25">Check availability</Link></div>;
}
