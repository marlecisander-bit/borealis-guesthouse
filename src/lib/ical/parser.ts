export interface ParsedCalendarEvent {
  uid: string;
  start_date: string;
  end_date: string;
  summary: string;
  description: string;
  status: 'active' | 'cancelled';
}

function text(value: string) {
  return value.replace(/\\[nN]/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
}

function date(value: string) {
  const match = value.trim().match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  const result = `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(`${result}T00:00:00Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0,10) !== result ? null : result;
}

/** Parse the all-day VEVENT subset used by accommodation channel iCal feeds. */
export function parseICalendar(source: string): ParsedCalendarEvent[] {
  if (source.length > 2_000_000) throw new Error('Calendar feed is larger than 2 MB.');
  const unfolded = source.replace(/\r?\n[ \t]/g, '');
  if (!/(^|\r?\n)BEGIN:VCALENDAR(\r?\n|$)/i.test(unfolded)) throw new Error('The URL did not return a valid iCalendar feed.');
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi) || [];
  const events = new Map<string, ParsedCalendarEvent>();
  for (const block of blocks) {
    const values = new Map<string,string>();
    for (const line of block.split(/\r?\n/)) {
      const separator = line.indexOf(':');
      if (separator < 1) continue;
      const key = line.slice(0,separator).split(';')[0].toUpperCase();
      values.set(key,line.slice(separator+1));
    }
    const uid = text(values.get('UID') || '');
    const start = date(values.get('DTSTART') || '');
    const end = date(values.get('DTEND') || '');
    if (uid.length > 500) throw new Error('Calendar event UID is too long.');
    if (!uid || !start || !end || end <= start) continue;
    events.set(uid, {
      uid,
      start_date: start,
      end_date: end,
      summary: text(values.get('SUMMARY') || ''),
      description: text(values.get('DESCRIPTION') || ''),
      status: (values.get('STATUS') || '').toUpperCase() === 'CANCELLED' ? 'cancelled' : 'active',
    });
  }
  return [...events.values()];
}
