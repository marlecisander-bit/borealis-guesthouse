import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { compile } from '@tailwindcss/node';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export function assertFixtureBuildEnvironment(env) {
  if (env.BOREALIS_BOOKING_FIXTURE !== '1' || env.NODE_ENV === 'production' || ['NETLIFY', 'CONTEXT', 'VERCEL', 'CI'].some(k => env[k])) throw Error('Local explicit fixture build only; production/hosting rejected');
  for (const key of Object.keys(env)) if (/^(SUPABASE_|NEXT_PUBLIC_SUPABASE_|RESEND_|STRIPE_|ICAL_SYNC_|PAYMENT_)/.test(key) && env[key]) throw Error('Credential/configuration-bearing environment rejected');
}
export async function buildFixture(env = process.env, options = {}) {
  assertFixtureBuildEnvironment(env);
  const out = path.join(root, options.whatsapp ? '.local/whatsapp-fixture-v1' : options.calendar ? '.local/calendar-fixture-v1' : options.audit ? '.local/responsive-fixture-v1' : options.admin ? '.local/admin-fixture-v1' : options.rental ? '.local/rental-fixture-v1' : '.local/booking-fixture-v1'); fs.mkdirSync(out, { recursive: true, mode: 0o700 });
  const modules = {}, sources = {};
  const digest = value => crypto.createHash('sha256').update(value).digest('hex');
  function source(file) { const snapshot=options.snapshot&&file.startsWith('src/')?path.join(root,options.snapshot,file):null; const data = fs.readFileSync(snapshot&&fs.existsSync(snapshot)?snapshot:path.join(root, file), 'utf8'); sources[file] = digest(data); return data; }
  for (const [id, file] of Object.entries({ react: 'react/cjs/react.development.js', 'react/jsx-runtime': 'react/cjs/react-jsx-runtime.development.js', 'react-dom': 'react-dom/cjs/react-dom.development.js', 'react-dom/client': 'react-dom/cjs/react-dom-client.development.js', scheduler: 'scheduler/cjs/scheduler.development.js' })) modules[id] = source('node_modules/' + file);
  const router = `const router={replace:(url)=>{if(!url.startsWith('/book?')&&!url.startsWith('/booking/confirmation/FIXTURE-TOKEN-NOT-VALID'))throw Error('Fixture navigation denied');window.__fixtureNavigation=url}};exports.useRouter=()=>router;`;
  modules['next/navigation'] = router;
  modules['next/image'] = `module.exports=({fill,src,alt,sizes,className,...props})=>{if(!src.startsWith('data:image/'))throw Error('Fixture image boundary');return require('react').createElement('img',{src,alt,sizes,className,...props,style:fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:props.style})};`;
  if(options.rental||options.admin)modules['next/link']=`module.exports=({href,children,...props})=>require('react').createElement('a',{href,...props},children);`;
  if(options.admin){
    modules['next/navigation']+=`exports.usePathname=()=>window.__adminPath||'/admin/content';exports.useSearchParams=()=>new URLSearchParams();`;
    modules['@/components/brand/BorealisLogo']=`exports.BorealisLogo=()=>require('react').createElement('span',{},'BOREALIS');`;
    modules['next/dynamic']=`module.exports=loader=>{const React=require('react'),Component=React.lazy(()=>loader().then(value=>({default:value})));return props=>React.createElement(React.Suspense,{fallback:React.createElement('p',{},'Loading upload controls…')},React.createElement(Component,props))};`;
    modules['@/components/admin/MediaUploader']=`exports.MediaUploader=({onUploaded})=>require('react').createElement('button',{type:'button',onClick:()=>onUploaded([{id:'fixture-upload',title:'Synthetic uploaded photo',publicUrl:window.__adminFixtureImage}])},'Upload synthetic photo');`;
    for(const [file,fn,validator]of [['experiences','saveExperience','experience-validation'],['transfers','saveTransfer','transfer-validation'],['rooms','saveRoomType','room-validation']]){
      modules['@/app/admin/'+file+'/actions']=`exports.${fn}=async(previous,data)=>{const values=Array.from(data.entries());window.__adminCalls.push({action:${JSON.stringify(fn)},values});const mod=require('@/lib/admin/${validator}');const validate=mod.validateExperience||mod.validateTransfer||mod.validateRoomType;const result=validate(data);return result.data?{ok:true,id:'fixture-existing',savedStatus:data.get('status'),message:data.get('status')==='published'?'Published in synthetic fixture.':'Draft saved in synthetic fixture.'}:result.state};`;
    }
    modules['@/app/admin/settings/actions']=`exports.saveSettings=async(previous,data)=>({ok:true,message:'Settings saved in synthetic fixture.'});`;
  }
  if(options.audit){
    modules['next/form']=`module.exports=({children,...props})=>require('react').createElement('form',props,children);`;
    modules['@/lib/admin/auth']=`exports.requireAdmin=async()=>({role:'owner',propertyId:'FIXTURE',userId:'FIXTURE',email:'synthetic@example.invalid'});`;
    modules['@/lib/supabase/client']=`exports.createClient=()=>{throw Error('Synthetic fixture forbids database access')};`;
    for(const id of ['@/app/admin/content/site-actions','@/app/admin/content/homepage/actions','@/app/admin/explore-koman/actions'])modules[id]=`module.exports=new Proxy({},{get:()=>async()=>({ok:false,message:'Synthetic fixture — no write performed'})});`;
    modules['@/lib/supabase/server']=`exports.createServerSupabaseClient=async()=>({rpc:async(name)=>({data:name==='rental_payment_balance'?window.__auditBalance:window.__auditConfirmation,error:null})});`;
    modules['@/components/public/PageShell']=`const React=require('react');exports.PublicShell=({children})=>React.createElement(React.Fragment,{},children);exports.Breadcrumbs=({items})=>React.createElement('nav',{'aria-label':'Breadcrumb',className:'mb-8 flex flex-wrap gap-2 text-sm'},items.map((x,i)=>React.createElement('span',{key:i},x.label)));`;
    modules['@/services/content']=`exports.contentRepository={getTransfer:async()=>window.__auditTransfer,getArticle:async()=>window.__auditArticle};`;
    modules['@/services/site-content']=`exports.getLandingPageContent=async()=>({detailEyebrow:'Synthetic journey',detailHeading:'Synthetic route details'});`;
    modules['@/lib/seo']=`exports.createLocalizedMetadata=()=>({});`;
    modules['next/navigation']+=`exports.notFound=()=>{throw Error('Synthetic not found')};`;
    for(const name of ['dashboard','rooms','rates','amenities','availability','media','languages','seo','bookings','inquiries','notifications','channels']){
      const repo='admin'+name[0].toUpperCase()+name.slice(1)+'Repository';
      modules['@/lib/repositories/admin/'+name]=`const get=(method)=>async()=>{if(window.__auditMode==='error')throw Error('Synthetic fixture failure');const data=window.__auditData[${JSON.stringify(name)}];return window.__auditMode==='empty'&&method==='list'?(data.empty||[]):data[method]??data};exports[${JSON.stringify(repo)}]=new Proxy({},{get:(_,method)=>method==='allowed'?()=>['confirmed','cancelled']:get(method)});exports.getDashboardOverview=get('dashboard');`;
    }
    for(const name of ['rooms','rates','amenities','availability','media','languages','seo','bookings','inquiries','notifications','channels']){const id='@/app/admin/'+name+'/actions';modules[id]=(modules[id]||'')+`;module.exports=new Proxy(module.exports,{get:(target,key)=>key in target?target[key]:async()=>({ok:false,message:'Synthetic fixture: no production write performed.'})});`;}
  }
  if(options.calendar){
    modules['next/navigation']+=`exports.useRouter=()=>({push:url=>{if(!url.startsWith('/admin/availability?'))throw Error('Calendar navigation boundary');window.__calendarNavigation=url},refresh:()=>{window.__calendarRefresh=true},replace:()=>{throw Error('Calendar fixture booking submission denied')}});`;
    modules['@/app/admin/availability/actions']=`const validate=require('@/lib/admin/availability-validation').validateBlock;exports.createAvailabilityBlock=async(previous,data)=>{window.__calendarCalls.push({action:'close',values:Object.fromEntries(data)});await new Promise(r=>setTimeout(r,250));const result=validate(data);if(!result.data)return result.state;if(window.__calendarConflict)return{ok:false,message:'This inventory has a booking or active hold during the selected dates. Refresh and choose another range.'};const x=result.data;window.__calendarCommit({id:'new-closure',roomId:x.kind==='room'?x.id:null,roomTypeId:x.kind==='type'?x.id:null,targetName:'Synthetic selected room',startDate:x.startDate,endDate:x.endDate,reasonCode:x.reasonCode,reason:x.reason,notes:x.notes,source:'manual',status:'published'});return{ok:true,message:'Room closed in local fixture.'}};exports.reopenAvailabilityState=async(previous,data)=>{window.__calendarCalls.push({action:'reopen',id:data.get('id')});await new Promise(r=>setTimeout(r,250));window.__calendarReopen(data.get('id'));return{ok:true,message:'Dates reopened in local fixture.'}};`;
  }
  if(options.whatsapp){
    const officialGlyph='data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'public/brand/whatsapp-glyph-white.svg')).toString('base64');
    modules['next/image']=`module.exports=({src,alt,...props})=>{if(src==='/brand/whatsapp-glyph-white.svg')src=${JSON.stringify(officialGlyph)};if(!src.startsWith('data:image/'))throw Error('Fixture image boundary');return require('react').createElement('img',{src,alt,...props})};`;
    modules['next/link']+=`;module.exports.useLinkStatus=()=>({pending:false});`;
    modules['next/navigation']+=`exports.useRouter=()=>({prefetch:()=>{},replace:()=>{throw Error('WhatsApp fixture navigation denied')}});`;
    modules['@/app/admin/settings/actions']=`exports.saveSettings=async(previous,data)=>{const result=require('@/lib/admin/settings-validation').validateSettings(data);if(!result.data)return result.state;window.__waCalls.push(result.data.whatsapp);window.__saveWhatsApp(result.data.whatsapp);return{ok:true,message:'Settings saved in isolated fixture.'}};`;
  }
  function add(file) {
    const id = file.replace(/^src\//, '@/').replace(/\.tsx?$/, '');
    if (id in modules) return;
    if (!file.startsWith('src/') || (/supabase|repositories|notifications|app\//.test(file) && !(options.audit && (/^src\/app\/admin\/[\w-]+\/page\.tsx$/.test(file)||['src/app/admin/bookings/[id]/page.tsx','src/app/booking/confirmation/[token]/page.tsx','src/app/transfers/[slug]/page.tsx','src/app/explore-koman/[slug]/page.tsx','src/app/loading.tsx','src/app/book/loading.tsx','src/app/admin/loading.tsx','src/app/admin/error.tsx'].includes(file))))) throw Error('Server/database dependency rejected: ' + file);
    const text = source(file);
    let code = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    modules[id] = '';
    code = code.replace(/require\(["']([^"']+)["']\)/g, (match, requested) => {
      let resolved = requested;
      if (requested.startsWith('.')) resolved = '@/' + path.posix.normalize(path.posix.join(path.posix.dirname(file.slice(4)), requested)).replace(/\.tsx?$/, '');
      if (resolved.startsWith('@/')) {
        const base = 'src/' + resolved.slice(2), target = [base + '.ts', base + '.tsx'].find(f => fs.existsSync(path.join(root, f)));
        if (!target) throw Error('Missing fixture dependency ' + resolved);
        add(target);
      } else if (!(resolved in modules)) throw Error('Unexpected import ' + resolved);
      return `require(${JSON.stringify(resolved)})`;
    });
    modules[id] = code;
  }
  for (const file of ['src/components/booking/BookingFlow.tsx', 'src/lib/pricing/core.ts', 'src/lib/booking/accommodation-allocation.ts']) add(file);
  if(options.rental){for(const file of ['src/components/booking/RentalBookingFlow.tsx','src/components/public/ExperienceCatalogueCard.tsx','src/components/admin/RentalFields.tsx','src/lib/rentals/catalogue.ts'])add(file);modules.rentalEntry=ts.transpileModule(source('tools/rental-fixture/entry.mjs'),{compilerOptions:{allowJs:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;}
  if(options.admin){for(const file of ['src/components/admin/ExperienceForm.tsx','src/components/admin/TransferForm.tsx','src/components/admin/RoomTypeForm.tsx','src/components/admin/SettingsForm.tsx','src/components/layout/AdminSidebar.tsx','src/components/layout/AdminMobileNav.tsx','src/components/admin/AdminWorkspaceNav.tsx','src/components/admin/ServiceRows.tsx','src/components/admin/AdminFormValueGuard.tsx','src/lib/admin/experience-validation.ts','src/lib/admin/transfer-validation.ts','src/lib/admin/room-validation.ts'])add(file);modules.adminEntry=ts.transpileModule(source('tools/admin-fixture/entry.mjs'),{compilerOptions:{allowJs:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;}
  if(options.audit){for(const name of ['dashboard','rooms','rates','amenities','availability','media','languages','seo','bookings','inquiries','notifications'])add('src/app/admin/'+name+'/page.tsx');for(const file of ['src/components/public/GalleryExplorer.tsx','src/components/admin/HomepageCmsForm.tsx','src/components/admin/SiteDocumentForm.tsx','src/components/admin/ArticleForm.tsx','src/components/admin/ManualBookingForm.tsx','src/components/admin/ChannelsManager.tsx','src/app/admin/bookings/[id]/page.tsx','src/app/booking/confirmation/[token]/page.tsx','src/app/transfers/[slug]/page.tsx','src/app/explore-koman/[slug]/page.tsx','src/app/loading.tsx','src/app/book/loading.tsx','src/app/admin/loading.tsx','src/app/admin/error.tsx'])add(file);modules.auditEntry=ts.transpileModule(source('tools/responsive-audit/fixtures.mjs'),{compilerOptions:{allowJs:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;}
  modules.fixture = ts.transpileModule(source('tools/booking-fixture/fixtures.mjs'), { compilerOptions: { allowJs: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  let cssText = source('src/app/globals.css')+'\n'+source('src/app/control-alignment.css')+'\n'+source('src/app/homepage-hero.css');
  const css = await compile(cssText, { base: path.join(root, 'src/app'), onDependency: () => {} });
  if(options.calendar){add('src/components/admin/AvailabilityCalendar.tsx');add('src/lib/admin/availability-validation.ts');modules.calendarEntry=ts.transpileModule(source('tools/calendar-fixture/entry.mjs'),{compilerOptions:{allowJs:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;}
  if(options.whatsapp){source('public/brand/whatsapp-glyph-white.svg');add('src/components/public/Header.tsx');add('src/lib/admin/settings-validation.ts');modules.whatsappEntry=ts.transpileModule(source('tools/whatsapp-fixture/entry.mjs'),{compilerOptions:{allowJs:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;}
  const candidates = [...Object.keys(sources).filter(f => f.startsWith('src/') || f==='tools/rental-fixture/entry.mjs'||f==='tools/admin-fixture/entry.mjs'||f==='tools/responsive-audit/fixtures.mjs').flatMap(f => source(f).match(/[@a-zA-Z0-9_!#[\].:%/(),-]+/g) || []), 'max-w-6xl', 'mx-auto', 'p-4', 'md:p-8'];
  cssText = css.build(candidates) + '\n.fixture-banner{position:relative;background:#fff2bf;border:3px solid #a66e00;padding:16px;margin-bottom:20px}.fixture-banner label{display:inline-block;margin:8px}.fixture-status{font-weight:bold;color:#8b1111}';
  if(options.audit){for(const [family,file]of [['FixtureManrope','src/app/fonts/manrope/Manrope[wght].ttf'],['FixtureCormorant','src/app/fonts/cormorantgaramond/CormorantGaramond[wght].ttf']]){const bytes=fs.readFileSync(path.join(root,file));sources[file]=digest(bytes);cssText+=`@font-face{font-family:${family};src:url(data:font/ttf;base64,${bytes.toString('base64')}) format('truetype');font-weight:100 900;font-display:swap}`;}cssText+=':root{--font-manrope:FixtureManrope;--font-cormorant:FixtureCormorant}';}
  let entry = `
if(window.top!==window || !(location.protocol==='file:' || (location.href==='about:blank' && window.__BOREALIS_FIXTURE_HEADLESS__===true)))throw Error('Fixture cannot run on a hosted origin');
const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){if(args.length)super(...args);else super('2026-10-21T12:00:00Z')}static now(){return NativeDate.parse('2026-10-21T12:00:00Z')}};
const cache={};function require(id){if(!(id in factories))throw Error('Unlisted fixture module '+id);if(!cache[id]){const m={exports:{}};cache[id]=m;factories[id](require,m,m.exports)}return cache[id].exports}
const React=require('react'),root=require('react-dom/client').createRoot(document.getElementById('root'));
let transport;const blocked=()=>{document.getElementById('boundary').textContent='FIXTURE BOUNDARY VIOLATION';throw Error('Fixture blocks network-capable APIs')};
Object.defineProperty(window,'open',{value:blocked,writable:false,configurable:false});
for(const key of ['WebSocket','EventSource','Worker','SharedWorker'])Object.defineProperty(window,key,{value:class{constructor(){blocked()}},writable:false,configurable:false});
Object.defineProperty(window,'XMLHttpRequest',{value:class{constructor(){blocked()}},writable:false,configurable:false});
Object.defineProperty(navigator,'sendBeacon',{value:blocked,writable:false,configurable:false});
if(navigator.serviceWorker)navigator.serviceWorker.register=blocked;
const fixtureFetch=(input,init)=>transport.fetch(input,init);Object.defineProperty(window,'fetch',{value:fixtureFetch,writable:false,configurable:false});
window.addEventListener('securitypolicyviolation',()=>{document.getElementById('boundary').textContent='FIXTURE CSP BLOCKED REQUEST'});
window.__fixture={calls:()=>transport.calls,violations:()=>transport.violations,state:()=>transport.state()};
function mount(){const scenario=document.getElementById('scenario').value;transport=require('fixture').createFixtureTransport({...require('@/lib/booking/search-criteria'),...require('@/lib/pricing/core'),...require('@/lib/booking/accommodation-allocation'),scenario});document.getElementById('cancel-result').textContent='';root.render(React.createElement(require('@/components/booking/BookingFlow').BookingFlow,{key:scenario+'-'+Math.random(),initialCheckIn:'2026-11-16',initialCheckOut:'2026-11-20',initialGuests:scenario==='multi'?6:2,initialAdults:scenario==='multi'?6:2,initialChildren:0,initialInfants:0,autoSearch:true,addons:[]}))}
document.getElementById('scenario').onchange=mount;document.getElementById('reset').onclick=mount;
document.getElementById('cancel').onclick=async()=>{const response=await fetch('/__fixtures/cancel',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reference:'FICTIONAL-BOREALIS-0001'})});const body=await response.json();document.getElementById('cancel-result').textContent=response.ok?'FICTIONAL RESERVATION CANCELLED':body.error};mount();
`;
  if(options.rental){const start=entry.indexOf('function mount()');entry=entry.slice(0,start)+`function mount(){transport=require('rentalEntry').mountRentalFixture({root,scenario:document.getElementById('scenario').value,legacy:require('fixture'),libs:{...require('@/lib/booking/search-criteria'),...require('@/lib/pricing/core'),...require('@/lib/booking/accommodation-allocation')}})}document.getElementById('scenario').onchange=mount;document.getElementById('reset').onclick=mount;document.addEventListener('click',e=>{if(e.target.closest('a'))e.preventDefault()});mount();`;}
  if(options.admin){const start=entry.indexOf('function mount()');entry=entry.slice(0,start)+`function mount(){transport=require('adminEntry').mountAdminFixture({root,scenario:document.getElementById('scenario').value})}document.getElementById('scenario').onchange=mount;document.getElementById('reset').onclick=mount;mount();`;}
  if(options.audit){const start=entry.indexOf('function mount()');entry=entry.slice(0,start)+`async function mount(){transport=await require('auditEntry').mountAuditFixture({root,scenario:document.getElementById('scenario').value})}document.getElementById('scenario').onchange=mount;document.getElementById('reset').onclick=mount;mount();`;}
  if(options.calendar)entry=entry.replace(/function mount\(\)\{[\s\S]*?\}document\.getElementById\('scenario'\)/,`function mount(){const scenario=document.getElementById('scenario').value;Promise.resolve(require('calendarEntry').mountCalendarFixture({root,scenario})).then(value=>transport=value);}document.getElementById('scenario')`);
  if(options.whatsapp){const start=entry.indexOf('function mount()');entry=entry.slice(0,start)+`function mount(){transport=require('whatsappEntry').mountWhatsAppFixture({root,scenario:document.getElementById('scenario').value})}document.getElementById('scenario').onchange=mount;document.getElementById('reset').onclick=mount;mount();`;}
  const js = `/* BOREALIS_BOOKING_FIXTURE_HARNESS_V1 */(()=>{const process={env:{NODE_ENV:'development'}};const factories={${Object.entries(modules).map(([id, code]) => `${JSON.stringify(id)}:function(require,module,exports){${code}\n}`).join(',')}};${entry}})();`;
  const scriptHash = crypto.createHash('sha256').update(js).digest('base64');
  const csp = `default-src 'none'; script-src 'sha256-${scriptHash}'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; worker-src 'none'`;
  let html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>Borealis — FICTIONAL booking tests</title><style>${cssText}</style></head><body><main class="mx-auto max-w-6xl p-4 md:p-8"><section class="fixture-banner"><h1>LOCAL FIXTURE ONLY — NO REAL RESERVATIONS</h1><p>Synthetic rooms, prices and confirmation. No database, Auth, email, payments or server. Test clock: 21 October 2026. Enter fictional guest details only.</p><label>Fixture scenario <select id="scenario"><option value="available">Available rooms</option><option value="multi">Multi-room party (6 adults)</option><option value="empty">No availability</option><option value="pricing-error">Pricing failure</option><option value="hold-error">Hold failure</option><option value="confirm-error">Confirmation failure</option></select></label><button id="reset">Reset fixture</button><p id="boundary" class="fixture-status">NETWORK DISABLED — ALL RESPONSES SYNTHETIC</p><button id="cancel">Cancel synthetic reservation</button><p id="cancel-result" role="status"></p><p>Cancellation is a harness-only control; it is not a production guest cancellation feature.</p></section><div id="root"></div></main><script>${js.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
  if(options.rental)html=html.replace(/<select id="scenario">[\s\S]*?<\/select>/,'<select id="scenario"><option value="catalogue">Catalogue cards</option><option value="standalone">Standalone rental</option><option value="room">Room rental add-on</option><option value="admin">Owner rental settings</option></select>').replace('Synthetic rooms, prices and confirmation.','Synthetic equipment, rooms, prices and confirmation.');
  if(options.admin)html=html.replace(/<select id="scenario">[\s\S]*?<\/select>/,'<select id="scenario"><option value="rental">Rental editor</option><option value="experience">Experience editor</option><option value="transfer">Transfer editor</option><option value="room">Room editor</option><option value="settings">Settings</option><option value="navigation">Navigation & list</option></select>').replace('Synthetic rooms, prices and confirmation.','Synthetic admin records and saves. No production access.');
  if(options.audit)html=html.replace(/<select id="scenario">[\s\S]*?<\/select>/,'<select id="scenario">'+['dashboard','rooms','rates','amenities','availability','media','languages','seo','bookings','inquiries','notifications','bookingdetail','channels','homepageform','siteform','articleform','manualbooking','publicloading','bookingloading','adminloading','adminerror','gallery','confirmation','transfer','article','bookings-empty','rates-error'].map(name=>'<option value="'+name+'">'+name+'</option>').join('')+'</select>');
  if(options.calendar)html=html.replace(/<select id="scenario">[\s\S]*?<\/select>/,'<select id="scenario"><option value="calendar">Calendar</option><option value="empty">Empty calendar</option><option value="year">Year boundary</option><option value="prefill">Prefilled booking</option><option value="deep">Legacy date link</option></select>');
  if(options.whatsapp)html=html.replace(/<select id="scenario">[\s\S]*?<\/select>/,'<select id="scenario"><option value="saved">Saved number</option><option value="missing">Missing number</option><option value="invalid">Invalid number</option></select>');
  // No script contains closing script markup; hash must match exact emitted text.
  if (js !== js.replace(/<\/script/gi, '<\\/script')) throw Error('Unexpected script closing markup');
  fs.writeFileSync(path.join(out, 'index.html'), html, { mode: 0o600 });
  for (const file of ['tools/booking-fixture/build.mjs','tools/booking-fixture/browser-tests.mjs','tools/booking-fixture/run.py']) source(file);
  const manifest = { localOnly: true, serverStarted: false, environmentGuard: true, sources, html_sha256: digest(html), script_sha256: digest(js), csp, modules: Object.keys(modules) };
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2), { mode: 0o600 });
  return { out, html, manifest };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const built = await buildFixture(); console.log(JSON.stringify({ fixture: built.out, sources: Object.keys(built.manifest.sources).length, serverStarted: false }));
}
