import { getCurrentAdmin } from '@/lib/admin/auth';
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { bookingPushConfig } from '@/lib/notifications/push-config';
import { validPushEndpoint, validPushSubscription } from '@/lib/notifications/push-contract';

export const runtime='nodejs';
const response=(data:object,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});

export async function POST(request:Request) {
  const url=new URL(request.url);
  // Next normalizes local loopback URLs to localhost. Use the actual Host for
  // loopback development and the configured canonical origin for production.
  const host=request.headers.get('host')||'';
  const origin=process.env.NODE_ENV==='production'&&process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(host) ? url.protocol+'//'+host : url.origin;
  if(request.headers.get('origin')!==origin)return response({error:'Invalid origin.'},403);
  const session=await getCurrentAdmin();
  if(!session||!['owner','manager','staff'].includes(session.role))return response({error:'Sign in with an eligible Borealis account.'},403);
  const config=bookingPushConfig();
  try{
    if(Number(request.headers.get('content-length')||0)>4096)return response({error:'Device request too large.'},413);
    const reader=request.body?.getReader();
    if(!reader)return response({error:'Invalid device request.'},400);
    const decoder=new TextDecoder();
    let body='',size=0;
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      size+=value.byteLength;
      if(size>4096){await reader.cancel();return response({error:'Device request too large.'},413);}
      body+=decoder.decode(value,{stream:true});
    }
    body+=decoder.decode();
    const data=JSON.parse(body) as {action?:string;endpoint?:unknown;subscription?:unknown}|null;
    const action=data?.action;
    if(!action||!['enable','status','disable','test'].includes(action))return response({error:'Invalid device action.'},400);
    if((action==='enable'||action==='test')&&!config)return response({error:'Booking push is not configured.'},503);
    const subscription=validPushSubscription(data.subscription)?data.subscription:null;
    const endpoint=action==='enable'?subscription?.endpoint:data.endpoint;
    if(!validPushEndpoint(endpoint))return response({error:'This push subscription is unsupported.'},400);
    const db=createServiceSupabaseClient();
    const result=await db.rpc('manage_booking_push_device',{
      property:session.propertyId,actor:session.userId,action,device_endpoint:endpoint,
      device_key:subscription?.keys.p256dh??null,device_auth:subscription?.keys.auth??null,
    });
    if(result.error||!result.data)return response({error:'Device registration could not be verified.'},503);
    if(result.data.conflict)return response({error:'This subscription is assigned to another account. Reset the device subscription and enable push again.',code:'device_conflict'},409);
    if(action==='test'&&!result.data.enabled)return response({error:'Enable this device before sending a test.'},409);
    return response(result.data);
  }catch{
    return response({error:'Unable to process the device request.'},503);
  }
}
