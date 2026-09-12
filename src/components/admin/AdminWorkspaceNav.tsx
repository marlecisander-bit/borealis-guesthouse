'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Workspace = { label: string; paths: string[]; tabs: Array<{ label: string; href: string; matches?: string[] }> };

const workspaces: Workspace[] = [
  { label: 'Bookings', paths: ['/admin/bookings', '/admin/inquiries'], tabs: [
    { label: 'Bookings', href: '/admin/bookings' }, { label: 'Guest enquiries', href: '/admin/inquiries' },
  ] },
  { label: 'Rooms & Rates', paths: ['/admin/rooms', '/admin/rates', '/admin/amenities', '/admin/room-types', '/admin/rate-rules'], tabs: [
    { label: 'Rooms', href: '/admin/rooms', matches: ['/admin/room-types'] },
    { label: 'Rates', href: '/admin/rates', matches: ['/admin/rate-rules'] },
    { label: 'Amenities', href: '/admin/amenities' },
  ] },
  { label: 'Experiences & Transfers', paths: ['/admin/experiences', '/admin/transfers'], tabs: [
    { label: 'Experiences', href: '/admin/experiences' }, { label: 'Transfers', href: '/admin/transfers' },
  ] },
  { label: 'Website', paths: ['/admin/content', '/admin/explore-koman', '/admin/seo'], tabs: [
    { label: 'All pages', href: '/admin/content' }, { label: 'Homepage', href: '/admin/content/homepage' },
    { label: 'Rooms page', href: '/admin/content/rooms' }, { label: 'Experiences page', href: '/admin/content/experiences' },
    { label: 'Transfers page', href: '/admin/content/transfers' }, { label: 'About', href: '/admin/content/about' },
    { label: 'Contact', href: '/admin/content/contact' }, { label: 'Explore Koman', href: '/admin/explore-koman' },
    { label: 'SEO', href: '/admin/seo' },
  ] },
  { label: 'Settings', paths: ['/admin/settings', '/admin/languages', '/admin/notifications', '/admin/channels'], tabs: [
    { label: 'Property & policies', href: '/admin/settings' }, { label: 'Languages', href: '/admin/languages' },
    { label: 'Notifications', href: '/admin/notifications' }, { label: 'Integrations', href: '/admin/channels' },
  ] },
];

const matchesPath = (pathname: string, paths: string[]) => paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export function AdminWorkspaceNav() {
  const pathname = usePathname();
  const workspace = workspaces.find((item) => matchesPath(pathname, item.paths));
  if (!workspace) return null;
  return <nav aria-label={`${workspace.label} sections`} className="mb-6 overflow-x-auto rounded-xl border border-[#d5e5e2] bg-white p-1.5 shadow-sm"><div className="flex min-w-max gap-1">{workspace.tabs.map((tab) => {const active=matchesPath(pathname,[tab.href,...(tab.matches||[])]);return <Link key={tab.href} href={tab.href} aria-current={active?'page':undefined} className={`inline-flex min-h-10 items-center rounded-lg px-3.5 text-sm font-semibold transition ${active?'bg-[#164b59] text-white':'text-[#45656a] hover:bg-[#e8f4f3] hover:text-[#164b59]'}`}>{tab.label}</Link>})}</div></nav>;
}
