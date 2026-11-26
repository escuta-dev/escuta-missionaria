-- Escuta Missionaria - documenta bloqueio explicito da tabela antiabuso para clientes
begin;

create policy registration_attempts_deny_api
on public.registration_attempts
for all
to anon, authenticated
using (false)
with check (false);

commit;
