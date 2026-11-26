-- Escuta Missionaria - registro minimo de tentativas para limitar abuso do formulario publico
begin;

create table public.registration_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text,
  email_hash text not null,
  created_at timestamptz not null default now()
);

create index registration_attempts_ip_created_idx
  on public.registration_attempts (ip_hash, created_at desc)
  where ip_hash is not null;
create index registration_attempts_email_created_idx
  on public.registration_attempts (email_hash, created_at desc);

alter table public.registration_attempts enable row level security;
revoke all on public.registration_attempts from anon, authenticated;
grant select, insert, delete on public.registration_attempts to service_role;

commit;
