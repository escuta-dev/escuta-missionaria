-- Private attachments for quarterly missionary reports.
-- Bucket is private; every object operation is governed by storage.objects RLS.

create table if not exists public.missionary_update_attachments (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.missionary_updates(id) on delete cascade,
  missionary_id uuid not null references public.missionaries(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint missionary_update_attachments_path_matches check (
    storage_path like missionary_id::text || '/' || update_id::text || '/%'
  ),
  constraint missionary_update_attachments_mime_allowed check (
    mime_type in ('image/jpeg','image/png','image/webp','application/pdf')
  )
);

alter table public.missionary_update_attachments enable row level security;
revoke all on public.missionary_update_attachments from anon, public;
grant select, insert, delete on public.missionary_update_attachments to authenticated;

create policy missionary_attachments_read on public.missionary_update_attachments
for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.missionaries m
    where m.id = missionary_update_attachments.missionary_id
      and m.profile_id = (select auth.uid())
  )
);

create policy missionary_attachments_insert_own on public.missionary_update_attachments
for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and exists (
    select 1 from public.missionaries m
    join public.missionary_updates u on u.missionary_id = m.id
    where m.id = missionary_update_attachments.missionary_id
      and m.profile_id = (select auth.uid())
      and u.id = missionary_update_attachments.update_id
      and u.status in ('draft','revision_requested')
  )
);

create policy missionary_attachments_delete_own on public.missionary_update_attachments
for delete to authenticated
using (
  exists (
    select 1 from public.missionaries m
    join public.missionary_updates u on u.missionary_id = m.id
    where m.id = missionary_update_attachments.missionary_id
      and m.profile_id = (select auth.uid())
      and u.id = missionary_update_attachments.update_id
      and u.status in ('draft','revision_requested')
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'missionary-report-attachments',
  'missionary-report-attachments',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy missionary_report_files_read on storage.objects
for select to authenticated
using (
  bucket_id = 'missionary-report-attachments'
  and (
    private.is_admin()
    or exists (
      select 1 from public.missionaries m
      join public.missionary_updates u on u.missionary_id = m.id
      where m.id::text = (storage.foldername(name))[1]
        and u.id::text = (storage.foldername(name))[2]
        and m.profile_id = (select auth.uid())
    )
  )
);

create policy missionary_report_files_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'missionary-report-attachments'
  and exists (
    select 1 from public.missionaries m
    join public.missionary_updates u on u.missionary_id = m.id
    where m.id::text = (storage.foldername(name))[1]
      and u.id::text = (storage.foldername(name))[2]
      and m.profile_id = (select auth.uid())
      and u.status in ('draft','revision_requested')
  )
);

create policy missionary_report_files_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'missionary-report-attachments'
  and exists (
    select 1 from public.missionaries m
    join public.missionary_updates u on u.missionary_id = m.id
    where m.id::text = (storage.foldername(name))[1]
      and u.id::text = (storage.foldername(name))[2]
      and m.profile_id = (select auth.uid())
      and u.status in ('draft','revision_requested')
  )
);
