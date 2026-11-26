-- Escuta Missionaria - schema inicial v1.2
-- Revisao de seguranca: provisionamento pendente, RLS, fluxo de relatorios,
-- consentimento, integridade referencial e auditoria.
-- IMPORTANTE: ainda requer teste de integracao no projeto Supabase antes de uso.
begin;

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'missionary');
create type public.account_status as enum ('pending', 'active', 'suspended');
create type public.registration_status as enum ('pending', 'approved', 'rejected');
create type public.update_status as enum ('draft', 'submitted', 'under_review', 'approved', 'revision_requested');
create type public.reporting_period_status as enum ('upcoming', 'open', 'closed');
create type public.organization_type as enum ('church', 'mission_base', 'mission_agency', 'ministry', 'other');
create type public.consent_type as enum ('public_profile', 'photos', 'updates', 'contact_sharing');
create type public.request_status as enum ('open', 'in_progress', 'closed');
create type public.notification_status as enum ('pending', 'sent', 'failed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.app_role not null default 'missionary',
  account_status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.registration_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  email text not null check (length(trim(email)) <= 254),
  phone text,
  ministry_summary text not null check (length(trim(ministry_summary)) between 10 and 5000),
  years_in_ministry integer,
  status public.registration_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  constraint registration_years_nonnegative check (years_in_ministry is null or years_in_ministry >= 0),
  constraint registration_review_consistency check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (status <> 'pending' and reviewed_by is not null and reviewed_at is not null)
  )
);

