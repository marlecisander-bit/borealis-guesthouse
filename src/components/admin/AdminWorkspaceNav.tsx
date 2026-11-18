'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { TranslationShortcut } from './TranslationShortcut';

type Tab={label:string;href:string;matches?:string[];type?:string};
const groups:{label:string;paths:string[];tabs:Tab[]}[]=[
  {label:'Bookings',paths:['/admin/bookings','/admin/inquiries'],tabs:[{label:'Reservations',href:'/admin/bookings'},{label:'Guest enquiries',href:'/admin/inquiries'}]},
  {label:'Rooms & Rates',paths:['/admin/rooms','/admin/rates','/admin/amenities','/admin/room-types','/admin/rate-rules'],tabs:[{label:'Rooms',href:'/admin/rooms',matches:['/admin/room-types']},{label:'Rates',href:'/admin/rates',matches:['/admin/rate-rules']},{label:'Amenities',href:'/admin/amenities'}]},
  {label:'Experiences & Transfers',paths:['/admin/services','/admin/experiences','/admin/transfers'],tabs:[{label:'Overview',href:'/admin/services'},{label:'Experiences',href:'/admin/experiences?type=experience',type:'experience'},{label:'Rentals',href:'/admin/experiences?type=rental',type:'rental'},{label:'Transfers',href:'/admin/transfers'}]},
];
const matches=(pathname:string,base:string)=>pathname===base||pathname.startsWith(base+'/');

export function AdminWorkspaceNav() {
  const pathname=usePathname(), search=useSearchParams();
  const group=groups.find(item=>item.paths.some(path=>matches(pathname,path)));
  if(pathname.startsWith('/admin/bookings/')) return null;
  const back=pathname.startsWith('/admin/content/')||['/admin/media','/admin/seo'].includes(pathname)||matches(pathname,'/admin/explore-koman')
    ? ['/admin/content','Website'] : ['/admin/languages','/admin/channels','/admin/notifications'].some(path=>matches(pathname,path))
      ? ['/admin/settings','Settings'] : null;
  if(!group&&!back)return null;

  return <div className="mb-4 flex flex-wrap items-center gap-2">
    {group&&<nav aria-label={group.label+' sections'} className="flex flex-wrap gap-1 rounded-xl border border-stone-200 bg-white p-1">
      {group.tabs.map(tab=>{
        const base=tab.href.split('?')[0],type=search.get('type');
        const active=(matches(pathname,base)&&(!tab.type||tab.type===(type||'experience')))||(tab.matches||[]).some(path=>matches(pathname,path));
        return <Link href={tab.href} prefetch={false} key={tab.href} aria-current={active?'page':undefined} className="admin-tab inline-flex min-h-11 items-center rounded-lg px-2.5 text-sm font-semibold">{tab.label}</Link>;
      })}
    </nav>}
    {back&&<Link href={back[0]} className="inline-flex min-h-11 items-center text-sm font-bold text-brand">← {back[1]}</Link>}
    <TranslationShortcut/>
  </div>;
}
