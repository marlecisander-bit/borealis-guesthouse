const paths: Record<string, string> = {
  '/admin/dashboard': 'M3 10l9-7 9 7v10H3zM9 20v-6h6v6',
  '/admin/bookings': 'M4 5h16v15H4zM8 9h8M8 13h8M8 17h5',
  '/admin/availability': 'M4 6h16v14H4zM8 3v6m8-6v6M4 11h16',
  '/admin/more': 'M4 12h.01M12 12h.01M20 12h.01',
  '/admin/rooms': 'M3 18V6m18 12v-6a2 2 0 0 0-2-2H9v6M3 16h18M3 10h6',
  '/admin/experiences': 'M3 17l6-9 4 6 2-3 6 6H3zM16 6h.01',
  '/admin/content': 'M3 5h18v14H3zM3 9h18M7 13h4m3 0h3m-10 3h10',
  '/admin/settings': 'M4 7h5m4 0h7M4 12h11m4 0h1M4 17h2m4 0h10M9 5v4m6 1v4m-9 1v4',
  '/': 'M13 5h6v6m0-6-9 9m7 0v5H5V7h5',
};

export function AdminNavIcon({ href, className }: { href: string; className?: string }) {
  const path = paths[href];
  if (!path) return null;

  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={href === '/admin/more' ? 3 : 1.7}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={path}/>
  </svg>;
}