create table public.missionaries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  biography text,
  missionary_start_date date,
  country text,
  state text,
  city text,
  mission_area text,
  ministry_description text,
  marital_status text,
  has_children boolean,
  lives_in_mission_base boolean,
  has_vehicle boolean,
  financial_support_range text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint missionaries_id_profile_unique unique (id, profile_id)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization_type public.organization_type not null default 'other',
  country text,
  state text,
  city text,
  website text,
  contact_email text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.missionary_organizations (
  id uuid primary key default gen_random_uuid(),
  missionary_id uuid not null references public.missionaries(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  relationship_type text not null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  constraint organization_dates_valid check (end_date is null or start_date is null or end_date >= start_date),
  constraint missionary_org_unique unique (missionary_id, organization_id, relationship_type)
);

create table public.reporting_periods (
  id uuid primary key default gen_random_uuid(),
  missionary_id uuid not null references public.missionaries(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  due_date date,
  status public.reporting_period_status not null default 'upcoming',
  justification text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reporting_dates_valid check (period_end >= period_start),
  constraint reporting_period_unique unique (missionary_id, period_start, period_end),
  constraint reporting_id_missionary_unique unique (id, missionary_id)
);

create table public.missionary_updates (
  id uuid primary key default gen_random_uuid(),
  reporting_period_id uuid not null unique,
  missionary_id uuid not null,
  activities text,
  results text,
  challenges text,
  prayer_requests text,
  next_steps text,
  status public.update_status not null default 'draft',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint update_period_owner_fk foreign key (reporting_period_id, missionary_id)
    references public.reporting_periods(id, missionary_id) on delete cascade,
  constraint update_review_consistency check (
    (status in ('draft', 'submitted') and reviewed_by is null and reviewed_at is null)
    or (status in ('under_review', 'approved', 'revision_requested')
        and reviewed_by is not null and reviewed_at is not null)
  ),
  constraint update_submission_consistency check (
    (status = 'draft' and submitted_at is null)
    or (status <> 'draft' and submitted_at is not null)
  )
);

create table public.private_requests (
  id uuid primary key default gen_random_uuid(),
  missionary_id uuid not null references public.missionaries(id) on delete cascade,
  request_type text not null,
  description text not null,
  status public.request_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Consentimentos sao eventos append-only: para revogar, inserir novo evento granted=false.
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  missionary_id uuid not null references public.missionaries(id) on delete cascade,
  consent_type public.consent_type not null,
  granted boolean not null,
  policy_version text not null,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint consent_timestamps_valid check (
    (granted = true and granted_at is not null and revoked_at is null)
    or (granted = false and granted_at is null and revoked_at is not null)
  )
);

create table public.public_profiles (
  id uuid primary key default gen_random_uuid(),
  missionary_id uuid not null unique references public.missionaries(id) on delete cascade,
  public_name text not null,
  public_biography text,
  public_location text,
  public_ministry_description text,
  contact_method text,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'pending_review', 'published', 'unpublished')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint published_requires_approval check (
    publication_status <> 'published' or (approved_by is not null and approved_at is not null)
  )
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  channel text not null default 'email' check (channel = 'email'),
  scheduled_for timestamptz,
  sent_at timestamptz,
  status public.notification_status not null default 'pending',
  error_detail text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index missionaries_profile_id_idx on public.missionaries(profile_id);
create index missionary_org_missionary_idx on public.missionary_organizations(missionary_id);
create index missionary_org_organization_idx on public.missionary_organizations(organization_id);
create index reporting_periods_missionary_due_idx on public.reporting_periods(missionary_id, due_date);
create index updates_missionary_status_idx on public.missionary_updates(missionary_id, status);
create index private_requests_missionary_idx on public.private_requests(missionary_id);
create index consents_missionary_type_idx on public.consents(missionary_id, consent_type, created_at desc);
create index notifications_pending_idx on public.notifications(status, scheduled_for);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin' and p.account_status = 'active'
  );
$$;

create or replace function public.current_missionary_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select m.id
  from public.missionaries m
  join public.profiles p on p.id = m.profile_id
  where m.profile_id = (select auth.uid()) and p.account_status = 'active'
  limit 1;
$$;

create or replace function public.has_active_consent(p_missionary_id uuid, p_type public.consent_type)
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((
    select c.granted and c.revoked_at is null
    from public.consents c
    where c.missionary_id = p_missionary_id and c.consent_type = p_type
    order by c.created_at desc, c.id desc
    limit 1
  ), false);
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.current_missionary_id() from public;
revoke all on function public.has_active_consent(uuid, public.consent_type) from public;
grant execute on function public.is_admin(), public.current_missionary_id(), public.has_active_consent(uuid, public.consent_type) to authenticated, anon;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.id <> old.id then
    raise exception 'O identificador do perfil nao pode ser alterado';
  end if;
  if (new.role is distinct from old.role or new.account_status is distinct from old.account_status)
     and auth.uid() is not null and not public.is_admin() then
    raise exception 'Somente a administracao pode alterar papel ou status da conta';
  end if;
  return new;
end;
$$;

create or replace function public.protect_reporting_period_update()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if old.missionary_id <> public.current_missionary_id()
       or new.id is distinct from old.id
       or new.missionary_id is distinct from old.missionary_id
       or new.period_start is distinct from old.period_start
       or new.period_end is distinct from old.period_end
       or new.due_date is distinct from old.due_date
       or new.status is distinct from old.status
       or new.created_at is distinct from old.created_at then
      raise exception 'Missionario pode alterar somente a justificativa do periodo';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.guard_missionary_update()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_period_status public.reporting_period_status;
begin
  if auth.uid() is not null and not public.is_admin() then
    if old.missionary_id <> public.current_missionary_id()
       or new.id is distinct from old.id
       or new.missionary_id is distinct from old.missionary_id
       or new.reporting_period_id is distinct from old.reporting_period_id
       or new.created_at is distinct from old.created_at
       or old.status not in ('draft', 'revision_requested')
       or new.status not in ('draft', 'submitted')
       or new.reviewed_by is not null or new.reviewed_at is not null
       or new.review_note is not null then
      raise exception 'Relatorio indisponivel para edicao ou transicao nao permitida';
    end if;
    select rp.status into v_period_status
      from public.reporting_periods rp
      where rp.id = new.reporting_period_id and rp.missionary_id = new.missionary_id;
    if new.status = 'submitted' and v_period_status <> 'open' then
      raise exception 'O periodo de atualizacao nao esta aberto';
    end if;
  end if;

  if new.status = 'submitted' and old.status is distinct from 'submitted' then
    new.submitted_at = now();
  elsif new.status = 'draft' then
    new.submitted_at = null;
  end if;
  return new;
end;
$$;

create or replace function public.validate_publication()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.publication_status = 'published' then
    if new.approved_by is null or new.approved_at is null
       or not public.has_active_consent(new.missionary_id, 'public_profile') then
      raise exception 'Publicacao exige aprovacao administrativa e consentimento vigente';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_name text;
begin
  v_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email);
  insert into public.profiles (id, full_name, role, account_status)
  values (new.id, v_name, 'missionary', 'pending')
  on conflict (id) do nothing;

  insert into public.missionaries (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;
  return new;
end;
$$;

create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_row jsonb;
  v_id uuid;
begin
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
  else
    v_row := to_jsonb(new);
  end if;
  begin
    v_id := (v_row ->> 'id')::uuid;
  exception when others then
    v_id := null;
  end;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id)
  values (auth.uid(), lower(tg_op), tg_table_name, v_id);
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.write_audit_log() from public;
revoke all on function public.protect_profile_privileges() from public;
revoke all on function public.protect_reporting_period_update() from public;
revoke all on function public.guard_missionary_update() from public;
revoke all on function public.validate_publication() from public;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger profiles_privilege_guard before update on public.profiles
for each row execute function public.protect_profile_privileges();
create trigger missionaries_updated_at before update on public.missionaries
for each row execute function public.set_updated_at();
create trigger organizations_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
create trigger reporting_periods_updated_at before update on public.reporting_periods
for each row execute function public.set_updated_at();
create trigger reporting_periods_guard before update on public.reporting_periods
for each row execute function public.protect_reporting_period_update();
create trigger missionary_updates_updated_at before update on public.missionary_updates
for each row execute function public.set_updated_at();
create trigger missionary_updates_guard before update on public.missionary_updates
for each row execute function public.guard_missionary_update();
create trigger private_requests_updated_at before update on public.private_requests
for each row execute function public.set_updated_at();
create trigger public_profiles_updated_at before update on public.public_profiles
for each row execute function public.set_updated_at();
create trigger public_profiles_consent_guard before insert or update on public.public_profiles
for each row execute function public.validate_publication();

