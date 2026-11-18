import Form from 'next/form';

const archived = { value: 'archived', label: 'Archived' };
const activeStatuses = [{ value: 'active', label: 'Active' }, archived];
const publicationStatuses = [
  { value: 'active', label: 'All current' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  archived,
];

export function AdminStatusFilter({
  status,
  kind = 'status',
  type,
}: {
  status: string;
  kind?: 'status' | 'publication' | 'articles';
  type?: string;
}) {
  const options = kind === 'publication' ? publicationStatuses :
    kind === 'articles' ? [{ value: 'active', label: 'Draft & published' }, archived] : activeStatuses;

  return <Form action="" className="admin-filter-bar rounded-xl border border-slate-200 bg-white p-4">
    {type !== undefined && <input type="hidden" name="type" value={type}/>}
    <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-600">
      {kind === 'publication' ? 'Publication' : 'Status'}
      <select name="status" defaultValue={status} className="admin-panel-input font-medium">
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
    <button type="submit" className="min-h-11 rounded-lg bg-slate-100 px-4 text-sm font-bold">
      {kind === 'articles' ? 'Apply' : 'Filter'}
    </button>
  </Form>;
}
