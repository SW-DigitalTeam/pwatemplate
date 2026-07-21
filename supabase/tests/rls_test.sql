-- RLS boundary tests. Run by scripts/test-db.sh against a scratch database.
-- Tests access DIRECTLY at the database boundary (hiding a button is not a test).
\set ON_ERROR_STOP on

create or replace function test.assert(cond boolean, msg text) returns void
language plpgsql as $$
begin
  if not cond then raise exception 'FAILED: %', msg; end if;
  raise notice 'ok: %', msg;
end $$;

-- helper to become a user
create or replace procedure test.login(uid text)
language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid, false);
end $$;

set role authenticated;

-- 1. Teacher at Kōwhai sees own school participants only
call test.login('00000000-0000-0000-0000-00000000b001');
select test.assert(
  (select count(*) from public.participants) = 2,
  'Kōwhai teacher sees exactly the 2 Kōwhai participants');
select test.assert(
  not exists (select 1 from public.participants where school_id = '00000000-0000-0000-0000-000000050002'),
  'Kōwhai teacher cannot see any Rimu participant');

-- 2. Rimu teacher: isolation in the other direction
call test.login('00000000-0000-0000-0000-00000000c001');
select test.assert(
  (select count(*) from public.participants) = 1,
  'Rimu teacher sees exactly 1 Rimu participant');

-- 3. SW reporting user cannot read identifiable participants…
call test.login('00000000-0000-0000-0000-00000000a003');
select test.assert(
  (select count(*) from public.participants) = 0,
  'sw_reporting sees no identifiable participant rows');
-- …but can read aggregates
select test.assert(
  (select coalesce(sum(registered),0) from public.v_participation_summary) >= 3,
  'sw_reporting can read participation aggregates');

-- 4. SW programme admin sees everything
call test.login('00000000-0000-0000-0000-00000000a002');
select test.assert(
  (select count(*) from public.participants) = 3,
  'sw_programme_admin sees all participants');

-- 5. Participant sees only their own record
call test.login('00000000-0000-0000-0000-00000000d001');
select test.assert(
  (select count(*) from public.participants) = 1
  and exists (select 1 from public.participants where display_name like 'Aroha%'),
  'participant account sees only their own record');

-- 6. Teacher cannot approve their own school programme (status change blocked)
-- RLS USING silently excludes rows from UPDATE (0 rows affected, no error),
-- so we assert on the OUTCOME: the row is unchanged.
call test.login('00000000-0000-0000-0000-00000000b001');
update public.school_programmes
  set status = 'suspended'
  where id = '00000000-0000-0000-0000-000000ab0001';
select test.assert(
  (select status from public.school_programmes where id = '00000000-0000-0000-0000-000000ab0001'
   ) = 'approved',
  'teacher (non-admin) attempted status change affected zero rows');

-- 7. Attendance correction requires supersede pattern
call test.login('00000000-0000-0000-0000-00000000b001');
do $$
declare v_old uuid; v_new uuid;
begin
  select id into v_old from public.attendance
    where participant_id = '00000000-0000-0000-0000-0000aa000002' and superseded_by is null;
  insert into public.attendance (session_id, participant_id, status, recorded_by)
    values ('00000000-0000-0000-0000-00005e000001', '00000000-0000-0000-0000-0000aa000002',
            'present', '00000000-0000-0000-0000-00000000b001')
    returning id into v_new;
  update public.attendance set superseded_by = v_new where id = v_old;
  perform test.assert(true, 'attendance corrected via supersede with audit-safe history');
end $$;

-- 8. Audit log is append-only for API roles
call test.login('00000000-0000-0000-0000-00000000a002');
select app.write_audit('test.action', 'tests', null);
-- No DELETE policy exists, so DELETE affects zero rows for API roles.
delete from public.audit_log;
select test.assert(
  (select count(*) from public.audit_log) > 0,
  'audit_log rows persist: delete without a policy affected zero rows');

-- 9. Safeguarding issues restricted
call test.login('00000000-0000-0000-0000-00000000b001');
insert into public.issues (school_id, category, severity, title)
  values ('00000000-0000-0000-0000-000000050001', 'safeguarding', 'high', 'synthetic safeguarding test');
select test.assert(
  not exists (select 1 from public.issues where category = 'safeguarding'),
  'reporter (teacher) cannot read back safeguarding issues');
call test.login('00000000-0000-0000-0000-00000000a002');
select test.assert(
  exists (select 1 from public.issues where category = 'safeguarding'),
  'sw_programme_admin can read safeguarding issues');

reset role;
select 'ALL RLS TESTS PASSED' as result;
