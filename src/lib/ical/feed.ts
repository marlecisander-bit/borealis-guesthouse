export interface ExportCalendarEvent { uid: string; start_date: string; end_date: string; summary: string; }
const day = (value:string) => value.replaceAll('-','');
const escape = (value:string) => value.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');

export function buildICalendar(events: ExportCalendarEvent[], now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Borealis Guest House//Availability//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Borealis Availability'];
  for (const event of events) lines.push(
    'BEGIN:VEVENT',
    `UID:${escape(event.uid)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day(event.start_date)}`,
    `DTEND;VALUE=DATE:${day(event.end_date)}`,
    `SUMMARY:${escape(event.summary || 'Reserved')}`,
    'TRANSP:OPAQUE',
    'STATUS:CONFIRMED',
    'END:VEVENT',
  );
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

