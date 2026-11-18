'use client';

import { createContext, useContext, startTransition, useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { useEditorForm } from './EditorWorkspace';

const TrackMediaEdit = createContext<(() => void) | undefined>(undefined);
export const useWebsiteMediaEdit = () => useContext(TrackMediaEdit);

export function WebsiteSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function openLinkedSection() {
      if (window.location.hash !== '#' + id || !panel.current) return;
      panel.current.open = true;
      panel.current.scrollIntoView({ block: 'start' });
    }
    openLinkedSection();
    window.addEventListener('hashchange', openLinkedSection);
    return () => window.removeEventListener('hashchange', openLinkedSection);
  }, [id]);
  return <details id={id} ref={panel} className="scroll-mt-24 rounded-xl border border-stone-200 bg-white">
    <summary className="min-h-12 cursor-pointer rounded-xl px-4 py-3.5 text-base font-bold text-lake focus-visible:outline-2 focus-visible:outline-brand sm:px-5">{title}</summary>
    <div className="border-t border-stone-100 p-4 sm:p-5">{children}</div>
  </details>;
}

type Result = { ok: boolean; message: string; section?: string };

export function WebsiteEditor({ children, result, dispatch, pending, preview }: {
  children: ReactNode; result: Result; dispatch: (data: FormData) => void; pending: boolean; preview: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  const feedback = useRef<HTMLParagraphElement>(null);
  const editor = useEditorForm(result);

  useEffect(() => {
    if (!result.message || result.ok) return;
    const section = result.section && form.current?.querySelector<HTMLDetailsElement>('details#' + CSS.escape(result.section));
    if (section) section.setAttribute('open', '');
    feedback.current?.focus();
  }, [result]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    editor.submit();
    const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    if (!data.has('status')) data.set('status', 'draft');
    startTransition(() => dispatch(data));
  }

  return <TrackMediaEdit.Provider value={editor.changed}><form ref={form} action={dispatch} onChange={event => { if (event.target.getAttribute('name')) editor.onChange(); }} onSubmit={submit} className="grid gap-3"
    onInvalidCapture={event => { const panel = (event.target as HTMLElement).closest('details'); if (panel) panel.open = true; }}>
    {children}
    <div className="website-editor-actions grid gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      {result.message && <p ref={feedback} tabIndex={-1} role={result.ok ? 'status' : 'alert'} className={result.ok ? 'text-sm text-emerald-900' : 'text-sm font-medium text-red-800'}>
        {result.message}{!result.ok && result.section && <> <a href={'#' + result.section} className="underline">Go to section</a></>}
      </p>}
      <div className="website-action-buttons">
        <button name="status" value="draft" disabled={pending} className="min-h-11 rounded-lg border border-stone-300 px-3 text-sm font-semibold">Save draft</button>
        <a href={preview} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-3 text-sm font-semibold">Preview draft ↗</a>
        <button name="status" value="published" disabled={pending} className="website-publish-button min-h-11 rounded-lg bg-brand px-3 text-sm font-semibold text-white">{pending ? 'Saving…' : 'Publish changes'}</button>
      </div>
      <p className="text-xs text-slate-600">Save your edits before previewing. Preview opens the last saved draft in a new tab.</p>
    </div>
  </form></TrackMediaEdit.Provider>;
}
