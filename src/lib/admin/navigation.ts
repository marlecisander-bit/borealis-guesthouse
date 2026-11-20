import type { AdminRole } from './auth';

export interface AdminNavItem {
  label: string;
  href: string;
  matches?: string[];
  roles?: AdminRole[];
  description?: string;
}

const editingRoles: AdminRole[] = ['owner', 'manager', 'editor'];

export const adminWorkspaces: AdminNavItem[] = [
  { label: 'Rooms & pricing', href: '/admin/rooms', description: 'Rooms, amenities and nightly prices', matches: ['/admin/rates', '/admin/amenities', '/admin/room-types', '/admin/rate-rules'] },
  { label: 'Guest services', href: '/admin/services', description: 'Experiences, equipment rentals and transfers', matches: ['/admin/experiences', '/admin/transfers'] },
  { label: 'Website', href: '/admin/content', description: 'Pages, articles, photos and translations', roles: editingRoles, matches: ['/admin/explore-koman', '/admin/seo', '/admin/media', '/admin/pages', '/admin/languages'] },
  { label: 'Settings', href: '/admin/settings', description: 'Property details, policies and team access', roles: ['owner', 'manager'] },
];

export function canSeeAdminNav(role: AdminRole | null, roles?: AdminRole[]) {
  return !roles || (role !== null && roles.includes(role));
}

export function adminWorkspacesFor(role: AdminRole | null) {
  return adminWorkspaces.filter(item => canSeeAdminNav(role, item.roles));
}

const operationsRoles: AdminRole[] = ['owner', 'manager', 'staff'];

export const adminNavigation: AdminNavItem[] = [
  {label:'Today',href:'/admin/dashboard',matches:['/admin']},
  {label:'Bookings',href:'/admin/bookings',matches:['/admin/inquiries'],roles:operationsRoles},
  {label:'Calendar',href:'/admin/availability',matches:['/admin/channels'],roles:operationsRoles},
  {label:'More',href:'/admin/more',matches:adminWorkspaces.flatMap(item=>[item.href,...(item.matches||[])])},
];

export function adminNavigationFor(role: AdminRole | null) {
  return adminNavigation.filter(item => canSeeAdminNav(role, item.roles));
}

export function isAdminNavItemActive(pathname: string, item: AdminNavItem) {
  return [item.href,...(item.matches||[])].some(href=>pathname===href||(href!=='/admin'&&pathname.startsWith(href+'/')));
}

const screenTitles: Record<string,string> = {
  '/admin/settings/team':'Team & Access',
  '/admin/inquiries':'Guest messages', '/admin/bookings/requests':'Change requests', '/admin/notifications':'Notifications', '/admin/bookings/new':'New booking',
  '/admin/rooms/new':'New room', '/admin/room-types':'Room types',
  '/admin/rates':'Pricing', '/admin/rate-rules':'Rate rules', '/admin/amenities':'Amenities',
  '/admin/media':'Media', '/admin/seo':'Search appearance', '/admin/languages':'Languages',
  '/admin/channels':'Channel calendars', '/admin/channels/booking-com':'Booking.com calendars',
  '/admin/content/homepage':'Homepage', '/admin/content/rooms':'Rooms page', '/admin/content/contact':'Contact page',
  '/admin/content/experiences':'Experiences page', '/admin/content/transfers':'Transfers page',
  '/admin/content/explore-koman':'Explore Koman page', '/admin/content/gallery':'Gallery',
  '/admin/content/book':'Booking page', '/admin/content/footer':'Footer',
  '/admin/content/navigation':'Website navigation', '/admin/content/global':'Shared website content',
  '/admin/experiences':'Experiences', '/admin/transfers':'Transfers', '/admin/explore-koman':'Explore Koman',
};

export function adminScreenTitle(pathname: string) {
  return screenTitles[pathname] || (pathname.startsWith('/admin/bookings/') ? 'Reservation'
    : pathname.startsWith('/admin/rooms/') ? 'Room details'
    : pathname.startsWith('/admin/experiences/') ? 'Experience editor'
    : pathname.startsWith('/admin/transfers/') ? 'Transfer editor'
    : pathname.startsWith('/admin/explore-koman/') ? 'Article editor'
    : adminWorkspaces.find(item=>isAdminNavItemActive(pathname,item))?.label
      || adminNavigation.find(item=>isAdminNavItemActive(pathname,item))?.label || 'Borealis admin');
}
