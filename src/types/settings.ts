export interface PropertySettings {
  name:string; legalName:string; description:string; address:string; mapsUrl:string; latitude:string; longitude:string;
  phone:string; whatsapp:string; email:string; instagram:string; facebook:string; checkIn:string; checkOut:string;
  currency:string; timezone:string; maximumGuests:number; bookingNotice:string; bookingMode:'instant'|'request';
  holdMinutes:number; minimumAdvanceHours:number; maximumHorizonDays:number; cancellationPolicy:string;
  infantMaxAge:number;childMaxAge:number;minimumBookingHolderAge:number;
  payAtProperty:boolean; depositEnabled:boolean; depositPercentage:number; onlinePaymentEnabled:boolean;
  notificationEmail:string; additionalNotificationEmails:string; replyToEmail:string;
  guestConfirmationEnabled:boolean; ownerNotificationEnabled:boolean;
  notifyBookingCreated:boolean; notifyBookingCancelled:boolean; notifyBookingModified:boolean;
}
export interface SettingsDashboard{settings:PropertySettings;propertyPublished:boolean;paymentProviderConfigured:boolean}
export interface SettingsFormState{ok:boolean;message:string;errors?:Record<string,string>}
