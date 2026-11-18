import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';

const file=(path:string)=>readFile(new URL(path,import.meta.url),'utf8');
const migration=(name:string)=>file('../database/migrations/'+name);
const slice=(source:string,start:string,end:string)=>source.slice(source.indexOf(start),source.indexOf(end));
const property='00000000-0000-4000-8000-000000000001', roomType='00000000-0000-4000-8000-000000000002';
const room='00000000-0000-4000-8000-000000000003', staff='00000000-0000-4000-8000-000000000004';
const guest={firstName:'Synthetic',lastName:'Guest',email:'guest@example.invalid',phone:'+12025550101',adults:1,children:0,infants:0};
const date=(days:number)=>new Date(Date.now()+days*86400000).toISOString().slice(0,10);

async function setup() {
  const db=new PGlite({extensions:{btree_gist}});
  await db.exec(await file('./fixtures/booking-management-schema.sql'));
  const engine=await migration('20260905_027_booking_engine_completion.sql');
  await db.exec(engine.slice(engine.indexOf('CREATE TABLE'),engine.indexOf('CREATE OR REPLACE FUNCTION public.get_booking_confirmation')));
  const inventory=await migration('20260904_021_booking_management.sql');
  await db.exec(slice(inventory,'CREATE OR REPLACE FUNCTION public.expire_booking_holds','CREATE OR REPLACE FUNCTION public.sync_booking_reservation_status'));
  const packages=await migration('20260905_029_booking_packages.sql');
  await db.exec(slice(packages,'CREATE OR REPLACE FUNCTION public.create_booking_package_hold','-- Keep item lifecycle'));
  const occupancy=await migration('20260912_038_room_occupancy_policy.sql');
  await db.exec(slice(occupancy,'CREATE OR REPLACE FUNCTION public.validate_room_occupancy','CREATE OR REPLACE FUNCTION public.get_booking_confirmation_package'));
  await db.exec(occupancy.slice(occupancy.indexOf('CREATE OR REPLACE FUNCTION public.create_admin_booking')));
  await db.exec(await migration('20260905_030_booking_cancellation_release.sql'));
  await db.exec(await migration('20260905_031_owner_notifications.sql'));
  await db.exec(await migration('20261118_043_booking_management.sql'));
  await db.query("INSERT INTO properties(id,email) VALUES($1,'owner@example.invalid')",[property]);
  await db.query("INSERT INTO room_types(id,property_id,name,capacity,base_occupancy,max_adults,max_children,max_total_occupancy) VALUES($1,$2,'Test room',3,1,3,2,3)",[roomType,property]);
  await db.query("INSERT INTO rooms(id,property_id,room_type_id,room_number,title) VALUES($1,$2,$3,'1','Test room')",[room,property,roomType]);
  await db.query("INSERT INTO rates(property_id,room_type_id,base_price,currency) VALUES($1,$2,100,'EUR')",[property,roomType]);
  await db.query("INSERT INTO site_settings(property_id,setting_key,value_text,value_number) VALUES($1,'booking_mode','instant',NULL),($1,'cancellation_policy_reference','Synthetic terms',NULL),($1,'guest_change_cutoff_hours',NULL,24),($1,'guest_cancel_cutoff_hours',NULL,24)",[property]);
  await db.query('INSERT INTO auth.users VALUES($1)',[staff]);
  await db.query("INSERT INTO admin_profiles VALUES($1,$2,'staff',TRUE)",[staff,property]);
  const actor=async(id:string)=>db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[id]);
  const hold=async(start:number,end:number)=>{
    const allocation=[{roomTypeId:roomType,occupancies:[{adults:1,children:0,infants:0}]}];
    return (await db.query<{booking_id:string;hold_token:string}>('SELECT * FROM create_multi_room_booking_package_hold($1,$2,$3,1,$4)',[JSON.stringify(allocation),date(start),date(end),guest])).rows[0];
  };
  const manage=async(token:string|null,booking:string|null,action:string,input:object={},id:string|null=randomUUID())=>
    (await db.query<{result: null|{result:string;total:number;version:string;canChange:boolean;canCancel:boolean}}>('SELECT manage_booking($1,$2,$3,$4,$5) AS result',[token,booking,action,id,input])).rows[0].result;
  return {db,actor,hold,manage};
}

