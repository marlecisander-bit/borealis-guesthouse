export type CalendarProvider = 'booking_com' | 'airbnb' | 'other';
export type CalendarDirection = 'import' | 'export' | 'both';
export type CalendarSyncStatus = 'never' | 'syncing' | 'success' | 'error';

export interface ExternalCalendarAdmin {
  id: string;
  provider: CalendarProvider;
  name: string;
  direction: CalendarDirection;
  enabled: boolean;
  roomId: string | null;
  roomTypeId: string | null;
  targetName: string;
  importHost: string;
  exportUrl: string;
  lastSyncedAt: string | null;
  lastSyncStatus: CalendarSyncStatus;
  lastSyncError: string;
  activeEventCount: number;
}

export interface CalendarTarget { id: string; name: string; }
export interface ChannelActionState { ok: boolean; message: string; errors?: Record<string,string>; }

