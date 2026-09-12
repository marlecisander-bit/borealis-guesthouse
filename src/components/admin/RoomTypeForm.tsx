'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveRoomType } from '@/app/admin/rooms/actions';
import { CurrencySelect } from '@/components/admin/CurrencySelect';
import { AmenityIcon } from '@/components/amenities/AmenityIcon';
import type { AdminAmenity, AdminRoomType, RoomFormState } from '@/types/rooms-admin';

const initial: RoomFormState = { ok: false, message: '' };
const input = 'mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-900';

export function RoomTypeForm({ room, amenities, agePolicy={infantMaxAge:2,childMaxAge:12} }: { room: AdminRoomType | null; amenities: AdminAmenity[]; agePolicy?: { infantMaxAge:number; childMaxAge:number } }) {
  const [state, action, pending] = useActionState(saveRoomType, initial);
  const router = useRouter();
  useEffect(() => { if (state.ok && state.id && !room) router.replace(`/admin/rooms/${state.id}`); }, [state, room, router]);
  const error = (key: string) => state.errors?.[key] && <span className="mt-1 block text-xs text-red-700">{state.errors[key]}</span>;

  return <form action={action} className="grid gap-6">
    <input type="hidden" name="id" value={room?.id || ''}/>
    <input type="hidden" name="slug" value={room?.slug || ''}/>
    <input type="hidden" name="sortOrder" value={room?.sortOrder || 0}/>

    <nav aria-label="Room editor sections" className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 text-sm font-semibold">
      {['Basic information','Guests & beds','Amenities','Price','Availability','Advanced'].map((label) => <a key={label} href={`#${label.toLowerCase().replaceAll(' ','-').replace('&','and')}`} className="shrink-0 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">{label}</a>)}
    </nav>

    <FormSection id="basic-information" step="1" title="Basic information" description="The name and description guests see on the website.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Room name" error={error('name')}><input name="name" defaultValue={room?.name || ''} className={input}/></Field>
        <Field label="View"><input name="viewType" defaultValue={room?.viewType || ''} placeholder="Lake view" className={input}/></Field>
      </div>
      <Field label="Short description" error={error('shortDescription')} hint="A concise introduction for room cards."><textarea name="shortDescription" defaultValue={room?.shortDescription || ''} rows={3} className={`${input} py-3`}/></Field>
      <Field label="Full description" error={error('longDescription')}><textarea name="longDescription" defaultValue={room?.longDescription || ''} rows={7} className={`${input} py-3`}/></Field>
      <div className="grid gap-3 sm:grid-cols-2"><Check name="featured" label="Feature this room on the website" checked={room?.featured ?? false}/><Check name="visible" label="Show and allow bookings when published" checked={room?.visible ?? true}/></div>
      {room ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Photos are managed directly below this form. The website automatically uses the selected cover photo.</p> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Save this room first. You can then upload its cover photo and gallery without entering any technical details.</p>}
    </FormSection>

    <FormSection id="guests-and-beds" step="2" title="Guests & beds" description="Set clear guest limits for this room. Borealis validates every booking automatically.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <NumberField label="Maximum total guests" name="maxTotalOccupancy" value={room?.maxTotalOccupancy || room?.capacity || 2} error={error('maxTotalOccupancy')} min={1}/>
        <NumberField label="Maximum adults" name="maxAdults" value={room?.maxAdults || room?.capacity || 2} error={error('maxAdults')} min={1}/>
        <NumberField label="Maximum children" name="maxChildren" value={room?.maxChildren ?? 0} error={error('maxChildren')}/>
        <NumberField label="Maximum infants" name="maxInfants" value={room?.maxInfants ?? 0} error={error('maxInfants')}/>
        <NumberField label="Minimum adults" name="minAdults" value={room?.minAdults || 1} error={error('minAdults')} min={1}/>
        <NumberField label="Guests included in base price" name="baseOccupancy" value={room?.baseOccupancy || 2} error={error('baseOccupancy')}/>
        <NumberField label="Total beds" name="beds" value={room?.beds || 1} error={error('beds')} min={1}/>
        <Field label="Bed configuration" error={error('bedConfiguration')}><input name="bedConfiguration" defaultValue={room?.bedConfiguration || ''} placeholder="1 queen bed" className={input}/></Field>
        <Field label="Room size (m²)"><input name="sizeSqm" type="number" step="0.1" min="0" defaultValue={room?.sizeSqm || ''} className={input}/></Field>
      </div>
      <Check name="infantsCountTowardCapacity" label="Infants count toward maximum occupancy" checked={room?.infantsCountTowardCapacity ?? true}/>
      <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600"><strong className="text-slate-800">Property age groups:</strong> infants 0–{agePolicy.infantMaxAge}, children {agePolicy.infantMaxAge+1}–{agePolicy.childMaxAge}, adults {agePolicy.childMaxAge+1}+. <Link href="/admin/settings#booking-policies" className="font-bold underline">Change booking policies</Link></p>
    </FormSection>

    <FormSection id="amenities" step="3" title="Amenities" description="Select the features available in this room.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{amenities.length ? amenities.map((item) => <label key={item.id} className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-4 text-sm font-medium"><input type="checkbox" name="amenityIds" value={item.id} defaultChecked={room?.amenityIds.includes(item.id)}/><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><AmenityIcon name={item.icon} className="size-4"/></span><span>{item.name}</span></label>) : <p className="text-sm text-slate-500">No amenities yet. Add reusable amenities from Rooms & Rates.</p>}</div>
      <Link href="/admin/amenities" className="inline-flex min-h-11 items-center text-sm font-bold text-[#164b59] underline underline-offset-4">Manage amenity list</Link>
    </FormSection>

    <FormSection id="price" step="4" title="Price" description="This standard nightly price is reused on the website and in booking calculations.">
      <div className="grid max-w-2xl gap-5 sm:grid-cols-2"><Field label="Standard nightly price" error={error('basePrice')}><input name="basePrice" type="number" min="0" step="0.01" defaultValue={room?.basePrice ?? ''} className={input}/></Field><Field label="Currency" error={error('currency')}><CurrencySelect defaultValue={room?.currency || 'EUR'} className={input}/></Field></div>
      <Link href="/admin/rates" className="inline-flex min-h-11 items-center text-sm font-bold text-[#164b59] underline underline-offset-4">Manage seasonal rates</Link>
    </FormSection>

    <FormSection id="availability" step="5" title="Availability" description="Tell Borealis how many interchangeable units can be booked.">
      <div className="max-w-md"><NumberField label="Number of units" name="inventoryCount" value={room?.inventoryCount || 1} error={error('inventoryCount')} min={1} max={100}/><p className="mt-2 text-sm leading-6 text-slate-500">Use 1 for a unique room. Increase this only when multiple units share the same name, photos, price and amenities.</p></div>
      <Link href="/admin/availability" className="inline-flex min-h-11 items-center text-sm font-bold text-[#164b59] underline underline-offset-4">Open calendar</Link>
    </FormSection>

    <details id="advanced" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 font-bold sm:px-6"><span>Advanced settings</span><span aria-hidden="true" className="text-slate-400">⌄</span></summary>
      <div className="grid gap-5 border-t border-slate-100 p-5 sm:p-6"><p className="text-sm text-slate-500">Optional search-engine text. Sensible property defaults are used when these fields are empty.</p><Field label="SEO title" error={error('seoTitle')}><input name="seoTitle" maxLength={70} defaultValue={room?.seoTitle || ''} className={input}/></Field><Field label="Meta description" error={error('seoDescription')}><textarea name="seoDescription" maxLength={180} rows={3} defaultValue={room?.seoDescription || ''} className={`${input} py-3`}/></Field></div>
    </details>

    <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><p role="status" aria-live="polite" className={`text-sm ${state.ok?'text-emerald-700':'text-red-700'}`}>{state.message}</p><div className="grid grid-cols-2 gap-2"><button name="status" value="draft" disabled={pending} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Save draft</button><button name="status" value="published" disabled={pending} className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">{pending?'Saving…':'Save & publish'}</button></div></div>
  </form>;
}

function FormSection({ id, step, title, description, children }: { id:string; step:string; title:string; description:string; children:React.ReactNode }) { return <section id={id} className="scroll-mt-24 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><header><p className="text-xs font-bold uppercase tracking-widest text-[#568087]">Step {step}</p><h2 className="mt-1 text-xl font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></header>{children}</section>; }
function Field({ label, children, error, hint }: { label:string; children:React.ReactNode; error?:React.ReactNode; hint?:string }) { return <label className="text-sm font-semibold text-slate-800">{label}{children}{hint&&<span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}{error}</label>; }
function NumberField({ label, name, value, error, min=0, max }: { label:string; name:string; value:number; error?:React.ReactNode; min?:number; max?:number }) { return <Field label={label} error={error}><input name={name} type="number" min={min} max={max} defaultValue={value} className={input}/></Field>; }
function Check({ name, label, checked }: { name:string; label:string; checked:boolean }) { return <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-4 text-sm font-semibold"><input name={name} type="checkbox" defaultChecked={checked}/>{label}</label>; }
