import 'server-only';
import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

function privateAddress(address:string) {
  const lower=address.toLowerCase();
  if (lower==='::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:')) return true;
  const mapped=lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  const value=mapped||address;
  if (isIP(value)!==4) return false;
  const [a,b]=value.split('.').map(Number);
  return a===10 || a===127 || a===0 || (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&b===168) || a>=224;
}

async function validateRemoteUrl(raw:string) {
  let url:URL;
  try { url=new URL(raw); } catch { throw new Error('The calendar URL is invalid.'); }
  if (url.protocol!=='https:' || url.username || url.password || (url.port && url.port!=='443')) throw new Error('Calendar imports require a standard HTTPS URL.');
  const host=url.hostname.toLowerCase();
  if (host==='localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Private network calendar URLs are not allowed.');
  const addresses=isIP(host)?[{address:host}]:await lookup(host,{all:true,verbatim:true});
  if (!addresses.length || addresses.some(item=>privateAddress(item.address))) throw new Error('Private network calendar URLs are not allowed.');
  return url;
}

export async function downloadCalendarFeed(rawUrl:string) {
  const url=await validateRemoteUrl(rawUrl);
  const response=await fetch(url,{headers:{accept:'text/calendar, text/plain;q=0.9','user-agent':'Borealis-Calendar-Sync/1.0'},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15_000)});
  if (!response.ok) throw new Error(`Calendar provider returned HTTP ${response.status}.`);
  const declared=Number(response.headers.get('content-length')||0);
  if (declared>2_000_000) throw new Error('Calendar feed is larger than 2 MB.');
  const body=await response.text();
  if (body.length>2_000_000) throw new Error('Calendar feed is larger than 2 MB.');
  return body;
}

