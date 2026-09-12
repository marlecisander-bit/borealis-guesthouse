import type { PropertySettings, SettingsFormState } from '@/types/settings';
import { isSupportedCurrency } from '../currencies.ts';
import { isGoogleMapsUrl } from '../google-maps.ts';

const text = (data: FormData, key: string) => String(data.get(key) || '').trim();
const number = (data: FormData, key: string, fallback = 0) => Number(text(data, key) || fallback);

export function validateSettings(data: FormData): { data?: PropertySettings; state?: SettingsFormState } {
  const value: PropertySettings = {
    name: text(data, 'name'), legalName: text(data, 'legalName'), description: text(data, 'description'),
    address: text(data, 'address'), mapsUrl: text(data, 'mapsUrl'), latitude: text(data, 'latitude'), longitude: text(data, 'longitude'),
    phone: text(data, 'phone'), whatsapp: text(data, 'whatsapp'), email: text(data, 'email'), instagram: text(data, 'instagram'), facebook: text(data, 'facebook'),
    checkIn: text(data, 'checkIn'), checkOut: text(data, 'checkOut'), currency: text(data, 'currency').toUpperCase(), timezone: text(data, 'timezone'),
    maximumGuests: number(data, 'maximumGuests', 4), bookingNotice: text(data, 'bookingNotice'), bookingMode: text(data, 'bookingMode') === 'instant' ? 'instant' : 'request',
    holdMinutes: number(data, 'holdMinutes', 15), minimumAdvanceHours: number(data, 'minimumAdvanceHours', 24), maximumHorizonDays: number(data, 'maximumHorizonDays', 365),
    infantMaxAge:number(data,'infantMaxAge',2),childMaxAge:number(data,'childMaxAge',12),minimumBookingHolderAge:number(data,'minimumBookingHolderAge',18),
    cancellationPolicy: text(data, 'cancellationPolicy'), payAtProperty: data.get('payAtProperty') === 'on', depositEnabled: data.get('depositEnabled') === 'on',
    depositPercentage: number(data, 'depositPercentage'), onlinePaymentEnabled: data.get('onlinePaymentEnabled') === 'on', notificationEmail: text(data, 'notificationEmail'), additionalNotificationEmails: text(data, 'additionalNotificationEmails'),
    replyToEmail: text(data, 'replyToEmail'), guestConfirmationEnabled: data.get('guestConfirmationEnabled') === 'on', ownerNotificationEnabled: data.get('ownerNotificationEnabled') === 'on',
    notifyBookingCreated: data.get('notifyBookingCreated') === 'on', notifyBookingCancelled: data.get('notifyBookingCancelled') === 'on', notifyBookingModified: data.get('notifyBookingModified') === 'on',
  };
  const errors: Record<string, string> = {};
  if (!value.name) errors.name = 'Property name is required.';
  if (value.email && !/^\S+@\S+\.\S+$/.test(value.email)) errors.email = 'Enter a valid email.';
  if (value.mapsUrl && !isGoogleMapsUrl(value.mapsUrl)) errors.mapsUrl = 'Please enter a valid Google Maps link.';
  if (value.notificationEmail && !/^\S+@\S+\.\S+$/.test(value.notificationEmail)) errors.notificationEmail = 'Enter a valid notification email.';
  const additional = value.additionalNotificationEmails.split(/[,;\n]+/).map(item => item.trim()).filter(Boolean);
  if (additional.some(email => !/^\S+@\S+\.\S+$/.test(email))) errors.additionalNotificationEmails = 'Separate valid email addresses with commas or new lines.';
  if (value.replyToEmail && !/^\S+@\S+\.\S+$/.test(value.replyToEmail)) errors.replyToEmail = 'Enter a valid reply-to email.';
  if (!isSupportedCurrency(value.currency)) errors.currency = 'Choose EUR, USD, GBP or ALL.';
  if (value.latitude && (Number(value.latitude) < -90 || Number(value.latitude) > 90)) errors.latitude = 'Latitude must be between -90 and 90.';
  if (value.longitude && (Number(value.longitude) < -180 || Number(value.longitude) > 180)) errors.longitude = 'Longitude must be between -180 and 180.';
  if (value.depositPercentage < 0 || value.depositPercentage > 100) errors.depositPercentage = 'Deposit percentage must be between 0 and 100.';
  if (value.maximumGuests < 1) errors.maximumGuests = 'Maximum guests must be at least 1.';
  if (value.holdMinutes < 1 || value.minimumAdvanceHours < 0 || value.maximumHorizonDays < 1) errors.booking = 'Enter valid booking limits.';
  if(!Number.isInteger(value.infantMaxAge)||value.infantMaxAge<0)errors.infantMaxAge='Infant maximum age must be zero or higher.';
  if(!Number.isInteger(value.childMaxAge)||value.childMaxAge<=value.infantMaxAge)errors.childMaxAge='Child maximum age must be greater than the infant maximum age.';
  if(!Number.isInteger(value.minimumBookingHolderAge)||value.minimumBookingHolderAge<18)errors.minimumBookingHolderAge='Booking holders must be at least 18.';
  return Object.keys(errors).length ? { state: { ok: false, message: 'Review the highlighted settings.', errors } } : { data: value };
}
