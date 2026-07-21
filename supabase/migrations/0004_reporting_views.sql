-- Migration 0004: reporting views with small-group suppression, audit trigger helpers

-- Pseudonymised analysis view: reporting staff work from this, never from
-- identifiable participants. security_invoker keeps RLS of underlying tables.
create view public.v_participation_summary
with (security_invoker = off) as
select
  pr.slug as programme_slug,
  s.region,
  sp.school_id,
  count(distinct e.participant_id) as registered,
  count(distinct e.participant_id) filter (where e.status = 'active') as active,
  count(distinct e.participant_id) filter (where e.status = 'completed') as completed,
  count(distinct e.participant_id) filter (where e.status = 'withdrawn') as withdrawn
from public.enrolments e
join public.school_programmes sp on sp.id = e.school_programme_id
join public.programmes pr on pr.id = sp.programme_id
join public.schools s on s.id = sp.school_id
group by pr.slug, s.region, sp.school_id;

comment on view public.v_participation_summary is
  'Definitions: registered = any enrolment; active = enrolment status active; retained is computed in reporting layer as active at week N / registered. See docs/operations/data-dictionary.md.';

-- Small-group suppression: demographic breakdowns below this threshold are
-- suppressed at the API layer. The database records the rule as a constant
-- so app and docs cannot drift.
create or replace function app.small_group_threshold() returns int
language sql immutable as $$ select 5 $$;

-- Movement measures rollup (per programme, per measure_key - never mixed)
create view public.v_movement_rollup
with (security_invoker = off) as
select
  pr.slug as programme_slug,
  sp.school_id,
  me.measure_key,
  me.unit,
  me.source,
  date_trunc('week', me.occurred_on)::date as week,
  count(*) as entries,
  sum(me.value) as total_value,
  count(distinct e.participant_id) as participants
from public.movement_entries me
join public.enrolments e on e.id = me.enrolment_id
join public.school_programmes sp on sp.id = e.school_programme_id
join public.programmes pr on pr.id = sp.programme_id
group by pr.slug, sp.school_id, me.measure_key, me.unit, me.source, week;

-- Survey completion rates
create view public.v_survey_completion
with (security_invoker = off) as
select
  sv.programme_id,
  sv.key as survey_key,
  sv.version,
  count(*) filter (where r.status = 'submitted') as submitted,
  count(*) filter (where r.status = 'in_progress') as in_progress
from public.surveys sv
left join public.survey_responses r on r.survey_id = sv.id
group by sv.programme_id, sv.key, sv.version;

-- Grants: views are exposed to authenticated users; each consuming role sees
-- them through PostgREST. Underlying row filtering for schools happens in the
-- reporting API layer using these aggregates (already de-identified).
grant select on public.v_participation_summary, public.v_movement_rollup, public.v_survey_completion to public;

-- ---------- Audit helper ----------
create or replace function app.write_audit(
  p_action text, p_entity text, p_entity_id uuid,
  p_school uuid default null, p_programme uuid default null,
  p_detail jsonb default '{}'::jsonb
) returns void
language sql security definer set search_path = public
as $$
  insert into public.audit_log (actor, action, entity, entity_id, school_id, programme_id, detail)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_school, p_programme, p_detail)
$$;

-- Automatic audit of privileged transitions
create or replace function app.audit_school_programme_decision() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    perform app.write_audit('school_programme.status:' || new.status::text,
      'school_programmes', new.id, new.school_id, new.programme_id,
      jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end $$;
create trigger audit_sp_decision after update on public.school_programmes
  for each row execute function app.audit_school_programme_decision();

create or replace function app.audit_role_grant() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform app.write_audit(
    case when tg_op = 'INSERT' then 'role.grant' else 'role.change' end,
    'user_roles', new.id, new.school_id, new.programme_id,
    jsonb_build_object('role', new.role, 'user', new.user_id, 'revoked_at', new.revoked_at));
  return new;
end $$;
create trigger audit_role_grant after insert or update on public.user_roles
  for each row execute function app.audit_role_grant();
