import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { effectiveTeamPermissions, teamPresets } from '../src/lib/admin/team-permissions.ts';

const id=(n:number)=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const [property,other,owner,operator,viewer,editor,writer,room,roomType,booking,asset]=Array.from({length:11},(_,i)=>id(i+1));
const file=(path:string)=>readFile(new URL(path,import.meta.url),'utf8');

test('preset dependency closure never creates a team or ownership grant',()=>{
  assert.deepEqual(effectiveTeamPermissions(['bookings.export','website.publish']),['bookings.export','bookings.view','website.draft','website.publish']);
  assert.deepEqual(teamPresets['Availability Operator'],['availability.manage']);
  assert.throws(()=>effectiveTeamPermissions(['team.manage']),/Unknown permission/);
});

test('Team Access migration is rerunnable and restricts direct authenticated roles and operations',async()=>{
  const db=new PGlite({extensions:{btree_gist}});
  try {
    await db.exec(await file('./fixtures/booking-management-schema.sql'));
    await db.exec(`
      ALTER TABLE auth.users ADD COLUMN email text, ADD COLUMN email_confirmed_at timestamptz;
      CREATE TABLE auth.mfa_factors(user_id uuid,status text,factor_type text);
      CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
      ALTER TABLE admin_profiles ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid(),ADD COLUMN display_name text,ADD COLUMN updated_by uuid;
      ALTER TABLE admin_profiles ADD UNIQUE(user_id,property_id);
      DROP FUNCTION public.can_manage_property(uuid,admin_role[]);
      CREATE SCHEMA storage;
      CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array($1,'/') $$;
      CREATE TABLE storage.objects(name text,bucket_id text);
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      ALTER TABLE availability_blocks ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid(),ADD COLUMN source text,ADD COLUMN reason_code text,
        ADD COLUMN archived_at timestamptz,ADD COLUMN created_by uuid,ADD COLUMN updated_by uuid;
      ALTER TABLE room_types ADD COLUMN short_description text,ADD COLUMN long_description text,ADD COLUMN description text,ADD COLUMN updated_by uuid;
      ALTER TABLE rates ADD COLUMN title text,ADD COLUMN created_by uuid,ADD COLUMN updated_by uuid;
      CREATE UNIQUE INDEX rate_current ON rates(property_id,room_type_id) WHERE status<>'archived';
      CREATE TABLE media_assets(id uuid,property_id uuid,title text,filename text,status text,is_visible boolean,created_at timestamptz DEFAULT now());
      CREATE TABLE amenities(id uuid,property_id uuid,name text,status text,active boolean);
      CREATE TABLE room_type_amenities(property_id uuid,room_type_id uuid,amenity_id uuid,created_by uuid);
      CREATE TABLE room_images(property_id uuid,room_type_id uuid,media_asset_id uuid,sort_order integer,status text,is_visible boolean,
        archived_at timestamptz,created_by uuid,updated_by uuid,UNIQUE(room_type_id,media_asset_id));
      CREATE TABLE experiences(id uuid,property_id uuid,name text,short_description text,status text,updated_by uuid);
      CREATE TABLE transfer_routes(id uuid,property_id uuid,origin text,destination text,short_description text,status text,updated_by uuid);
      CREATE TABLE cms_documents(id uuid DEFAULT gen_random_uuid(),property_id uuid,document_key text,data jsonb,draft_data jsonb,
        status text,created_by uuid,updated_by uuid,UNIQUE(property_id,document_key));
      ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE booking_guests ENABLE ROW LEVEL SECURITY;
      ALTER TABLE cms_documents ENABLE ROW LEVEL SECURITY;
      CREATE POLICY published_cms ON cms_documents FOR SELECT USING(status='published');
      GRANT USAGE ON SCHEMA auth,storage TO authenticated;
      GRANT SELECT ON bookings,booking_guests,cms_documents TO authenticated;
      GRANT INSERT,UPDATE,DELETE ON storage.objects TO authenticated;
    `);
    for (const [user,email] of [[owner,'owner'],[operator,'operator'],[viewer,'viewer'],[editor,'editor'],[writer,'writer']]) {
      await db.query('INSERT INTO auth.users VALUES ($1,$2,now())',[user,email+'@example.invalid']);
    }
    await db.query('INSERT INTO properties(id) VALUES ($1),($2)',[property,other]);
    await db.query("INSERT INTO admin_profiles(user_id,property_id,role,is_active) VALUES ($1,$2,'owner',true)",[owner,property]);
    const migration=await file('../database/migrations/20261118_045_team_access.sql');
    await db.exec(migration);
    await db.exec(`
      CREATE POLICY booking_legacy ON bookings FOR SELECT USING(public.can_manage_property(property_id));
      CREATE POLICY guest_legacy ON booking_guests FOR SELECT USING(public.can_manage_property(property_id));
    `);
    await db.query("INSERT INTO room_types(id,property_id,name,max_total_occupancy) VALUES ($1,$2,'Lake Room',3)",[roomType,property]);
    await db.query("INSERT INTO rooms(id,property_id,room_type_id,title) VALUES ($1,$2,$3,'Lake Room 1')",[room,property,roomType]);
    await db.query("INSERT INTO bookings(id,property_id,reference,booking_status) VALUES ($1,$2,'LOCAL-1','confirmed')",[booking,property]);
    await db.query("INSERT INTO booking_guests(property_id,booking_id,first_name,email,phone) VALUES ($1,$2,'Private Guest','private@example.invalid','12345')",[property,booking]);
    await db.query("INSERT INTO media_assets(id,property_id,title,status,is_visible) VALUES ($1,$2,'Approved','published',true)",[asset,property]);
    await db.query("INSERT INTO cms_documents(property_id,document_key,data,draft_data,status) VALUES ($1,'contact','{\"introduction\":\"Live copy\"}','{\"private\":\"draft-only data\"}','published')",[property]);
    const actor=async(user:string,aal='aal1',fresh=false)=>{
      await db.exec('RESET ROLE');
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[
        user,JSON.stringify({aal,amr:fresh?[{method:'totp',timestamp:Math.floor(Date.now()/1000)}]:[]}),
      ]);
      await db.exec('SET ROLE authenticated');
    };
    const read=async(area:string,tenant=property)=>(await db.query<{data:unknown}>('SELECT team_workspace($1,$2) AS data',[tenant,area])).rows[0].data;
    const write=(operation:string,target:string|null,payload:object)=>db.query('SELECT team_workspace_write($1,$2,$3,$4)',[property,operation,target,payload]);
    const manage=async(operation:string,target:string|null,payload:object={})=>(await db.query<{data:{id:string}}>('SELECT team_manage($1,$2,$3,$4) AS data',[property,operation,target,payload])).rows[0].data;
    const accept=(invite:string)=>db.query('SELECT team_accept($1)',[invite]);

    await actor(viewer);
    await assert.rejects(()=>db.query('SELECT team_directory($1)',[property]),/Access denied/);
    await assert.rejects(()=>manage('create_role',null,{name:'Unauthorized',permissions:[]}),/Access denied/);
    await actor(owner);
    assert.match(JSON.stringify((await db.query('SELECT team_directory($1)',[property])).rows),/Super Admin/);
    const role = await manage('create_role',null,{name:'Front desk calendar',permissions:teamPresets['Availability Operator']});
    await assert.rejects(()=>manage('create_role',null,{name:'front desk calendar',permissions:[]}),/duplicate key/);
    await assert.rejects(()=>manage('create_role',null,{name:'Super Admin',permissions:[]}),/distinct role name/);
    const list = await db.query('SELECT team_role_list($1)',[property]);
    assert.match(JSON.stringify(list.rows),/Front desk calendar/);
    await assert.rejects(()=>db.query('SELECT team_role_list($1)',[other]),/Access denied/);
    const inviteOperator={name:'Operator',email:'operator@example.invalid',roleId:role.id,permissions:['bookings.view']};
    const cancelled=await manage('invite',null,inviteOperator);
    await assert.rejects(()=>manage('invite',null,inviteOperator),/already exists/);
    await manage('cancel',cancelled.id);
    const replacement=await manage('invite',null,inviteOperator);
    assert.notEqual(cancelled.id,replacement.id);
    await actor(viewer);
    await assert.rejects(()=>accept(replacement.id),/unavailable/);
    await actor(operator);
    await assert.rejects(()=>accept(cancelled.id),/unavailable/);
    await db.exec('RESET ROLE');
    await db.query("UPDATE team_invitations SET expires_at=now()-interval '1 minute' WHERE id=$1",[replacement.id]);
    await actor(operator);
    await assert.rejects(()=>accept(replacement.id),/unavailable/);
    await actor(owner);
    assert.equal((await manage('resend',replacement.id)).id,replacement.id);
    await actor(operator);
    await accept(replacement.id);
    await assert.rejects(()=>read('bookings.view'),/Access denied/);
    await assert.rejects(()=>read('availability.manage',other),/Access denied/);
    assert.doesNotMatch(JSON.stringify(await read('availability.manage')),/Private Guest|private@example/);
    await write('block',room,{start:'2035-01-01',end:'2035-01-02'});
    const calendar=await read('availability.manage') as {blocks:{id:string}[]};
    assert.equal(calendar.blocks.length,1);
    await write('reopen',calendar.blocks[0].id,{});
    await assert.rejects(()=>write('booking_status',booking,{status:'cancelled'}),/Access denied/);
    await assert.rejects(()=>db.query("INSERT INTO storage.objects VALUES ($1,'public-media')",[property+'/unsafe.jpg']),/row-level security/);

    for(const [user,preset,email] of [[viewer,'Bookings Viewer','viewer'],[editor,'Rooms Editor','editor'],[writer,'Website Editor','writer']]) {
      await actor(owner);
      const invitation=await manage('invite',null,{name:email,email:email+'@example.invalid',preset,permissions:teamPresets[preset]});
      await actor(user);
      await accept(invitation.id);
    }
    await actor(viewer);
    assert.match(JSON.stringify(await read('bookings.view')),/LOCAL-1/);
    assert.doesNotMatch(JSON.stringify(await read('bookings.view')),/Private Guest|private@example/);
    assert.equal((await db.query('SELECT * FROM booking_guests')).rows.length,0);
    await assert.rejects(()=>read('bookings.export'),/Access denied/);
    await assert.rejects(()=>write('booking_status',booking,{status:'cancelled'}),/Access denied/);
    await actor(editor);
    await write('room_content',roomType,{short:'Changed copy',long:'Long copy',media:asset,capacity:99,price:1});
    await assert.rejects(()=>write('rate',roomType,{price:'1'}),/Access denied/);
    await assert.rejects(()=>write('room_capacity',roomType,{total:99}),/Access denied/);
    await actor(writer);
    await write('draft',null,{key:'contact',copy:'Draft text',status:'published'});
    assert.match(JSON.stringify(await read('website.draft')),/Draft text/);
    assert.doesNotMatch(JSON.stringify(await read('website.draft')),/draft-only data/);
    assert.equal((await db.query<{data:{introduction:string}}>('SELECT data FROM cms_documents')).rows[0].data.introduction,'Live copy');
    await assert.rejects(()=>db.query('SELECT draft_data FROM cms_documents'),/permission denied/);
    await assert.rejects(()=>write('publish',null,{key:'contact'}),/Access denied/);
    await db.exec('RESET ROLE');
    const memberId=async(user:string)=>(await db.query<{id:string}>('SELECT id FROM admin_profiles WHERE user_id=$1',[user])).rows[0].id;
    const writerId=await memberId(writer),viewerId=await memberId(viewer);
    assert.equal((await db.query<{max_total_occupancy:number}>('SELECT max_total_occupancy FROM room_types')).rows[0].max_total_occupancy,3);
    await assert.rejects(()=>db.query('UPDATE admin_profiles SET is_active=false WHERE user_id=$1',[owner]),/Last active Super Admin/);
    await db.exec(migration);
    await actor(owner);
    await manage('permissions',writerId,{preset:'Website Editor',permissions:['website.publish']});
    await actor(writer);
    await write('publish',null,{key:'contact'});
    await actor(owner);
    await manage('suspend',viewerId);
    await actor(viewer);
    await assert.rejects(()=>read('bookings.view'),/Access denied/);
    await assert.rejects(()=>db.query('SELECT team_email_recipient_allowed($1,$2)',[property,'viewer@example.invalid']),/permission denied/);
    await db.exec('RESET ROLE; SET ROLE service_role');
    assert.equal((await db.query<{allowed:boolean}>('SELECT team_email_recipient_allowed($1,$2) AS allowed',[property,'viewer@example.invalid'])).rows[0].allowed,false);
    await actor(owner);
    assert.match(JSON.stringify((await db.query('SELECT team_directory($1)',[property])).rows),/Front desk calendar/);
  } finally {await db.close();}
});
