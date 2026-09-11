'use client';

import { FormEvent, useState } from 'react';

type Fields = { name:string; email:string; phone:string; subject:string; message:string; website:string };
const initial: Fields = { name:'', email:'', phone:'', subject:'', message:'', website:'' };

export function ContactForm() {
  const [fields,setFields] = useState(initial);
  const [errors,setErrors] = useState<Partial<Record<keyof Fields,string>>>({});
  const [sent,setSent] = useState(false);
  const [loading,setLoading] = useState(false);
  const [requestError,setRequestError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Partial<Record<keyof Fields,string>> = {};
    if (fields.name.trim().length < 2) next.name = 'Please enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(fields.email)) next.email = 'Enter a valid email address.';
    if (!fields.subject) next.subject = 'Choose a subject.';
    if (fields.message.trim().length < 10) next.message = 'Please add a little more detail.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setRequestError('');
    try {
      const response = await fetch('/api/contact', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(fields) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Your message could not be sent.');
      setSent(true);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Your message could not be sent.');
    } finally {
      setLoading(false);
    }
  }

  const field = (key: keyof Fields, value: string) => {
    setFields(current => ({...current,[key]:value}));
    setErrors(current => ({...current,[key]:undefined}));
    setRequestError('');
  };

  if (sent) return <div role="status" className="rounded-[1.75rem] bg-ivory p-8"><span className="grid size-12 place-items-center rounded-full bg-green text-white">✓</span><h2 className="mt-6 font-serif text-4xl text-lake">Message received.</h2><p className="mt-4 leading-7 text-muted">Your enquiry has been saved securely. The Borealis team will reply using the contact details you provided.</p><button onClick={()=>{setSent(false);setFields(initial)}} className="mt-6 text-sm font-bold text-green underline">Write another message</button></div>;

  return <form onSubmit={submit} noValidate className="grid gap-5 rounded-[1.75rem] bg-ivory p-6 md:p-9"><div className="hidden" aria-hidden="true"><label>Website<input name="website" value={fields.website} onChange={event=>field('website',event.target.value)} tabIndex={-1} autoComplete="off"/></label></div><div className="grid gap-5 sm:grid-cols-2"><Input label="Name" name="name" value={fields.name} error={errors.name} onChange={field}/><Input label="Email" name="email" type="email" value={fields.email} error={errors.email} onChange={field}/></div><Input label="Phone (optional)" name="phone" type="tel" value={fields.phone} error={errors.phone} onChange={field}/><label className="text-sm font-semibold text-lake">Subject<select name="subject" value={fields.subject} onChange={event=>field('subject',event.target.value)} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject?'subject-error':undefined} className="mt-2 min-h-14 w-full rounded-xl border border-lake/10 bg-white px-4"><option value="">Choose a subject</option><option>Room booking</option><option>Experience</option><option>Transfer</option><option>Directions</option><option>General question</option></select>{errors.subject&&<span id="subject-error" role="alert" className="mt-1 block text-xs text-red-700">{errors.subject}</span>}</label><label className="text-sm font-semibold text-lake">Message<textarea name="message" value={fields.message} onChange={event=>field('message',event.target.value)} rows={6} maxLength={5000} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message?'message-error':undefined} className="mt-2 w-full rounded-xl border border-lake/10 bg-white px-4 py-3"/>{errors.message&&<span id="message-error" role="alert" className="mt-1 block text-xs text-red-700">{errors.message}</span>}</label>{requestError&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{requestError}</p>}<button disabled={loading} className="min-h-14 rounded-xl bg-lake px-6 text-sm font-bold text-white disabled:opacity-60">{loading?'Sending…':'Send message'}</button><p className="text-xs leading-5 text-muted">Your details are used only to respond to this enquiry.</p></form>;
}

function Input({label,name,type='text',value,error,onChange}:{label:string;name:keyof Fields;type?:string;value:string;error?:string;onChange:(name:keyof Fields,value:string)=>void}) {
  const errorId = `${name}-error`;
  return <label className="text-sm font-semibold text-lake">{label}<input name={name} type={type} value={value} onChange={event=>onChange(name,event.target.value)} autoComplete={name} aria-invalid={Boolean(error)} aria-describedby={error?errorId:undefined} className="mt-2 min-h-14 w-full rounded-xl border border-lake/10 bg-white px-4"/>{error&&<span id={errorId} role="alert" className="mt-1 block text-xs text-red-700">{error}</span>}</label>;
}
