#!/usr/bin/env python3
"""Mac-only offline source checks. No server, install, database runner or deployment."""
from pathlib import Path
import datetime,hashlib,json,os,shutil,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[1]
if sys.platform!='darwin' or not Path('/usr/bin/sandbox-exec').exists():raise SystemExit('OS network-denial support unavailable; stopped.')
NODE=ROOT/'.local/readonly-build-v1/node-v20.19.5-darwin-arm64/bin/node'
if not NODE.is_file() or subprocess.check_output([str(NODE),'--version'],text=True).strip()!='v20.19.5':raise SystemExit('Reviewed Node 20.19.5 unavailable; stopped without installing.')
os.umask(0o077)
BASE=ROOT/'.local'/('safe-checks-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'));BASE.mkdir(mode=0o700,parents=True);(BASE/'.gitignore').write_text('*\n')
SOURCE=BASE/'source';SOURCE.mkdir(mode=0o700)
for name in ['src','public','tests']:shutil.copytree(ROOT/name,SOURCE/name,symlinks=True)
# Test-only fixtures stay outside src/public and are never a Next route.
if (ROOT/'tools/booking-fixture').exists():shutil.copytree(ROOT/'tools/booking-fixture',SOURCE/'tools/booking-fixture')
for name in ['package.json','package-lock.json','next.config.ts','next-env.d.ts','tsconfig.json','postcss.config.mjs','eslint.config.mjs','AGENTS.md']:
 if (ROOT/name).exists():shutil.copy2(ROOT/name,SOURCE/name)
shutil.copytree(ROOT/'docs/security-proposals/phase-a',SOURCE/'docs/security-proposals/phase-a')
subprocess.run(['/bin/cp','-cR',str(ROOT/'node_modules'),str(SOURCE/'node_modules')],check=True)
def inventory(root):
 out={}
 for base,ds,fs in os.walk(root,followlinks=False):
  for name in ds+fs:
   p=Path(base)/name;rel=str(p.relative_to(root))
   if p.is_symlink():out[rel]={'link':os.readlink(p)}
   elif p.is_file():out[rel]={'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 return out
original_deps=inventory(ROOT/'node_modules');clone_deps=inventory(SOURCE/'node_modules')
assert original_deps==clone_deps,'Dependency clone differs; stopped'
(BASE/'dependency-manifest.json').write_text(json.dumps(original_deps,sort_keys=True))
source_before=inventory(SOURCE/'src');canonical_before=inventory(ROOT/'src')
LOADER=BASE/'typescript-loader.mjs';LOADER.write_text("import ts from './source/node_modules/typescript/lib/typescript.js';import {readFile} from 'node:fs/promises';export async function load(url,context,nextLoad){if(url.startsWith('file:')&&url.endsWith('.ts')){const source=await readFile(new URL(url),'utf8');return {format:'module',source:ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,shortCircuit:true};}return nextLoad(url,context);}")
POLICY=BASE/'offline.sb';POLICY.write_text('(version 1)\n(allow default)\n(deny network*)\n')
HOME=BASE/'home';TMP=BASE/'tmp';HOME.mkdir();TMP.mkdir()
env={'PATH':str(NODE.parent)+':/usr/bin:/bin','HOME':str(HOME),'TMPDIR':str(TMP),'NEXT_TELEMETRY_DISABLED':'1','NEXT_DIST_DIR':'.next-safe-checks','NEXT_PUBLIC_SUPABASE_URL':'https://rlqyruulxyanfgvnzkpe.supabase.co','NEXT_PUBLIC_SITE_URL':'https://borealisguesthouse.netlify.app','APP_URL':'https://borealisguesthouse.netlify.app','NEXT_PUBLIC_APP_URL':'https://borealisguesthouse.netlify.app'}
# Read only the two explicitly public build values. Never inherit dotenv/deployment/provider credentials.
for line in (ROOT/'.env.local').read_text().splitlines():
 if line.startswith('NEXT_PUBLIC_SUPABASE_ANON_KEY='):env['NEXT_PUBLIC_SUPABASE_ANON_KEY']=line.split('=',1)[1].strip().strip('\"\'')
assert env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY','').startswith('sb_publishable_'),'Reviewed public configuration unavailable'
result={'started_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':str(SOURCE),'network':'OS deny network*','dependency_entries':len(original_deps),'dependency_clone_matches':True,'privileged_credentials_supplied':False,'preview_flags_supplied':False,'normal_mode':True,'server_started':False,'checks':{}}
def save(): (BASE/'result.json').write_text(json.dumps(result,indent=2)+'\n')
def run(name,args,production=False):
 e=dict(env)
 if production:e['NODE_ENV']='production'
 with (BASE/(name+'.log')).open('w') as log:
  r=subprocess.run(['/usr/bin/sandbox-exec','-f',str(POLICY),str(NODE),*args],cwd=SOURCE,env=e,stdout=log,stderr=subprocess.STDOUT)
 # Only public key can be present in environment; redact it even from compiler diagnostics.
 p=BASE/(name+'.log');p.write_text(p.read_text().replace(env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],'[PUBLIC_KEY_REDACTED]'))
 result['checks'][name]=r.returncode;save()
 if r.returncode:raise SystemExit('Check failed: '+name+'. See private log; no retry or startup.')
run('unit',['--experimental-loader',str(LOADER),'--test',*[str(x.relative_to(SOURCE)) for x in sorted((SOURCE/'tests').glob('*.test.ts'))]])
run('typescript',[str(SOURCE/'node_modules/typescript/bin/tsc'),'--noEmit','--incremental','false'])
run('eslint',[str(SOURCE/'node_modules/eslint/bin/eslint.js'),'src','tests','next.config.ts'])
run('build',[str(SOURCE/'node_modules/next/dist/bin/next'),'build','--webpack'],True)
assert original_deps==inventory(ROOT/'node_modules')==inventory(SOURCE/'node_modules'),'Dependencies changed'
assert canonical_before==inventory(ROOT/'src'),'Canonical source changed during run'
artifacts=inventory(SOURCE/'.next-safe-checks');(BASE/'build-artifacts.json').write_text(json.dumps(artifacts,sort_keys=True))
result.update(status='PASS',artifacts=len(artifacts),canonical_source_unchanged=True,dependency_integrity_after=True,finished_at=datetime.datetime.now(datetime.timezone.utc).isoformat());save();print(json.dumps({'result':str(BASE/'result.json'),**result},indent=2))
