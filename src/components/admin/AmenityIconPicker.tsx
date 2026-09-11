'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AmenityIcon, amenityIconOptions } from '@/components/amenities/AmenityIcon';
import { useOutsideClick } from '@/hooks/useOutsideClick';

export function AmenityIconPicker({ defaultValue = '', error }: { defaultValue?: string; error?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  useOutsideClick(rootRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);

  const selected = amenityIconOptions.find((option) => option.id === value);
  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? amenityIconOptions.filter((option) => `${option.label} ${option.id} ${option.category}`.toLowerCase().includes(term)) : amenityIconOptions;
  }, [query]);
  const choose = (nextValue: string) => {
    setValue(nextValue);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor="amenity-icon-button" className="text-sm font-semibold text-slate-800">Icon</label>
      <span className="mt-1 block text-xs leading-5 text-slate-500">Choose a shared symbol, or use automatic matching from the amenity name.</span>
      <input type="hidden" name="icon" value={value} />
      <button id="amenity-icon-button" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="mt-2 flex min-h-12 w-full items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 text-left text-sm text-slate-950 transition hover:border-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">{value ? <AmenityIcon name={value} /> : <span aria-hidden="true" className="text-lg leading-none">—</span>}</span>
        <span className="min-w-0 flex-1 truncate">{selected?.label || (value ? `Current icon (${value})` : 'Automatic icon')}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className={`size-4 transition ${open ? 'rotate-180' : ''}`}><path d="m5 7.5 5 5 5-5"/></svg>
      </button>
      {open && (
        <div role="listbox" aria-label="Amenity icons" className="absolute z-40 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="sticky top-0 z-10 mb-2 bg-white pb-1">
            <label htmlFor="amenity-icon-search" className="sr-only">Search amenity icons</label>
            <input id="amenity-icon-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search icons" className="min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200" />
          </div>
          <button type="button" role="option" aria-selected={!value} onClick={() => choose('')} className={`mb-1 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-slate-50 ${!value ? 'bg-emerald-50 font-semibold text-emerald-900' : 'text-slate-700'}`}><span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><AmenityIcon /></span>Automatic icon</button>
          {value && !selected && <button type="button" role="option" aria-selected="true" onClick={() => choose(value)} className="mb-1 flex min-h-11 w-full items-center gap-3 rounded-lg bg-emerald-50 px-3 text-left text-sm font-semibold text-emerald-900"><span className="grid size-8 place-items-center rounded-lg bg-white text-emerald-700"><AmenityIcon name={value} /></span>Current icon ({value})</button>}
          <div className="grid gap-1 sm:grid-cols-2">
            {filteredOptions.map((option) => <button key={option.id} type="button" role="option" aria-selected={value === option.id} onClick={() => choose(option.id)} className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-left text-sm transition hover:bg-slate-50 ${value === option.id ? 'bg-emerald-50 font-semibold text-emerald-900' : 'text-slate-700'}`}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><AmenityIcon name={option.id} /></span><span className="min-w-0"><span className="block truncate">{option.label}</span><span className="block text-[11px] font-normal capitalize text-slate-400">{option.category}</span></span></button>)}
          </div>
          {!filteredOptions.length && <p className="px-3 py-5 text-center text-sm text-slate-500">No matching icons.</p>}
        </div>
      )}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </div>
  );
}
