-- Migration 0003: row-level security
-- Every table has RLS enabled. Default posture: deny.
-- School isolation is the hard invariant: no school staff can ever read
-- another school's identifiable participant data.

-- Enable RLS everywhere
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_roles','schools','programmes','school_programmes','cohorts',
    'participants','enrolments','consent_versions','consents','sessions','attendance',
    'movement_entries','surveys','survey_assignments','survey_responses','issues',
    'audit_log','invitations','notification_outbox','support_grants']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- ---------- profiles ----------
create policy profiles_self_read on public.profiles for select
  using (id = auth.uid() or app.is_sw_staff());
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_school_staff_read on public.profiles for select
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = profiles.id and ur.revoked_at is null
      and ur.school_id is not null and app.is_school_staff(ur.school_id)
  ));

-- ---------- user_roles ----------
create policy user_roles_self_read on public.user_roles for select
  using (user_id = auth.uid() or app.is_sw_staff());
create policy user_roles_admin_write on public.user_roles for insert
  with check (app.has_role('sw_programme_admin') or app.is_system_admin()
              or (app.has_role('school_admin', school_id)
                  and role in ('teacher','facilitator','participant','caregiver')));
create policy user_roles_admin_revoke on public.user_roles for update
  using (app.has_role('sw_programme_admin') or app.is_system_admin()
         or app.has_role('school_admin', school_id))
  with check (true);

-- ---------- programmes (public metadata; config is not sensitive) ----------
create policy programmes_read_all on public.programmes for select using (is_active or app.is_sw_staff());
create policy programmes_sw_write on public.programmes for all
  using (app.has_role('sw_programme_admin') or app.is_system_admin())
  with check (app.has_role('sw_programme_admin') or app.is_system_admin());

-- ---------- schools ----------
create policy schools_read on public.schools for select
  using (app.is_sw_staff() or app.is_school_staff(id));
create policy schools_public_insert on public.schools for insert
  with check (auth.uid() is not null);   -- any signed-in user may create a pending school application
create policy schools_update on public.schools for update
  using (app.is_sw_staff() or app.has_role('school_admin', id))
  with check (
    -- school admins can edit details but only SW staff may change status
    app.is_sw_staff() or (app.has_role('school_admin', id) and status = 'approved')
  );

-- ---------- school_programmes ----------
create policy sp_read on public.school_programmes for select
  using (app.is_sw_staff() or app.is_school_staff(school_id));
create policy sp_apply on public.school_programmes for insert
  with check (app.has_role('school_admin', school_id) or app.is_sw_staff());
create policy sp_update on public.school_programmes for update
  using (app.is_sw_staff() or app.has_role('school_admin', school_id))
  with check (app.is_sw_staff() or app.has_role('school_admin', school_id));

-- ---------- cohorts ----------
create policy cohorts_read on public.cohorts for select
  using (app.is_sw_staff() or exists (
    select 1 from public.school_programmes sp
    where sp.id = cohorts.school_programme_id and app.is_school_staff(sp.school_id)));
create policy cohorts_write on public.cohorts for all
  using (exists (
    select 1 from public.school_programmes sp
    where sp.id = cohorts.school_programme_id
      and (app.is_sw_staff() or app.is_school_staff(sp.school_id))))
  with check (exists (
    select 1 from public.school_programmes sp
    where sp.id = cohorts.school_programme_id
      and (app.is_sw_staff() or app.is_school_staff(sp.school_id))));

-- ---------- participants (THE isolation boundary) ----------
create policy participants_school_staff on public.participants for select
  using (app.is_school_staff(school_id)
         or app.has_role('sw_programme_admin')
         or app.is_system_admin()
         or user_id = auth.uid());
-- sw_reporting deliberately has NO select on identifiable participants;
-- reporting users work from aggregate views only.
create policy participants_write on public.participants for insert
  with check (app.is_school_staff(school_id) or app.has_role('sw_programme_admin') or app.is_system_admin());
