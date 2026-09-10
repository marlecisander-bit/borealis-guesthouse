import { notFound } from 'next/navigation';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/auth';
const labels={about:'About',gallery:'Gallery',contact:'Contact'} as const;
export default async function ContentSectionPage({params}:{params:Promise<{section:string}>}){await requireAdmin(['owner','manager','editor']);const{section}=await params;const label=labels[section as keyof typeof labels];if(!label)notFound();return <div className="space-y-8"><AdminPageHeader title={`${label} content`} description="This module will use the shared CMS repository, validation, status, media and audit foundations created in this phase."/><AdminEmptyState title={`${label} editor is prepared for the next module`} description="The foundation is complete; field-level implementation is intentionally deferred so each public section can receive the correct structured editor."/></div>}
