import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminSession } from '@/lib/admin/auth';
import type { PropertySettings, SettingsDashboard } from '@/types/settings';

const keys = ['maximum_guests','booking_notice_default','booking_mode','booking_hold_minutes','minimum_advance_hours','maximum_booking_horizon_days','cancellation_policy_reference','pay_at_property_enabled','deposit_enabled','deposit_percentage','full_online_payment_enabled','default_language_id','seo_default_og','default_contact_cta','booking_notification_email','owner_notification_additional_emails','reply_to_email','guest_confirmation_enabled','owner_notification_enabled','notify_booking_created','notify_booking_cancelled','notify_booking_modified'];

export const adminSettingsRepository = {
  async get(session: AdminSession): Promise<SettingsDashboard> {
    const db = await createServerSupabaseClient();
    const [propertyResult, settingResult, languagesResult, mediaResult] = await Promise.all([
      db.from('properties').select('name,legal_name,description,address_line,location,google_maps_url,latitude,longitude,phone,whatsapp,email,instagram_url,facebook_url,check_in_time,check_out_time,currency,timezone,status').eq('id', session.propertyId).single(),
      db.from('site_settings').select('setting_key,value_text,value_number,value_boolean,media_asset_id').eq('property_id', session.propertyId).in('setting_key', keys),
      db.from('languages').select('id,label,native_name,is_default').eq('property_id', session.propertyId).eq('enabled', true).order('sort_order'),
      db.from('media_assets').select('id,title,filename,alt_text').eq('property_id', session.propertyId).neq('status', 'archived').order('sort_order'),
    ]);
    if (propertyResult.error) throw propertyResult.error;
    const property = propertyResult.data;
    const settings = new Map((settingResult.data || []).map(item => [item.setting_key, item]));
    const text = (key: string, fallback = '') => settings.get(key)?.value_text || fallback;
    const number = (key: string, fallback = 0) => settings.get(key)?.value_number == null ? fallback : Number(settings.get(key)?.value_number);
    const boolean = (key: string, fallback = false) => settings.get(key)?.value_boolean ?? fallback;
    const defaultLanguage = text('default_language_id') || (languagesResult.data || []).find(item => item.is_default)?.id || '';
    return {
      settings: {
        name: property.name, legalName: property.legal_name || '', description: property.description || '', address: property.address_line || property.location || '',
        mapsUrl: property.google_maps_url || '', latitude: property.latitude == null ? '' : String(property.latitude), longitude: property.longitude == null ? '' : String(property.longitude),
        phone: property.phone || '', whatsapp: property.whatsapp || '', email: property.email || '', instagram: property.instagram_url || '', facebook: property.facebook_url || '',
        checkIn: String(property.check_in_time || '14:00').slice(0, 5), checkOut: String(property.check_out_time || '11:00').slice(0, 5),
        currency: property.currency || 'EUR', timezone: property.timezone || 'Europe/Tirane', maximumGuests: number('maximum_guests', 4), bookingNotice: text('booking_notice_default'),
        bookingMode: text('booking_mode') === 'instant' ? 'instant' : 'request', holdMinutes: number('booking_hold_minutes', 15), minimumAdvanceHours: number('minimum_advance_hours', 24),
        maximumHorizonDays: number('maximum_booking_horizon_days', 365), cancellationPolicy: text('cancellation_policy_reference'), payAtProperty: boolean('pay_at_property_enabled', true),
        depositEnabled: boolean('deposit_enabled'), depositPercentage: number('deposit_percentage'), onlinePaymentEnabled: boolean('full_online_payment_enabled'),
        defaultLanguageId: defaultLanguage, defaultSeoMediaId: settings.get('seo_default_og')?.media_asset_id || '', defaultContactCta: text('default_contact_cta', 'Contact us'),
        notificationEmail: text('booking_notification_email', property.email || ''), additionalNotificationEmails: text('owner_notification_additional_emails'), replyToEmail: text('reply_to_email'), guestConfirmationEnabled: boolean('guest_confirmation_enabled', true),
        ownerNotificationEnabled: boolean('owner_notification_enabled', true), notifyBookingCreated: boolean('notify_booking_created', true),
        notifyBookingCancelled: boolean('notify_booking_cancelled', true), notifyBookingModified: boolean('notify_booking_modified', true),
      },
      propertyPublished: property.status === 'published',
      languages: (languagesResult.data || []).map(item => ({ id: item.id, label: item.native_name + ' (' + item.label + ')' })),
      media: (mediaResult.data || []).map(item => ({ id: item.id, label: item.alt_text || item.title || item.filename })),
      paymentProviderConfigured: Boolean(process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_PROVIDER_SECRET),
    };
  },

  async save(session: AdminSession, value: PropertySettings) {
    const db = await createServerSupabaseClient();
    const { error: propertyError } = await db.from('properties').update({
      name: value.name, legal_name: value.legalName || null, description: value.description, address_line: value.address, location: value.address,
      google_maps_url: value.mapsUrl || null, latitude: value.latitude ? Number(value.latitude) : null, longitude: value.longitude ? Number(value.longitude) : null,
      phone: value.phone || null, whatsapp: value.whatsapp || null, email: value.email || null, instagram_url: value.instagram || null, facebook_url: value.facebook || null,
      check_in_time: value.checkIn, check_out_time: value.checkOut, currency: value.currency, timezone: value.timezone,
      updated_by: session.userId,
    }).eq('id', session.propertyId);
    if (propertyError) throw propertyError;

    const entries: [string,string|null,number|null,boolean|null,string|null,boolean][] = [
      ['maximum_guests',null,value.maximumGuests,null,null,true], ['booking_notice_default',value.bookingNotice,null,null,null,true],
      ['booking_mode',value.bookingMode,null,null,null,true], ['booking_hold_minutes',null,value.holdMinutes,null,null,false],
      ['minimum_advance_hours',null,value.minimumAdvanceHours,null,null,true], ['maximum_booking_horizon_days',null,value.maximumHorizonDays,null,null,true],
      ['cancellation_policy_reference',value.cancellationPolicy,null,null,null,true], ['pay_at_property_enabled',null,null,value.payAtProperty,null,true],
      ['deposit_enabled',null,null,value.depositEnabled,null,true], ['deposit_percentage',null,value.depositPercentage,null,null,true],
      ['full_online_payment_enabled',null,null,value.onlinePaymentEnabled,null,true], ['default_language_id',value.defaultLanguageId,null,null,null,true],
      ['seo_default_og',null,null,null,value.defaultSeoMediaId || null,true], ['default_contact_cta',value.defaultContactCta,null,null,null,true],
      ['booking_notification_email',value.notificationEmail,null,null,null,false], ['owner_notification_additional_emails',value.additionalNotificationEmails,null,null,null,false], ['reply_to_email',value.replyToEmail,null,null,null,false],
      ['guest_confirmation_enabled',null,null,value.guestConfirmationEnabled,null,false], ['owner_notification_enabled',null,null,value.ownerNotificationEnabled,null,false],
      ['notify_booking_created',null,null,value.notifyBookingCreated,null,false], ['notify_booking_cancelled',null,null,value.notifyBookingCancelled,null,false],
      ['notify_booking_modified',null,null,value.notifyBookingModified,null,false],
    ];
    const rows = entries.map(([setting_key,value_text,value_number,value_boolean,media_asset_id,is_public]) => ({ property_id: session.propertyId, setting_key, value_text, value_number, value_boolean, media_asset_id, is_public, status: 'published', created_by: session.userId, updated_by: session.userId }));
    const { error } = await db.from('site_settings').upsert(rows, { onConflict: 'property_id,setting_key' });
    if (error) throw error;
    if (value.defaultLanguageId) {
      await db.from('languages').update({ is_default: false }).eq('property_id', session.propertyId);
      const { error: languageError } = await db.from('languages').update({ is_default: true, enabled: true }).eq('property_id', session.propertyId).eq('id', value.defaultLanguageId);
      if (languageError) throw languageError;
    }
  },
};
