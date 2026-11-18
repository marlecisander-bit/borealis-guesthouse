'use client';

import { useActionState } from 'react';
import { saveSiteDocument } from '@/app/admin/content/site-actions';
import type { CmsOption } from '@/types/homepage-cms';
import type { SiteDocument } from '@/types/site-content-cms';
import {MediaHeroFields} from './MediaHeroFields';
import { MediaPicker } from './MediaPicker';
import { WebsiteEditor, WebsiteSection } from './WebsiteEditor';
import { useEditorForm } from './EditorWorkspace';

export type SiteDocumentField = {
  name: string;
  label: string;
  kind?: 'text' | 'textarea' | 'url' | 'email' | 'image' | 'hero';
  help?: string;
};

export function SiteDocumentForm({
  documentKey,
  fields,
  data,
  media = [],
  sections,
  preview,
}: {
  documentKey: SiteDocument['key'];
  fields: SiteDocumentField[];
  data: Record<string, string>;
  media?: CmsOption[];
  sections?: {id:string; title:string; fields:readonly string[]}[];
  preview?: string;
}) {
  const action = saveSiteDocument.bind(null, documentKey);
  const [state, formAction, pending] = useActionState(action, { ok: false, message: '' });

  const editor = useEditorForm(state);

  const renderFields = (shown: SiteDocumentField[]) => <div className="grid gap-4 lg:grid-cols-2">
        {shown.map(field => {
          if(field.kind==='hero')return <MediaHeroFields key={field.name} data={data} media={media}/>;
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
      </div>;
  if (sections && preview) return <WebsiteEditor result={state} dispatch={formAction} pending={pending} preview={preview}>
    {sections.map(section => <WebsiteSection key={section.id} id={section.id} title={section.title}>
      {renderFields(fields.filter(field => section.fields.includes(field.name)))}
    </WebsiteSection>)}
  </WebsiteEditor>;
  return <form action={formAction} onChange={editor.onChange} onSubmit={editor.submit} className="space-y-6">
    <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-6">{renderFields(fields)}</div>
      {state.message && (
        <p role="status" className={`rounded-lg px-4 py-3 text-sm ${state.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
          {state.message}
        </p>
      )}
      <div className="admin-form-actions sticky bottom-4 z-10 flex flex-wrap justify-end gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <button name="status" value="draft" disabled={pending} className="min-h-11 rounded-lg border border-slate-300 px-5 font-semibold">Save draft</button>
        <button name="status" value="published" disabled={pending} className="min-h-11 rounded-lg bg-brand px-5 font-semibold text-white">{pending ? 'Saving…' : 'Publish changes'}</button>
      </div>
    </form>
}
