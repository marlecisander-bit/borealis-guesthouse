import Link from 'next/link';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin/ui';
import { SiteDocumentForm } from '@/components/admin/SiteDocumentForm';
import { requireAdmin } from '@/lib/admin/auth';
import { adminMediaRepository } from '@/lib/repositories/admin/media';
import { adminSiteContentRepository } from '@/lib/repositories/admin/site-content';

const fields = [
  { name: 'heroEyebrow', label: 'Hero eyebrow' },
  { name: 'heroTitle', label: 'Page title' },
  { name: 'introduction', label: 'Introduction', kind: 'textarea' as const },
  { name: 'heroImage', label: 'Hero image', kind: 'image' as const },
  { name: 'heroImageAlt', label: 'Hero image alternative text' },
  { name: 'storyEyebrow', label: 'Story eyebrow' },
  { name: 'storyHeading', label: 'Story heading' },
  { name: 'storyText', label: 'Story content', kind: 'textarea' as const },
  { name: 'storyImage', label: 'Story image', kind: 'image' as const },
  { name: 'storyImageAlt', label: 'Story image alternative text' },
  { name: 'locationEyebrow', label: 'Location eyebrow' },
  { name: 'locationHeading', label: 'Location heading' },
  { name: 'locationText', label: 'Location content', kind: 'textarea' as const },
  { name: 'locationImage', label: 'Location image', kind: 'image' as const },
  { name: 'locationImageAlt', label: 'Location image alternative text' },
  { name: 'philosophyEyebrow', label: 'Philosophy eyebrow' },
  { name: 'philosophyHeading', label: 'Philosophy heading' },
  { name: 'philosophy', label: 'Philosophy points', kind: 'textarea' as const, help: 'Enter one point per line.' },
  { name: 'ctaLabel', label: 'CTA label' },
  { name: 'ctaTarget', label: 'CTA destination' },
];

export default async function Page() {
  const session = await requireAdmin(['owner', 'manager', 'editor']);
  const [document, assets] = await Promise.all([
    adminSiteContentRepository.document(session, 'about').catch(() => null),
    adminMediaRepository.list(session).catch(() => []),
  ]);
  if (!document) {
    return <AdminEmptyState title="CMS database update required" description="Run database/migrations/20260902_007_site_content_cms.sql in Supabase, then reload." />;
  }
  const media = assets
    .filter(asset => asset.status !== 'archived')
    .map(asset => ({
      id: asset.id,
      label: asset.title || asset.alt_text || asset.filename || 'Untitled image',
      imageUrl: asset.publicUrl,
    }));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="About page"
        description="Edit the approved story and location sections while the public layout remains protected."
        actions={<Link href="/about" target="_blank" className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Preview Website</Link>}
      />
      <SiteDocumentForm documentKey="about" fields={fields} data={document.data} media={media} />
    </div>
  );
}
