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
});
test('local font integration preserves family variables, weights, normal styles and swap',()=>{
 const source=readFileSync(new URL('src/app/layout.tsx',root),'utf8');assert.ok(!source.includes('next/font/google'));assert.ok(source.includes("from 'next/font/local'"));
 for(const value of ['--font-manrope','--font-cormorant',"weight:'200 800'","weight:'400'","weight:'500'","weight:'600'","style:'normal'","display:'swap'","adjustFontFallback:'Times New Roman'"])assert.ok(source.includes(value),value);
 assert.ok(!source.includes("style:'italic'")); // Original loader used normal faces only; CSS italic synthesis is unchanged.
});
