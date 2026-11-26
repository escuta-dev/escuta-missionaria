-- Escuta Missionaria - remove privilegios de TRUNCATE/REFERENCES/TRIGGER de roles da API
begin;

revoke truncate, references, trigger
on all tables in schema public
from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
revoke truncate, references, trigger on tables
from anon, authenticated, service_role;

commit;
