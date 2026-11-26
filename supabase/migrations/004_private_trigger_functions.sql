-- Escuta Missionaria - move funcoes SECURITY DEFINER de public para private
begin;

alter function public.protect_profile_privileges() set schema private;
alter function public.protect_reporting_period_update() set schema private;
alter function public.guard_missionary_update() set schema private;
alter function public.validate_publication() set schema private;
alter function public.handle_new_auth_user() set schema private;
alter function public.write_audit_log() set schema private;

revoke all on function private.protect_profile_privileges() from public, anon, authenticated;
revoke all on function private.protect_reporting_period_update() from public, anon, authenticated;
revoke all on function private.guard_missionary_update() from public, anon, authenticated;
revoke all on function private.validate_publication() from public, anon, authenticated;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
revoke all on function private.write_audit_log() from public, anon, authenticated;

commit;
