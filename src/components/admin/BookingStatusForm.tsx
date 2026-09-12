'use client';

import { useActionState, useRef, useState } from 'react';
import type { BookingMutationState } from '@/app/admin/bookings/actions';

export function BookingStatusForm({
  action,
  allowed,
  reference,
}: {
  action: (previous: BookingMutationState, data: FormData) => Promise<BookingMutationState>;
  allowed: string[];
  reference: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const confirmed = useRef(false);
  const [status, setStatus] = useState(allowed[0] || '');
  const [state, formAction, pending] = useActionState(action, { ok: false, message: '' });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    if (status !== 'cancelled' || confirmed.current) {
      confirmed.current = false;
      return;
    }
    event.preventDefault();
    dialog.current?.showModal();
  }

  function confirmCancellation() {
    confirmed.current = true;
    dialog.current?.close();
    form.current?.requestSubmit();
  }

  return <>
    <form ref={form} action={formAction} onSubmit={submit} className="mt-4 space-y-3">
      <label className="block text-sm font-semibold text-slate-700">New status
        <select name="status" value={status} onChange={event => setStatus(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3">
          {allowed.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
        </select>
      </label>
      {state.message&&<p role="status" aria-live="polite" className={`text-sm ${state.ok?'text-emerald-700':'text-red-700'}`}>{state.message}</p>}
      <button disabled={pending} className={`min-h-11 w-full rounded-lg px-4 font-bold text-white disabled:opacity-60 ${status === 'cancelled' ? 'bg-red-700' : 'bg-slate-950'}`}>{pending?'Updating…':'Update status'}</button>
    </form>
    <dialog ref={dialog} aria-labelledby="cancel-booking-title">
      <div className="p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-red-700">Inventory-changing action</p>
        <h2 id="cancel-booking-title" className="mt-1 text-xl font-bold text-slate-950">Cancel {reference}?</h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">The booking remains in your records, but its room and service capacity will be released for new bookings.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => dialog.current?.close()} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Keep booking</button>
          <button type="button" onClick={confirmCancellation} className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-bold text-white">Cancel booking</button>
        </div>
      </div>
    </dialog>
  </>;
}
