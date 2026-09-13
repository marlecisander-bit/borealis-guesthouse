/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function load(file:string,mocks:Record<string,unknown>):any{
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const loaded={exports:{}};new Function('require','module','exports',code)((id:string)=>{if(id==='server-only')return{};if(id in mocks)return mocks[id];throw Error('Unexpected import '+id)},loaded,loaded.exports);return loaded.exports;
}
test('CMS cache excludes live data, auth and writes',async()=>{
 const calls:any[]=[];
 const {fetchPublicCms}=load('src/lib/supabase/public-cms.ts',{'@supabase/supabase-js':{},'./fetch':{fetchSupabase:async(_url:unknown,init:unknown)=>{calls.push(init);return new Response()}}});
 await fetchPublicCms('https://example.test/rest/v1/navigation_items');
 assert.equal(calls[0].cache,'force-cache');assert.equal(calls[0].next.revalidate,300);
 for(const path of ['bookings','booking_items','rates','pricing_rules','availability','rpc/get_availability'])await fetchPublicCms('https://example.test/rest/v1/'+path);
 await fetchPublicCms('https://example.test/auth/v1/user');await fetchPublicCms('https://example.test/rest/v1/room_types',{method:'PATCH'});
 assert.ok(calls.slice(1).every(call=>call.cache==='no-store'&&!call.next));
});
test('publishing expires its shared CMS tags without invalidating unrelated tables',()=>{
 const tags:string[]=[],paths:string[]=[];
 const mod=load('src/lib/revalidate-public-content.ts',{'next/cache':{revalidatePath:(path:string)=>paths.push(path),revalidateTag:(tag:string,options:unknown)=>{assert.deepEqual(options,{expire:0});tags.push(tag)}},'@/lib/supabase/public-cms':{PUBLIC_CMS_TAG:'public-cms'}});
 mod.experiencesRevalidatePath('/admin/experiences');assert.equal(tags.length,0);
 mod.experiencesRevalidatePath('/experiences');assert.ok(tags.includes('public-cms:experiences'));assert.ok(tags.includes('public-cms:seo_metadata'));assert.ok(!tags.includes('public-cms:room_types'));assert.deepEqual(paths,['/admin/experiences','/experiences']);
});
test('booking pagination keeps filtered matches across batch boundaries and bounds the first page',async()=>{
 const rows=Array.from({length:230},(_,i)=>({id:String(i),reference:'B'+i,booking_status:'confirmed',booking_guests:[{first_name:i%2?'Other':'Target',last_name:'Guest',email:'guest@example.test',is_primary:true}],booking_items:[{item_type:'experience',title_snapshot:'Lake tour',service_date:'2030-01-01',quantity:2}]}));
 const ranges:number[][]=[];
 const query:any={};for(const name of ['select','eq','neq','order'])query[name]=()=>query;
 query.range=(from:number,to:number)=>{ranges.push([from,to]);return Promise.resolve({data:rows.slice(from,to+1),error:null})};
 const {adminBookingsRepository:repo}=load('src/lib/repositories/admin/bookings.ts',{'@/lib/supabase/server':{createServerSupabaseClient:async()=>({from:()=>query})}});
 const first=await repo.list({propertyId:'p'},{page:1});assert.equal(first.rows.length,25);assert.equal(first.hasNext,true);assert.deepEqual(ranges,[[0,99]]);
 ranges.length=0;const third=await repo.list({propertyId:'p'},{page:3,query:'target',from:'2030-01-01',to:'2030-01-01'});
 assert.deepEqual(third.rows.map((r:any)=>r.id),Array.from({length:25},(_,i)=>String(100+i*2)));assert.equal(third.hasNext,true);assert.deepEqual(ranges,[[0,99],[100,199]]);
 const last=await repo.list({propertyId:'p'},{page:5,query:'target'});assert.equal(last.rows.length,15);assert.equal(last.hasNext,false);
});
test('media usage checks are batched and retain mobile Hero archive protection',async()=>{
 let calls=0;const assets=Array.from({length:24},(_,i)=>({id:String(i),status:'published',file_path:'a.jpg'}));
 function db(fail=false){return{from:(table:string)=>{calls++;const query:any={};for(const name of ['select','eq','neq','in','order','range','returns'])query[name]=()=>query;
 query.then=(resolve:any)=>Promise.resolve({data:table==='media_assets'?assets:table==='homepage_sections'?[{settings:{mobileMediaId:'2'}}]:table==='room_images'?[{media_asset_id:'1'}]:[],count:24,error:fail&&table==='seo_metadata'?{message:'unavailable'}:null}).then(resolve);return query}}}
 let failing=false;
 const {adminMediaRepository:repo}=load('src/lib/repositories/admin/media.ts',{'@/lib/supabase/server':{createServerSupabaseClient:async()=>db(failing)},'@/lib/media-url':{resolvePublicMediaUrl:()=>'/thumbnail'}});
 const page=await repo.list({propertyId:'p'});assert.equal(calls,11);assert.deepEqual(page.assets.filter((a:any)=>a.referencedByPublishedContent).map((a:any)=>a.id),['1','2']);
 failing=true;await assert.rejects(()=>repo.archive({propertyId:'p'},'3'),/used by published content/);
});

test('live Supabase transport explicitly bypasses cache by default',async()=>{
 const original=globalThis.fetch,calls:any[]=[];
 globalThis.fetch=async(_input,init)=>{calls.push(init);return new Response()};
 try{const {fetchSupabase}=load('src/lib/supabase/fetch.ts',{});await fetchSupabase('https://example.test/rest/v1/bookings');assert.equal(calls[0].cache,'no-store');assert.ok(calls[0].signal);}finally{globalThis.fetch=original;}
});

test('homepage selection preserves order and fills gaps left by unpublished items',async()=>{
 const rows=['e1','e2','e3','e4'].map(id=>({id,slug:id,name:id,price:null,pricing_type:'per_person',availability_mode:'on_request',is_featured:false}));
 const db={from:(table:string)=>{let ids:string[]|undefined,limit=1000;const query:any={};for(const method of ['select','eq','order'])query[method]=()=>query;query.in=(_key:string,values:string[])=>{ids=values;return query};query.limit=(value:number)=>{limit=value;return query};query.then=(resolve:any)=>Promise.resolve({data:table==='experiences'?rows.filter(row=>!ids||ids.includes(row.id)).slice(0,limit):[],error:null}).then(resolve);return query}};
 const {getDatabaseExperiences}=load('src/services/database-experiences.ts',{'react':{cache:(fn:unknown)=>fn},'@/lib/supabase/public-cms':{createPublicCmsClient:()=>db},'@/lib/supabase/server':{createServerSupabaseClient:async()=>db}});
 const selected=await getDatabaseExperiences(undefined,3,['unpublished','e4','e3','e2']);assert.deepEqual(selected.map((row:any)=>row.id),['e4','e3','e2']);
});
