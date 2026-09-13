import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
const label=process.argv[2]||'baseline',origin=process.env.PERF_ORIGIN||'http://127.0.0.1:3200';
const browser=await chromium.launch();const results=[];
try {
 for(let run=0;run<3;run++){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});const page=await context.newPage();
  await page.addInitScript(()=>{window.__perf={lcp:0,cls:0,interaction:0};for(const [type,apply]of [['largest-contentful-paint',e=>window.__perf.lcp=e.startTime],['layout-shift',e=>{if(!e.hadRecentInput)window.__perf.cls+=e.value}],['event',e=>{if(e.interactionId)window.__perf.interaction=Math.max(window.__perf.interaction,e.duration)}]]){try{new PerformanceObserver(list=>list.getEntries().forEach(apply)).observe({type,buffered:true,durationThreshold:16})}catch{}}});
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');let bytes=0,requests=0;cdp.on('Network.loadingFinished',event=>bytes+=event.encodedDataLength);page.on('request',()=>requests++);
  const started=performance.now();await page.goto(origin,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForTimeout(3000);
  const metrics=await page.evaluate(()=>{const navigation=performance.getEntriesByType('navigation')[0],resources=performance.getEntriesByType('resource'),scripts=resources.filter(x=>x.initiatorType==='script');return {...window.__perf,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime||0,ttfb:navigation.responseStart,jsBytes:scripts.reduce((s,x)=>s+x.encodedBodySize,0),jsRequests:scripts.length}});
  const hero=await page.locator('[data-homepage-section="hero"] img').evaluate(img=>({loaded:img.complete&&img.naturalWidth>0,width:img.naturalWidth}));if(!hero.loaded)throw Error('Hero did not load; refusing to record incomplete LCP metrics');
  const initial={...metrics,hero,requests,transferBytes:bytes,observedMs:performance.now()-started};
  await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.locator('#mobile-menu').getByRole('button',{name:'Close menu',exact:true}).click();initial.interaction=await page.evaluate(()=>window.__perf.interaction);
  const navigationStarted=performance.now();await page.locator('a[href="/rooms"]').first().evaluate(el=>el.click());await page.waitForURL('**/rooms',{timeout:90000});await page.waitForSelector('main h1');initial.navigationMs=performance.now()-navigationStarted;
  results.push(initial);await context.close();
 }
 mkdirSync('test-results/performance',{recursive:true});writeFileSync(`test-results/performance/${label}.json`,JSON.stringify(results,null,2));const log=process.env.PERF_FETCH_LOG||`test-results/performance/${label}-fetch.jsonl`;if(existsSync(log)){const rows=readFileSync(log,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);writeFileSync(`test-results/performance/${label}-queries.json`,JSON.stringify({count:rows.length,byPath:Object.fromEntries([...new Set(rows.map(row=>row.path))].map(path=>[path,rows.filter(row=>row.path===path).length]))},null,2));}console.log(JSON.stringify({label,results}));
}finally{await browser.close()}
