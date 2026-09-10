export interface AdminNavItem { label: string; href: string; group: string }
export const adminNavigation: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', group: 'Overview' },
  { label: 'Rooms', href: '/admin/rooms', group: 'Stay' }, { label: 'Room types', href: '/admin/room-types', group: 'Stay' }, { label: 'Amenities', href: '/admin/amenities', group: 'Stay' },
  { label: 'Rates', href: '/admin/rates', group: 'Operations' }, { label: 'Rate rules', href: '/admin/rate-rules', group: 'Operations' }, { label: 'Availability', href: '/admin/availability', group: 'Operations' }, { label: 'Bookings', href: '/admin/bookings', group: 'Operations' },
  { label: 'Experiences', href: '/admin/experiences', group: 'Services' }, { label: 'Transfers', href: '/admin/transfers', group: 'Services' },
  { label: 'Website content', href: '/admin/content', group: 'Website' }, { label: 'Explore Koman', href: '/admin/explore-koman', group: 'Website' }, { label: 'Media', href: '/admin/media', group: 'Website' }, { label: 'SEO', href: '/admin/seo', group: 'Website' },
  { label: 'Languages', href: '/admin/languages', group: 'System' }, { label: 'Settings', href: '/admin/settings', group: 'System' },
];
