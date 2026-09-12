'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveRoomType } from '@/app/admin/rooms/actions';
import { CurrencySelect } from '@/components/admin/CurrencySelect';
import { AmenityIcon } from '@/components/amenities/AmenityIcon';
import type { AdminAmenity, AdminRoomType, RoomFormState } from '@/types/rooms-admin';

const initial: RoomFormState = { ok: false, message: '' };
const input = 'mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900';

export function RoomTypeForm({ room, amenities,agePolicy={infantMaxAge:2,childMaxAge:12} }: { room: AdminRoomType | null; amenities: AdminAmenity[];agePolicy?:{infantMaxAge:number;childMaxAge:number} }) {
  const [state, action, pending] = useActionState(saveRoomType, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.id && !room) router.replace(`/admin/rooms/${state.id}`);
  }, [state, room, router]);

  const error = (key: string) => state.errors?.[key] && <span className="mt-1 block text-xs text-red-700">{state.errors[key]}</span>;

  return <form action={action} className="grid gap-6">
    <input type="hidden" name="id" value={room?.id || ''} />
    <nav className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 text-sm font-semibold">
      {['General', 'Description', 'Occupancy policy', 'Beds', 'Inventory', 'Amenities', 'Photos', 'Pricing', 'SEO', 'Visibility'].map(label => <a key={label} href={`#${label.toLowerCase().replaceAll(' ', '-').replace('&', 'and')}`} className="shrink-0 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">{label}</a>)}
    </nav>
    <FormSection id="general" title="General">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" error={error('name')}><input name="name" defaultValue={room?.name || ''} className={input} /></Field>
        <Field label="URL slug" hint="Optional. If left blank, a safe URL slug is generated from the room name." error={error('slug')}><input name="slug" defaultValue={room?.slug || ''} placeholder="lake-view-double" className={input} /></Field>
        <Field label="View"><input name="viewType" defaultValue={room?.viewType || ''} placeholder="Lake view" className={input} /></Field>
        <Field label="Sort order"><input name="sortOrder" type="number" defaultValue={room?.sortOrder || 0} className={input} /></Field>
      </div>
    </FormSection>
    <FormSection id="inventory" title="Inventory">
      <div className="max-w-md">
        <NumberField label="Number of bookable rooms" name="inventoryCount" value={room?.inventoryCount || 1} error={error('inventoryCount')} min={1} max={100} />
        <p className="mt-2 text-sm leading-6 text-slate-500">Use 1 when this is a unique room. Increase it only when several interchangeable rooms share this page, price and amenities. Borealis manages the operational units automatically.</p>
      </div>
    </FormSection>
    <FormSection id="description" title="Description">
      <Field label="Short description" error={error('shortDescription')}><textarea name="shortDescription" defaultValue={room?.shortDescription || ''} rows={3} className={`${input} py-3`} /></Field>
      <Field label="Long description" error={error('longDescription')}><textarea name="longDescription" defaultValue={room?.longDescription || ''} rows={7} className={`${input} py-3`} /></Field>
    </FormSection>
    <FormSection id="occupancy-policy" title="Occupancy policy">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <NumberField label="Maximum total guests" name="maxTotalOccupancy" value={room?.maxTotalOccupancy || room?.capacity || 2} error={error('maxTotalOccupancy')} min={1}/>
        <NumberField label="Maximum adults" name="maxAdults" value={room?.maxAdults || room?.capacity || 2} error={error('maxAdults')} min={1}/>
        <NumberField label="Maximum children" name="maxChildren" value={room?.maxChildren ?? 0} error={error('maxChildren')}/>
        <NumberField label="Maximum infants" name="maxInfants" value={room?.maxInfants ?? 0} error={error('maxInfants')}/>
        <NumberField label="Minimum adults" name="minAdults" value={room?.minAdults || 1} error={error('minAdults')} min={1}/>
        <NumberField label="Base occupancy" name="baseOccupancy" value={room?.baseOccupancy || 2} error={error('baseOccupancy')} />
        <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-4 text-sm font-semibold"><input name="infantsCountTowardCapacity" type="checkbox" defaultChecked={room?.infantsCountTowardCapacity??true}/>Infants count toward total capacity</label>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">Every booked room requires its minimum number of adults. Infants count toward the total by default; turn this off only when the property explicitly allows infants without using a normal capacity place.</p>
      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600"><strong className="text-slate-800">Property age policy:</strong> Infants 0–{agePolicy.infantMaxAge}, children {agePolicy.infantMaxAge+1}–{agePolicy.childMaxAge}, adults {agePolicy.childMaxAge+1}+. Change these bands in Admin Settings; the minimum legal booking-holder age remains a separate policy.</div>
    </FormSection>
    <FormSection id="beds" title="Beds and room details">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <NumberField label="Total beds" name="beds" value={room?.beds || 1} error={error('beds')} min={1} />
        <Field label="Bed configuration" error={error('bedConfiguration')}><input name="bedConfiguration" defaultValue={room?.bedConfiguration || ''} placeholder="1 queen bed" className={input} /></Field>
        <Field label="Room size (m²)"><input name="sizeSqm" type="number" step="0.1" min="0" defaultValue={room?.sizeSqm || ''} className={input} /></Field>
      </div>
    </FormSection>
    <FormSection id="amenities" title="Amenities">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {amenities.length ? amenities.map(item => <label key={item.id} className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-4 text-sm font-medium"><input type="checkbox" name="amenityIds" value={item.id} defaultChecked={room?.amenityIds.includes(item.id)} /><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><AmenityIcon name={item.icon} className="size-4" /></span><span>{item.name}</span></label>) : <p className="text-sm text-slate-500">Create amenities in the catalogue before assigning them.</p>}
      </div>
    </FormSection>
    <FormSection id="photos" title="Photos"><p className="text-sm text-slate-500">Save the room first, then upload, reorder and choose its cover image below the form.</p></FormSection>
    <FormSection id="pricing" title="Pricing">
      <div className="grid max-w-2xl gap-5 sm:grid-cols-2"><Field label="Base price from" error={error('basePrice')}><input name="basePrice" type="number" min="0" step="0.01" defaultValue={room?.basePrice ?? ''} className={input} /></Field><Field label="Currency" error={error('currency')}><CurrencySelect defaultValue={room?.currency || 'EUR'} className={input} /></Field></div>
    </FormSection>
    <FormSection id="seo" title="SEO">
      <div className="grid gap-5">
        <Field label="SEO title" error={error('seoTitle')}><input name="seoTitle" maxLength={70} defaultValue={room?.seoTitle || ''} className={input} /></Field>
        <Field label="Meta description" error={error('seoDescription')}><textarea name="seoDescription" maxLength={180} rows={3} defaultValue={room?.seoDescription || ''} className={`${input} py-3`} /></Field>
      </div>
    </FormSection>
    <FormSection id="visibility" title="Visibility">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" name="featured" defaultChecked={room?.featured} />Featured room</label>
        <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" name="visible" defaultChecked={room?.visible ?? true} />Bookable and visible when published</label>
      </div>
    </FormSection>
    <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <p role="status" aria-live="polite" className={`text-sm ${state.ok ? 'text-emerald-700' : 'text-red-700'}`}>{state.message}</p>
      <div className="flex gap-2">
        <button name="status" value="draft" disabled={pending} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Save draft</button>
        <button name="status" value="published" disabled={pending} className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">{pending ? 'Saving…' : 'Save & publish'}</button>
      </div>
    </div>
  </form>;
}

function FormSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="mb-5 text-xl font-bold text-slate-950">{title}</h2>{children}</section>;
}

function Field({ label, children, error, hint }: { label: string; children: React.ReactNode; error?: React.ReactNode; hint?: string }) {
  return <label className="text-sm font-semibold text-slate-800">{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}{error}</label>;
}

function NumberField({ label, name, value, error, min=0, max }: { label: string; name: string; value: number; error?: React.ReactNode; min?: number; max?: number }) {
  return <Field label={label} error={error}><input name={name} type="number" min={min} max={max} defaultValue={value} className={input} /></Field>;
}
