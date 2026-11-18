'use client';

import { useEffect, useState } from 'react';
import { activePushWorker, currentAdminPushSubscription, pushDeviceSupport, requestPushDevice, type DeviceStatus } from '@/lib/notifications/push-device';

const initial:DeviceStatus={enabled:false};
const testLabels:Record<string,string>={pending:'Queued',sending:'Sending',sent:'Accepted by the push provider',expired:'Subscription expired',failed:'Delivery failed',skipped:'Device disabled or access removed',uncertain:'Provider acceptance unknown'};

export function BookingPushDevice({ publicKey }: { publicKey:string|null }) {
  const [support,setSupport]=useState<string|null>(null);
  const [status,setStatus]=useState<DeviceStatus>(initial);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    if(busy)return;
    let active=true;
    async function refresh(){
      const environment=pushDeviceSupport();
      if(active)setSupport(environment);
      if(environment==='install'||environment==='unsupported')return;
      try {
        const subscription=await currentAdminPushSubscription();
        const next=subscription?await requestPushDevice('status',subscription):initial;
        if(active)setStatus(next);
      } catch {if(active)setMessage('Device registration could not be verified.');}
    }
    void refresh();
    const interval=setInterval(()=>void refresh(),15000);
    return()=>{active=false;clearInterval(interval);};
  },[busy]);

  async function enable() {
    if(!publicKey||pushDeviceSupport()!=='supported')return;
    setBusy(true);setMessage('');
    try {
      const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
      if(permission!=='granted'){setSupport(pushDeviceSupport());throw new Error('Notification permission was not granted.');}
      const registration=await activePushWorker();
      const key=Uint8Array.from(atob(publicKey.replace(/-/g,'+').replace(/_/g,'/')),character=>character.charCodeAt(0));
      let subscription=await registration.pushManager.getSubscription();
      if(subscription) {
        const current=await requestPushDevice('status',subscription);
        const enrolled=subscription.options.applicationServerKey;
        const matches=enrolled&&new Uint8Array(enrolled).every((byte,index)=>byte===key[index])&&enrolled.byteLength===key.byteLength;
        if(!matches||current.retired||(subscription.expirationTime!==null&&subscription.expirationTime<=Date.now())){
          await subscription.unsubscribe();
          subscription=null;
        }
      }
      const subscribe=()=>registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
      subscription??=await subscribe();
      let saved;
      try {saved=await requestPushDevice('enable',subscription);}
      catch(error){
        if((error as {code?:string}).code!=='device_conflict')throw error;
        await subscription.unsubscribe();
        subscription=await subscribe();
        saved=await requestPushDevice('enable',subscription);
      }
      if(!saved.enabled)throw new Error('The server did not save this device.');
      setStatus(saved);setMessage('Push enabled on this device.');
    } catch(error) {setMessage(error instanceof Error?error.message:'This device could not be registered.');}
    finally{setBusy(false);}
  }

  async function act(action:'test'|'disable') {
    setBusy(true);setMessage('');
    try{
      const subscription=await currentAdminPushSubscription();
      if(!subscription){setStatus(initial);throw new Error('Enable push on this device first.');}
      const result=await requestPushDevice(action,subscription);
      setStatus(result);
      if(action==='disable'){
        await subscription.unsubscribe();
        setMessage('Push disabled on this device.');
      }else setMessage('Test queued for this device. Check the delivery status below.');
    }catch(error){setMessage(error instanceof Error?error.message:'The device action could not be completed.');}
    finally{setBusy(false);}
  }

  return <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
    <h2 className="text-lg font-bold text-lake">Booking push notifications</h2>
    <p className="text-sm text-slate-600">Private booking alerts for this device. Booking details stay inside the signed-in admin.</p>
    {support==='install'&&<p className="rounded-lg bg-ivory p-3 text-sm">In Safari, tap Share, then Add to Home Screen. Open Borealis Admin from its Home Screen icon, sign in, and return here to enable push.</p>}
    {support==='unsupported'&&<p className="text-sm text-slate-600">This browser does not support push in this context.</p>}
    {support==='denied'&&<p className="text-sm text-slate-600">Notifications are blocked. Allow notifications in your browser or device settings, then reopen this page.</p>}
    {!publicKey&&<p className="text-sm text-slate-600">Booking push is awaiting server setup.</p>}
    {support==='supported'&&publicKey&&<div className="flex flex-wrap gap-2">
      <button type="button" onClick={()=>void enable()} disabled={busy||status.enabled} className="min-h-11 rounded-lg bg-brand px-4 text-sm font-bold text-white disabled:opacity-55">Enable on this device</button>
      <button type="button" onClick={()=>void act('test')} disabled={busy||!status.enabled} className="min-h-11 rounded-lg border border-stone-300 px-4 text-sm font-bold text-brand disabled:opacity-55">Send test notification</button>
    </div>}
    {status.enabled&&<button type="button" onClick={()=>void act('disable')} disabled={busy} className="min-h-11 rounded-lg border border-stone-300 px-4 text-sm font-bold text-brand disabled:opacity-55">Disable on this device</button>}
    {status.retired&&<p className="text-sm text-slate-600">This subscription expired. Enable push again to register a fresh one.</p>}
    {status.testStatus&&<p className="text-sm text-slate-600">Last test · {testLabels[status.testStatus]||'Status unavailable'}</p>}
    {(message||(support==='supported'&&publicKey))&&<p role="status" className="text-sm font-semibold">{message||(status.enabled?'Push enabled on this device.':'Push is off on this device.')}</p>}
  </section>;
}
