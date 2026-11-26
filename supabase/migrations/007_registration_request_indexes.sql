-- Escuta Missionaria - evita solicitacoes pendentes duplicadas e acelera fila administrativa
begin;

create unique index if not exists registration_requests_pending_email_uidx
  on public.registration_requests (lower(email))
  where status = 'pending';

create index if not exists registration_requests_status_created_idx
  on public.registration_requests (status, created_at desc);

commit;
