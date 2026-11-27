begin;

-- Campos complementares do relatório trimestral. Todos permanecem privados
-- sob as políticas RLS já existentes em missionary_updates.
alter table public.missionary_updates
  add column if not exists community_relationship text,
  add column if not exists people_reached integer,
  add column if not exists testimony text,
  add column if not exists support_situation text,
  add column if not exists urgent_needs text,
  add column if not exists support_needed text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.missionary_updates'::regclass
      and conname = 'missionary_updates_people_reached_nonnegative'
  ) then
    alter table public.missionary_updates
      add constraint missionary_updates_people_reached_nonnegative
      check (people_reached is null or people_reached >= 0);
  end if;
end;
$$;

-- Permite envio fora do prazo. A data-limite sinaliza atraso no painel,
-- mas não bloqueia o missionário de enviar o relatório.
-- Também limpa os dados da análise anterior ao receber uma complementação.
create or replace function private.guard_missionary_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not private.is_admin() then
    if old.missionary_id <> private.current_missionary_id()
       or new.id is distinct from old.id
       or new.missionary_id is distinct from old.missionary_id
       or new.reporting_period_id is distinct from old.reporting_period_id
       or new.created_at is distinct from old.created_at
       or old.status not in ('draft', 'revision_requested')
       or new.status not in ('draft', 'submitted') then
      raise exception 'Relatorio indisponivel para edicao ou transicao nao permitida';
    end if;

    if old.status = 'revision_requested' then
      new.reviewed_by := null;
      new.reviewed_at := null;
      new.review_note := null;
    elsif new.reviewed_by is not null
       or new.reviewed_at is not null
       or new.review_note is not null then
      raise exception 'Missionario nao pode alterar dados da avaliacao administrativa';
    end if;
  end if;

  if new.status = 'submitted' and old.status is distinct from 'submitted' then
    new.submitted_at = now();
  elsif new.status = 'draft' then
    new.submitted_at = null;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_missionary_update() from public, anon, authenticated;

-- Provisiona o trimestre atual e os três seguintes para missionários ativos.
-- Não cria pendências retroativas. A função é idempotente e só pode ser
-- executada por administrador autenticado.
create or replace function private.ensure_reporting_periods()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first_day date;
  v_period_start date;
  v_period_end date;
  v_due_date date;
  v_offset integer;
  v_inserted integer;
  v_total integer := 0;
begin
  if auth.uid() is null or not private.is_admin() then
    raise exception 'Acesso restrito à administração'
      using errcode = '42501';
  end if;

  v_first_day := date_trunc('quarter', current_date)::date;

  for v_offset in 0..3 loop
    v_period_start := (v_first_day + (v_offset * interval '3 months'))::date;
    v_period_end := (v_period_start + interval '3 months - 1 day')::date;
    v_due_date := (
      date_trunc('month', v_period_end + interval '1 month') + interval '14 days'
    )::date;

    insert into public.reporting_periods (
      missionary_id, period_start, period_end, due_date, status
    )
    select
      m.id,
      v_period_start,
      v_period_end,
      v_due_date,
      case
        when v_period_start <= current_date then 'open'::public.reporting_period_status
        else 'upcoming'::public.reporting_period_status
      end
    from public.missionaries m
    join public.profiles p on p.id = m.profile_id
    where p.role = 'missionary'
      and p.account_status = 'active'
    on conflict (missionary_id, period_start, period_end)
    do update set
      due_date = excluded.due_date,
      status = case
        when public.reporting_periods.status = 'upcoming'
          and excluded.status = 'open'
        then 'open'::public.reporting_period_status
        else public.reporting_periods.status
      end;

    get diagnostics v_inserted = row_count;
    v_total := v_total + v_inserted;
  end loop;

  return v_total;
end;
$$;

revoke all on function private.ensure_reporting_periods() from public, anon;
grant execute on function private.ensure_reporting_periods() to authenticated;

commit;