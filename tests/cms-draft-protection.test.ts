/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function load(file:string,mocks:Record<string,unknown>={}):any {
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};new Function('require','module','exports',code)((id:string)=>{if(id==='server-only')return{};if(id in mocks)return mocks[id];throw Error('Unexpected dependency '+id);},m,m.exports);return m.exports;
}
const contract=load('src/types/site-content-cms.ts');
const helper=load('src/lib/admin/cms-documents.ts',{'@/types/site-content-cms':contract});
const property='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',id='20000000-0000-4000-8000-000000000001';
const session={propertyId:property,userId:'30000000-0000-4000-8000-000000000001',role:'editor',email:'fixture@example.test'};
const row=()=>({id,property_id:property,document_key:'about',data:{title:'published',unchanged:'kept'},draft_data:{title:'draft'},status:'published'});
test('private reads and saves pass only trusted property/key/input to exact RPCs for O/M/E',async()=>{
 for(const role of ['owner','manager','editor']){
  const calls:any[]=[];const db={rpc:async(name:string,args:unknown)=>{calls.push({name,args});return{data:name==='borealis_admin_cms_documents'?[row()]:id,error:null}}};
  const rows=await helper.readPrivateCmsDocuments(db,{...session,role},'about');assert.deepEqual(helper.privateCmsPayload(rows[0]),{title:'draft',unchanged:'kept'});
  await helper.savePrivateCmsDocument(db,{...session,role},'about',{title:'new'},'draft');
  assert.deepEqual(calls,[{name:'borealis_admin_cms_documents',args:{target_property:property,target_document_key:'about'}},{name:'borealis_save_cms_document',args:{target_property:property,target_document_key:'about',input_data:{title:'new'},target_status:'draft'}}]);
 }
});
test('staff, missing/invalid sessions and invalid key/payload/status cause zero delegate calls',async()=>{
 let calls=0;const db={rpc:async()=>{calls++;return{data:[],error:null}}};
 for(const s of [null,{...session,role:'staff'},{...session,propertyId:''},{...session,userId:''}])await assert.rejects(()=>helper.readPrivateCmsDocuments(db,s),/denied/);
 for(const [key,data,status] of [['unknown',{},'draft'],['about',[], 'draft'],['about',{x:42},'draft'],['about',{},'archived']])await assert.rejects(()=>helper.savePrivateCmsDocument(db,session,key,data,status),/Invalid/);
 assert.equal(calls,0);
});
test('private responses reject cross-property/key, duplicate, malformed and RPC error results',async()=>{
 for(const data of [null,[{...row(),property_id:other}],[{...row(),document_key:'footer'}],[row(),row()],[{...row(),data:[]}],[{...row(),status:'unknown'}]])await assert.rejects(()=>helper.readPrivateCmsDocuments({rpc:async()=>({data,error:null})},session,'about'),/Invalid/);
 await assert.rejects(()=>helper.readPrivateCmsDocuments({rpc:async()=>({data:null,error:{message:'private sentinel'}})},session),/Private CMS read failed/);
 await assert.rejects(()=>helper.savePrivateCmsDocument({rpc:async()=>({data:id,error:{message:'secret'}})},session,'about',{},'published'),/save failed/);
});
test('repository draft/save/publish uses RPC server-owned merge with no direct-table fallback',async()=>{
 let current=row();const calls:any[]=[];
 const db={from:()=>{throw Error('Direct table forbidden')},rpc:async(name:string,args:any)=>{calls.push(name);if(name==='borealis_admin_cms_documents')return{data:[structuredClone(current)],error:null};const merged={...current.data,...current.draft_data,...args.input_data};if(args.target_status==='draft')current={...current,draft_data:merged};else current={...current,data:merged,draft_data:null as any,status:'published'};return{data:id,error:null}}};
 const repo=load('src/lib/repositories/admin/site-content.ts',{'@/lib/admin/cms-documents':helper,'@/lib/supabase/server':{createServerSupabaseClient:async()=>db}}).adminSiteContentRepository;
 await repo.saveDocument(session,'about',{title:'new draft'},'draft');assert.equal(current.data.title,'published');assert.equal((await repo.document(session,'about')).data.title,'new draft');
 await repo.saveDocument(session,'about',{extra:'submitted'},'published');assert.deepEqual(current.data,{title:'new draft',unchanged:'kept',extra:'submitted'});assert.equal(current.draft_data,null);assert.equal((await repo.document(session,'about')).status,'published');assert.equal(calls.length,4);
});
test('preview requires O/M/E and propagates failures; public reader keeps published projection/translations',async()=>{
 let fail=false,privateCalls=0,publicCalls=0;const query:any={};const ops:any[]=[];for(const name of ['select','eq','returns'])query[name]=(...args:any[])=>{ops.push([name,...args]);return query};query.maybeSingle=async()=>({data:{id,data:{title:'public'}},error:null});
 const service=load('src/services/site-content.ts',{'@/lib/whatsapp':load('src/lib/whatsapp.ts'),'react':{cache:(fn:unknown)=>fn},'@/lib/supabase/public-cms':{createPublicCmsClient:()=>{publicCalls++;return{from:(t:string)=>{assert.equal(t,'cms_documents');return query}}}},'@/lib/admin/auth':{requireAdmin:async(roles:string[])=>{assert.deepEqual(roles,['owner','manager','editor']);if(fail)throw Error('denied');return session}},'@/lib/repositories/admin/site-content':{adminSiteContentRepository:{document:async()=>{privateCalls++;return{data:{title:'private'}}}}},'@/services/translations':{getEntityTranslationMap:async()=>new Map([[id,{title:'translated'}]])},'@/lib/media-url':{},'@/lib/landing-page-content':{}});
 assert.deepEqual(await service.getSiteDocument('about',true),{title:'private'});assert.equal(publicCalls,0);
 fail=true;await assert.rejects(()=>service.getSiteDocument('about',true),/denied/);assert.equal(privateCalls,1);
 assert.deepEqual(await service.getSiteDocument('about'),{title:'translated'});assert.deepEqual(ops.slice(0,3),[['select','id,data'],['eq','document_key','about'],['eq','status','published']]);
});
test('private RPC transport forcibly drops shared-cache settings while preview still refuses RPC',async()=>{
 const original=globalThis.fetch;const calls:any[]=[];globalThis.fetch=async(_input,init)=>{calls.push(init);return new Response()};
 try{let preview=false;const f=load('src/lib/supabase/fetch.ts',{'../readonly-preview/policy':{previewEnabled:()=>preview,approvedSupabaseRead:()=>{throw Error('RPC denied in preview')}}}).fetchSupabase;
 for(const name of ['borealis_admin_cms_documents','borealis_save_cms_document'])await f('https://example.test/rest/v1/rpc/'+name,{method:'POST',cache:'force-cache',next:{tags:['public-cms'],revalidate:300}});
 assert.ok(calls.every(x=>x.cache==='no-store'&&x.next.revalidate===0&&!x.next.tags));preview=true;assert.throws(()=>f('https://example.test/rest/v1/rpc/borealis_admin_cms_documents'),/RPC denied/);
 }finally{globalThis.fetch=original;}
});
test('draft and failed save never invalidate public cache; successful publication does',async()=>{
 let fail=false;const paths:any[]=[];const actions=load('src/app/admin/content/site-actions.ts',{'@/lib/supabase/server':{},'@/lib/revalidate-public-content':{contentRevalidatePath:(...x:any[])=>paths.push(x)},'@/lib/admin/auth':{requireAdmin:async()=>session},'@/lib/landing-page-content':{isLandingPageKey:()=>false,landingPageFieldNames:{rooms:[],experiences:[],transfers:[],'explore-koman':[],gallery:[]}},'@/lib/repositories/admin/site-content':{adminSiteContentRepository:{saveDocument:async()=>{if(fail)throw Error('failed')}}},'@/types/site-content-cms':contract});
 const form=new FormData();form.set('status','draft');assert.equal((await actions.saveSiteDocument('global',{},form)).ok,true);assert.ok(paths.every(x=>x[0].startsWith('/admin')));
 paths.length=0;form.set('status','published');fail=true;assert.equal((await actions.saveSiteDocument('global',{},form)).ok,false);assert.equal(paths.length,0);
 fail=false;assert.equal((await actions.saveSiteDocument('global',{},form)).ok,true);assert.ok(paths.some(x=>x[0]==='/'&&x[1]==='layout'));
});
test('language dashboard uses private RPC enumeration and fails closed on private read errors',async()=>{
 const source=readFileSync('src/lib/repositories/admin/languages.ts','utf8');assert.doesNotMatch(source,/from\('cms_documents'\)/);
 const q:any={then:(resolve:any)=>Promise.resolve({data:[]}).then(resolve)};for(const k of ['select','eq','neq','order','in'])q[k]=()=>q;
 const repo=load('src/lib/repositories/admin/languages.ts',{'@/types/homepage-cms':load('src/types/homepage-cms.ts'),'@/lib/supabase/server':{createServerSupabaseClient:async()=>({from:()=>q})},'@/lib/admin/cms-documents':{assertCmsSession:helper.assertCmsSession,readPrivateCmsDocuments:async()=>{throw Error('private failure')}}}).adminLanguagesRepository;
 await assert.rejects(()=>repo.dashboard(session),/private failure/);
});
test('ten-key source contract agrees with proposed save SQL; no compatibility seed or constraint applied',()=>{
 assert.equal(contract.SITE_DOCUMENT_KEYS.length,10);const sql=readFileSync('docs/security-proposals/phase-a/F01-01-cms-rpc-expand.sql.proposed','utf8');for(const key of contract.SITE_DOCUMENT_KEYS)assert.ok(sql.includes("'"+key+"'"));
 assert.match(sql,/auth\.uid\(\) IS NULL/);assert.match(sql,/can_manage_property/);assert.match(sql,/SET search_path = ''/);
});
