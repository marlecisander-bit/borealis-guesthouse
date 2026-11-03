#!/usr/bin/env python3
"""Compile or headless-test the fixture HTML. Never opens it or starts a server."""
from pathlib import Path
import argparse,subprocess,os,sys,json,hashlib,uuid
root=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('operation',choices=['build','test','open']);p.add_argument('--fixtures-only',action='store_true',required=True);p.add_argument('--allow-interactive-start',action='store_true');args=p.parse_args()
if sys.platform!='darwin':raise SystemExit('Reviewed macOS network policy required')
if any(os.environ.get(k) for k in ['NETLIFY','CONTEXT','VERCEL','CI']) or os.environ.get('NODE_ENV')=='production':raise SystemExit('Hosting/production environment refused')
base=root/'.local/booking-fixture-v1';base.mkdir(mode=0o700,exist_ok=True)
for name in ['home','tmp']:(base/name).mkdir(mode=0o700,exist_ok=True)
node=root/'.local/readonly-build-v1/node-v20.19.5-darwin-arm64/bin/node'
if not node.is_file() or subprocess.check_output([str(node),'--version'],text=True).strip()!='v20.19.5':raise SystemExit('Existing reviewed Node20.19.5 required; no installation')
policy=base/'deny-ip-network.sb';policy.write_text('(version 1)\n(allow default)\n(deny network-outbound (remote ip "*:*"))\n(deny network-inbound (local ip "*:*"))\n(deny network-bind (local ip "*:*"))\n')
env={'PATH':str(node.parent)+':/usr/bin:/bin','HOME':str(base/'home'),'TMPDIR':str(base/'tmp'),'BOREALIS_BOOKING_FIXTURE':'1','NODE_ENV':'development','NEXT_TELEMETRY_DISABLED':'1'}
# Chrome requires local Unix-domain process IPC. All IP traffic/listening remains denied.
negative="""const net=require('net');let denied=0;const fail=()=>process.exit(81);const check=e=>{if(e.code!=='EPERM'&&e.code!=='EACCES')fail();if(++denied===3)process.exit(0)};const s=net.createServer();s.on('error',check);s.listen(0,'127.0.0.1',fail);for(const host of ['127.0.0.1','1.1.1.1']){const c=net.connect(443,host,fail);c.on('error',check)};setTimeout(fail,3000);"""
cmd=['/usr/bin/sandbox-exec','-f',str(policy),str(node)]
subprocess.run(cmd+['-e',negative],cwd=root,env=env,check=True)
if args.operation=='open':
 if not args.allow_interactive_start:raise SystemExit('Not started: separate interactive startup approval/flag required')
 manifest=json.loads((base/'manifest.json').read_text())
 digest=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
 if digest(base/'index.html')!=manifest['html_sha256'] or any(digest(root/n)!=value for n,value in manifest['sources'].items()):raise SystemExit('Fixture/source identity changed; rebuild and retest first')
 if not (base/'browser-results.json').exists() or (json.loads((base/'browser-results.json').read_text()).get('status')!='PASS' or json.loads((base/'browser-results.json').read_text()).get('html_sha256')!=manifest['html_sha256']):raise SystemExit('Passing headless acceptance required')
 profile=base/('interactive-profile-'+uuid.uuid4().hex);profile.mkdir(mode=0o700)
 chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
 command=['/usr/bin/sandbox-exec','-f',str(policy),chrome,'--user-data-dir='+str(profile),'--no-first-run','--no-default-browser-check','--disable-sync','--disable-extensions','--disable-background-networking','--disable-component-update','--app='+str((base/'index.html').as_uri())]
 child=subprocess.Popen(command,env=env,cwd=root,start_new_session=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 (profile/'startup.json').write_text(json.dumps({'pid':child.pid,'owned_profile':str(profile),'fixture':str(base/'index.html'),'IP_network':'denied','server_started':False}))
 print('Fixture-only browser launched with a separate empty profile; no HTTP server. PID',child.pid)
 raise SystemExit(0)
script='build.mjs' if args.operation=='build' else 'browser-tests.mjs'
raise SystemExit(subprocess.run(cmd+[str(root/'tools/booking-fixture'/script)],cwd=root,env=env).returncode)
