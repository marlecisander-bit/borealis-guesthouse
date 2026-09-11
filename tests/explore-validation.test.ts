import test from 'node:test';
import assert from 'node:assert/strict';
import{sanitizeArticleBlocks,validateArticle}from'../src/lib/admin/explore-validation.ts';

function form(values:Record<string,string>){const data=new FormData();for(const[key,value]of Object.entries(values))data.set(key,value);return data}
const publishable={status:'published',title:'A Local Guide',slug:'a-local-guide',excerpt:'A practical guide to exploring Koman.',categoryId:'00000000-0000-0000-0000-000000000001',blocks:JSON.stringify([{id:'one',type:'rich_text',text:'A safe paragraph.'}])};

test('accepts a complete structured article',()=>{const result=validateArticle(form(publishable));assert.equal(result.data?.status,'published');assert.equal(result.data?.blocks[0].type,'rich_text')});
test('generates the slug from the article title when left blank',()=>{const result=validateArticle(form({...publishable,title:'What to Pack for Koman',slug:''}));assert.equal(result.data?.slug,'what-to-pack-for-koman');assert.equal(result.state,undefined)});
test('drops unknown block types and executable CTA URLs',()=>{const blocks=sanitizeArticleBlocks(JSON.stringify([{id:'x',type:'script',text:'bad'},{id:'cta',type:'cta',label:'Bad',href:'javascript:alert(1)'}]));assert.equal(blocks.length,1);assert.equal(blocks[0].href,undefined)});
test('requires complete FAQ and relation blocks before publishing',()=>{const result=validateArticle(form({...publishable,blocks:JSON.stringify([{id:'faq',type:'faq',items:[{question:'Empty answer',answer:''}]},{id:'stay',type:'related_room'}])}));assert.equal(result.state?.errors?.content,'Complete every content block before publishing.')});
test('allows only HTTPS canonical overrides',()=>{const result=validateArticle(form({...publishable,canonicalOverride:'http://example.com/article'}));assert.ok(result.state?.errors?.canonicalOverride)});
