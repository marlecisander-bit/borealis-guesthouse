'use client';
import Image from 'next/image';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveExperience } from '@/app/admin/experiences/actions';
import { CurrencySelect } from '@/components/admin/CurrencySelect';
import type { AdminExperience, ExperienceFormState, ExperienceMediaOption } from '@/types/experiences-admin';

const initial:ExperienceFormState={ok:false,message:''};
const input='mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4';
const days:[number,string][]=[[1,'Monday'],[2,'Tuesday'],[3,'Wednesday'],[4,'Thursday'],[5,'Friday'],[6,'Saturday'],[0,'Sunday']];

export function ExperienceForm({item,media}:{item:AdminExperience|null;media:ExperienceMediaOption[]}){
  const[state,action,pending]=useActionState(saveExperience,initial),router=useRouter();
  useEffect(()=>{if(state.ok&&state.id&&!item)router.replace(`/admin/experiences/${state.id}`)},[state,item,router]);
  return <form action={action} className="space-y-6">
    <input type="hidden" name="id" value={item?.id||''}/>
    <input type="hidden" name="slug" value={item?.slug||''}/>
    <input type="hidden" name="sortOrder" value={item?.sortOrder||0}/>
    <Section title="General"><Grid>
      <Field label="Name" error={state.errors?.name}><input name="name" defaultValue={item?.name||''} className={input}/></Field>
    </Grid></Section>
    <Section title="Description">
      <Field label="Short description" error={state.errors?.description}><textarea name="shortDescription" rows={3} defaultValue={item?.shortDescription||''} className={`${input} py-3`}/></Field>
      <Field label="Full description"><textarea name="fullDescription" rows={7} defaultValue={item?.fullDescription||''} className={`${input} py-3`}/></Field>
    </Section>
    <Section title="Media">
      <Field label="Cover image" error={state.errors?.coverMediaId}><select name="coverMediaId" defaultValue={item?.coverMediaId||''} className={input}><option value="">No cover selected</option>{media.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></Field>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{media.map(option=><label key={option.id} className="flex gap-3 rounded-xl border border-slate-200 p-3"><span className="relative size-16 shrink-0 overflow-hidden rounded-lg"><Image src={option.url} alt="" fill sizes="64px" className="object-cover"/></span><span className="text-sm"><input type="checkbox" name="galleryMediaIds" value={option.id} defaultChecked={item?.galleryMediaIds.includes(option.id)}/> {option.label}</span></label>)}</div>
    </Section>
    <Section title="Experience details"><Grid>
      <Field label="Duration" error={state.errors?.duration}><input name="duration" defaultValue={item?.duration||''} placeholder="60 minutes" className={input}/></Field>
      <Field label="Capacity" error={state.errors?.capacity}><input name="capacity" type="number" min="1" defaultValue={item?.capacity||''} className={input}/></Field>
      <Field label="Price" error={state.errors?.price}><input name="price" type="number" min="0" step="0.01" defaultValue={item?.price??''} className={input}/></Field>
      <Field label="Currency"><CurrencySelect defaultValue={item?.currency||'EUR'} className={input}/></Field>
      <Field label="Pricing type"><select name="pricingType" defaultValue={item?.pricingType||'fixed'} className={input}><option value="per_person">Per participant / unit</option><option value="per_group">Per group</option><option value="fixed">Fixed booking price</option><option value="on_request">On request</option></select></Field>
      <Field label="Meeting point"><input name="meetingPoint" defaultValue={item?.meetingPoint||''} className={input}/></Field>
    </Grid>
      <Field label="Included — one per line"><textarea name="included" rows={3} defaultValue={item?.included.join('\n')||''} className={`${input} py-3`}/></Field>
      <Field label="Excluded — one per line"><textarea name="excluded" rows={3} defaultValue={item?.excluded.join('\n')||''} className={`${input} py-3`}/></Field>
      <Field label="Important notes — one per line"><textarea name="notes" rows={3} defaultValue={item?.notes.join('\n')||''} className={`${input} py-3`}/></Field>
      <Field label="Booking notice"><textarea name="bookingNotice" rows={3} defaultValue={item?.bookingNotice||''} className={`${input} py-3`}/></Field>
    </Section>
    <Section title="Availability & booking">
      <div className="grid gap-4 sm:grid-cols-2"><Check name="bookable" label="Bookable as a room add-on" checked={item?.bookable??true}/><Check name="bookIndependently" label="Allow standalone booking" checked={item?.bookIndependently??false}/></div>
      <p className="text-sm text-slate-500">Standalone booking appears publicly only when both options are enabled. Every route reserves the same capacity.</p>
      <Grid>
        <Field label="Availability mode"><select name="availabilityMode" defaultValue={item?.availabilityMode||'on_request'} className={input}><option value="always">Operating schedule</option><option value="specific_dates">Specific dates / overrides</option><option value="recurring">Recurring schedule</option><option value="on_request">On request</option></select></Field>
        <Field label="Minimum quantity" error={state.errors?.quantity}><input name="minimumQuantity" type="number" min="1" defaultValue={item?.minimumQuantity||1} className={input}/></Field>
        <Field label="Maximum quantity" error={state.errors?.quantity}><input name="maximumQuantity" type="number" min="1" defaultValue={item?.maximumQuantity||''} className={input}/></Field>
        <Field label="Booking cutoff (hours)" error={state.errors?.availability}><input name="bookingCutoffHours" type="number" min="0" defaultValue={item?.bookingCutoffHours||0} className={input}/></Field>
        <Field label="Active from" error={state.errors?.availability}><input name="activeDateStart" type="date" defaultValue={item?.activeDateStart||''} className={input}/></Field>
        <Field label="Active until"><input name="activeDateEnd" type="date" defaultValue={item?.activeDateEnd||''} className={input}/></Field>
      </Grid>
      <div><p className="text-sm font-semibold text-slate-800">Operating days</p><div className="mt-2 grid gap-2 sm:grid-cols-4">{days.map(([value,label])=><label key={value} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm"><input type="checkbox" name="operatingDays" value={value} defaultChecked={(item?.operatingDays||[0,1,2,3,4,5,6]).includes(value)}/>{label}</label>)}</div></div>
      <Grid>
        <Field label="Operating start" error={state.errors?.availability}><input name="operatingStartTime" type="time" defaultValue={item?.operatingStartTime||''} className={input}/></Field>
        <Field label="Operating end"><input name="operatingEndTime" type="time" defaultValue={item?.operatingEndTime||''} className={input}/></Field>
        <Field label="Slot interval (minutes)" hint="Leave blank for a flexible-time experience."><input name="slotIntervalMinutes" type="number" min="5" step="5" defaultValue={item?.slotIntervalMinutes||''} className={input}/></Field>
      </Grid>
    </Section>
    <details className="rounded-2xl border border-slate-200 bg-white"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-6 text-xl font-bold">Advanced search settings <span aria-hidden="true" className="text-slate-400">⌄</span></summary><div className="space-y-5 border-t border-slate-100 p-6"><Field label="Search title"><input name="seoTitle" maxLength={70} defaultValue={item?.seoTitle||''} className={input}/></Field><Field label="Search description"><textarea name="seoDescription" maxLength={180} rows={3} defaultValue={item?.seoDescription||''} className={`${input} py-3`}/></Field></div></details>
    <Section title="Visibility"><div className="grid gap-4 sm:grid-cols-2"><Check name="active" label="Active" checked={item?.active??true}/><Check name="featured" label="Featured" checked={item?.featured??false}/></div></Section>
    <div className="admin-form-actions sticky bottom-3 z-10 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><p role="status" className={state.ok?'text-sm text-emerald-700':'text-sm text-red-700'}>{state.message}</p><div className="grid grid-cols-2 gap-2"><button name="status" value="draft" disabled={pending} className="min-h-11 rounded-lg border border-slate-300 px-4 font-semibold">Save draft</button><button name="status" value="published" disabled={pending} className="min-h-11 rounded-lg bg-slate-950 px-4 font-semibold text-white">Save & publish</button></div></div>
  </form>;
}

function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">{title}</h2>{children}</section>}
function Grid({children}:{children:React.ReactNode}){return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>}
function Field({label,error,hint,children}:{label:string;error?:string;hint?:string;children:React.ReactNode}){return <label className="block text-sm font-semibold text-slate-800">{label}{children}{hint&&<span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{hint}</span>}{error&&<span className="mt-1 block text-xs text-red-700">{error}</span>}</label>}
function Check({name,label,checked}:{name:string;label:string;checked:boolean}){return <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-4 font-semibold"><input name={name} type="checkbox" defaultChecked={checked}/>{label}</label>}
