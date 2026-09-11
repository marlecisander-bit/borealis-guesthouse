'use client';

import {useActionState} from 'react';
import {attachExistingRoomMedia} from '@/app/admin/rooms/actions';
import type {CmsOption} from '@/types/homepage-cms';
import {MediaPicker} from './MediaPicker';

export function RoomMediaSelectorForm({roomTypeId,assets}:{roomTypeId:string;assets:CmsOption[]}){
  const action=attachExistingRoomMedia.bind(null,roomTypeId);
  const[state,formAction,pending]=useActionState(action,{ok:false,message:''});
  return <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-6">
    <h2 className="text-xl font-bold">Choose from Media Library</h2>
    <p className="mt-1 text-sm text-slate-500">Reuse an image that has already been uploaded.</p>
    <div className="mt-5 max-w-xl"><MediaPicker name="mediaAssetId" label="Existing image" assets={assets} valueMode="id"/></div>
    {state.message&&<p role="status" className={`mt-4 rounded-lg px-4 py-3 text-sm ${state.ok?'bg-emerald-50 text-emerald-800':'bg-red-50 text-red-800'}`}>{state.message}</p>}
    <button disabled={pending} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{pending?'Adding image…':'Add to room gallery'}</button>
  </form>;
}
