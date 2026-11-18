'use client';
import { useActionState, useState, useRef } from 'react';
import { saveSettings } from '@/app/admin/settings/actions';
import type { SettingsDashboard, SettingsFormState } from '@/types/settings';
import { CurrencySelect } from '@/components/admin/CurrencySelect';
import {EditorWorkspace,EditorPanel,useEditorForm} from './EditorWorkspace';
import Link from 'next/link';
import { isGoogleMapsUrl } from '@/lib/google-maps';

const settingsHashes:Record<string,string>={'property':'Property details','property-details':'Property details','booking-policies':'Booking policies','payments-fees':'Payments & fees','notification-preferences':'Notifications'};
const initial: SettingsFormState = { ok: false, message: '' };
const input = 'mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4';

export function SettingsForm({ data }: { data: SettingsDashboard }) {
  const [state, action, pending] = useActionState(saveSettings, initial);
  const editor=useEditorForm(state);
 const formRef=useRef<HTMLFormElement>(null);
  const s = data.settings;
  const [whatsapp,setWhatsApp] = useState(s.whatsapp);
  const [mapsUrl, setMapsUrl] = useState(s.mapsUrl);
  const error = (key: string) => state.errors?.[key];
  return <form ref={formRef} action={action} onChange={editor.onChange} onSubmit={editor.submit} className="space-y-5"><EditorWorkspace tabs={['Property details','Booking policies','Payments & fees','Notifications']} hashTabs={settingsHashes} trailing={<Link href="/admin/channels" className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-[#45656a]">Integrations</Link>}><EditorPanel name="Property details">
    <div id="property-details" className="scroll-mt-24"/><Section id="property" title="Property" description="Manage contact channels and location details shown across the website. Leave a channel blank to hide it.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Property name" error={error('name')}><input name="name" defaultValue={s.name} className={input}/></Field>
        <Field label="Legal / business name (optional)"><input name="legalName" defaultValue={s.legalName} className={input}/></Field>
        <Field label="Phone"><input name="phone" type="tel" defaultValue={s.phone} className={input}/></Field>
        <Field label="WhatsApp number" helpId="whatsapp-number-help" error={error('whatsapp')} help="Include the country code. +, spaces, parentheses and dashes are removed when saved. Leave blank to hide WhatsApp."><input name="whatsapp" aria-label="WhatsApp number" aria-describedby="whatsapp-number-help" aria-invalid={Boolean(error('whatsapp'))} type="tel" inputMode="tel" autoComplete="tel" value={whatsapp} onChange={event=>setWhatsApp(event.target.value)} className={input}/></Field>
        <Field label="Email" error={error('email')}><input name="email" type="email" defaultValue={s.email} className={input}/></Field>
        <Field label="Instagram"><input name="instagram" type="url" defaultValue={s.instagram} className={input}/></Field>
        <Field label="Facebook (optional)"><input name="facebook" type="url" defaultValue={s.facebook} className={input}/></Field>
      </div>
      <Field label="Short description"><textarea name="description" rows={3} defaultValue={s.description} className={`${input} py-3`}/></Field>
      <Field label="Address"><textarea name="address" rows={2} defaultValue={s.address} className={`${input} py-3`}/></Field>
      <Field label="Google Maps location link" error={error('mapsUrl')} help="Paste the Google Maps share link for Borealis Guest House. This location will be used for the map shown on the public website."><input name="mapsUrl" type="url" inputMode="url" value={mapsUrl} onChange={event=>setMapsUrl(event.target.value)} placeholder="https://maps.app.goo.gl/..." className={input}/>{isGoogleMapsUrl(mapsUrl)&&<a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-[#164b59] underline underline-offset-4">Preview map</a>}</Field>
      <details className="rounded-xl border border-slate-200"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold">Stored map coordinates <span aria-hidden="true">⌄</span></summary><div className="grid gap-5 border-t border-slate-100 p-4 sm:grid-cols-2"><Field label="Latitude (optional)" help="Stored for reference. The website uses the Google Maps link above." error={error('latitude')}><input name="latitude" type="number" step="0.000001" defaultValue={s.latitude} className={input}/></Field><Field label="Longitude (optional)" error={error('longitude')}><input name="longitude" type="number" step="0.000001" defaultValue={s.longitude} className={input}/></Field></div></details>
    </Section>
    </EditorPanel><EditorPanel name="Booking policies"><Section id="booking-policies" title="Booking policies" description="Stay booking rules and property information. Room guest limits are managed in Rooms.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><Field label="Check-in reference time" help="Stored for staff reference. Booking availability uses dates."><input name="checkIn" type="time" defaultValue={s.checkIn} className={input}/></Field><Field label="Check-out reference time" help="Stored for staff reference. Booking availability uses dates."><input name="checkOut" type="time" defaultValue={s.checkOut} className={input}/></Field><Field label="Currency" error={error('currency')}><CurrencySelect defaultValue={s.currency} className={input}/></Field></div>
      <Field label="Stay booking notice" help="Optional text shown above room booking. Leave blank to hide it."><textarea name="bookingNotice" rows={3} defaultValue={s.bookingNotice} className={`${input} py-3`}/></Field>
      <div className="grid gap-5 sm:grid-cols-2"><Field label="Public stay booking mode" help="Request mode creates a pending booking. Instant mode confirms an eligible stay. Manual bookings use the staff workflow."><select name="bookingMode" defaultValue={s.bookingMode} className={input}><option value="request">Booking request</option><option value="instant">Instant booking</option></select></Field><Field label="Cancellation policy text" help="Shown in Manage booking. Staff review remains the default unless automatic cutoffs are configured separately."><textarea name="cancellationPolicy" rows={2} defaultValue={s.cancellationPolicy} placeholder="Short cancellation policy" className={`${input} py-3`}/></Field></div>
      <h3 className="text-lg font-bold text-slate-950">Guest age groups</h3>
      <p className="text-sm leading-6 text-slate-500">These age bands appear in the public guest selector.</p>
      <div className="grid gap-5 sm:grid-cols-3"><Field label="Infant maximum age" error={error('infantMaxAge')} help={`Infants: ages 0–${s.infantMaxAge}`}><input name="infantMaxAge" type="number" min="0" defaultValue={s.infantMaxAge} className={input}/></Field><Field label="Child maximum age" error={error('childMaxAge')} help={`Children: ages ${s.infantMaxAge+1}–${s.childMaxAge}`}><input name="childMaxAge" type="number" min="1" defaultValue={s.childMaxAge} className={input}/></Field></div>
      <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Adult occupancy category: age {s.childMaxAge+1}+. Every booking and every room that requires an adult is validated separately.</p>
      <details className="rounded-xl border border-slate-200"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold">Advanced booking rules <span aria-hidden="true">⌄</span></summary><div className="grid gap-5 border-t border-slate-100 p-4 sm:grid-cols-2"><Field label="Stay inventory hold (minutes)" error={error('booking')}><input name="holdMinutes" type="number" min="1" defaultValue={s.holdMinutes} className={input}/></Field><Field label="Stay advance notice (hours)" help="Checked when the engine holds inventory."><input name="minimumAdvanceHours" type="number" min="0" defaultValue={s.minimumAdvanceHours} className={input}/></Field><Field label="Stay booking horizon (days)" help="Checked when the engine holds inventory."><input name="maximumHorizonDays" type="number" min="1" defaultValue={s.maximumHorizonDays} className={input}/></Field><Field label="Property timezone" help="Stored for reference. Changing this does not move existing reservations or alter booking cutoff calculations."><input name="timezone" defaultValue={s.timezone} placeholder="Europe/Tirane" className={input}/></Field></div></details>
    </Section>
    </EditorPanel><EditorPanel name="Payments & fees"><details open id="payments-fees" className="rounded-2xl border border-slate-200 bg-white"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-5 text-xl font-bold sm:px-6">Payment settings <span aria-hidden="true" className="text-slate-400">⌄</span></summary><div className="space-y-5 border-t border-slate-100 p-5 sm:p-6">
      <p className="text-sm text-slate-600">Stay booking uses pay at property. The website does not collect deposits or take online payments.</p>
      <p className="text-sm text-slate-600">Rental payment terms and manual receipts are managed in their own workflows.</p>
    </div></details>
    </EditorPanel><EditorPanel name="Notifications"><Section id="notification-preferences" title="Notification preferences" description="Choose which events create alerts and where owner email is sent. Recent activity and device enrollment are in Notifications.">
      <p className="text-sm text-slate-500">In-app alerts are private to this property. Email provider credentials remain in secure server environment variables.</p>
      <div className="grid gap-5 sm:grid-cols-2"><Field label="Primary notification email" error={error('notificationEmail')}><input name="notificationEmail" type="email" defaultValue={s.notificationEmail} className={input}/></Field><Field label="Reply-to email" error={error('replyToEmail')}><input name="replyToEmail" type="email" defaultValue={s.replyToEmail} className={input}/></Field></div>
      <Field label="Additional recipient emails" error={error('additionalNotificationEmails')}><textarea name="additionalNotificationEmails" rows={2} defaultValue={s.additionalNotificationEmails} placeholder="manager@example.com, reception@example.com" className={`${input} py-3`}/></Field>
      <div><Check name="ownerNotificationEnabled" label="Send owner email notifications" checked={s.ownerNotificationEnabled}/></div>
      <p className="text-sm text-slate-600">Guests receive an on-screen confirmation and private booking link. Automatic guest confirmation email is unavailable. Staff push enrollment is in Notifications.</p>
      <div><h3 className="mb-3 text-sm font-bold text-[#164b59]">Create booking alerts for</h3><div className="grid gap-3 sm:grid-cols-3"><Check name="notifyBookingCreated" label="New booking" checked={s.notifyBookingCreated}/><Check name="notifyBookingCancelled" label="Booking cancelled" checked={s.notifyBookingCancelled}/><Check name="notifyBookingModified" label="Booking modified" checked={s.notifyBookingModified}/></div></div>
      <a href="/admin/notifications" className="inline-flex min-h-11 items-center text-sm font-bold text-[#164b59] underline underline-offset-4">Open notification activity</a>
    </Section>
    </EditorPanel><div className="sticky bottom-3 z-10 flex items-center justify-between rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"><p role="status" className={state.ok ? 'text-sm text-emerald-700' : 'text-sm text-red-700'}>{state.message}</p><button disabled={pending} className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white">{pending ? 'Saving…' : 'Save settings'}</button></div>
  </EditorWorkspace></form>;
}

function Section({ id, title, description, children }: { id?:string; title:string; description?:string; children:React.ReactNode }) { return <section id={id} className="scroll-mt-24 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><header><h2 className="text-xl font-bold">{title}</h2>{description&&<p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}</header>{children}</section>; }
function Field({ label, error, help, helpId, children }: { label: string; error?: string; help?: string; helpId?:string; children: React.ReactNode }) { return <label className="block text-sm font-semibold">{label}{children}{help&&<span id={helpId} className="mt-2 block text-xs font-normal leading-5 text-slate-500">{help}</span>}{error && <span className="mt-1 block text-xs text-red-700">{error}</span>}</label>; }
function Check({ name, label, checked, disabled = false }: { name: string; label: string; checked: boolean; disabled?: boolean }) { return <label className={`flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-4 font-semibold ${disabled ? 'bg-slate-50 text-slate-400' : ''}`}>{disabled && checked && <input type="hidden" name={name} value="on"/>}<input name={name} type="checkbox" defaultChecked={checked} disabled={disabled}/>{label}</label>; }
