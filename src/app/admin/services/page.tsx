import { redirect } from 'next/navigation';

export default async function ServicesPage({ searchParams }: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const query = new URLSearchParams({ type: 'experience' });
  if (typeof status === 'string') query.set('status', status);
  if (typeof page === 'string') query.set('page', page);
  redirect('/admin/experiences?' + query);
}
