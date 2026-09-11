import 'server-only';
import type { NotificationChannel, NotificationEmail } from '@/types/notifications';

export class ResendEmailChannel implements NotificationChannel {
  readonly name = 'email' as const;

  async send(recipient: string, notification: NotificationEmail) {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!key || !from) throw new Error('Email provider is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL.');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: notification.subject,
        html: notification.html,
        text: notification.text,
        ...(notification.replyTo ? { reply_to: notification.replyTo } : {}),
      }),
    });
    const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };
    if (!response.ok) throw new Error(payload.message || `Email provider returned ${response.status}.`);
    return { providerId: payload.id };
  }
}