test('guest and admin bookings, atomic changes, inventory conflicts and cancellation are durable',async()=>{
  const {db,actor,hold,manage}=await setup();
  try {
    const first=await hold(10,12);
    assert.equal((await db.query('SELECT id FROM notifications')).rows.length,0);
    assert.equal(await manage(first.hold_token,null,'read'),null);
    await db.query('SELECT confirm_booking_hold($1,$2)',[first.booking_id,first.hold_token]);
    await actor(staff);
    const admin=(await db.query<{booking_id:string}>('SELECT * FROM create_admin_booking($1,$2,$3,1,0,0,$4)',[roomType,date(17),date(19),guest])).rows[0];
    assert.equal(await manage(first.hold_token,admin.booking_id,'read'),null);
    assert.equal(await manage(randomUUID(),null,'read'),null);
    assert.equal((await manage(null,admin.booking_id,'read'))?.canChange,true);
    const adminChange={checkIn:date(20),checkOut:date(23),adults:1,children:0,infants:0};
    const adminQuote=await manage(null,admin.booking_id,'quote',adminChange);
    assert.equal(adminQuote?.total,300);
    assert.equal((await manage(null,admin.booking_id,'modify',{...adminChange,version:adminQuote?.version}))?.result,'modified');
    assert.equal((await manage(null,admin.booking_id,'quote',adminChange))?.result,'unchanged');
    await actor('');
    assert.equal(await manage(null,first.booking_id,'read'),null);
    assert.equal((await manage(first.hold_token,null,'read'))?.canCancel,true);
    const change=async(start:number,end:number,adults=1)=>{
      const input={checkIn:date(start),checkOut:date(end),adults,children:0,infants:0};
      const quote=await manage(first.hold_token,null,'quote',input);
      assert.equal(quote?.result,'quoted');
      const id=randomUUID(), result=await manage(first.hold_token,null,'modify',{...input,version:quote?.version},id);
      assert.equal(result?.result,'modified');
      assert.deepEqual(await manage(first.hold_token,null,'modify',{...input,version:quote?.version},id),result);
      return result;
    };
    assert.equal((await change(11,14))?.total,300);
    assert.equal((await change(12,14,2))?.total,200);
    const proposal={checkIn:date(15),checkOut:date(17),adults:1,children:0,infants:0};
    const quote=await manage(first.hold_token,null,'quote',proposal);
    assert.equal(quote?.result,'quoted');
    await hold(15,17);
    assert.equal((await manage(first.hold_token,null,'modify',{...proposal,version:quote?.version}))?.result,'conflict');
    const row=(await db.query<{check_in:string;rr:string;total:string;line:string}>(`SELECT b.check_in::text,rr.check_in::text AS rr,b.total_amount::text AS total,i.total_price::text AS line
      FROM bookings b JOIN room_reservations rr ON rr.booking_id=b.id JOIN booking_items i ON i.booking_id=b.id WHERE b.id=$1`,[first.booking_id])).rows[0];
    assert.deepEqual(row,{check_in:date(12),rr:date(12),total:'200.00',line:'200.00'});
    const cancellation=randomUUID();
    assert.equal((await manage(first.hold_token,null,'cancel',{confirmed:true},cancellation))?.result,'cancelled');
    assert.equal((await manage(first.hold_token,null,'cancel',{confirmed:true},cancellation))?.result,'cancelled');
    await hold(12,14);
    assert.deepEqual((await db.query<{type:string;n:number}>('SELECT type,count(*)::int n FROM notifications GROUP BY type ORDER BY type')).rows,
      [{type:'booking_cancelled',n:1},{type:'booking_created',n:2},{type:'booking_modified',n:3}]);
    assert.equal((await db.query<{status:string}>('SELECT item_status AS status FROM booking_items WHERE booking_id=$1',[first.booking_id])).rows[0].status,'cancelled');
  } finally {await db.close();}
});

