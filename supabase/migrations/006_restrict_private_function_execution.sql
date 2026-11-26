-- Escuta Missionaria - restringe execucao direta de funcoes auxiliares internas
begin;

revoke all on function private.is_admin() from anon;
revoke all on function private.current_missionary_id() from anon;
revoke all on function private.has_active_consent(uuid, public.consent_type) from anon, authenticated;
revoke all on function private.is_missionary_active(uuid) from anon, authenticated;

grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_missionary_id() to authenticated;
grant execute on function private.can_view_public_profile(uuid) to anon, authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;

commit;
