'use client';

import { useId, useRef } from 'react';

export function ConfirmAction({
  action,
  label,
  confirmMessage,
}: {
  action: () => Promise<void>;
  label: string;
  confirmMessage: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return <>
    <button
      type="button"
      onClick={() => dialog.current?.showModal()}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-center text-sm font-semibold leading-none text-red-700"
    >
      {label}
    </button>
    <dialog ref={dialog} aria-labelledby={titleId}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-700">Please confirm</p>
            <h2 id={titleId} className="mt-1 text-xl font-bold text-slate-950">{label}?</h2>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} className="grid size-11 shrink-0 place-items-center rounded-full border border-slate-300 text-xl" aria-label="Close confirmation">×</button>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{confirmMessage}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => dialog.current?.close()} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold">Keep unchanged</button>
          <form action={action}>
            <button className="min-h-11 w-full rounded-lg bg-red-700 px-4 text-sm font-bold text-white">Yes, {label.toLowerCase()}</button>
          </form>
        </div>
      </div>
    </dialog>
  </>;
}
