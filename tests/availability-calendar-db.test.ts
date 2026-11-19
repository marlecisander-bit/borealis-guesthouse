import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const property = '00000000-0000-4000-8000-000000000001';
const owner = '00000000-0000-4000-8000-000000000002';
const operator = '00000000-0000-4000-8000-000000000003';
const type = '00000000-0000-4000-8000-000000000004';
const left = '00000000-0000-4000-8000-000000000005';
const right = '00000000-0000-4000-8000-000000000006';
const stay = '00000000-0000-4000-8000-000000000007';
const hold = '00000000-0000-4000-8000-000000000008';
const imported = '00000000-0000-4000-8000-000000000009';
const event = '00000000-0000-4000-8000-000000000010';
const feed = '00000000-0000-4000-8000-000000000011';
const outsider = '00000000-0000-4000-8000-000000000012';

test('calendar RPC protects real inventory semantics and restricts the agenda projection', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT current_setting('fixture.user',true)::uuid $$;
      CREATE TABLE properties(id uuid PRIMARY KEY, timezone text);
      CREATE TABLE admin_profiles(user_id uuid, property_id uuid, is_active boolean, role text, team_permissions text[]);
      CREATE TABLE room_types(id uuid PRIMARY KEY, name text, property_id uuid, status text);
      CREATE TABLE rooms(id uuid PRIMARY KEY, room_type_id uuid, property_id uuid, title text, room_number text, active boolean, status text);
      CREATE TABLE bookings(id uuid PRIMARY KEY, property_id uuid, check_in date, check_out date, booking_status text, hold_expires_at timestamptz, guest_name text);
      CREATE TABLE booking_items(booking_id uuid, room_id uuid, room_type_id uuid, item_id uuid, item_type text);
      CREATE TABLE room_reservations(booking_id uuid, property_id uuid, room_id uuid, check_in date, check_out date, booking_status text, hold_expires_at timestamptz);
      CREATE TABLE external_calendars(id uuid PRIMARY KEY, property_id uuid, name text);
      CREATE TABLE external_calendar_events(id uuid PRIMARY KEY, external_calendar_id uuid);
      CREATE TABLE availability_blocks(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), property_id uuid, room_id uuid, room_type_id uuid,
        start_date date, end_date date, reason_code text, reason text, internal_notes text, source text, status text,
        archived_at timestamptz, created_by uuid, updated_by uuid, external_calendar_event_id uuid);
      CREATE FUNCTION can_manage_availability(p uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
        SELECT EXISTS(SELECT 1 FROM public.admin_profiles WHERE property_id=p AND user_id=auth.uid() AND is_active AND role='owner');
      $$;
      CREATE FUNCTION team_has_permission(p uuid, permission text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
        SELECT EXISTS(SELECT 1 FROM public.admin_profiles WHERE property_id=p AND user_id=auth.uid() AND is_active AND permission=ANY(team_permissions));
      $$;
      INSERT INTO properties VALUES ('${property}','Europe/Tirane');
      INSERT INTO admin_profiles VALUES ('${owner}','${property}',true,'owner',null),
        ('${operator}','${property}',true,'staff',ARRAY['availability.manage']);
      INSERT INTO room_types VALUES ('${type}','Triple','${property}','published');
      INSERT INTO rooms VALUES ('${left}','${type}','${property}','Left','1',true,'published'),
        ('${right}','${type}','${property}','Right','2',true,'published');
      INSERT INTO bookings VALUES ('${stay}','${property}','2030-11-19','2030-11-22','confirmed',null,'Private guest'),
        ('${hold}','${property}','2030-11-23','2030-11-24','held','2099-01-01','Private hold');
      INSERT INTO room_reservations VALUES ('${stay}','${property}','${left}','2030-11-19','2030-11-22','confirmed',null),
        ('${hold}','${property}','${left}','2030-11-23','2030-11-24','held','2099-01-01');
      INSERT INTO external_calendars VALUES ('${feed}','${property}','Partner feed');
      INSERT INTO external_calendar_events VALUES ('${event}','${feed}');
      INSERT INTO availability_blocks(id,property_id,room_id,start_date,end_date,source,status,reason_code,external_calendar_event_id)
        VALUES ('${imported}','${property}','${right}','2030-11-24','2030-11-24','ical','published','external_calendar','${event}');
    `);
    const migration = readFileSync('database/migrations/20261118_046_availability_calendar.sql', 'utf8');
    await db.exec(migration);
    await db.exec(migration);
    const as = async (user: string) => { await db.exec('RESET ROLE'); await db.query("SELECT set_config('fixture.user',$1,false)", [user]); await db.exec('SET ROLE authenticated'); };
    const inventory = () => db.query<{data: {occupancy: {roomIds:string[]}[];blocks: {id:string; startDate:string; endDate:string; reason:string; notes:string}[]}}>(
      "SELECT admin_calendar_inventory($1,'2030-11-19','2030-11-27') AS data", [property]);
    const change = (operation: string, target: string, payload: object = {}) =>
      db.query('SELECT admin_calendar_change($1,$2,$3,$4)', [property, operation, target, payload]);
    const payload = { startDate:'2030-11-20', endDate:'2030-11-22', reasonCode:'maintenance', reason:'Floor repair', notes:'Private note' };
    await as(outsider);
    await assert.rejects(inventory, /Access denied/);
    await assert.rejects(() => change('room', right, payload), /Access denied/);
    await as(operator);
    const data = (await inventory()).rows[0].data;
    assert.match(JSON.stringify(data), /Partner feed/);
    assert.doesNotMatch(JSON.stringify(data), /Private guest|Private hold/);
    assert.ok(data.occupancy.every(row => row.roomIds.join('') === left));
    await assert.rejects(() => change('room', left, payload), /booking or active hold/);
    await assert.rejects(() => change('room', left, { ...payload, startDate:'2030-11-23', endDate:'2030-11-23' }), /booking or active hold/);
    await assert.rejects(() => change('room', right, { ...payload, startDate:'2030-11-24', endDate:'2030-11-24' }), /already overlaps/);
    await assert.rejects(() => change('reopen', imported), /Only an active manual block/);
    await assert.rejects(() => change('type', type, payload), /Access denied/);
    await change('room', right, payload);
    const created = (await inventory()).rows[0].data.blocks.find(block => block.id !== imported)!;
    assert.deepEqual([created.startDate,created.endDate,created.reason,created.notes],['2030-11-20','2030-11-22','','']);
    await assert.rejects(() => change('room', right, payload), /already overlaps/);
    await as(owner);
    assert.equal((await inventory()).rows[0].data.blocks.find(block => block.id === created.id)?.notes,'Private note');
    await change('reopen', created.id);
    assert.equal((await inventory()).rows[0].data.blocks.some(block => block.id === created.id), false);
    await assert.rejects(() => change('reopen', created.id), /Only an active manual block/);
  } finally { await db.close(); }
});
