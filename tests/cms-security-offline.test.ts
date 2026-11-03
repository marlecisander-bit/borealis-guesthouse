/* eslint-disable @typescript-eslint/no-explicit-any */
// Contract models plus actual application adapters. These are NOT PostgreSQL/RLS tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function load(file:string,mocks:Record<string,unknown>={}):any {
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};new Function('require','module','exports',code)((id:string)=>{if(id==='server-only')return{};if(id in mocks)return mocks[id];throw Error('Unmocked dependency '+id);},mod,mod.exports);return mod.exports;
}
const contract=load('src/types/site-content-cms.ts');
const adapter=load('src/lib/admin/cms-documents.ts',{'@/types/site-content-cms':contract});
const A='10000000-0000-4000-8000-000000000001',B='10000000-0000-4000-8000-000000000002',ID='20000000-0000-4000-8000-000000000001',U='30000000-0000-4000-8000-000000000001';
const session=(role='editor',propertyId=A)=>({userId:U,propertyId,role,email:'offline@example.test'});
function model(actor:{uid:string|null;propertyId:string;role:string;active:boolean}) {
 let current:any={id:ID,property_id:A,document_key:'about',data:{title:'PUBLIC',retained:'keep'},draft_data:{title:'PRIVATE'},status:'published'};let fail=false,calls=0;
 return {
  state:()=>structuredClone(current),setFailure:(value:boolean)=>{fail=value;},calls:()=>calls,
  // This projection models the intended FINAL contraction, not current production grants.
  publicRead:()=>current?.status==='published'?{id:current.id,property_id:current.property_id,document_key:current.document_key,data:structuredClone(current.data),status:current.status}:null,
  clear:()=>{current=null;},
  rpc:async(name:string,args:any)=>{
   calls++;
   if(!actor.uid||!actor.active||!['owner','manager','editor'].includes(actor.role)||actor.propertyId!==args.target_property)return{data:null,error:{code:'42501',message:'PRIVATE error detail'}};
   if(fail)return{data:null,error:{message:'Simulated failure before commit'}};
   if(name==='borealis_admin_cms_documents')return{data:current?[structuredClone(current)]:[],error:null};
   assert.equal(name,'borealis_save_cms_document');
   const merged={...(current?.data||{}),...(current?.draft_data||{}),...args.input_data};
   current={id:ID,property_id:args.target_property,document_key:args.target_document_key,data:args.target_status==='published'?merged:current?.data||{},draft_data:args.target_status==='draft'?merged:null,status:args.target_status==='published'?'published':current?.status||'draft'};
   return{data:ID,error:null};
  },
 };
}
test('MODEL final projection excludes drafts; anonymous/null identity and nonmember are denied',async()=>{
 for(const actor of [{uid:null,propertyId:A,role:'owner',active:true},{uid:U,propertyId:B,role:'owner',active:true}]){
  const db=model(actor);const reply=await db.rpc('borealis_admin_cms_documents',{target_property:A});assert.equal(reply.error?.code,'42501');assert.equal(reply.data,null);assert.ok(!JSON.stringify(db.publicRead()).includes('PRIVATE'));
 }
 let calls=0;await assert.rejects(()=>adapter.readPrivateCmsDocuments({rpc:()=>{calls++;throw Error('delegate');}},null),/denied/);assert.equal(calls,0);
});
test('actual adapter accepts O/M/E only when the MOCK backend also authorizes active membership',async()=>{
 for(const role of ['owner','manager','editor']){
  const db=model({uid:U,propertyId:A,role,active:true});const rows=await adapter.readPrivateCmsDocuments(db,session(role),'about');assert.equal(adapter.privateCmsPayload(rows[0]).title,'PRIVATE');assert.equal(db.calls(),1);
 }
});
test('staff fails locally; disabled and stale/forged editor claims fail at MOCK membership boundary',async()=>{
 const staff=model({uid:U,propertyId:A,role:'staff',active:true});await assert.rejects(()=>adapter.readPrivateCmsDocuments(staff,session('staff')),/denied/);assert.equal(staff.calls(),0);
 for(const actor of [{uid:U,propertyId:A,role:'editor',active:false},{uid:U,propertyId:A,role:'staff',active:true}]){
  const db=model(actor),before=db.state();await assert.rejects(()=>adapter.readPrivateCmsDocuments(db,session()),/Private CMS read failed/);await assert.rejects(()=>adapter.savePrivateCmsDocument(db,session(),'about',{title:'bad'},'published'),/CMS save failed/);assert.deepEqual(db.state(),before);
 }
});
test('cross-property session tampering is denied by MOCK backend even with a valid local role',async()=>{
 const db=model({uid:U,propertyId:A,role:'owner',active:true}),before=db.state();await assert.rejects(()=>adapter.readPrivateCmsDocuments(db,session('owner',B)),/Private CMS read failed/);await assert.rejects(()=>adapter.savePrivateCmsDocument(db,session('owner',B),'about',{title:'bad'},'draft'),/CMS save failed/);assert.deepEqual(db.state(),before);
});
test('actual adapter integrates new-draft/merge/publish and failure preservation with transaction MODEL',async()=>{
 const db=model({uid:U,propertyId:A,role:'editor',active:true});db.clear();await adapter.savePrivateCmsDocument(db,session(),'about',{title:'first'},'draft');assert.equal(db.publicRead(),null);assert.deepEqual(db.state().data,{});
 await adapter.savePrivateCmsDocument(db,session(),'about',{detail:'second'},'draft');const before=db.state();db.setFailure(true);await assert.rejects(()=>adapter.savePrivateCmsDocument(db,session(),'about',{title:'failed'},'published'),/save failed/);assert.deepEqual(db.state(),before);
 db.setFailure(false);await adapter.savePrivateCmsDocument(db,session(),'about',{title:'published'},'published');assert.deepEqual(db.publicRead()?.data,{title:'published',detail:'second'});assert.equal(db.state().draft_data,null);
});
test('all ten keys reach save RPC; invalid keys and payload/status shapes make zero calls',async()=>{
 const seen:string[]=[];const db={rpc:async(_name:string,args:any)=>{seen.push(args.target_document_key);return{data:ID,error:null};}};
 for(const key of contract.SITE_DOCUMENT_KEYS)await adapter.savePrivateCmsDocument(db,session(),key,{title:'fixture'},'draft');assert.equal(new Set(seen).size,10);seen.length=0;
 for(const key of ['', '../about', 'ABOUT', 'unknown', null])await assert.rejects(()=>adapter.savePrivateCmsDocument(db,session(),key,{},'draft'),/Invalid/);
 for(const payload of [null,[],{x:1},{x:{}},{x:undefined}])await assert.rejects(()=>adapter.savePrivateCmsDocument(db,session(),'about',payload,'draft'),/Invalid/);
 await assert.rejects(()=>adapter.savePrivateCmsDocument(db,session(),'about',{},'archived'),/Invalid/);assert.equal(seen.length,0);
});
test('RPC exceptions and malformed save IDs propagate/fail closed without direct-table fallback',async()=>{
 let tables=0;for(const data of [null,'',42,'not-a-uuid']){const db={from:()=>{tables++;throw Error('forbidden');},rpc:async()=>({data,error:null})};await assert.rejects(()=>adapter.savePrivateCmsDocument(db,session(),'about',{},'draft'),/save failed/);}
 const thrown=new Error('offline transport unavailable');await assert.rejects(()=>adapter.readPrivateCmsDocuments({rpc:async()=>{throw thrown;}},session()),e=>e===thrown);assert.equal(tables,0);
});
test('private transport overrides force-cache for string, URL and Request inputs; honors cancellation',async()=>{
 const old=globalThis.fetch;const seen:any[]=[];globalThis.fetch=async(_url,init)=>{seen.push(init);return new Response();};
 try{
  const transport=load('src/lib/supabase/fetch.ts',{'../readonly-preview/policy':{previewEnabled:()=>false}}).fetchSupabase;
  for(const name of ['borealis_admin_cms_documents','borealis_save_cms_document'])for(const input of ['https://offline.example.test/rest/v1/rpc/'+name,new URL('https://offline.example.test/rest/v1/rpc/'+name),new Request('https://offline.example.test/rest/v1/rpc/'+name)])await transport(input,{cache:'force-cache',next:{tags:['public-cms'],revalidate:600}});
  assert.equal(seen.length,6);for(const init of seen){assert.equal(init.cache,'no-store');assert.deepEqual(init.next,{revalidate:0});}
  const controller=new AbortController();controller.abort();await transport('https://offline.example.test/rest/v1/rpc/borealis_admin_cms_documents',{signal:controller.signal});assert.equal(seen.at(-1).signal.aborted,true);
 }finally{globalThis.fetch=old;}
});
test('actual save action and revalidation wrapper invalidate public CMS tags only after publish success',async()=>{
 const events:string[]=[];let failure=false;
 const revalidation=load('src/lib/revalidate-public-content.ts',{'next/cache':{revalidatePath:(p:string)=>events.push('path:'+p),revalidateTag:(tag:string,opts:any)=>{assert.deepEqual(opts,{expire:0});events.push('tag:'+tag);}},'@/lib/supabase/public-cms':{PUBLIC_CMS_TAG:'public-cms'}});
 const action=load('src/app/admin/content/site-actions.ts',{'@/lib/supabase/server':{},'@/lib/revalidate-public-content':revalidation,'@/lib/admin/auth':{requireAdmin:async()=>session()},'@/lib/landing-page-content':{isLandingPageKey:()=>false,landingPageFieldNames:{}},'@/lib/repositories/admin/site-content':{adminSiteContentRepository:{saveDocument:async()=>{events.push('rpc');if(failure)throw Error('failure');events.push('committed');}}},'@/types/site-content-cms':contract});
 const form=new FormData();form.set('status','draft');assert.equal((await action.saveSiteDocument('global',{},form)).ok,true);assert.ok(!events.some(x=>x.startsWith('tag:')));
 events.length=0;form.set('status','published');failure=true;assert.equal((await action.saveSiteDocument('global',{},form)).ok,false);assert.deepEqual(events,['rpc']);
 failure=false;events.length=0;assert.equal((await action.saveSiteDocument('global',{},form)).ok,true);assert.ok(events.indexOf('committed')<events.findIndex(x=>x.startsWith('tag:')));assert.ok(events.includes('tag:public-cms:cms_documents'));assert.ok(!events.some(x=>x.includes('bookings')));
});
test('F02 compatibility: actual booking client keeps hold/confirm API and token flow under fetch MOCK',async()=>{
 const original=globalThis.fetch,seen:any[]=[];globalThis.fetch=async(input,init)=>{seen.push({url:String(input),body:JSON.parse(String(init?.body))});return Response.json(String(input).endsWith('/hold')?{id:ID,token:'synthetic-token'}:{reference:'SYNTHETIC'});};
 try{
  const booking=load('src/services/booking.ts').bookingService;const selection={search:{checkIn:'2030-01-01',checkOut:'2030-01-02'},accommodation:{rooms:[{room:{id:ID},occupancies:[2]}]},addons:[],guest:{name:'Synthetic'}};
  const hold=await booking.createBookingHold(selection);const confirm=await booking.createBooking(selection,hold);assert.equal(confirm.reference,'SYNTHETIC');assert.deepEqual(seen.map(x=>x.url),['/api/bookings/hold','/api/bookings/confirm']);assert.deepEqual(seen[1].body,{id:ID,token:'synthetic-token'});assert.ok(!JSON.stringify(seen).includes('next_booking_reference'));assert.ok(!JSON.stringify(seen).includes('expire_booking_holds'));
 }finally{globalThis.fetch=original;}
});
test('private adapter performs fresh reads, not shared memoization across requests',async()=>{
 const db=model({uid:U,propertyId:A,role:'editor',active:true});assert.equal(adapter.privateCmsPayload((await adapter.readPrivateCmsDocuments(db,session()))[0]).title,'PRIVATE');await adapter.savePrivateCmsDocument(db,session(),'about',{title:'changed'},'draft');assert.equal(adapter.privateCmsPayload((await adapter.readPrivateCmsDocuments(db,session()))[0]).title,'changed');assert.equal(db.calls(),3);
});