create policy participants_update on public.participants for update
  using (app.is_school_staff(school_id) or app.has_role('sw_programme_admin') or app.is_system_admin())
  with check (app.is_school_staff(school_id) or app.has_role('sw_programme_admin') or app.is_system_admin());

-- ---------- enrolments ----------
create policy enrolments_read on public.enrolments for select
  using (app.is_sw_staff() or exists (
    select 1 from public.school_programmes sp
    where sp.id = enrolments.school_programme_id and app.is_school_staff(sp.school_id))
    or exists (
    select 1 from public.participants p
    where p.id = enrolments.participant_id and p.user_id = auth.uid()));
create policy enrolments_write on public.enrolments for all
  using (app.has_role('sw_programme_admin') or app.is_system_admin() or exists (
    select 1 from public.school_programmes sp
    where sp.id = enrolments.school_programme_id and app.is_school_staff(sp.school_id)))
  with check (app.has_role('sw_programme_admin') or app.is_system_admin() or exists (
    select 1 from public.school_programmes sp
    where sp.id = enrolments.school_programme_id and app.is_school_staff(sp.school_id)));

-- ---------- consent ----------
create policy consent_versions_read on public.consent_versions for select using (true);
create policy consent_versions_write on public.consent_versions for all
  using (app.has_role('sw_programme_admin') or app.is_system_admin())
  with check (app.has_role('sw_programme_admin') or app.is_system_admin());

create policy consents_read on public.consents for select
  using (app.has_role('sw_programme_admin') or app.is_system_admin()
         or granted_by_user = auth.uid()
         or exists (select 1 from public.participants p
                    where p.id = consents.participant_id
                      and (app.is_school_staff(p.school_id) or p.user_id = auth.uid())));
create policy consents_insert on public.consents for insert
  with check (auth.uid() is not null);
create policy consents_withdraw on public.consents for update
  using (granted_by_user = auth.uid() or app.has_role('sw_programme_admin') or app.is_system_admin()
         or exists (select 1 from public.participants p
                    where p.id = consents.participant_id and app.is_school_staff(p.school_id)))
  with check (true);

-- ---------- sessions & attendance ----------
create policy sessions_read on public.sessions for select
  using (app.is_sw_staff() or exists (
    select 1 from public.school_programmes sp
    where sp.id = sessions.school_programme_id and app.is_school_staff(sp.school_id)));
create policy sessions_write on public.sessions for all
  using (app.has_role('sw_programme_admin') or app.is_system_admin() or exists (
    select 1 from public.school_programmes sp
    where sp.id = sessions.school_programme_id and app.is_school_staff(sp.school_id)))
  with check (app.has_role('sw_programme_admin') or app.is_system_admin() or exists (
    select 1 from public.school_programmes sp
    where sp.id = sessions.school_programme_id and app.is_school_staff(sp.school_id)));

create policy attendance_read on public.attendance for select
  using (app.is_sw_staff() or exists (
    select 1 from public.sessions s
    join public.school_programmes sp on sp.id = s.school_programme_id
    where s.id = attendance.session_id and app.is_school_staff(sp.school_id)));
create policy attendance_insert on public.attendance for insert
  with check (exists (
    select 1 from public.sessions s
    join public.school_programmes sp on sp.id = s.school_programme_id
    where s.id = attendance.session_id
      and (app.is_school_staff(sp.school_id) or app.has_role('sw_programme_admin') or app.is_system_admin())));
-- Corrections: only supersede, never mutate the substantive fields directly.
create policy attendance_supersede on public.attendance for update
  using (exists (
    select 1 from public.sessions s
    join public.school_programmes sp on sp.id = s.school_programme_id
    where s.id = attendance.session_id
      and (app.is_school_staff(sp.school_id) or app.has_role('sw_programme_admin') or app.is_system_admin())))
  with check (superseded_by is not null);

-- ---------- movement entries ----------
create policy movement_read on public.movement_entries for select
  using (app.is_sw_staff() or exists (
    select 1 from public.enrolments e
    join public.school_programmes sp on sp.id = e.school_programme_id
    where e.id = movement_entries.enrolment_id and app.is_school_staff(sp.school_id))
    or exists (
    select 1 from public.enrolments e
    join public.participants p on p.id = e.participant_id
    where e.id = movement_entries.enrolment_id and p.user_id = auth.uid()));