test('paid and opted-out bookings go to staff review without changing the reservation',async()=>{
  const {db,actor,hold,manage}=await setup();
  try {
    const b=await hold(10,12);
    await db.query('SELECT confirm_booking_hold($1,$2)',[b.booking_id,b.hold_token]);
    await db.query("DELETE FROM site_settings WHERE setting_key='guest_change_cutoff_hours'");
    assert.equal((await manage(b.hold_token,null,'read'))?.canChange,false);
    await db.query("UPDATE bookings SET payment_status='paid' WHERE id=$1",[b.booking_id]);
    assert.equal((await manage(b.hold_token,null,'cancel',{confirmed:true}))?.result,'review_required');
    const id=randomUUID();
    assert.equal((await manage(b.hold_token,null,'request_cancel',{message:'Please contact me about cancelling.'},id))?.result,'requested');
    assert.equal(await manage(null,b.booking_id,'read'),null);
    await actor(staff);
    assert.equal((await db.query('SELECT * FROM booking_review_queue($1)',[property])).rows.length,1);
    await manage(null,b.booking_id,'review',{},id);
    assert.equal((await db.query('SELECT * FROM booking_review_queue($1)',[property])).rows.length,0);
    assert.equal((await db.query<{status:string}>('SELECT booking_status AS status FROM bookings WHERE id=$1',[b.booking_id])).rows[0].status,'confirmed');
  } finally {await db.close();}
});

test('push queues committed changes per eligible device, retries and retires expired endpoints',async()=>{
  const {db,actor,hold,manage}=await setup();
  try{
    await db.exec(await migration('20261118_044_admin_booking_push.sql'));
    const privileges=await db.query<{guest:boolean;worker:boolean}>(`SELECT
      has_function_privilege('anon','claim_booking_push(integer)','EXECUTE') AS guest,
      has_function_privilege('service_role','claim_booking_push(integer)','EXECUTE') AS worker`);
    assert.deepEqual(privileges.rows,[{guest:false,worker:true}]);
    const endpoint='https://fcm.googleapis.com/fcm/send/test-one', second='https://web.push.apple.com/test-two';
    const key='B'+'A'.repeat(86),secret='A'.repeat(22);
    const device=async(action:string,url:string)=>(
      await db.query<{data:{enabled:boolean;retired?:boolean;testStatus?:string}}>(
        'SELECT manage_booking_push_device($1,$2,$3,$4,$5,$6) data',[property,staff,action,url,key,secret])).rows[0].data;
    assert.equal((await device('enable',endpoint)).enabled,true);
    assert.equal((await device('enable',endpoint)).enabled,true);
    assert.equal((await device('enable',second)).enabled,true);
    assert.equal((await device('test',endpoint)).testStatus,'pending');
    await device('test',endpoint);
    assert.equal((await db.query('SELECT id FROM booking_push_deliveries WHERE notification_id IS NULL')).rows.length,1);
    const b=await hold(10,12);
    assert.equal((await db.query('SELECT id FROM booking_push_deliveries WHERE notification_id IS NOT NULL')).rows.length,0);
    await db.query('SELECT confirm_booking_hold($1,$2)',[b.booking_id,b.hold_token]);
    const input={checkIn:date(11),checkOut:date(13),adults:1,children:0,infants:0};
    const quote=await manage(b.hold_token,null,'quote',input), modification=randomUUID();
    await manage(b.hold_token,null,'modify',{...input,version:quote?.version},modification);
    await manage(b.hold_token,null,'modify',{...input,version:quote?.version},modification);
    assert.equal((await db.query('SELECT id FROM booking_push_deliveries WHERE notification_id IS NOT NULL')).rows.length,4);
    type Row={job_id:string;lease:string;attempt:number};
    const claimed=(await db.query<Row>('SELECT * FROM claim_booking_push(8)')).rows;
    assert.equal(claimed.length,5);
    assert.equal((await db.query('SELECT * FROM claim_booking_push(8)')).rows.length,0);
    const read=async(job:Row)=>(await db.query<{data:{endpoint:string;type:string;bookingId:string}|null}>('SELECT read_booking_push($1,$2) data',[job.job_id,job.lease])).rows[0].data;
    const finish=(job:Row,outcome:string)=>db.query('SELECT finish_booking_push($1,$2,$3,$4)',[job.job_id,job.lease,outcome,'synthetic_outcome']);
    const first=claimed[0];
    assert.equal((await read(first))?.endpoint,endpoint);
    assert.equal((await read(first))?.type,'test');
    await finish(first,'retry');
    const retry=(await db.query<{status:string;future:boolean}>('SELECT status,next_attempt_at>now() AS future FROM booking_push_deliveries WHERE id=$1',[first.job_id])).rows[0];
    assert.deepEqual(retry,{status:'pending',future:true});
    await db.query('UPDATE booking_push_deliveries SET next_attempt_at=now()-interval \'1 second\' WHERE id=$1',[first.job_id]);
    const again=(await db.query<Row>('SELECT * FROM claim_booking_push(1)')).rows[0];
    assert.equal(again.attempt,2);
    await finish(again,'expired');
    assert.equal((await device('status',endpoint)).retired,true);
    assert.equal((await device('enable',endpoint)).enabled,false);
    const bookingDelivery=claimed[2];
    const assigned=await read(bookingDelivery);
    if(assigned)assert.equal(assigned.bookingId,b.booking_id);
    await db.query('UPDATE admin_profiles SET is_active=false WHERE user_id=$1',[staff]);
    for(const job of claimed.slice(1))assert.equal(await read(job),null);
    await actor(staff);
    assert.equal((await db.query('SELECT * FROM booking_push_overview($1,ARRAY(SELECT id FROM notifications))',[property])).rows.length,0);
    const state=(await db.query<{status:string}>('SELECT booking_status AS status FROM bookings WHERE id=$1',[b.booking_id])).rows[0];
    assert.equal(state.status,'confirmed');
  }finally{await db.close();}
});

