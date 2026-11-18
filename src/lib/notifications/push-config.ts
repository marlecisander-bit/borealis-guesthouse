import 'server-only';

export function bookingPushConfig(){
  const publicKey=process.env.BOOKING_PUSH_VAPID_PUBLIC_KEY;
  const privateKey=process.env.BOOKING_PUSH_VAPID_PRIVATE_KEY;
  const subject=process.env.BOOKING_PUSH_VAPID_SUBJECT;
  const workerSecret=process.env.BOOKING_PUSH_WORKER_SECRET;
  if(!publicKey||!/^B[A-Za-z0-9_-]{86}$/.test(publicKey)||!privateKey||!/^[A-Za-z0-9_-]{43}$/.test(privateKey)
    ||!subject||!(/^(mailto:|https:\/\/)/.test(subject))||!workerSecret||Buffer.byteLength(workerSecret)<32||!process.env.SUPABASE_SERVICE_ROLE_KEY)return null;
  return {publicKey,privateKey,subject,workerSecret};
}
