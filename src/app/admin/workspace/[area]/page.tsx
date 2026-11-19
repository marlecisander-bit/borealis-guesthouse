import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireTeamMember } from '@/lib/admin/team-session';
import { teamWorkspaces, type TeamPermission } from '@/lib/admin/team-permissions';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { WorkspaceForm } from '@/components/admin/WorkspaceForm';
import { WorkspaceAccount } from '@/components/admin/WorkspaceAccount';

const input='min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3';
const card='space-y-3 rounded-xl border border-stone-200 bg-white p-4';
const publicPreviews: Record<string,string> = {rooms:'/rooms?preview=rooms',gallery:'/gallery?preview=gallery',contact:'/gallery?preview=contact#contact'};
const pages = [
  ['rooms','Rooms'],['experiences','Experiences'],['transfers','Transfers'],['explore-koman','Explore Koman'],
  ['about','About'],['gallery','Gallery'],['contact','Contact'],['book','Booking page'],['footer','Footer'],
] as const;

export const metadata={robots:{index:false,follow:false}};

export default async function Page({params,searchParams}:{
  params:Promise<{area:string}>; searchParams:Promise<{preview?:string}>;
}) {
  const {area}=await params;
  const workspace=teamWorkspaces.find(item=>item.key===area);
  if(!workspace)notFound();
  const member=await requireTeamMember(workspace.permission);
  if (area === 'calendar') {
    const query = await searchParams;
    const params = new URLSearchParams(Object.entries(query).filter(([key, value]) =>
      ['from','to','room','view','blockStart','blockEnd'].includes(key) && typeof value === 'string') as [string, string][]);
    redirect('/admin/availability' + (params.size ? '?' + params : ''));
  }
  const db=await createServerSupabaseClient();
  const read=(permission:string)=>db.rpc('team_workspace',{target_property:member.propertyId,area:permission});
  const [main,media,amenities]=await Promise.all([
    read(workspace.permission),
    area==='rooms'||area==='website'?read('approved_media'):{data:[]},
    area==='rooms'?read('approved_amenities'):{data:[]},
  ]);
  const {preview}=await searchParams;
  const links=teamWorkspaces.filter(item=>member.permissions.includes(item.permission));
  return <main className="min-h-dvh bg-ivory px-4 pb-28 pt-4 sm:px-7 sm:pt-7 lg:pb-8">
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold text-lake">{workspace.label}</h1><WorkspaceAccount/></header>
      <nav aria-label="Workspaces" className="hidden flex-wrap gap-2 lg:flex">{links.map(item=><WorkspaceLink key={item.key} item={item} current={area}/>)}</nav>
      {main.error ? <p role="alert" className={card}>These records are unavailable for your current access.</p> :
        area==='bookings'?<Bookings rows={main.data} permissions={member.permissions}/>:

        area==='website'?<Website rows={main.data} media={media.data || []} publish={member.permissions.includes('website.publish')} preview={preview}/>:
        <EditorRows area={area} rows={main.data} media={media.data || []} amenities={amenities.data || []}/>}
    </div>
    <nav aria-label="Mobile workspaces" className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
      {links.map(item=><WorkspaceLink key={item.key} item={item} current={area}/>)}
    </nav>
  </main>;
}

function WorkspaceLink({item,current}:{item:{key:string;label:string};current:string}) {
  return <Link href={'/admin/workspace/'+item.key} aria-current={current===item.key?'page':undefined} className="min-h-11 shrink-0 rounded-lg px-3 py-3 text-sm font-semibold text-brand aria-[current=page]:bg-emerald-50">{item.label}</Link>;
}

type Reservation={id:string;reference:string;check_in:string|null;check_out:string|null;booking_status:string;total_guests:number|null;guest_contacts:{name:string;email:string;phone:string}[]|null};
function Bookings({rows,permissions}:{rows:Reservation[];permissions:TeamPermission[]}) {
  return <div className="space-y-3">
    {permissions.includes('bookings.export') && <Link href="/admin/workspace/export" prefetch={false} download className="inline-flex min-h-11 items-center rounded border px-3">Export reservations</Link>}
    {!rows.length && <p className={card}>No reservations to show.</p>}
    {rows.map(row=><article key={row.id} className={card}>
      <h2 className="font-bold">{row.reference || 'Reservation'}</h2>
      <p>{row.check_in || 'No stay dates'}{row.check_out && ' → '+row.check_out} · {row.booking_status.replaceAll('_',' ')}{row.total_guests!=null && ' · '+row.total_guests+' guests'}</p>
      {row.guest_contacts?.map((contact,index)=><p key={index} className="break-all text-sm">{[contact.name,contact.email,contact.phone].filter(Boolean).join(' · ')}</p>)}
      {permissions.includes('bookings.manage') && ['pending','confirmed','awaiting_payment'].includes(row.booking_status) &&
        <WorkspaceForm operation="booking_status" target={row.id} label="Cancel reservation" confirm="Cancel this reservation and release its dates? This action does not issue a refund.">
          <input type="hidden" name="status" value="cancelled"/>
        </WorkspaceForm>}
    </article>)}
  </div>;
}

