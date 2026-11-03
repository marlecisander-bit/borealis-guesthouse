import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWhatsAppNumber,whatsAppHref} from '../src/lib/whatsapp.ts';
import {validateSettings} from '../src/lib/admin/settings-validation.ts';

test('international punctuation is normalized without inventing a country code',()=>{
 for(const raw of ['+1 (202) 555-0101','(+1) 202 555 0101','12025550101'])assert.equal(normalizeWhatsAppNumber(raw),'12025550101');
 assert.equal(whatsAppHref('+1 (202) 555-0101'),'https://wa.me/12025550101');
 assert.equal(whatsAppHref('https://wa.me/12025550101'),'https://wa.me/12025550101');
});
test('empty, malformed and unsafe contacts never become a WhatsApp destination',()=>{
 for(const raw of ['',null,undefined,'20255','012025550101','1234567890123456','+1 202 CALL 0101','++12025550101','https://example.test/12025550101','https://wa.me.evil.test/12025550101','https://wa.me/12025550101?text=ignored','javascript:12025550101'])assert.equal(whatsAppHref(raw),'',String(raw));
});
test('settings save accepts normalized international numbers, permits clearing, and rejects invalid entries',()=>{
 const form=(whatsapp:string)=>{const f=new FormData();for(const[k,v]of Object.entries({name:'Synthetic property',currency:'EUR',timezone:'Europe/Tirane',whatsapp}))f.set(k,v);return f};
 assert.equal(validateSettings(form('+1 (202) 555-0101')).data?.whatsapp,'12025550101');
 assert.equal(validateSettings(form('')).data?.whatsapp,'');
 assert.ok(validateSettings(form('not a phone')).state?.errors?.whatsapp);
});

// Real settings action → property repository → public contact reader → rendered controls.
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const nativeRequire=createRequire(import.meta.url);
function load(file:string,mocks:Record<string,unknown>){const m={exports:{} as Record<string,unknown>};const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;new Function('require','module','exports',code)((id:string)=>{if(id==='server-only')return{};if(id in mocks)return mocks[id];if(['react','react/jsx-runtime','react-dom'].includes(id))return nativeRequire(id);throw Error('Unexpected import '+id)},m,m.exports);return m.exports}
test('saving or clearing the property number updates the shared responsive control and invalidates shared contact caches',async()=>{
 const property:Record<string,unknown>={whatsapp:''},calls:Array<[string,...unknown[]]>=[],tags:string[]=[];
 const db={from:(table:string)=>{let update:Record<string,unknown>|undefined;const q:Record<string,unknown>={};for(const method of ['select','eq','order','limit','returns','upsert'])q[method]=(...args:unknown[])=>{calls.push([table,method,...args]);return q};q.update=(value:Record<string,unknown>)=>{update=value;return q};q.maybeSingle=async()=>({data:table==='properties'?property:{id:'legacy-contact',data:{whatsapp:'12025550999'}},error:null});q.then=(resolve:(x:unknown)=>unknown)=>{if(table==='properties'&&update)Object.assign(property,update);return Promise.resolve({error:null}).then(resolve)};return q}};
 const repository=load('src/lib/repositories/admin/settings.ts',{'@/lib/supabase/server':{createServerSupabaseClient:async()=>db}});
 const revalidation=load('src/lib/revalidate-public-content.ts',{'next/cache':{revalidatePath:()=>{},revalidateTag:(tag:string)=>tags.push(tag)},'@/lib/supabase/public-cms':{PUBLIC_CMS_TAG:'public-cms'}});
 const action=load('src/app/admin/settings/actions.ts',{'@/lib/revalidate-public-content':revalidation,'@/lib/admin/auth':{requireAdmin:async(roles:string[])=>{assert.deepEqual(roles,['owner','manager']);return{propertyId:'synthetic-property',userId:'synthetic-owner'}}},'@/lib/admin/owner-safe-error':{},'@/lib/admin/settings-validation':{validateSettings},'@/lib/repositories/admin/settings':repository});
 const contact=load('src/services/site-content.ts',{'react':{cache:(fn:unknown)=>fn},'@/lib/whatsapp':{whatsAppHref},'@/lib/supabase/public-cms':{createPublicCmsClient:()=>db},'@/lib/admin/auth':{},'@/lib/repositories/admin/site-content':{},'@/services/translations':{getEntityTranslationMap:async()=>new Map()},'@/lib/media-url':{},'@/lib/landing-page-content':{}});
 const buttons=load('src/components/public/WhatsAppContact.tsx',{'@/lib/whatsapp':{whatsAppHref},'next/image':{default:(props:Record<string,unknown>)=>nativeRequire('react').createElement('img',props)}}),React=nativeRequire('react'),render=nativeRequire('react-dom/server').renderToStaticMarkup;
 for(const raw of ['+1 (202) 555-0101','+1 202-555-0102','']){const f=new FormData();for(const[k,v]of Object.entries({name:'Synthetic property',currency:'EUR',timezone:'Europe/Tirane',whatsapp:raw}))f.set(k,v);const save=action.saveSettings as (s:unknown,f:FormData)=>Promise<{ok:boolean}>;assert.equal((await save({},f)).ok,true);const read=contact.getContactInfo as ()=>Promise<{whatsapp:string}>;const current=await read();assert.equal(current.whatsapp,whatsAppHref(raw));const html=render(React.createElement(buttons.WhatsAppContact,{value:current.whatsapp}));assert.equal((html.match(/href="https:\/\/wa.me\//g)||[]).length,raw?1:0);if(raw)assert.ok(html.includes('href="'+whatsAppHref(raw)+'"'));}
 assert.ok(tags.includes('public-cms:properties'));assert.ok(calls.some(x=>x[0]==='properties'&&x[1]==='eq'&&x[2]==='id'&&x[3]==='synthetic-property'));
 property.whatsapp='invalid saved number';const read=contact.getContactInfo as ()=>Promise<{whatsapp:string}>;assert.equal((await read()).whatsapp,'');
});
