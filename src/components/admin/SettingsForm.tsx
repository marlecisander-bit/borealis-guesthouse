'use client';
import { useActionState, useState } from 'react';
import { saveSettings } from '@/app/admin/settings/actions';
import type { SettingsDashboard, SettingsFormState } from '@/types/settings';
import { CurrencySelect } from '@/components/admin/CurrencySelect';
import { isGoogleMapsUrl } from '@/lib/google-maps';

const initial: SettingsFormState = { ok: false, message: '' };
const input = 'mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4';

export function SettingsForm({ data }: { data: SettingsDashboard }) {
  const [state, action, pending] = useActionState(saveSettings, initial);
  const s = data.settings;
  const [mapsUrl, setMapsUrl] = useState(s.mapsUrl);
  const error = (key: string) => state.errors?.[key];
  return <form action={action} className="space-y-6">
    <Section title="Property">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Property name" error={error('name')}><input name="name" defaultValue={s.name} className={input}/></Field>
        <Field label="Legal / business name (optional)"><input name="legalName" defaultValue={s.legalName} className={input}/></Field>
        <Field label="Phone"><input name="phone" type="tel" defaultValue={s.phone} className={input}/></Field>
        <Field label="WhatsApp"><input name="whatsapp" defaultValue={s.whatsapp} className={input}/></Field>
        <Field label="Email" error={error('email')}><input name="email" type="email" defaultValue={s.email} className={input}/></Field>
        <Field label="Instagram"><input name="instagram" type="url" defaultValue={s.instagram} className={input}/></Field>
        <Field label="Facebook (optional)"><input name="facebook" type="url" defaultValue={s.facebook} className={input}/></Field>
      </div>
      <Field label="Short description"><textarea name="description" rows={3} defaultValue={s.description} className={`${input} py-3`}/></Field>
      <Field label="Address"><textarea name="address" rows={2} defaultValue={s.address} className={`${input} py-3`}/></Field>
      <Field label="Google Maps location link" error={error('mapsUrl')} help="Paste the Google Maps share link for Borealis Guest House. This location will be used for the map shown on the public website."><input name="mapsUrl" type="url" inputMode="url" value={mapsUrl} onChange={event=>setMapsUrl(event.target.value)} placeholder="https://maps.app.goo.gl/..." className={input}/>{isGoogleMapsUrl(mapsUrl)&&<a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-[#164b59] underline underline-offset-4">Preview map</a>}</Field>
      <div className="grid gap-5 sm:grid-cols-2"><Field label="Latitude (optional)" error={error('latitude')}><input name="latitude" type="number" step="0.000001" defaultValue={s.latitude} className={input}/></Field><Field label="Longitude (optional)" error={error('longitude')}><input name="longitude" type="number" step="0.000001" defaultValue={s.longitude} className={input}/></Field></div>
    </Section>
    <Section title="Stay settings">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><Field label="Check-in time"><input name="checkIn" type="time" defaultValue={s.checkIn} className={input}/></Field><Field label="Check-out time"><input name="checkOut" type="time" defaultValue={s.checkOut} className={input}/></Field><Field label="Currency" error={error('currency')}><CurrencySelect defaultValue={s.currency} className={input}/></Field><Field label="Timezone"><input name="timezone" defaultValue={s.timezone} placeholder="Europe/Tirane" className={input}/></Field><Field label="Maximum guests default" error={error('maximumGuests')}><input name="maximumGuests" type="number" min="1" defaultValue={s.maximumGuests} className={input}/></Field></div>
      <Field label="Booking notice defaults"><textarea name="bookingNotice" rows={3} defaultValue={s.bookingNotice} className={`${input} py-3`}/></Field>
    </Section>
    <Section title="Booking settings">
      <div className="grid gap-5 sm:grid-cols-2"><Field label="Booking mode"><select name="bookingMode" defaultValue={s.bookingMode} className={input}><option value="request">Booking request</option><option value="instant">Instant booking</option></select></Field><Field label="Booking hold duration (minutes)" error={error('booking')}><input name="holdMinutes" type="number" min="1" defaultValue={s.holdMinutes} className={input}/></Field><Field label="Minimum advance notice (hours)"><input name="minimumAdvanceHours" type="number" min="0" defaultValue={s.minimumAdvanceHours} className={input}/></Field><Field label="Maximum booking horizon (days)"><input name="maximumHorizonDays" type="number" min="1" defaultValue={s.maximumHorizonDays} className={input}/></Field></div>
      <Field label="Default cancellation policy reference"><textarea name="cancellationPolicy" rows={3} defaultValue={s.cancellationPolicy} placeholder="Policy name, URL or short reference" className={`${input} py-3`}/></Field>
    </Section>
    <Section title="Guest age policy">
      <p className="text-sm leading-6 text-slate-500">These age bands appear in the public guest selector. The minimum booking-holder age is separate from room occupancy.</p>
      <div className="grid gap-5 sm:grid-cols-3"><Field label="Infant maximum age" error={error('infantMaxAge')} help={`Infants: ages 0–${s.infantMaxAge}`}><input name="infantMaxAge" type="number" min="0" defaultValue={s.infantMaxAge} className={input}/></Field><Field label="Child maximum age" error={error('childMaxAge')} help={`Children: ages ${s.infantMaxAge+1}–${s.childMaxAge}`}><input name="childMaxAge" type="number" min="1" defaultValue={s.childMaxAge} className={input}/></Field><Field label="Minimum booking-holder age" error={error('minimumBookingHolderAge')} help="This does not change the adult occupancy category."><input name="minimumBookingHolderAge" type="number" min="18" defaultValue={s.minimumBookingHolderAge} className={input}/></Field></div>
      <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Adult occupancy category: age {s.childMaxAge+1}+. Every booking and every room that requires an adult is validated separately.</p>
    </Section>
    <Section title="Payment settings">
      <p className="text-sm text-slate-500">These controls describe accepted payment flows. No payment provider or secret credentials are configured in this form.</p>
      <div className="grid gap-3 sm:grid-cols-3"><Check name="payAtProperty" label="Pay at property" checked={s.payAtProperty}/><Check name="depositEnabled" label="Deposit enabled" checked={s.depositEnabled}/><Check name="onlinePaymentEnabled" label="Full online payment" checked={s.onlinePaymentEnabled} disabled={!data.paymentProviderConfigured}/></div>
      <Field label="Deposit percentage" error={error('depositPercentage')}><input name="depositPercentage" type="number" min="0" max="100" step="1" defaultValue={s.depositPercentage} className={input}/></Field>
      {!data.paymentProviderConfigured && <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">Full online payment remains disabled because no payment provider is configured securely in the server environment.</p>}
    </Section>
    <Section title="Notifications">
      <p className="text-sm text-slate-500">In-app alerts are private to this property. Email provider credentials remain in secure server environment variables.</p>
      <div className="grid gap-5 sm:grid-cols-2"><Field label="Primary notification email" error={error('notificationEmail')}><input name="notificationEmail" type="email" defaultValue={s.notificationEmail} className={input}/></Field><Field label="Reply-to email" error={error('replyToEmail')}><input name="replyToEmail" type="email" defaultValue={s.replyToEmail} className={input}/></Field></div>
      <Field label="Additional recipient emails" error={error('additionalNotificationEmails')}><textarea name="additionalNotificationEmails" rows={2} defaultValue={s.additionalNotificationEmails} placeholder="manager@example.com, reception@example.com" className={`${input} py-3`}/></Field>
      <div className="grid gap-3 sm:grid-cols-2"><Check name="ownerNotificationEnabled" label="Send owner email notifications" checked={s.ownerNotificationEnabled}/><Check name="guestConfirmationEnabled" label="Send guest confirmations" checked={s.guestConfirmationEnabled}/></div>
      <div><h3 className="mb-3 text-sm font-bold text-[#164b59]">Notify the owner about</h3><div className="grid gap-3 sm:grid-cols-3"><Check name="notifyBookingCreated" label="New booking" checked={s.notifyBookingCreated}/><Check name="notifyBookingCancelled" label="Booking cancelled" checked={s.notifyBookingCancelled}/><Check name="notifyBookingModified" label="Booking modified" checked={s.notifyBookingModified}/></div></div>
    </Section>
    <div className="sticky bottom-3 z-10 flex items-center justify-between rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"><p role="status" className={state.ok ? 'text-sm text-emerald-700' : 'text-sm text-red-700'}>{state.message}</p><button disabled={pending} className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white">{pending ? 'Saving…' : 'Save settings'}</button></div>
  </form>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">{title}</h2>{children}</section>; }
function Field({ label, error, help, children }: { label: string; error?: string; help?: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold">{label}{children}{help&&<span className="mt-2 block text-xs font-normal leading-5 text-slate-500">{help}</span>}{error && <span className="mt-1 block text-xs text-red-700">{error}</span>}</label>; }
function Check({ name, label, checked, disabled = false }: { name: string; label: string; checked: boolean; disabled?: boolean }) { return <label className={`flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-4 font-semibold ${disabled ? 'bg-slate-50 text-slate-400' : ''}`}>{disabled && checked && <input type="hidden" name={name} value="on"/>}<input name={name} type="checkbox" defaultChecked={checked} disabled={disabled}/>{label}</label>; }