type Option={id:string;name:string};
type Document={document_key:string;live_copy:string|null;draft_copy:string|null;has_draft:boolean};
function Website({rows,media,publish,preview}:{rows:Document[];media:Option[];publish:boolean;preview?:string}) {
  if(preview) {
    const document=rows.find(row=>row.document_key===preview);
    return <section className={card}><Link href="/admin/workspace/website" className="underline">Back to Website</Link><h2 className="font-bold">Saved draft preview</h2>
      <p className="whitespace-pre-wrap">{document?.draft_copy ?? 'No saved draft copy for this page.'}</p></section>;
  }
  return <div className="grid gap-3">{pages.map(([key,label])=>{
    const document=rows.find(row=>row.document_key===key);
    return <details key={key} className={card}><summary className="cursor-pointer font-bold">{label}</summary>
      <WorkspaceForm key={document?.draft_copy||document?.live_copy||key} operation="draft" label="Save draft">
        <input type="hidden" name="key" value={key}/>
        <label>Page copy<textarea name="copy" rows={4} className={input} maxLength={4000} defaultValue={document?.draft_copy ?? document?.live_copy ?? ''}/></label>
        {['experiences','transfers','explore-koman'].includes(key) && <><MediaOptions options={media}/><label>Image alternative text<input name="alt" className={input}/></label></>}
      </WorkspaceForm>
      <Link className="inline-flex min-h-11 items-center underline" href={publicPreviews[key] || '/admin/workspace/website?preview='+key} target="_blank" rel="noreferrer" prefetch={false}>Preview draft</Link>
      {publish && document?.has_draft && <WorkspaceForm operation="publish" label="Publish saved draft" confirm="Publish the saved draft to the public site?"><input type="hidden" name="key" value={key}/></WorkspaceForm>}
    </details>;
  })}</div>;
}

type RecordRow={id:string;name:string;short_description?:string;long_description?:string;kind?:string;capacity?:number;max_adults?:number;max_children?:number;max_infants?:number;min_adults?:number;base_occupancy?:number;infants_count?:boolean;amenities?:string[];rate?:{price:number;currency:string;active:boolean}};
function EditorRows({area,rows,media,amenities}:{area:string;rows:RecordRow[];media:Option[];amenities:Option[]}) {
  return <div className="grid gap-3">{rows.length===0 && <p className={card}>No items available.</p>}{rows.map(row=><details key={row.id} className={card}>
    <summary className="cursor-pointer font-bold">{row.name}</summary>
    {area==='rooms' ? <WorkspaceForm operation="room_content" target={row.id}>
      <label>Short description<textarea name="short" defaultValue={row.short_description ?? ''} maxLength={1000} className={input}/></label>
      <label>Full description<textarea name="long" defaultValue={row.long_description ?? ''} maxLength={10000} className={input}/></label>
      <MediaOptions options={media}/>
      <fieldset><legend className="font-semibold">Amenities</legend>{amenities.map(item=><label key={item.id} className="flex min-h-11 items-center gap-2"><input type="checkbox" name="amenity" value={item.id} defaultChecked={row.amenities?.includes(item.id)}/>{item.name}</label>)}</fieldset>
    </WorkspaceForm> : area==='capacity' ? <WorkspaceForm operation="room_capacity" target={row.id}>
      <div className="grid gap-2 sm:grid-cols-3">{[
        ['Total guests','total',row.capacity],['Maximum adults','adults',row.max_adults],['Maximum children','children',row.max_children],
        ['Maximum infants','infants',row.max_infants],['Minimum adults','minimum',row.min_adults],['Base occupancy','base',row.base_occupancy],
      ].map(([label,key,value])=><label key={key}>{label}<input name={String(key)} type="number" min="0" required defaultValue={value??0} className={input}/></label>)}</div>
      <label><input type="checkbox" name="infantsCount" defaultChecked={row.infants_count??true}/> Infants count toward capacity</label>
    </WorkspaceForm> : area==='rates' ? <WorkspaceForm operation="rate" target={row.id}>
      <label>Nightly rate<input className={input} name="price" type="number" min="0" step=".01" required defaultValue={row.rate?.price ?? ''}/></label>
      <label>Currency<select className={input} name="currency" defaultValue={row.rate?.currency || 'EUR'}>{['EUR','USD','GBP','ALL'].map(currency=><option key={currency}>{currency}</option>)}</select></label>
      <label><input type="checkbox" name="active" defaultChecked={row.rate?.active ?? true}/> Active</label>
    </WorkspaceForm> : <WorkspaceForm operation="offer" target={row.id}>
      <input type="hidden" name="kind" value={row.kind}/><label>Offer description<textarea className={input} name="description" required defaultValue={row.short_description || ''}/></label>
    </WorkspaceForm>}
  </details>)}</div>;
}

function MediaOptions({options}:{options:Option[]}) {
  return <label>Approved photo<select className={input} name="media"><option value="">Keep current photos</option>{options.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>;
}
