import {occupancyLabel} from '../booking/occupancy.ts';
import {bookingSourceLabel} from '../booking/source-labels.ts';
import type {NotificationEmail,NotificationType} from '../../types/notifications.ts';

type Occupancy={adults:number;children:number;infants:number};
export interface BookingEmailData{
  type:NotificationType;reference:string;status:string;source:string;guestName:string;guestEmail:string;guestPhone:string;
  checkIn:string|null;checkOut:string|null;adults:number;children:number;infants?:number|null;totalGuests?:number|null;currency:string;total:number;roomTitle?:string;
  items:Array<{type:string;title:string;quantity:number;total:number;date?:string;time?:string;guestCount?:number;capacity?:number;occupancy?:Occupancy}>;bookingUrl:string;replyTo?:string;
}
const escapeHtml=(value:unknown)=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const money=(amount:number,currency:string)=>new Intl.NumberFormat('en',{style:'currency',currency,maximumFractionDigits:2}).format(amount);

export function bookingNotificationEmail(data:BookingEmailData):NotificationEmail{
  const roomItems=data.items.filter(item=>item.type==='room'),experienceOnly=!roomItems.length&&data.items.some(item=>item.type==='experience');
  const heading=data.type==='booking_cancelled'?(experienceOnly?'Experience booking cancelled':'Booking cancelled'):data.type==='booking_modified'?'Booking modified':experienceOnly?'New experience booking':'New booking received';
  const legacyTotal=data.adults+data.children;
  const party=data.totalGuests==null?`${legacyTotal} guest${legacyTotal===1?'':'s'}`:occupancyLabel({adults:data.adults,children:data.children,infants:data.infants||0});
  const lines=data.items.map(item=>{
    const detail=item.type==='room'?`1 room${item.occupancy?` · ${occupancyLabel(item.occupancy)}`:item.guestCount?` · ${item.guestCount} guest(s)`:''}${item.capacity?` · capacity ${item.capacity}`:''}`:`${item.quantity} ${item.type==='transfer'?'passenger(s)':'participant(s)'}${item.date?` · ${item.date}`:''}${item.time?` at ${item.time}`:''}`;
    return `<tr><td style="padding:12px 0;border-bottom:1px solid #dce8e5"><strong>${escapeHtml(item.title)}</strong><br><span style="color:#5d6f72;font-size:13px">${escapeHtml(item.type)} · ${escapeHtml(detail)}</span></td><td style="padding:12px 0;border-bottom:1px solid #dce8e5;text-align:right;font-weight:600">${escapeHtml(money(item.total,data.currency))}</td></tr>`;
  }).join('');
  const stay=roomItems.length&&data.checkIn&&data.checkOut?`<td style="width:50%;vertical-align:top;padding-bottom:18px"><span style="color:#667">Stay</span><br><strong>${escapeHtml(data.checkIn)} → ${escapeHtml(data.checkOut)}</strong><br>${escapeHtml(party)}</td>`:'';
  const room=roomItems.length?`<div><span style="color:#667">Rooms</span><br><strong>${roomItems.length} room${roomItems.length===1?'':'s'}</strong></div>`:'';
  const html=`<!doctype html><html><body style="margin:0;background:#eef5f3;font-family:Arial,sans-serif;color:#123c45"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:28px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:auto;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:#164b59;color:#fff;padding:28px"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#b9ded9">Borealis Guest House</div><h1 style="margin:10px 0 0;font-family:Georgia,serif;font-size:32px">${escapeHtml(heading)}</h1><p style="margin:10px 0 0;color:#dcecea">${escapeHtml(data.reference)} · ${escapeHtml(data.status.replaceAll('_',' '))}</p></td></tr><tr><td style="padding:28px"><table role="presentation" width="100%" style="line-height:1.55"><tr><td style="width:50%;vertical-align:top;padding-bottom:18px"><span style="color:#667">Guest</span><br><strong>${escapeHtml(data.guestName)}</strong><br>${escapeHtml(data.guestEmail)}<br>${escapeHtml(data.guestPhone)}</td>${stay}</tr><tr>${room?`<td style="vertical-align:top;padding-bottom:18px">${room}</td>`:''}<td style="vertical-align:top;padding-bottom:18px"><span style="color:#667">Source</span><br><strong>${escapeHtml(bookingSourceLabel(data.source))}</strong></td></tr></table><h2 style="font-family:Georgia,serif;margin:8px 0">${experienceOnly?'Experience':'Complete package'}</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${lines||'<tr><td style="padding:12px 0">No line items recorded.</td></tr>'}</table><p style="font-size:20px;text-align:right"><strong>Total: ${escapeHtml(money(data.total,data.currency))}</strong></p><p style="margin:26px 0 4px"><a href="${escapeHtml(data.bookingUrl)}" style="display:inline-block;background:#164b59;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700">View booking</a></p></td></tr></table></td></tr></table></body></html>`;
  const itemText=data.items.map(item=>`- ${item.title} (${item.type}, ${item.occupancy?occupancyLabel(item.occupancy):`quantity ${item.quantity}`}${item.date?`, ${item.date}`:''}${item.time?` at ${item.time}`:''}): ${money(item.total,data.currency)}`).join('\n');
  const stayText=roomItems.length&&data.checkIn&&data.checkOut?`\nStay: ${data.checkIn} to ${data.checkOut}\nGuests: ${party}\nRooms: ${roomItems.length}`:'';
  return{subject:`${heading}: ${data.reference}`,html,text:`${heading}\n${data.reference}\n\nGuest: ${data.guestName}\nEmail: ${data.guestEmail}\nPhone: ${data.guestPhone}${stayText}\nSource: ${bookingSourceLabel(data.source)}\n\n${itemText}\n\nTotal: ${money(data.total,data.currency)}\n\nView booking: ${data.bookingUrl}`,replyTo:data.replyTo||undefined};
}
