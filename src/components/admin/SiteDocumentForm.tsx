'use client';

import { useActionState } from 'react';
import { saveSiteDocument } from '@/app/admin/content/site-actions';
import type { CmsOption } from '@/types/homepage-cms';
import type { SiteDocument } from '@/types/site-content-cms';
import { MediaPicker } from './MediaPicker';

type Field = {
  name: string;
  label: string;
  kind?: 'text' | 'textarea' | 'url' | 'email' | 'image';
  help?: string;
};

export function SiteDocumentForm({
  documentKey,
  fields,
  data,
  media = [],
}: {
  documentKey: SiteDocument['key'];
  fields: Field[];
  data: Record<string, string>;
  media?: CmsOption[];
}) {
  const action = saveSiteDocument.bind(null, documentKey);
  const [state, formAction, pending] = useActionState(action, { ok: false, message: '' });

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 lg:grid-cols-2">
        {fields.map(field => {
          if (field.kind === 'image') {
            return (
              <div key={field.name}>
                <MediaPicker
                  name={field.name}
                  label={field.label}
                  assets={media}
                  defaultValue={data[field.name] || ''}
                  valueMode={field.name.endsWith('ImageId') ? 'id' : 'url'}
                />
                {field.help && <span className="mt-1 block text-xs text-slate-500">{field.help}</span>}
              </div>
            );
          }
          return (
            <label key={field.name} className={`text-sm font-semibold text-slate-800 ${field.kind === 'textarea' ? 'lg:col-span-2' : ''}`}>
              {field.label}
              {field.kind === 'textarea' ? (
                <textarea name={field.name} defaultValue={data[field.name] || ''} rows={4} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal" />
              ) : (
                <input
                  name={field.name}
                  type={field.kind === 'email' ? 'email' : field.kind === 'url' ? 'url' : 'text'}
                  defaultValue={data[field.name] || ''}
                  className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 font-normal"
                />
              )}
              {field.help && <span className="mt-1 block text-xs font-normal text-slate-500">{field.help}</span>}
            </label>
          );
        })}
      </div>
      {state.message && (
        <p role="status" className={`rounded-lg px-4 py-3 text-sm ${state.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
          {state.message}
        </p>
      )}
      <div className="sticky bottom-4 flex justify-end gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <button name="status" value="draft" disabled={pending} className="min-h-11 rounded-lg border border-slate-300 px-5 font-semibold">Save Draft</button>
        <button name="status" value="published" disabled={pending} className="min-h-11 rounded-lg bg-slate-950 px-5 font-semibold text-white">{pending ? 'Saving…' : 'Publish'}</button>
      </div>
    </form>
  );
}
