// Local synthetic UI tests. Every network request is blocked at the browser.
import {chromium} from '@playwright/test';
import {buildFixture} from '../booking-fixture/build.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const {html,out}=await buildFixture(process.env,{rental:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking','--disable-component-update','--disable-extensions','--no-first-run']});
const results=[];
try{
 for(const viewport of [{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]){
  const context=await browser.newContext({viewport,serviceWorkers:'block'}),outbound=[],errors=[];
  await context.route('**/*',r=>{outbound.push(r.request().url());return r.abort('blockedbyclient')});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.evaluate(()=>{window.__BOREALIS_FIXTURE_HEADLESS__=true});await page.setContent(html,{waitUntil:'load'});
  async function inspect(name){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' horizontal overflow');await page.screenshot({path:path.join(out,`${name}-${viewport.width}.png`),fullPage:true})}
  await page.getByRole('heading',{name:'Boat rental',exact:true}).waitFor();await inspect('catalogue');const positions=await page.locator('article').evaluateAll(nodes=>nodes.map(n=>({top:n.getBoundingClientRect().top,left:n.getBoundingClientRect().left})));if(viewport.width>=640)assert.equal(positions[0].top,positions[1].top,'Cards must align without stagger');assert.equal(await page.getByRole('link',{name:'Choose time',exact:true}).count(),3);assert.match(await page.locator('body').innerText(),/Fuel excluded/);assert.equal(await page.locator('body').innerText().then(t=>t.includes('Additional kayak')),false);
  await page.selectOption('#scenario','standalone');await page.getByRole('heading',{name:'Synthetic double kayak'}).waitFor();await page.getByLabel('Duration (whole hours)',{exact:true}).fill('2');await page.getByLabel('Equipment quantity (kayak)',{exact:true}).fill('1');await page.getByLabel('Adults participating',{exact:true}).fill('2');
  await page.getByRole('button',{name:'Find available times',exact:true}).click();await page.getByRole('button',{name:/10:00 → 12:00/}).click();await inspect('standalone-selection');await page.getByLabel('Rental mode',{exact:true}).selectOption('daily');await page.getByRole('button',{name:'Find available times',exact:true}).click();await page.getByRole('button',{name:/10:00 → 21:00/}).click();await inspect('standalone-daily');
  for(const[label,value]of [['First Name','Synthetic'],['Last Name','Guest'],['Email','synthetic@example.invalid'],['Phone','000']])await page.getByLabel(new RegExp('^'+label+'$','i')).fill(value);
  await page.getByRole('button',{name:'Review rental',exact:true}).click();await inspect('standalone-review');assert.match(await page.locator('body').innerText(),/2 adult/);await page.getByRole('button',{name:'Confirm rental request',exact:true}).click();await page.waitForFunction(()=>window.__fixtureNavigation?.includes('FIXTURE-TOKEN-NOT-VALID'));
  await page.selectOption('#scenario','room');await page.getByRole('button',{name:/Fictional Double/}).first().click();await page.getByRole('button',{name:'Add',exact:true}).click();await page.getByRole('button',{name:'Find available times',exact:true}).click();await page.getByRole('button',{name:/10:00 → 11:00/}).click();await inspect('room-addon');await page.getByRole('button',{name:'Continue to guest details',exact:true}).click();
  for(const[label,value]of [['First name','Synthetic'],['Last name','Guest'],['Email','synthetic@example.invalid'],['Phone','000']])await page.getByLabel(new RegExp('^'+label+'$','i')).fill(value);
  await page.getByRole('button',{name:'Review booking',exact:true}).first().click();await inspect('room-review');assert.match(await page.locator('body').innerText(),/1 equipment item/);await page.getByRole('button',{name:'Confirm reservation request',exact:true}).click();await page.waitForFunction(()=>window.__fixture.calls().some(c=>c.url==='/api/bookings/hold'));
  const calls=await page.evaluate(()=>window.__fixture.calls());assert.ok(calls.find(c=>c.url==='/api/bookings/hold').body.addons[0].rentalSelection);assert.equal((await page.evaluate(()=>window.__fixture.violations())).length,0);
  await page.selectOption('#scenario','admin');await page.getByRole('heading',{name:'Equipment rental',exact:true}).waitFor();await inspect('owner-settings');assert.equal(await page.getByLabel('Internal equipment name',{exact:true}).count(),4);assert.equal(outbound.length,0);assert.deepEqual(errors,[]);
  results.push({viewport,catalogue:true,standalone:true,roomAddon:true,ownerSettings:true,outbound:outbound.length,pageErrors:errors});await context.close();
 }
 if(fs.existsSync(path.join(out,'failure.txt')))fs.unlinkSync(path.join(out,'failure.txt'));
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}catch(e){fs.writeFileSync(path.join(out,'failure.txt'),String(e.stack));throw e}finally{await browser.close()}
