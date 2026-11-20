'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { AdminRole } from '@/lib/admin/auth';
import { canSeeAdminNav } from '@/lib/admin/navigation';
import { TranslationShortcut } from './TranslationShortcut';

type Tab = { label: string; href: string; roles?: AdminRole[] };
const owner: AdminRole[] = ['owner'];
const bookingRoles: AdminRole[] = ['owner', 'manager', 'staff'];

const groups: { label: string; paths: string[]; tabs: Tab[]; roles?: AdminRole[] }[] = [
  { label: 'Bookings', paths: ['/admin/bookings', '/admin/inquiries'], roles: bookingRoles, tabs: [
    { label: 'Reservations', href: '/admin/bookings' },
    { label: 'Change requests', href: '/admin/bookings/requests' },
    { label: 'Guest messages', href: '/admin/inquiries' },
  ] },
  { label: 'Rooms & pricing', paths: ['/admin/rooms', '/admin/rates', '/admin/amenities'], tabs: [
    { label: 'Rooms', href: '/admin/rooms' },
    { label: 'Pricing', href: '/admin/rates', roles: ['owner', 'manager'] },
    { label: 'Amenities', href: '/admin/amenities' },
  ] },
  { label: 'Guest services', paths: ['/admin/services', '/admin/experiences', '/admin/transfers'], tabs: [
    { label: 'Experiences', href: '/admin/experiences?type=experience' },
    { label: 'Rentals', href: '/admin/experiences?type=rental' },
    { label: 'Transfers', href: '/admin/transfers', roles: owner },
  ] },
];

const matches = (pathname: string, base: string) => pathname === base || pathname.startsWith(base + '/');

export function AdminWorkspaceNav({ role = 'owner' }: { role?: AdminRole | null }) {
  const pathname = usePathname();
  const search = useSearchParams();
  if (!role) return null;
  if (pathname.startsWith('/admin/bookings/') && pathname !== '/admin/bookings/requests') return null;

  if (['homepage', 'rooms', 'gallery', 'contact', 'experiences', 'transfers', 'explore-koman'].some(key => pathname === '/admin/content/' + key)) {
    return <TranslationShortcut/>;
  }
  const group = groups.find(item => canSeeAdminNav(role, item.roles) && item.paths.some(path => matches(pathname, path)));
  const websiteTool = ['/admin/media', '/admin/seo', '/admin/languages', '/admin/explore-koman'].some(path => matches(pathname, path));
  const back = pathname.startsWith('/admin/content/') || websiteTool
    ? ['/admin/content', 'Website'] : matches(pathname, '/admin/channels')
      ? ['/admin/availability', 'Calendar'] : null;
  if (!group && !back) return null;

  return <div className="mb-4 flex flex-wrap items-center gap-2">
    {group && <nav aria-label={group.label + ' sections'} className="flex flex-wrap gap-1 rounded-xl border border-stone-200 bg-white p-1">
      {group.tabs.filter(tab => canSeeAdminNav(role, tab.roles)).map(tab => {
        const [base, query] = tab.href.split('?');
        const type = new URLSearchParams(query).get('type');
        const active = base === '/admin/bookings'
          ? pathname === base
          : matches(pathname, base) && (!type || type === (search.get('type') || 'experience'));
        return <Link href={tab.href} prefetch={false} key={tab.href} aria-current={active ? 'page' : undefined}
          className="admin-tab inline-flex min-h-11 items-center rounded-lg px-2.5 text-sm font-semibold">{tab.label}</Link>;
      })}
    </nav>}
    {back && <Link href={back[0]} className="inline-flex min-h-11 items-center text-sm font-bold text-brand">← Back to {back[1]}</Link>}
    {role !== 'staff' && <TranslationShortcut/>}
  </div>;
}
