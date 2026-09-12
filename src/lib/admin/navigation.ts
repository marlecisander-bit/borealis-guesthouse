export interface AdminNavItem {
  label: string;
  href: string;
  group: 'Overview' | 'Operations' | 'Business' | 'Website' | 'System';
  matches?: string[];
}

export const adminNavigation: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', group: 'Overview' },
  { label: 'Bookings', href: '/admin/bookings', group: 'Operations', matches: ['/admin/inquiries'] },
  { label: 'Calendar', href: '/admin/availability', group: 'Operations' },
  { label: 'Rooms & Rates', href: '/admin/rooms', group: 'Business', matches: ['/admin/rates', '/admin/amenities', '/admin/room-types', '/admin/rate-rules'] },
  { label: 'Experiences & Transfers', href: '/admin/experiences', group: 'Business', matches: ['/admin/transfers'] },
  { label: 'Website', href: '/admin/content', group: 'Website', matches: ['/admin/explore-koman', '/admin/seo'] },
  { label: 'Media', href: '/admin/media', group: 'Website' },
  { label: 'Settings', href: '/admin/settings', group: 'System', matches: ['/admin/languages', '/admin/notifications', '/admin/channels'] },
];

export function isAdminNavItemActive(pathname: string, item: AdminNavItem) {
  return [item.href, ...(item.matches || [])].some((href) => pathname === href || pathname.startsWith(`${href}/`));
}
