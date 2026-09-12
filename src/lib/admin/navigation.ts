export interface AdminNavItem { label: string; href: string; group: string }
export const adminNavigation: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', group: 'Overview' },
  { label: 'Bookings', href: '/admin/bookings', group: 'Operations' }, { label: 'Availability', href: '/admin/availability', group: 'Operations' }, { label: 'Rates & rules', href: '/admin/rates', group: 'Operations' }, { label: 'Channel calendars', href: '/admin/channels', group: 'Operations' }, { label: 'Contact enquiries', href: '/admin/inquiries', group: 'Operations' },
  { label: 'Rooms', href: '/admin/rooms', group: 'Accommodation' }, { label: 'Amenities', href: '/admin/amenities', group: 'Accommodation' },
  { label: 'Experiences', href: '/admin/experiences', group: 'Activities' }, { label: 'Transfers', href: '/admin/transfers', group: 'Activities' },
  { label: 'Website content', href: '/admin/content', group: 'Website' }, { label: 'Explore Koman', href: '/admin/explore-koman', group: 'Website' }, { label: 'Media', href: '/admin/media', group: 'Website' }, { label: 'SEO', href: '/admin/seo', group: 'Website' }, { label: 'Languages', href: '/admin/languages', group: 'Website' },
  { label: 'Notifications', href: '/admin/notifications', group: 'System' }, { label: 'Settings', href: '/admin/settings', group: 'System' },
];
