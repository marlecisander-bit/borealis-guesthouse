import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { bookingPushPayload, validPushEndpoint, pushFailure } from '../src/lib/notifications/push-contract.ts';
import { deliverBookingPush, type PushJob } from '../src/lib/notifications/push-worker.ts';

const id='00000000-0000-4000-8000-000000000001';
test('worker validates endpoints and uses an operational-only payload',async()=>{
  for(const value of ['https://fcm.googleapis.com.evil.test/x','https://fcm.googleapis.com@evil.test/x','https://127.0.0.1/admin','https://web.push.apple.com:123/x','http://fcm.googleapis.com/x','https://fcm.googleapis.com/x#foo']) assert.equal(validPushEndpoint(value),false);
  assert.equal(validPushEndpoint('https://fcm.googleapis.com/fcm/send/test'),true);
  assert.deepEqual(pushFailure({statusCode:410}),{outcome:'expired',code:'subscription_expired'});
  assert.deepEqual(pushFailure({statusCode:503}),{outcome:'retry',code:'provider_temporary'});
  const jobs:PushJob[]=['revoked','retry','expired','delivered'].map(job_id=>({job_id,lease:'lease',attempt:1}));
  const outcomes=new Map<string,string>();
  let sent=0;
  await deliverBookingPush({
    claim:async()=>jobs,
    read:async job=>job.job_id==='revoked'?null:{endpoint:'https://web.push.apple.com/test/'+job.job_id,p256dh:'B'+'A'.repeat(86),auth:'A'.repeat(22),bookingId:id,type:'booking_modified',tag:id},
    finish:async(job,outcome)=>{outcomes.set(job.job_id,outcome);},
  },async(device,payload)=>{
    sent++;
    assert.equal(payload,bookingPushPayload('booking_modified',id,id));
    assert.deepEqual(Object.keys(JSON.parse(payload)).sort(),['body','path','tag','title']);
    if(device.endpoint.endsWith('/retry'))throw {statusCode:503};
    if(device.endpoint.endsWith('/expired'))throw {statusCode:410};
  });
  assert.equal(sent,3);
  assert.deepEqual(Object.fromEntries(outcomes),{revoked:'skipped',retry:'retry',expired:'expired',delivered:'sent'});
});

test('service worker opens only the expected same-origin admin booking',async()=>{
  const listeners:Record<string,(event:unknown)=>void>={};
  const opened:string[]=[];
  const origin='https://borealis.example.invalid';
  const self={location:{origin},addEventListener:(name:string,handler:(event:unknown)=>void)=>{listeners[name]=handler;},
    clients:{matchAll:async()=>[],openWindow:async(url:string)=>opened.push(url)}};
  runInNewContext(await readFile(new URL('../public/admin/sw.js',import.meta.url),'utf8'),{self,URL});
  for(const path of ['/admin/bookings/'+id,'https://evil.invalid/admin/bookings/'+id]){
    let completion:Promise<unknown>|undefined;
    listeners.notificationclick({notification:{close(){},data:{path}},waitUntil(p:Promise<unknown>){completion=p;}});
    await completion;
  }
  assert.deepEqual(opened,[origin+'/admin/bookings/'+id,origin+'/admin/notifications']);
});
