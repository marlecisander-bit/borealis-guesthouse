// Native PostgreSQL multi-session test, confined to a new disposable loopback cluster.
// Bootstrap the optional binary runtime under .local; see the release guide.
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import ts from 'typescript';
const root=process.cwd(),runtime=path.join(root,'.local/rental-native-runtime');
const runtimeRequire=createRequire(path.join(runtime,'package.json'));
const {default:EmbeddedPostgres}=await import(runtimeRequire.resolve('embedded-postgres'));
const {Client}=runtimeRequire('pg');
function load(file){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>load(path.resolve(path.dirname(file),name)),m,m.exports);return m.exports}
const {catalogueRentalConfig}=load(path.join(root,'src/lib/rentals/catalogue.ts'));
const socket=net.createServer();await new Promise((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.1',resolve)});const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
fs.mkdirSync(path.join(root,'.local'),{recursive:true});const dir=fs.mkdtempSync(path.join(root,'.local/rental-native-check-'));
const postgres=new EmbeddedPostgres({databaseDir:dir,user:'postgres',password:'synthetic-fixture-only',port,persistent:false,autoRehydrateSymlinks:true,postgresFlags:['-c','listen_addresses=127.0.0.1'],onLog:()=>{},onError:()=>{}});
const clients=[];
try{
 await postgres.initialise();await postgres.start();
 for(let i=0;i<3;i++){const client=new Client({host:'127.0.0.1',port,user:'postgres',password:'synthetic-fixture-only',database:'postgres',application_name:'borealis-rental-fixture-'+i});await client.connect();await client.query("SET statement_timeout='15s'");clients.push(client)}
 const [a,b,inspect]=clients;
 await a.query(fs.readFileSync('tests/fixtures/rental-schema.sql','utf8'));await a.query(fs.readFileSync('database/migrations/20261103_040_equipment_rentals.sql','utf8'));
 const product='22222222-2222-4222-8222-222222222222',property='11111111-1111-4111-8111-111111111111',day=new Date(Date.now()+14*86400000).toISOString().slice(0,10),next=new Date(Date.now()+15*86400000).toISOString().slice(0,10);
 const c=catalogueRentalConfig('double_kayak');c.units=c.units.slice(0,1);c.occupancyReviewed=true;c.dailyHoursReviewed=true;c.roomAddon=true;c.standalone=true;c.paymentMethods=['cash'];c.policies.collection='Synthetic collect';c.policies.return='Synthetic return';c.policies.meetingPoint='Synthetic reception';c.policies.cancellation='Synthetic cancellation';c.policies.weather='Synthetic weather';
 await a.query('INSERT INTO experiences(id,property_id,name,rental_config) VALUES($1,$2,$3,$4)',[product,property,'Synthetic native test',c]);
 const selection={experienceId:product,date:day,startTime:'10:00',mode:'hourly',hours:2,quantity:1,adults:2,children:0,paymentMethod:'cash'},guest={firstName:'Synthetic',lastName:'Native',phone:'000',email:'synthetic@example.invalid',adults:2,children:0};
 const hold=client=>client.query('SELECT * FROM create_equipment_rental_hold($1,$2)',[selection,guest]);
 const room=()=>b.query('SELECT * FROM create_rental_room_package_hold($1,$2,$3,$4,$5,$6)',[JSON.stringify([{propertyId:property}]),day,next,2,guest,JSON.stringify([{id:product,type:'experience',rentalSelection:selection}])]);
 await a.query('BEGIN');const first=(await hold(a)).rows[0];
 const contender=room().then(v=>({ok:true,value:v}),error=>({ok:false,error}));
 await new Promise(resolve=>setTimeout(resolve,150));
 const waiter=(await inspect.query("SELECT wait_event_type,wait_event FROM pg_stat_activity WHERE application_name='borealis-rental-fixture-1'")).rows[0];assert.equal(waiter.wait_event_type,'Lock');assert.equal(waiter.wait_event,'advisory');
 await a.query('COMMIT');const result=await contender;assert.equal(result.ok,false);assert.match(result.error.message,/Not enough equipment/);assert.equal(Number((await inspect.query('SELECT count(*) FROM bookings')).rows[0].count),1);
 await a.query("UPDATE bookings SET hold_expires_at=clock_timestamp()-interval '1 second' WHERE id=$1",[first.booking_id]);const replacement=(await room()).rows[0];await assert.rejects(()=>a.query("UPDATE bookings SET booking_status='confirmed' WHERE id=$1",[first.booking_id]),/Released rentals/);
 await a.query("UPDATE bookings SET booking_status='cancelled' WHERE id=$1",[replacement.booking_id]);const race=await Promise.allSettled([hold(a),hold(b)]);assert.equal(race.filter(x=>x.status==='fulfilled').length,1);assert.equal(race.filter(x=>x.status==='rejected').length,1);
 const active=Number((await inspect.query("SELECT count(*) FROM rental_allocations x JOIN booking_items i ON i.id=x.booking_item_id JOIN bookings b ON b.id=i.booking_id WHERE b.booking_status IN ('held','confirmed','pending') AND (b.booking_status<>'held' OR b.hold_expires_at>clock_timestamp())")).rows[0].count);assert.equal(active,1);
 await inspect.query(fs.readFileSync('database/tests/rental_release_postcheck.sql','utf8'));
 const receipt={nativePostgres: (await inspect.query('SHOW server_version')).rows[0].server_version,multipleConnections:true,observedAdvisoryLock:true,roomStandaloneRace:'PASS',failedPackageRollback:'PASS',expiredHoldRelease:'PASS',expiredConfirmationDenied:'PASS',simultaneousLastUnit:'PASS',activeAllocations:active,loopbackOnly:true,syntheticOnly:true};
 fs.writeFileSync(path.join(root,'.local/rental-native-results.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
}finally{for(const c of clients)await c.end().catch(()=>{});await postgres.stop()}