test('stay rate, hold duration, booking window and request mode are enforced by the existing engine', async () => {
  const {db, hold, actor}=await setup();
  try {
    await db.query('UPDATE rates SET base_price=138 WHERE room_type_id=$1',[roomType]);
    await db.query("UPDATE site_settings SET value_text='request' WHERE property_id=$1 AND setting_key='booking_mode'",[property]);
    await db.query(`INSERT INTO site_settings(property_id,setting_key,value_number) VALUES
      ($1,'booking_hold_minutes',43),($1,'minimum_advance_hours',48),($1,'maximum_booking_horizon_days',30)`,[property]);
    const {rows:[price]}=await db.query<{subtotal:string}>(
      "SELECT calculate_room_stay_price($1,$2,$3,$4,1)->>'roomSubtotal' AS subtotal",
      [property,roomType,date(7),date(9)]);
    assert.equal(Number(price.subtotal),276);
    await assert.rejects(()=>hold(1,2),/outside the configured booking window/);
    await assert.rejects(()=>hold(31,32),/outside the configured booking window/);
    const booking=await hold(7,9);
    const {rows:[held]}=await db.query<{minutes:string}>(
      'SELECT EXTRACT(epoch FROM hold_expires_at - now()) / 60 AS minutes FROM bookings WHERE id=$1',[booking.booking_id]);
    assert.ok(Number(held.minutes)>42.9 && Number(held.minutes)<=43);
    await db.query('SELECT confirm_booking_hold($1,$2)',[booking.booking_id,booking.hold_token]);
    assert.equal((await db.query<{booking_status:string}>('SELECT booking_status FROM bookings WHERE id=$1',[booking.booking_id])).rows[0].booking_status,'pending');
    await db.query("INSERT INTO rooms(id,property_id,room_type_id,room_number,title) VALUES($1,$2,$3,'2','Second test room')",[randomUUID(),property,roomType]);
    const allocation=[{roomTypeId:roomType,occupancies:[{adults:2,children:0,infants:0},{adults:2,children:0,infants:0}]}];
    const {rows:[multi]}=await db.query<{booking_id:string;hold_token:string}>(
      'SELECT * FROM create_multi_room_booking_package_hold($1,$2,$3,4,$4)',[JSON.stringify(allocation),date(10),date(12),{...guest,adults:4}]);
    const {rows:[combined]}=await db.query<{room_subtotal:string}>('SELECT room_subtotal FROM bookings WHERE id=$1',[multi.booking_id]);
    assert.equal(Number(combined.room_subtotal),552);
    await actor(staff);
    const {rows:[manual]}=await db.query<{booking_id:string}>('SELECT * FROM create_admin_booking($1,$2,$3,1,0,0,$4)',[roomType,date(13),date(15),guest]);
    assert.equal((await db.query<{booking_status:string}>('SELECT booking_status FROM bookings WHERE id=$1',[manual.booking_id])).rows[0].booking_status,'confirmed');
  } finally { await db.close(); }
});
