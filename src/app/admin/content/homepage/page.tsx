import { AdminEmptyState } from '@/components/admin/ui';
import { HomepageCmsForm } from '@/components/admin/HomepageCmsForm';
import { WebsiteEditorHeader } from '@/components/admin/WebsiteEditorHeader';
import { requireAdmin } from '@/lib/admin/auth';
import { readHeroAssets } from '@/lib/hero-assets';
import { adminHomepageRepository, getHomepageDraft, getHomepageWorkflow } from '@/lib/repositories/admin/homepage';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { websiteStatus } from '@/lib/admin/website-status';

export const metadata = { title: 'Homepage | Borealis Admin' };

export default async function HomepageEditor() {
  const session = await requireAdmin(['owner', 'manager', 'editor']);
  const loaded = await (async () => {
    const [published, draft, workflow, db] = await Promise.all([
      adminHomepageRepository.get(session), getHomepageDraft(session), getHomepageWorkflow(session), createServerSupabaseClient(),
    ]);
    const data = draft ? { ...published, sections: draft.sections, highlights: draft.highlights, reviews: draft.reviews } : published;
    data.heroAssets = await readHeroAssets(db, data.sections);
    data.highlights = data.highlights.filter(item => item.status !== 'archived');
    return { data, status: workflow ? websiteStatus(workflow.status, workflow.hasDraft) : undefined };
  })().catch(() => null);

  return <div className="max-w-5xl space-y-4">
    <WebsiteEditorHeader title="Homepage" status={loaded?.status ?? 'Status unavailable'} live="/"/>
    {loaded ? <HomepageCmsForm data={loaded.data}/> : <AdminEmptyState title="Homepage could not be loaded" description="Reload this page before editing."/>}
  </div>;
}
