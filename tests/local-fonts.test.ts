import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
test('font files and notices match pinned official provenance',()=>{
 const provenance=JSON.parse(readFileSync(new URL('src/app/fonts/provenance.json',root),'utf8'));
 assert.equal(provenance.repository,'https://github.com/google/fonts');assert.match(provenance.commit,/^[a-f0-9]{40}$/);
 for(const row of provenance.files){
  const data=readFileSync(new URL(row.path,root));assert.equal(createHash('sha256').update(data).digest('hex'),row.sha256);
  assert.ok(row.source_url.startsWith(`https://raw.githubusercontent.com/google/fonts/${provenance.commit}/ofl/`));
  if(row.path.endsWith('OFL.txt'))assert.match(data.toString(),/SIL OPEN FONT LICENSE/);
  if(row.path.endsWith('.ttf'))assert.equal(data.readUInt32BE(0),0x00010000);
 }
 for(const row of provenance.webfont_derivatives){
  const data=readFileSync(new URL(row.path,root));
  const original=provenance.files.find((file:{path:string})=>file.path===row.derived_from);
  assert.ok(original);
  assert.equal(data.toString('ascii',0,4),'wOF2');
  assert.equal(createHash('sha256').update(data).digest('hex'),row.sha256);
  assert.ok(data.length<original.bytes);
 }
});
test('local font integration preserves family variables, weights, normal styles and swap',()=>{
 const source=readFileSync(new URL('src/app/layout.tsx',root),'utf8');assert.ok(!source.includes('next/font/google'));assert.ok(source.includes("from 'next/font/local'"));
 for(const value of ['--font-manrope',"weight:'200 800'",'Manrope-variable.woff2',"style:'normal'","display:'swap'"])assert.ok(source.includes(value),value);
 const css=readFileSync(new URL('src/app/site.css',root),'utf8');
 for(const value of ['--font-cormorant','font-weight: 300 700','font-style: normal','font-display: swap','local("Times New Roman")'])assert.ok(css.includes(value),value);
 const serifPath=css.match(/url\("(\/fonts\/cormorant-garamond-[\da-f]+\.woff2)"\)/)?.[1];
 assert.ok(serifPath);
 assert.ok(source.includes(`preload('${serifPath}'`));
 assert.ok(!source.includes("style:'italic'")); // Original loader used normal faces only; CSS italic synthesis is unchanged.
});
