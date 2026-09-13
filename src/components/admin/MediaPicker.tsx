'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { CmsOption } from '@/types/homepage-cms';
import type { AdminMediaAsset } from '@/types/media';
import dynamic from 'next/dynamic';
const MediaUploader=dynamic(()=>import('./MediaUploader').then(module=>module.MediaUploader));

interface MediaPickerProps {
  name: string;
  label?: string;
  assets: CmsOption[];
  defaultValue?: string;
  valueMode?: 'id' | 'url';
}

export function MediaPicker({
  name,
  label = 'Image',
  assets,
  defaultValue = '',
  valueMode = 'id',
}: MediaPickerProps) {
  const initialMatch = assets.find(item => valueMode === 'url' ? item.imageUrl === defaultValue : item.id === defaultValue);
  const [items, setItems] = useState(assets);
  const [selected, setSelected] = useState(initialMatch?.id || (valueMode === 'id' ? defaultValue : ''));
  const [legacyUrl, setLegacyUrl] = useState(valueMode === 'url' && !initialMatch ? defaultValue : '');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const current = items.find(item => item.id === selected);
  const submittedValue = valueMode === 'url' ? current?.imageUrl || legacyUrl : selected;
  const shown = useMemo(
    () => items.filter(item => item.label.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  function select(id: string) {
    setSelected(id);
    setLegacyUrl('');
    setOpen(false);
  }

  function remove() {
    setSelected('');
    setLegacyUrl('');
  }

  async function useUploaded(uploaded: AdminMediaAsset[]) {
    const added = uploaded.map(asset => ({
      id: asset.id,
      label: asset.title || asset.alt_text || asset.filename || 'Uploaded image',
      imageUrl: asset.publicUrl,
    }));
    setItems(previous => [...added, ...previous]);
    if (added[0]) select(added[0].id);
  }

  return (
    <div className="text-sm font-semibold text-slate-800">
      <span>{label}</span>
      <input type="hidden" name={name} value={submittedValue} />
      <div className="mt-2 flex min-h-20 items-center gap-3 rounded-xl border border-slate-300 p-3">
        {current?.imageUrl ? (
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <Image src={current.imageUrl} alt="" fill sizes="96px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-center text-xs text-slate-500">
            {legacyUrl ? 'Existing image' : 'No image'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {current?.label || (legacyUrl ? 'Previously saved image' : 'Use website fallback')}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold"
          >
            Choose or upload from computer
          </button>
          {submittedValue && (
            <button type="button" onClick={remove} className="ml-2 px-2 py-2 text-xs font-bold text-slate-600">
              Remove
            </button>
          )}
        </div>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Choose ${label.toLowerCase()}`}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-5"
        >
          <div
            onClick={event => event.stopPropagation()}
            className="admin-mobile-sheet max-h-[95dvh] w-full max-w-5xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Choose an image</h2>
                <p className="text-sm font-normal text-slate-500">Upload from your computer or reuse an existing image.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg border border-slate-300 px-4">
                Close
              </button>
            </div>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search existing images"
              className="mt-5 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal"
            />
            <div className="mt-4 grid max-h-72 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-5">
              {shown.map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => select(item.id)}
                  className={`overflow-hidden rounded-xl border text-left ${selected === item.id ? 'ring-2 ring-emerald-600' : 'border-slate-200'}`}
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="180px" className="object-cover" />}
                  </div>
                  <span className="block truncate p-2 text-xs">{item.label}</span>
                </button>
              ))}
            </div>
            {shown.length === 0 && <p className="my-6 text-center text-sm font-normal text-slate-500">No matching images.</p>}
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="mb-3 text-sm font-bold text-slate-900">Upload a new image from your computer</h3>
              <MediaUploader compact onUploaded={useUploaded} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
