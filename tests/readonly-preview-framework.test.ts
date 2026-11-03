import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server.js';
import {previewServerResponse} from '../src/lib/readonly-preview/server-request.ts';
import {allowedPreviewRoute, PREVIEW_ORIGIN, PRODUCTION_ORIGIN} from '../src/lib/readonly-preview/policy.ts';

function preview(fn: () => void) {
  const old={...process.env};
  for (const k of ['NETLIFY','CONTEXT','VERCEL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','RESEND_FROM_EMAIL','ICAL_SYNC_SECRET','STRIPE_SECRET_KEY','PAYMENT_PROVIDER_SECRET']) delete process.env[k];
  Object.assign(process.env,{BOREALIS_READONLY_PREVIEW:'1',NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW:'1',NEXT_DIST_DIR:'.next-readonly-preview-v1',NEXT_PUBLIC_SUPABASE_URL:PRODUCTION_ORIGIN,NEXT_PUBLIC_SUPABASE_ANON_KEY:'sb_publishable_SYNTHETIC',APP_URL:PREVIEW_ORIGIN,NEXT_PUBLIC_APP_URL:PREVIEW_ORIGIN,NEXT_PUBLIC_SITE_URL:PREVIEW_ORIGIN});
  try{fn();}finally{for(const k of Object.keys(process.env))delete process.env[k];Object.assign(process.env,old);}
}
const request=(path='/',headers:Record<string,string>={},method='GET',origin=PREVIEW_ORIGIN)=>new NextRequest(origin+path,{method,headers:{host:'127.0.0.1:3000',...headers}});
test('installed NextRequest normalizes numeric loopback; server exception requires exact original authority',()=>preview(()=>{
 const r=request();assert.equal(r.url,'http://localhost:3000/');assert.equal(allowedPreviewRoute(r.url,'GET',r.headers),false);assert.equal(previewServerResponse(r).status,200);
 assert.equal(previewServerResponse(new NextRequest(PREVIEW_ORIGIN+'/')).status,403);
 for(const path of ['/','/about','/rooms','/experiences','/transfers','/explore-koman','/gallery','/about?lang=en'])assert.equal(previewServerResponse(request(path)).status,200);
 assert.equal(previewServerResponse(request('/about',{},'HEAD')).status,200);
}));
test('original host, protocol, port and forwarded authorities fail closed',()=>preview(()=>{
 for(const host of ['localhost:3000','127.0.0.1','127.0.0.1:3001','evil.example:3000','127.0.0.1:3000, evil.example','[::1]:3000','127.0.0.1:3000@evil.example'])assert.equal(previewServerResponse(request('/',{host})).status,403,host);
 for(const origin of ['https://127.0.0.1:3000','http://127.0.0.1:3001','http://evil.example:3000'])assert.equal(previewServerResponse(request('/',{},'GET',origin)).status,403,origin);
 assert.throws(()=>request('/',{},'GET','http://user@127.0.0.1:3000'),/credentials/);
 for(const headers of [{'x-forwarded-host':'evil.example'},{'x-forwarded-host':'127.0.0.1:3000,evil.example'},{'x-forwarded-proto':'https'},{'x-forwarded-port':'443'},{'x-forwarded-for':'203.0.113.1'},{forwarded:'host=127.0.0.1:3000'},{origin:'http://localhost:3000'}] as Record<string,string>[])assert.equal(previewServerResponse(request('/',headers)).status,403);
 assert.equal(previewServerResponse(request('/',{'x-forwarded-host':'127.0.0.1:3000','x-forwarded-proto':'http','x-forwarded-port':'3000','x-forwarded-for':'127.0.0.1'})).status,200);
}));
test('framework response denies unknown/mutation/session paths and strips synthetic sessions',()=>preview(()=>{
 for(const path of ['/book','/admin','/contact','/api/bookings/confirm','/api/bookings/cancel','/auth/v1/token','/api/internal/calendars/sync','/storage/v1/object','/unknown','/about?preview=draft'])assert.equal(previewServerResponse(request(path)).status,403);
 for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS'])assert.equal(previewServerResponse(request('/',{},method)).status,403);
 assert.equal(previewServerResponse(request('/',{'next-action':'synthetic'})).status,403);
 const response=previewServerResponse(request('/',{cookie:'synthetic_session=not_real',authorization:'Bearer SYNTHETIC'}));
 assert.equal(response.headers.has('x-middleware-request-cookie'),false);assert.equal(response.headers.has('x-middleware-request-authorization'),false);
 assert.ok(!response.headers.get('x-middleware-override-headers')?.split(',').includes('cookie'));
 assert.equal(response.headers.has('set-cookie'),false);assert.equal(response.headers.get('cache-control'),'no-store');assert.match(response.headers.get('x-robots-tag')||'',/noindex/);
}));
test('server compatibility is unavailable without paired flags or with unsafe configuration',()=>preview(()=>{
 for(const [key,value] of [['BOREALIS_READONLY_PREVIEW','0'],['NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW','0'],['SUPABASE_SERVICE_ROLE_KEY','synthetic'],['APP_URL','http://localhost:3000'],['NETLIFY','true']]){
  const prior=process.env[key];process.env[key]=value;assert.equal(previewServerResponse(request()).status,403);if(prior===undefined)delete process.env[key];else process.env[key]=prior;
 }
 delete process.env.BOREALIS_READONLY_PREVIEW;delete process.env.NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW;assert.equal(previewServerResponse(request()).status,403);
}));