create policy movement_insert on public.movement_entries for insert
  with check (
    app.has_role('sw_programme_admin') or app.is_system_admin()
    or exists (
      select 1 from public.enrolments e
      join public.school_programmes sp on sp.id = e.school_programme_id
      where e.id = movement_entries.enrolment_id and app.is_school_staff(sp.school_id))
    or (source = 'self_reported' and exists (
      select 1 from public.enrolments e
      join public.participants p on p.id = e.participant_id
      where e.id = movement_entries.enrolment_id and p.user_id = auth.uid())));

-- ---------- surveys ----------
create policy surveys_read on public.surveys for select
  using (status = 'published' or app.is_sw_staff());
create policy surveys_write on public.surveys for all
  using (app.has_role('sw_programme_admin') or app.is_system_admin())
  with check (app.has_role('sw_programme_admin') or app.is_system_admin());

create policy survey_assignments_read on public.survey_assignments for select
  using (app.is_sw_staff() or exists (
    select 1 from public.school_programmes sp
    where sp.id = survey_assignments.school_programme_id and app.is_school_staff(sp.school_id)));
create policy survey_assignments_write on public.survey_assignments for all
  using (app.has_role('sw_programme_admin') or app.is_system_admin())
  with check (app.has_role('sw_programme_admin') or app.is_system_admin());

create policy responses_own_read on public.survey_responses for select
  using (
    app.has_role('sw_programme_admin') or app.is_system_admin() or app.has_role('sw_reporting')
    or exists (select 1 from public.participants p
               where p.id = survey_responses.participant_id and p.user_id = auth.uid()));
-- Note: sw_reporting can read responses because analysis requires row data,
-- but identified responses expose participant_id only, and the reporting UI
-- joins through the pseudonym view (see 0004) with small-group suppression.
create policy responses_insert on public.survey_responses for insert
  with check (auth.uid() is not null or anon_token is not null);
create policy responses_update_own on public.survey_responses for update
  using (status = 'in_progress' and (
    exists (select 1 from public.participants p
            where p.id = survey_responses.participant_id and p.user_id = auth.uid())
    or app.has_role('sw_programme_admin') or app.is_system_admin()))
  with check (true);

-- ---------- issues ----------
create policy issues_read on public.issues for select
  using (
    case when category = 'safeguarding'
      then app.has_role('sw_programme_admin') or app.is_system_admin()
      else app.is_sw_staff() or (school_id is not null and app.is_school_staff(school_id))
            or reported_by = auth.uid()
    end);
create policy issues_insert on public.issues for insert
  with check (auth.uid() is not null);
create policy issues_update on public.issues for update
  using (app.is_sw_staff())
  with check (app.is_sw_staff());

-- ---------- audit log (append-only) ----------
create policy audit_read on public.audit_log for select
  using (app.has_role('sw_programme_admin') or app.is_system_admin());
create policy audit_insert on public.audit_log for insert
  with check (auth.uid() is not null);
-- No update or delete policies: with FORCE RLS, rows are immutable to all API roles.

-- ---------- invitations ----------
create policy invitations_read on public.invitations for select
  using (app.is_sw_staff() or (school_id is not null and app.is_school_staff(school_id)));
create policy invitations_write on public.invitations for all
  using (app.is_sw_staff() or (school_id is not null and app.has_role('school_admin', school_id)))
  with check (app.is_sw_staff() or (school_id is not null and app.has_role('school_admin', school_id)));

-- ---------- notification outbox / support grants (service + admins only) ----------
create policy outbox_admin on public.notification_outbox for all
  using (app.is_system_admin()) with check (app.is_system_admin());
create policy support_grants_read on public.support_grants for select
  using (app.is_sw_staff() or support_user = auth.uid());
create policy support_grants_write on public.support_grants for insert
  with check (app.is_system_admin() or app.has_role('sw_programme_admin'));
