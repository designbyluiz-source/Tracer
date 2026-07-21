-- =============================================================================
-- Tracer — Migration v2 (login por área, auditoria, novo status, duplicidade)
-- Rodar DEPOIS de 0001_init.sql, no SQL Editor do Supabase.
--
-- Este script é IDEMPOTENTE: pode ser executado mais de uma vez sem erro,
-- mesmo que uma tentativa anterior tenha parado no meio.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Remover a view que depende da coluna antiga "stage" (tem que vir antes).
-- -----------------------------------------------------------------------------
drop view if exists cases_enriched cascade;

-- -----------------------------------------------------------------------------
-- 1. Novo enum de status (só cria se ainda não existir).
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'case_status') then
    create type case_status as enum (
      'New',
      'In Review',
      'Waiting for Treasury',
      'Waiting for Clearing',
      'Waiting for Operations',
      'Waiting for Tech',
      'Escalated',
      'Resolved'
    );
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Renomear stage -> status (com backfill do valor antigo).
-- -----------------------------------------------------------------------------
alter table cases add column if not exists status case_status;

-- Backfill a partir de "stage", apenas se a coluna antiga ainda existir.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'cases' and column_name = 'stage'
  ) then
    update cases set status = (
      case stage::text
        when 'New'              then 'New'
        when 'In Progress'      then 'In Review'
        when 'Waiting'          then 'Waiting for Operations'
        when 'Need Information' then 'In Review'
        when 'Resolved'         then 'Resolved'
        else 'New'
      end
    )::case_status
    where status is null;
  end if;
end $$;

-- Garante que ninguém fique sem status, define default e trava NOT NULL.
update cases set status = 'New' where status is null;
alter table cases alter column status set default 'New';
alter table cases alter column status set not null;

-- Remove a coluna e o tipo antigos, e ajusta índices.
drop index if exists cases_stage_idx;
alter table cases drop column if exists stage;
drop type if exists case_stage;
create index if not exists cases_status_idx on cases (status);

-- -----------------------------------------------------------------------------
-- 3. profiles — uma linha por usuário do Supabase Auth, com a área dele.
-- -----------------------------------------------------------------------------
create table if not exists profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  area       team_area not null default 'Operations',
  created_at timestamptz not null default now()
);

comment on table profiles is 'Mapeia cada login (auth.users) para uma team_area.';

-- Mapeia o prefixo do email para a área.
create or replace function area_from_email(addr text)
returns team_area
language sql
immutable
as $$
  select case lower(split_part(coalesce(addr, ''), '@', 1))
    when 'cs'         then 'CS'
    when 'tech'       then 'Tech'
    when 'treasury'   then 'Treasury'
    when 'clearing'   then 'Clearing'
    when 'operations' then 'Operations'
    when 'ops'        then 'Operations'
    else 'Operations'
  end::team_area;
$$;

