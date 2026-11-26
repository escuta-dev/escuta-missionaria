-- Escuta Missionaria - registra versao e data de aceite do aviso de privacidade na solicitacao
begin;

alter table public.registration_requests
  add column if not exists privacy_notice_version text not null default 'draft-1.0',
  add column if not exists privacy_accepted_at timestamptz not null default now();

commit;
