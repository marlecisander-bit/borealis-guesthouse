import { timingSafeEqual } from 'node:crypto';
import webpush from 'web-push';
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { bookingPushConfig } from '@/lib/notifications/push-config';
import { deliverBookingPush, type PushData, type PushJob } from '@/lib/notifications/push-worker';

export const runtime='nodejs';

export async function POST(request:Request) {
  const config=bookingPushConfig();
  const expected=Buffer.from('Bearer '+(config?.workerSecret||''));
  const received=Buffer.from(request.headers.get('authorization')||'');
  if(!config||expected.length!==received.length||!timingSafeEqual(expected,received))return new Response(null,{status:401});
  try {
    const db=createServiceSupabaseClient();
    const result=await deliverBookingPush({
      async claim(){
        const {data,error}=await db.rpc('claim_booking_push',{limit_count:8});
        if(error)throw new Error('Queue unavailable');
        return (data||[]) as PushJob[];
      },
      async read(job){
        const {data,error}=await db.rpc('read_booking_push',{job:job.job_id,lease:job.lease});
        if(error)throw new Error('Delivery unavailable');
        return data as PushData|null;
      },
      async finish(job,outcome,code){
        const {error}=await db.rpc('finish_booking_push',{job:job.job_id,lease:job.lease,outcome,code});
        if(error)throw new Error('Delivery update unavailable');
      },
    },(device,payload)=>webpush.sendNotification(device,payload,{
      TTL:300,timeout:4500,vapidDetails:{subject:config.subject,publicKey:config.publicKey,privateKey:config.privateKey},
    }));
    return Response.json(result,{status:result.claimed===result.recorded?200:503});
  } catch {
    return Response.json({error:'Booking push queue unavailable.'},{status:503});
  }
}
