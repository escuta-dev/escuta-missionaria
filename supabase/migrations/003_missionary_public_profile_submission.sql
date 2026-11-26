-- Escuta Missionaria - submissao de perfil publico pelo proprio missionario
begin;

create policy public_profiles_missionary_insert_own
on public.public_profiles
for insert
to authenticated
with check (
  missionary_id = (select private.current_missionary_id())
  and publication_status in ('draft', 'pending_review')
  and approved_by is null
  and approved_at is null
);

create policy public_profiles_missionary_update_own
on public.public_profiles
for update
to authenticated
using (missionary_id = (select private.current_missionary_id()))
with check (
  missionary_id = (select private.current_missionary_id())
  and publication_status in ('draft', 'pending_review')
  and approved_by is null
  and approved_at is null
);

commit;
