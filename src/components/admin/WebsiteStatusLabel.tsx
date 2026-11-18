import type { WebsiteStatus } from '@/lib/admin/website-status';

const colors: Record<WebsiteStatus, string> = {
  Live: 'bg-emerald-50 text-emerald-900',
  'Unpublished changes': 'bg-amber-100 text-amber-950',
  'Draft only': 'bg-amber-50 text-amber-950',
  Archived: 'bg-stone-100 text-stone-700',
  'Status unavailable': 'bg-stone-100 text-stone-700',
};

export function WebsiteStatusLabel({ status }: { status: WebsiteStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status]}`}>{status}</span>;
}
