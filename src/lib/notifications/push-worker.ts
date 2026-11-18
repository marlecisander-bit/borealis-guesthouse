import { bookingPushPayload, pushFailure, validPushSubscription, type PushSubscriptionInput } from './push-contract.ts';

export type PushJob={job_id:string;lease:string;attempt:number};
export type PushData={endpoint:string;p256dh:string;auth:string;type:string;bookingId:string|null;tag:string};
export interface PushStore {
  claim():Promise<PushJob[]>;
  read(job:PushJob):Promise<PushData|null>;
  finish(job:PushJob,outcome:string,code:string):Promise<void>;
}

export async function deliverBookingPush(store:PushStore,send:(device:PushSubscriptionInput,message:string)=>Promise<unknown>) {
  const jobs=await store.claim();
  const results=await Promise.allSettled(jobs.map(async job=>{
    let data:PushData|null;
    try {data=await store.read(job);}
    catch {return store.finish(job,'retry','read_unavailable');}
    if(!data)return store.finish(job,'skipped','access_revoked');
    const device={endpoint:data.endpoint,keys:{p256dh:data.p256dh,auth:data.auth}};
    if(!validPushSubscription(device))return store.finish(job,'expired','invalid_subscription');
    let outcome='sent',code='accepted';
    try {await send(device,bookingPushPayload(data.type,data.bookingId,data.tag));}
    catch(error) {({outcome,code}=pushFailure(error));}
    await store.finish(job,outcome,code);
  }));
  return {claimed:jobs.length,recorded:results.filter(result=>result.status==='fulfilled').length};
}
