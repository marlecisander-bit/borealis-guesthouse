'use client';

import { useActionState } from 'react';
import type { BookingMutationState } from '@/app/admin/bookings/actions';

export function BookingNoteForm({
  action,
  initialNote,
}: {
  action: (previous: BookingMutationState, data: FormData) => Promise<BookingMutationState>;
  initialNote: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, message: '' });
  return <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-5">
    <h2 className="font-bold">Internal note</h2>
    <p className="mt-1 text-xs leading-5 text-slate-500">Visible only to the Borealis team.</p>
    <textarea name="internalNote" defaultValue={initialNote} rows={7} className="mt-3 w-full rounded-lg border border-slate-300 p-3"/>
    {state.message&&<p role="status" aria-live="polite" className={`mt-3 text-sm ${state.ok?'text-emerald-700':'text-red-700'}`}>{state.message}</p>}
    <button disabled={pending} className="mt-3 min-h-11 w-full rounded-lg bg-slate-950 px-4 font-bold text-white disabled:opacity-60">{pending?'Saving…':'Save note'}</button>
  </form>;
}
