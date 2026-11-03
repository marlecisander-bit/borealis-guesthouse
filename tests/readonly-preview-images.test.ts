import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {previewPublicImages} from '../src/lib/readonly-preview/public-images.ts';
import {previewCsp, allowedPreviewRoute, approvedSupabaseRead, PREVIEW_ORIGIN} from '../src/lib/readonly-preview/policy.ts';

test('only nine exact public image object paths are exposed to image loading',()=>{
 assert.equal(previewPublicImages.length,9);assert.equal(new Set(previewPublicImages).size,9);
 const img=previewCsp.split(';').find(x=>x.trim().startsWith('img-src'))!;
 assert.ok(!img.includes('*'));assert.ok(!img.includes('unsplash'));
 for(const src of previewPublicImages){
  const u=new URL(src);assert.equal(u.origin,'https://rlqyruulxyanfgvnzkpe.supabase.co');assert.equal(u.search,'');assert.equal(u.username,'');
  assert.match(u.pathname,/^\/storage\/v1\/object\/public\/public-media\/[a-f0-9-]+\/[a-f0-9-]+\.(jpg|webp)$/);assert.ok(img.includes(src));
  assert.throws(()=>approvedSupabaseRead(src),/readonly_preview_blocked/);
 }
 assert.ok(previewCsp.includes("connect-src 'self';"));assert.ok(previewCsp.includes("form-action 'none';"));
});
test('image optimizer and mutation paths remain denied; preview-only unoptimized config',()=>{
 assert.equal(allowedPreviewRoute(PREVIEW_ORIGIN+'/_next/image?url='+encodeURIComponent(previewPublicImages[0])+'&w=640&q=75','GET',new Headers()),false);
 for(const p of ['/api/contact','/api/bookings/hold','/admin','/storage/v1/object'])assert.equal(allowedPreviewRoute(PREVIEW_ORIGIN+p,'POST',new Headers()),false);
 const config=readFileSync(new URL('../next.config.ts',import.meta.url),'utf8');
 assert.match(config,/unoptimized: process.env.BOREALIS_READONLY_PREVIEW === "1" && process.env.NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW === "1"/);
});
