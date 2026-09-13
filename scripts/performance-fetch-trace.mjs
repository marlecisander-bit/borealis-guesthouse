import { appendFileSync, mkdirSync } from 'node:fs';
const destination = process.env.PERF_FETCH_LOG;
if (destination) {
  mkdirSync('test-results/performance', {recursive:true});
  const original = globalThis.fetch;
  globalThis.fetch = async (...args) => {
    const input = args[0];
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    const tracked = url.pathname.startsWith('/rest/v1/') || url.pathname.startsWith('/auth/v1/');
    const start = performance.now();
    try { const response = await original(...args); if(tracked) appendFileSync(destination, JSON.stringify({path:url.pathname,status:response.status,ms:Math.round(performance.now()-start)})+'\n'); return response; }
    catch(error){if(tracked)appendFileSync(destination,JSON.stringify({path:url.pathname,status:'error',ms:Math.round(performance.now()-start)})+'\n');throw error;}
  };
}
