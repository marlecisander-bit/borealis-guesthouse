export interface AdminNavItem {
  label: string;
  href: string;
  matches?: string[];
}

export const adminWorkspaces: AdminNavItem[] = [
  {label:'Rooms & Rates',href:'/admin/rooms',matches:['/admin/rates','/admin/amenities','/admin/room-types','/admin/rate-rules']},
  {label:'Experiences & Transfers',href:'/admin/services',matches:['/admin/experiences','/admin/transfers']},
  {label:'Website',href:'/admin/content',matches:['/admin/explore-koman','/admin/seo','/admin/media','/admin/pages']},
  {label:'Settings',href:'/admin/settings',matches:['/admin/languages','/admin/notifications','/admin/channels']},
];

export const adminNavigation: AdminNavItem[] = [
  {label:'Today',href:'/admin/dashboard',matches:['/admin']},
  {label:'Bookings',href:'/admin/bookings',matches:['/admin/inquiries']},
  {label:'Calendar',href:'/admin/availability'},
  {label:'More',href:'/admin/more',matches:adminWorkspaces.flatMap(item=>[item.href,...(item.matches||[])])},
];

export function isAdminNavItemActive(pathname: string, item: AdminNavItem) {
  return [item.href,...(item.matches||[])].some(href=>pathname===href||(href!=='/admin'&&pathname.startsWith(href+'/')));
}

const screenTitles: Record<string,string> = {
  '/admin/inquiries':'Guest enquiries', '/admin/bookings/new':'New booking',
  '/admin/rooms/new':'New room', '/admin/room-types':'Room types',
  '/admin/rates':'Rates', '/admin/rate-rules':'Rate rules', '/admin/amenities':'Amenities',
  '/admin/media':'Media', '/admin/seo':'Search appearance', '/admin/languages':'Languages',
  '/admin/notifications':'Notifications', '/admin/channels':'Integrations', '/admin/channels/booking-com':'Booking.com calendars',
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