-- Cria o profile automaticamente ao surgir um novo usuário.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, area)
  values (new.id, new.email, area_from_email(new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Backfill: cria profiles para usuários que já existam.
insert into profiles (id, email, area)
select id, email, area_from_email(email) from auth.users
on conflict (id) do nothing;

-- Helper: área do usuário logado.
create or replace function current_area()
returns team_area
language sql
stable
as $$
  select area from public.profiles where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- 4. case_events — histórico de alterações.
-- -----------------------------------------------------------------------------
create table if not exists case_events (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references cases (id) on delete cascade,
  changed_by  team_area,
  field       text not null,
  old_value   text,
  new_value   text,
  created_at  timestamptz not null default now()
);

create index if not exists case_events_case_id_idx on case_events (case_id, created_at);

comment on table case_events is 'Timeline de mudanças de status/owner/pareceres por caso.';

-- security definer: grava em case_events mesmo com RLS ligado.
create or replace function log_case_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into case_events (case_id, changed_by, field, old_value, new_value)
  values (new.id, new.last_updated_by, 'created', null, new.case_number);
  return new;
end;
$$;

drop trigger if exists trg_cases_log_insert on cases;
create trigger trg_cases_log_insert
  after insert on cases
  for each row
  execute function log_case_insert();

create or replace function log_case_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor team_area := new.last_updated_by;
begin
  if new.status is distinct from old.status then
    insert into case_events (case_id, changed_by, field, old_value, new_value)
    values (new.id, actor, 'status', old.status::text, new.status::text);
  end if;

  if new.current_owner is distinct from old.current_owner then
    insert into case_events (case_id, changed_by, field, old_value, new_value)
    values (new.id, actor, 'current_owner', old.current_owner::text, new.current_owner::text);
  end if;

  if new.op_comment is distinct from old.op_comment then
    insert into case_events (case_id, changed_by, field, old_value, new_value)
    values (new.id, actor, 'op_comment', old.op_comment, new.op_comment);
  end if;

  if new.clearing_comment is distinct from old.clearing_comment then
    insert into case_events (case_id, changed_by, field, old_value, new_value)
    values (new.id, actor, 'clearing_comment', old.clearing_comment, new.clearing_comment);
  end if;

  if new.treasury_comment is distinct from old.treasury_comment then
    insert into case_events (case_id, changed_by, field, old_value, new_value)
    values (new.id, actor, 'treasury_comment', old.treasury_comment, new.treasury_comment);
  end if;

  if new.tech_comment is distinct from old.tech_comment then
    insert into case_events (case_id, changed_by, field, old_value, new_value)
    values (new.id, actor, 'tech_comment', old.tech_comment, new.tech_comment);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_cases_log_update on cases;
create trigger trg_cases_log_update
  after update on cases
  for each row
  execute function log_case_update();

-- -----------------------------------------------------------------------------
-- 5. View cases_enriched (checks de duplicidade independentes + missing_info).
-- -----------------------------------------------------------------------------
create view cases_enriched
with (security_invoker = on) as
select
  c.*,

  exists (
    select 1 from cases o
    where o.id <> c.id and c.order_id is not null and o.order_id = c.order_id
  ) as dup_order,

  exists (
    select 1 from cases o
    where o.id <> c.id and c.e2e_id is not null and o.e2e_id = c.e2e_id
  ) as dup_e2e,

  coalesce((
    select array_agg(distinct o.case_number order by o.case_number)
    from cases o
    where o.id <> c.id and c.order_id is not null and o.order_id = c.order_id
  ), '{}') as dup_order_cases,

  coalesce((
    select array_agg(distinct o.case_number order by o.case_number)
    from cases o
    where o.id <> c.id and c.e2e_id is not null and o.e2e_id = c.e2e_id
  ), '{}') as dup_e2e_cases,

  array_remove(array[
    case when c.account_id is null or c.account_id = '' then 'account_id' end,
    case when c.order_id   is null or c.order_id   = '' then 'order_id'   end,
    case when c.e2e_id     is null or c.e2e_id     = '' then 'e2e_id'     end,
    case when c.tax_id     is null or c.tax_id     = '' then 'tax_id'     end,
    case when c.tx_date    is null                       then 'tx_date'   end,
    case when c.amount     is null                       then 'amount'    end,
    case when c.summary    is null or c.summary    = '' then 'summary'    end
  ], null) as missing_info
from cases c;

comment on view cases_enriched is 'cases + dup_order / dup_e2e (checks independentes) + missing_info.';

-- -----------------------------------------------------------------------------
-- 6. RLS — autenticados leem/escrevem; o histórico registra quem foi.
--    (Políticas recriadas de forma idempotente.)
-- -----------------------------------------------------------------------------
alter table cases       enable row level security;
alter table profiles    enable row level security;
alter table case_events enable row level security;

drop policy if exists cases_select on cases;
drop policy if exists cases_insert on cases;
drop policy if exists cases_update on cases;
create policy cases_select on cases for select to authenticated using (true);
create policy cases_insert on cases for insert to authenticated with check (true);
create policy cases_update on cases for update to authenticated using (true) with check (true);

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated using (true);

drop policy if exists case_events_select on case_events;
create policy case_events_select on case_events for select to authenticated using (true);

-- =============================================================================
-- COMO CRIAR OS LOGINS (uma vez, no painel do Supabase)
-- -----------------------------------------------------------------------------
-- Authentication > Users > "Add user" (marque "Auto Confirm User"). Crie 5,
-- usando estes emails (a área é atribuída automaticamente pelo prefixo):
--
--   cs@tracer.local          -> CS
--   tech@tracer.local        -> Tech
--   treasury@tracer.local    -> Treasury
--   clearing@tracer.local    -> Clearing
--   operations@tracer.local  -> Operations
--
-- Defina uma senha para cada. Pronto: cada área entra com o seu login.
-- =============================================================================