alter table public.profiles enable row level security;
alter table public.registration_requests enable row level security;
alter table public.missionaries enable row level security;
alter table public.organizations enable row level security;
alter table public.missionary_organizations enable row level security;
alter table public.reporting_periods enable row level security;
alter table public.missionary_updates enable row level security;
alter table public.private_requests enable row level security;
alter table public.consents enable row level security;
alter table public.public_profiles enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_own_or_admin on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update_own_or_admin on public.profiles for update to authenticated
using (id = (select auth.uid()) or (select public.is_admin()))
with check (id = (select auth.uid()) or (select public.is_admin()));

-- Solicitacoes publicas entram por Edge Function com validacao anti-spam.
-- Nao ha INSERT anonimo direto nesta tabela.
create policy registration_admin_all on public.registration_requests for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy missionaries_select_own_or_admin on public.missionaries for select to authenticated
using (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy missionaries_update_own_or_admin on public.missionaries for update to authenticated
using (profile_id = (select auth.uid()) or (select public.is_admin()))
with check (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy missionaries_insert_admin on public.missionaries for insert to authenticated
with check ((select public.is_admin()));

create policy organizations_admin_all on public.organizations for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy organizations_missionary_read_linked on public.organizations for select to authenticated
using (exists (
  select 1 from public.missionary_organizations mo
  where mo.organization_id = organizations.id
    and mo.missionary_id = (select public.current_missionary_id())
));

create policy missionary_organizations_admin_all on public.missionary_organizations for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy missionary_organizations_read_own on public.missionary_organizations for select to authenticated
using (missionary_id = (select public.current_missionary_id()));

create policy reporting_periods_admin_all on public.reporting_periods for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy reporting_periods_read_own on public.reporting_periods for select to authenticated
using (missionary_id = (select public.current_missionary_id()));
create policy reporting_periods_update_own_justification on public.reporting_periods for update to authenticated
using (missionary_id = (select public.current_missionary_id()))
with check (missionary_id = (select public.current_missionary_id()));

create policy updates_admin_all on public.missionary_updates for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy updates_read_own on public.missionary_updates for select to authenticated
using (missionary_id = (select public.current_missionary_id()));
create policy updates_insert_own_draft on public.missionary_updates for insert to authenticated
with check (
  missionary_id = (select public.current_missionary_id())
  and status = 'draft' and submitted_at is null
  and reviewed_by is null and reviewed_at is null
);
create policy updates_update_own_draft on public.missionary_updates for update to authenticated
using (missionary_id = (select public.current_missionary_id()) and status in ('draft', 'revision_requested'))
with check (
  missionary_id = (select public.current_missionary_id())
  and status in ('draft', 'submitted')
  and reviewed_by is null and reviewed_at is null and review_note is null
);

create policy private_requests_admin_all on public.private_requests for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy private_requests_own_all on public.private_requests for all to authenticated
using (missionary_id = (select public.current_missionary_id()))
with check (missionary_id = (select public.current_missionary_id()));

create policy consents_admin_read on public.consents for select to authenticated
using ((select public.is_admin()));
create policy consents_read_own on public.consents for select to authenticated
using (missionary_id = (select public.current_missionary_id()));
create policy consents_insert_own on public.consents for insert to authenticated
with check (missionary_id = (select public.current_missionary_id()));

create policy public_profiles_public_read on public.public_profiles for select to anon, authenticated
using (
  publication_status = 'published'
  and public.has_active_consent(missionary_id, 'public_profile')
);
create policy public_profiles_admin_all on public.public_profiles for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy public_profiles_missionary_read_own on public.public_profiles for select to authenticated
using (missionary_id = (select public.current_missionary_id()));

create policy notifications_admin_all on public.notifications for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy notifications_read_own on public.notifications for select to authenticated
using (profile_id = (select auth.uid()));

create policy audit_logs_admin_read on public.audit_logs for select to authenticated
using ((select public.is_admin()));

-- Auditoria registra operacoes, sem copiar conteudo sensivel dos registros.
create trigger audit_profiles after insert or update or delete on public.profiles
for each row execute function public.write_audit_log();
create trigger audit_registration after insert or update or delete on public.registration_requests
for each row execute function public.write_audit_log();
create trigger audit_missionaries after insert or update or delete on public.missionaries
for each row execute function public.write_audit_log();
create trigger audit_organizations after insert or update or delete on public.organizations
for each row execute function public.write_audit_log();
create trigger audit_missionary_organizations after insert or update or delete on public.missionary_organizations
for each row execute function public.write_audit_log();
create trigger audit_reporting_periods after insert or update or delete on public.reporting_periods
for each row execute function public.write_audit_log();
create trigger audit_missionary_updates after insert or update or delete on public.missionary_updates
for each row execute function public.write_audit_log();
create trigger audit_private_requests after insert or update or delete on public.private_requests
for each row execute function public.write_audit_log();
create trigger audit_consents after insert or update or delete on public.consents
for each row execute function public.write_audit_log();
create trigger audit_public_profiles after insert or update or delete on public.public_profiles
for each row execute function public.write_audit_log();

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.missionaries to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.missionary_organizations to authenticated;
grant select, insert, update, delete on public.reporting_periods to authenticated;
grant select, insert, update, delete on public.missionary_updates to authenticated;
grant select, insert, update, delete on public.private_requests to authenticated;
grant select, insert on public.consents to authenticated;
grant select, insert, update, delete on public.public_profiles to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.public_profiles to anon;

commit;

-- Operacao ainda necessaria antes do lancamento:
-- 1) Desabilitar cadastro publico no Supabase Auth; contas somente por convite administrativo.
-- 2) Aprovacao da solicitacao deve ocorrer no backend confiavel; somente depois emitir convite.
-- 3) A conta nasce PENDING. Admin confere identidade/solicitacao e ativa o perfil.
-- 4) Criar o primeiro admin manualmente no SQL Editor, apos conferir o UUID do Auth.
-- 5) Formulario publico de solicitacao deve usar Edge Function com CAPTCHA/rate limit.
-- 6) Configurar bucket privado e politicas Storage separadas antes de aceitar arquivos.
-- 7) Testar RLS com usuarios distintos (anon, missionario A, missionario B, admin).
-- 8) Nao usar service_role no navegador; manter secrets somente no backend.
