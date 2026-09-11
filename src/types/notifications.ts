export type NotificationType =
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_modified'
  | 'payment_received'
  | 'experience_activity_booked'
  | 'transfer_booked';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  bookingId: string | null;
  isRead: boolean;
  createdAt: string;
  deliveryStatus?: 'pending' | 'sent' | 'failed' | 'skipped' | null;
}

export interface NotificationDeliveryResult {
  providerId?: string;
}

export interface NotificationEmail {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface NotificationChannel {
  readonly name: 'email';
  send(recipient: string, notification: NotificationEmail): Promise<NotificationDeliveryResult>;
}

