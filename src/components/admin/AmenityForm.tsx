'use client';

import { useActionState, type ReactNode } from 'react';
import { saveAmenity } from '@/app/admin/amenities/actions';
import { AmenityIconPicker } from '@/components/admin/AmenityIconPicker';
import { amenityCategories, type AdminAmenityRecord, type AmenityFormState } from '@/types/amenities-admin';

const initial: AmenityFormState = { ok: false, message: '' };
const pretty = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function AmenityForm({ amenity }: { amenity: AdminAmenityRecord | null }) {
  const [state, action, pending] = useActionState(saveAmenity, initial);
  const input = 'mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200';
  const error = (key: string) => state.errors?.[key] && <span className="mt-1 block text-xs text-red-700">{state.errors[key]}</span>;

  return (
    <form action={action} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <input type="hidden" name="id" value={amenity?.id || ''} />
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-950">{amenity ? 'Edit amenity' : 'Create amenity'}</h2>
        <p className="mt-1 text-sm text-slate-500">Catalogue entries become selectable in room editing.</p>
      </div>
      <div className="grid gap-5">
        <Field label="Name" error={error('name')}><input name="name" required defaultValue={amenity?.name || ''} placeholder="e.g. Lake view" className={input} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" error={error('category')}>
            <select name="category" defaultValue={amenity?.category || 'room'} className={input}>{amenityCategories.map((item) => <option key={item} value={item}>{pretty(item)}</option>)}</select>
          </Field>
          <Field label="Sort order" error={error('sortOrder')}><input name="sortOrder" type="number" min="0" step="1" defaultValue={amenity?.sortOrder || 0} className={input} /></Field>
        </div>
        <AmenityIconPicker defaultValue={amenity?.icon || ''} error={state.errors?.icon} />
        <Field label="Description (optional)" error={error('description')}><textarea name="description" maxLength={600} rows={4} defaultValue={amenity?.description || ''} className={`${input} py-3`} /></Field>
        <label className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 text-sm font-semibold text-slate-800"><input name="active" type="checkbox" defaultChecked={amenity?.active ?? true} />Active and available for room selection</label>
      </div>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <p role="status" className={`mb-3 text-sm ${state.ok ? 'text-emerald-700' : 'text-red-700'}`}>{state.message}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <button name="status" value="draft" disabled={pending} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Save draft</button>
          <button name="status" value="published" disabled={pending} className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">Save &amp; publish</button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: ReactNode; children: ReactNode }) {
  return <label className="text-sm font-semibold text-slate-800">{label}{hint && <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{hint}</span>}{children}{error}</label>;
}
