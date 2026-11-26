-- Escuta Missionaria - schema inicial v1.1
-- Revisar antes de executar. Este arquivo NAO cria usuarios nem concede acesso administrativo.
-- Execute somente no projeto Supabase correto (South America - Sao Paulo).

begin;

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'missionary');
create type public.account_status as enum ('active', 'suspended');
create type public.registration_status as enum ('pending', 'approved', 'rejected');
create type public.update_status as enum ('draft', 'submitted', 'under_review', 'approved', 'revision_requested');
create type public.reporting_period_status as enum ('upcoming', 'open', 'closed');
create type public.organization_type as enum ('church', 'mission_base', 'mission_agency', 'ministry', 'other');
create type public.consent_type as enum ('public_profile', 'photos', 'updates', 'contact_sharing');
create type public.request_status as enum ('open', 'in_progress', 'closed');
create type public.notification_status as enum ('pending', 'sent', 'failed', 'cancelled');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.app_role not null default 'missionary',
  account_status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.registration_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  ministry_summary text not null,
  years_in_ministry integer,
  status public.registration_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  constraint registration_years_nonnegative check (years_in_ministry is null or years_in_ministry >= 0)
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
  updated_at timestamptz not null default now()
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
  constraint reporting_period_unique unique (missionary_id, period_start, period_end)
);

create table public.missionary_updates (
  id uuid primary key default gen_random_uuid(),
  reporting_period_id uuid not null unique references public.reporting_periods(id) on delete cascade,
  missionary_id uuid not null references public.missionaries(id) on delete cascade,
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
  updated_at timestamptz not null default now()
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
    (granted = true and granted_at is not null) or
    (granted = false and revoked_at is not null)
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
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index missionaries_profile_id_idx on public.missionaries(profile_id);
create index missionary_org_missionary_idx on public.missionary_organizations(missionary_id);
create index missionary_org_organization_idx on public.missionary_organizations(organization_id);
create index reporting_periods_missionary_due_idx on public.reporting_periods(missionary_id, due_date);
create index updates_missionary_status_idx on public.missionary_updates(missionary_id, status);
create index private_requests_missionary_idx on public.private_requests(missionary_id);
create index consents_missionary_type_idx on public.consents(missionary_id, consent_type, granted);
create index notifications_pending_idx on public.notifications(status, scheduled_for);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger missionaries_updated_at before update on public.missionaries
for each row execute function public.set_updated_at();
create trigger organizations_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
create trigger reporting_periods_updated_at before update on public.reporting_periods
for each row execute function public.set_updated_at();
create trigger missionary_updates_updated_at before update on public.missionary_updates
for each row execute function public.set_updated_at();
create trigger private_requests_updated_at before update on public.private_requests
for each row execute function public.set_updated_at();
create trigger public_profiles_updated_at before update on public.public_profiles
for each row execute function public.set_updated_at();

-- Perfil criado automaticamente quando um usuario e provisionado pelo Supabase Auth.
-- O convite deve ser enviado somente depois da aprovacao administrativa da solicitacao.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, account_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'missionary',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Funcoes auxiliares SECURITY DEFINER evitam recursao das politicas RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.account_status = 'active'
  );
$$;

create or replace function public.current_missionary_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id from public.missionaries m
  where m.profile_id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.current_missionary_id() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_missionary_id() to authenticated;

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

-- Profiles: cada pessoa le o proprio perfil; administrador le todos.
create policy profiles_select_own_or_admin on public.profiles
for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));

create policy profiles_update_own_or_admin on public.profiles
for update to authenticated
using (id = (select auth.uid()) or (select public.is_admin()))
with check (
  (id = (select auth.uid()) and role = 'missionary' and account_status = 'active')
  or (select public.is_admin())
);

