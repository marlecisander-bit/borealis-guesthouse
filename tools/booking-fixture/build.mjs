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
  const out = path.join(root, options.rental ? '.local/rental-fixture-v1' : '.local/booking-fixture-v1'); fs.mkdirSync(out, { recursive: true, mode: 0o700 });
  const modules = {}, sources = {};
  const digest = value => crypto.createHash('sha256').update(value).digest('hex');
  function source(file) { const data = fs.readFileSync(path.join(root, file), 'utf8'); sources[file] = digest(data); return data; }
  for (const [id, file] of Object.entries({ react: 'react/cjs/react.development.js', 'react/jsx-runtime': 'react/cjs/react-jsx-runtime.development.js', 'react-dom': 'react-dom/cjs/react-dom.development.js', 'react-dom/client': 'react-dom/cjs/react-dom-client.development.js', scheduler: 'scheduler/cjs/scheduler.development.js' })) modules[id] = source('node_modules/' + file);
  const router = `const router={replace:(url)=>{if(!url.startsWith('/book?')&&!url.startsWith('/booking/confirmation/FIXTURE-TOKEN-NOT-VALID'))throw Error('Fixture navigation denied');window.__fixtureNavigation=url}};exports.useRouter=()=>router;`;
  modules['next/navigation'] = router;
  modules['next/image'] = `module.exports=({fill,src,alt,sizes,className,...props})=>{if(!src.startsWith('data:image/'))throw Error('Fixture image boundary');return require('react').createElement('img',{src,alt,sizes,className,...props,style:fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:props.style})};`;
  if(options.rental)modules['next/link']=`module.exports=({href,children,...props})=>require('react').createElement('a',{href,...props},children);`;
  function add(file) {
    const id = file.replace(/^src\//, '@/').replace(/\.tsx?$/, '');
    if (id in modules) return;
    if (!file.startsWith('src/') || /supabase|repositories|notifications|app\//.test(file)) throw Error('Server/database dependency rejected: ' + file);
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
  modules.fixture = ts.transpileModule(source('tools/booking-fixture/fixtures.mjs'), { compilerOptions: { allowJs: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  let cssText = source('src/app/globals.css');
  const css = await compile(cssText, { base: path.join(root, 'src/app'), onDependency: () => {} });
  const candidates = [...Object.keys(sources).filter(f => f.startsWith('src/') || f==='tools/rental-fixture/entry.mjs').flatMap(f => fs.readFileSync(path.join(root, f), 'utf8').match(/[a-zA-Z0-9_!#[\].:%/(),-]+/g) || []), 'max-w-6xl', 'mx-auto', 'p-4', 'md:p-8'];
  cssText = css.build(candidates) + '\n.fixture-banner{position:relative;background:#fff2bf;border:3px solid #a66e00;padding:16px;margin-bottom:20px}.fixture-banner label{display:inline-block;margin:8px}.fixture-status{font-weight:bold;color:#8b1111}';
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
  const js = `/* BOREALIS_BOOKING_FIXTURE_HARNESS_V1 */(()=>{const process={env:{NODE_ENV:'development'}};const factories={${Object.entries(modules).map(([id, code]) => `${JSON.stringify(id)}:function(require,module,exports){${code}\n}`).join(',')}};${entry}})();`;
  const scriptHash = crypto.createHash('sha256').update(js).digest('base64');
  const csp = `default-src 'none'; script-src 'sha256-${scriptHash}'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; worker-src 'none'`;
  let html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>Borealis — FICTIONAL booking tests</title><style>${cssText}</style></head><body><main class="mx-auto max-w-6xl p-4 md:p-8"><section class="fixture-banner"><h1>LOCAL FIXTURE ONLY — NO REAL RESERVATIONS</h1><p>Synthetic rooms, prices and confirmation. No database, Auth, email, payments or server. Test clock: 21 October 2026. Enter fictional guest details only.</p><label>Fixture scenario <select id="scenario"><option value="available">Available rooms</option><option value="multi">Multi-room party (6 adults)</option><option value="empty">No availability</option><option value="pricing-error">Pricing failure</option><option value="hold-error">Hold failure</option><option value="confirm-error">Confirmation failure</option></select></label><button id="reset">Reset fixture</button><p id="boundary" class="fixture-status">NETWORK DISABLED — ALL RESPONSES SYNTHETIC</p><button id="cancel">Cancel synthetic reservation</button><p id="cancel-result" role="status"></p><p>Cancellation is a harness-only control; it is not a production guest cancellation feature.</p></section><div id="root"></div></main><script>${js.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
  if(options.rental)html=html.replace(/<select id="scenario">[\s\S]*?<\/select>/,'<select id="scenario"><option value="catalogue">Catalogue cards</option><option value="standalone">Standalone rental</option><option value="room">Room rental add-on</option><option value="admin">Owner rental settings</option></select>').replace('Synthetic rooms, prices and confirmation.','Synthetic equipment, rooms, prices and confirmation.');
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
