'use client';

import Link, { useLinkStatus } from 'next/link';
import type { ComponentProps } from 'react';

export function AdminNavLink({ children, className, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} className={['admin-nav-link', className].filter(Boolean).join(' ')}>
    {children}
    <AdminNavProgress/>
  </Link>;
}

function AdminNavProgress() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" className="admin-nav-progress" data-pending={pending || undefined}/>;
}
