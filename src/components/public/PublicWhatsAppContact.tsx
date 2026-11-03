'use client';

import {usePathname} from 'next/navigation';
import {WhatsAppContact} from './WhatsAppContact';

/** Root-layout sibling of page content: persists across public route navigation. */
export function PublicWhatsAppContact({value}:{value?:string}) {
  const pathname=usePathname();
  if(pathname?.match(/^\/admin(?:\/|$)/))return null;
  return <WhatsAppContact value={value}/>;
}
