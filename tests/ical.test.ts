import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseICalendar } from '../src/lib/ical/parser.ts';
import { buildICalendar } from '../src/lib/ical/feed.ts';

test('parses an all-day channel event with exclusive checkout',async()=>{
  const feed=await readFile(new URL('./fixtures/sample-external-calendar.ics',import.meta.url),'utf8');
  assert.deepEqual(parseICalendar(feed),[{uid:'booking-com-123@example.test',start_date:'2027-10-10',end_date:'2027-10-13',summary:'Reserved',description:'External reservation',status:'active'}]);
});
test('unfolds lines, handles cancellation, and deduplicates a repeated UID',()=>{
  const feed='BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:same\r\nDTSTART;VALUE=DATE:20270101\r\nDTEND;VALUE=DATE:20270103\r\nSUMMARY:First\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:same\r\nDTSTART;VALUE=DATE:20270201\r\nDTEND;VALUE=DATE:20270202\r\nSUMMARY:Changed and \r\n folded\r\nSTATUS:CANCELLED\r\nEND:VEVENT\r\nEND:VCALENDAR';
  const events=parseICalendar(feed);assert.equal(events.length,1);assert.equal(events[0].start_date,'2027-02-01');assert.equal(events[0].summary,'Changed and folded');assert.equal(events[0].status,'cancelled');
});
test('builds a valid privacy-safe export without guest data',()=>{
  const feed=buildICalendar([{uid:'booking-safe@borealis',start_date:'2027-05-01',end_date:'2027-05-03',summary:'Borealis Booking'}],new Date('2026-09-04T12:00:00Z'));
  assert.match(feed,/DTSTART;VALUE=DATE:20270501/);assert.match(feed,/DTEND;VALUE=DATE:20270503/);assert.match(feed,/SUMMARY:Borealis Booking/);assert.doesNotMatch(feed,/email|phone|payment|internal note/i);
});

