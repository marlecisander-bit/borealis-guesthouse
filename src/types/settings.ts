export interface PropertySettings {
  name:string; legalName:string; description:string; address:string; mapsUrl:string; latitude:string; longitude:string;
  phone:string; whatsapp:string; email:string; instagram:string; facebook:string; checkIn:string; checkOut:string;
  currency:string; timezone:string; maximumGuests:number; bookingNotice:string; bookingMode:'instant'|'request';
  holdMinutes:number; minimumAdvanceHours:number; maximumHorizonDays:number; cancellationPolicy:string;
  payAtProperty:boolean; depositEnabled:boolean; depositPercentage:number; onlinePaymentEnabled:boolean;
  defaultLanguageId:string; defaultSeoMediaId:string; defaultContactCta:string;
  notificationEmail:string; additionalNotificationEmails:string; replyToEmail:string;
  guestConfirmationEnabled:boolean; ownerNotificationEnabled:boolean;
  notifyBookingCreated:boolean; notifyBookingCancelled:boolean; notifyBookingModified:boolean;
}
export interface SettingsOption{id:string;label:string}
export interface SettingsDashboard{settings:PropertySettings;propertyPublished:boolean;languages:SettingsOption[];media:SettingsOption[];paymentProviderConfigured:boolean}
export interface SettingsFormState{ok:boolean;message:string;errors?:Record<string,string>}
