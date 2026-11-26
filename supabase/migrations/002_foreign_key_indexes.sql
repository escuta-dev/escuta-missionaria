-- Escuta Missionaria - indices de chaves estrangeiras identificados pelo Database Advisor
begin;

create index if not exists audit_logs_actor_id_idx
  on public.audit_logs(actor_id);
create index if not exists missionary_updates_reviewed_by_idx
  on public.missionary_updates(reviewed_by);
create index if not exists missionary_updates_period_owner_idx
  on public.missionary_updates(reporting_period_id, missionary_id);
create index if not exists notifications_profile_id_idx
  on public.notifications(profile_id);
create index if not exists public_profiles_approved_by_idx
  on public.public_profiles(approved_by);
create index if not exists registration_requests_reviewed_by_idx
  on public.registration_requests(reviewed_by);

commit;
