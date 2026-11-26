-- Escuta Missionaria: libera somente leitura para usuarios autenticados.
-- A policy registration_admin_all restringe as linhas aos administradores ativos.
begin;
grant select on table public.registration_requests to authenticated;
commit;
