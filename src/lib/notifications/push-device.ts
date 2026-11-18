export const adminWorkerScope='/admin/';
const workerPath='/admin/sw.js';

export function pushDeviceSupport() {
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const standalone=matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone;
  if(ios&&!standalone)return 'install';
  if(!isSecureContext||!('serviceWorker' in navigator)||!('Notification' in window)||!('PushManager' in window))return 'unsupported';
  return Notification.permission==='denied'?'denied':'supported';
}

export async function currentAdminPushSubscription() {
  if(!('serviceWorker' in navigator))return null;
  const registration=await navigator.serviceWorker.getRegistration(adminWorkerScope);
  if(registration?.scope!==new URL(adminWorkerScope,location.origin).href||!registration.active?.scriptURL.endsWith(workerPath))return null;
  return registration.pushManager.getSubscription();
}

export async function activePushWorker() {
  const registration=await navigator.serviceWorker.register(workerPath,{scope:adminWorkerScope,updateViaCache:'none'});
  if(registration.active?.state==='activated')return registration;
  const worker=registration.installing||registration.waiting||registration.active;
  if(!worker)throw new Error('The notification worker could not be started.');
  await new Promise<void>((resolve,reject)=>{
    function finish(error?:Error) {
      clearTimeout(timer);
      worker?.removeEventListener('statechange',check);
      if(error)reject(error);else resolve();
    }
    function check() {
      if(worker?.state==='activated')finish();
      if(worker?.state==='redundant')finish(new Error('The notification worker could not be activated.'));
    }
    const timer=setTimeout(()=>finish(new Error('The notification worker is taking too long. Try again.')),15000);
    worker.addEventListener('statechange',check);
    check();
  });
  return registration;
}

export type DeviceStatus={enabled:boolean;retired?:boolean;testStatus?:string|null};
export async function requestPushDevice(action:string,subscription:PushSubscription) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
    const response=await fetch('/api/admin/booking-push',{
      method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},signal:controller.signal,
      body:JSON.stringify(action==='enable'?{action,subscription:subscription.toJSON()}:{action,endpoint:subscription.endpoint}),
    });
    const data=await response.json() as DeviceStatus&{error?:string;code?:string};
    if(!response.ok)throw Object.assign(new Error(data.error||'Device status could not be verified.'),{code:data.code});
    return data;
  }finally{clearTimeout(timer);}
}

export async function revokeAdminPushOnSignOut() {
  try {
    const subscription=await currentAdminPushSubscription();
    if(!subscription)return;
    await Promise.allSettled([requestPushDevice('disable',subscription),subscription.unsubscribe()]);
  } catch { /* Local sign-out remains available if push is unavailable. */ }
}