-- Solicitacoes: formulario publico pode inserir; somente admin consulta/decide.
create policy registration_public_insert on public.registration_requests
for insert to anon, authenticated
with check (status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy registration_admin_all on public.registration_requests
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy missionaries_select_own_or_admin on public.missionaries
for select to authenticated
using (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy missionaries_insert_admin on public.missionaries
for insert to authenticated with check ((select public.is_admin()));
create policy missionaries_update_own_or_admin on public.missionaries
for update to authenticated
using (profile_id = (select auth.uid()) or (select public.is_admin()))
with check (profile_id = (select auth.uid()) or (select public.is_admin()));

create policy organizations_admin_all on public.organizations
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy organizations_missionary_read_linked on public.organizations
for select to authenticated
using (exists (
  select 1 from public.missionary_organizations mo
  join public.missionaries m on m.id = mo.missionary_id
  where mo.organization_id = organizations.id and m.profile_id = (select auth.uid())
));

create policy missionary_organizations_admin_all on public.missionary_organizations
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy missionary_organizations_read_own on public.missionary_organizations
for select to authenticated
using (missionary_id = (select public.current_missionary_id()));

create policy reporting_periods_admin_all on public.reporting_periods
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy reporting_periods_read_own on public.reporting_periods
for select to authenticated
using (missionary_id = (select public.current_missionary_id()));

create policy updates_admin_all on public.missionary_updates
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy updates_read_own on public.missionary_updates
for select to authenticated
using (missionary_id = (select public.current_missionary_id()));
create policy updates_insert_own_draft on public.missionary_updates
for insert to authenticated
with check (
  missionary_id = (select public.current_missionary_id())
  and status = 'draft'
  and reviewed_by is null
  and reviewed_at is null
);
create policy updates_update_own_draft on public.missionary_updates
for update to authenticated
using (missionary_id = (select public.current_missionary_id()) and status in ('draft', 'revision_requested'))
with check (
  missionary_id = (select public.current_missionary_id())
  and status in ('draft', 'submitted')
  and reviewed_by is null
  and reviewed_at is null
);

create policy private_requests_admin_all on public.private_requests
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy private_requests_own_all on public.private_requests
for all to authenticated
using (missionary_id = (select public.current_missionary_id()))
with check (missionary_id = (select public.current_missionary_id()));

create policy consents_admin_all on public.consents
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy consents_read_own on public.consents
for select to authenticated
using (missionary_id = (select public.current_missionary_id()));
create policy consents_insert_own on public.consents
for insert to authenticated
with check (missionary_id = (select public.current_missionary_id()));

create policy public_profiles_public_read on public.public_profiles
for select to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1 from public.consents c
    where c.missionary_id = public_profiles.missionary_id
      and c.consent_type = 'public_profile'
      and c.granted = true
      and c.revoked_at is null
  )
);
create policy public_profiles_admin_all on public.public_profiles
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy public_profiles_missionary_read_own on public.public_profiles
for select to authenticated
using (missionary_id = (select public.current_missionary_id()));

create policy notifications_admin_all on public.notifications
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy notifications_read_own on public.notifications
for select to authenticated
using (profile_id = (select auth.uid()));

create policy audit_logs_admin_read on public.audit_logs
for select to authenticated
using ((select public.is_admin()));

-- Privilegios SQL explicitos: RLS continua sendo a camada de autorizacao por linha.
grant usage on schema public to anon, authenticated;
grant select, insert on public.registration_requests to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.missionaries to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.missionary_organizations to authenticated;
grant select, insert, update, delete on public.reporting_periods to authenticated;
grant select, insert, update, delete on public.missionary_updates to authenticated;
grant select, insert, update, delete on public.private_requests to authenticated;
grant select, insert, update, delete on public.consents to authenticated;
grant select, insert, update, delete on public.public_profiles to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.public_profiles to anon;

commit;

-- IMPORTANTE - ETAPAS MANUAIS AINDA NECESSARIAS:
-- 1. Configurar Auth para convite apenas; nao habilitar cadastro publico de contas.
-- 2. Revisar protecao anti-spam/rate limit do formulario de solicitacao.
-- 3. Criar o primeiro usuario administrador e promover seu profile.role por SQL
--    executado pelo proprietario do projeto, apos conferir o UUID correto.
-- 4. Testar cada politica RLS com contas de administrador, missionario e visitante.
-- 5. Completar auditoria por triggers/funcoes antes de considerar o sistema pronto.
-- 6. Configurar Storage privado e politicas proprias antes de aceitar uploads.
