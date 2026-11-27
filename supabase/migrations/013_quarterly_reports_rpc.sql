begin;

-- Wrapper público para permitir que o painel administrativo invoque
-- a função privada por RPC. A autorização continua sendo validada
-- dentro da função privada, e o wrapper não eleva privilégios.
create or replace function public.ensure_reporting_periods()
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.ensure_reporting_periods();
$$;

revoke all on function public.ensure_reporting_periods() from public, anon;
grant execute on function public.ensure_reporting_periods() to authenticated;

commit;