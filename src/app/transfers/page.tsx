import { redirect } from 'next/navigation';

export default async function TransfersPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  redirect(`/experiences${preview ? `?preview=${encodeURIComponent(preview)}` : ''}#transfers`);
}
