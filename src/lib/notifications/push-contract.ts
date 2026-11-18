export type PushSubscriptionInput={endpoint:string;keys:{p256dh:string;auth:string}};

const providerHosts=new Set(['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','wns.windows.com']);
export function validPushEndpoint(value:unknown): value is string {
  if(typeof value!=='string'||!/^https:\/\/[a-z0-9.-]+\//i.test(value)||value.length>2048||/[\s\\]/.test(value))return false;
  try{
    const url=new URL(value),host=url.hostname;
    return !url.username&&!url.password&&!url.port&&!url.hash&&url.pathname.length>1
      &&(providerHosts.has(host)||host.endsWith('.push.apple.com')||host.endsWith('.notify.windows.com'));
  }catch{return false;}
}
export function validPushSubscription(value:unknown):value is PushSubscriptionInput {
  if(!value||typeof value!=='object')return false;
  const {endpoint,keys}=value as Partial<PushSubscriptionInput>;
  return validPushEndpoint(endpoint)&&typeof keys?.p256dh==='string'&&/^B[A-Za-z0-9_-]{86}$/.test(keys.p256dh)
    &&typeof keys.auth==='string'&&/^[A-Za-z0-9_-]{22}$/.test(keys.auth);
}
const titles:Record<string,string>={
  booking_created:'New Borealis booking',
  booking_modified:'Booking modified',
  booking_cancelled:'Booking cancelled',
  test:'Borealis test notification',
};
export function bookingPushPayload(type:string,bookingId:string|null,tag:string){
  const booking=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(bookingId||'');
  return JSON.stringify({
    title:titles[type]||'Borealis booking activity',
    body:type==='test'?'Push is working on this device.':'Open the Borealis admin to see details.',
    path:booking?'/admin/bookings/'+bookingId:'/admin/notifications',tag,
  });
}
export function pushFailure(error:unknown){
  const status=(error as {statusCode?:number}|null)?.statusCode;
  if(status===404||status===410)return {outcome:'expired',code:'subscription_expired'};
  if(status===429||(typeof status==='number'&&status>=500))return {outcome:'retry',code:'provider_temporary'};
  if(typeof status==='number')return {outcome:'failed',code:'provider_rejected'};
  return {outcome:'uncertain',code:'acceptance_unknown'};
}
