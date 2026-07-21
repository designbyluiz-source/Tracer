-- =============================================================================
-- Tracer — Migration v3 (unificar / merge de casos duplicados)
-- Rodar DEPOIS de 0003_comment_area_lock.sql, no SQL Editor do Supabase.
--
-- Como funciona:
--   - Você escolhe o caso "master" (sobrevive) e o "secundário" (é mesclado).
--   - O master mantém seus valores e só PREENCHE o que estiver vazio a partir
--     do secundário. Os 4 pareceres são REUNIDOS.
--   - O secundário fica marcado (merged_into) e TRAVADO para edição — não é
--     apagado. Some das abas de trabalho, aparece só em "Todos".
--   - Tudo em uma única transação, com registro no histórico dos dois casos.
-- Idempotente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Coluna de vínculo do merge.
-- -----------------------------------------------------------------------------
alter table cases
  add column if not exists merged_into uuid references cases (id);

create index if not exists cases_merged_into_idx on cases (merged_into);

-- -----------------------------------------------------------------------------
-- 2. Trava de comentário por área — agora com "bypass" para o merge.
--    (recria a função de 0003 adicionando a checagem do flag de transação)
-- -----------------------------------------------------------------------------
create or replace function enforce_comment_area()
returns trigger
language plpgsql
as $$
declare
  actor team_area := current_area();
begin
  -- Durante o merge, a combinação de pareceres é permitida.
  if coalesce(current_setting('tracer.bypass', true), '') = 'on' then
    return new;
  end if;
  if actor is null then
    return new;
  end if;

  if new.op_comment is distinct from old.op_comment and actor <> 'Operations' then
    raise exception 'Apenas Operations pode editar o parecer de Operations.';
  end if;
  if new.clearing_comment is distinct from old.clearing_comment and actor <> 'Clearing' then
    raise exception 'Apenas Clearing pode editar o parecer de Clearing.';
  end if;
  if new.treasury_comment is distinct from old.treasury_comment and actor <> 'Treasury' then
    raise exception 'Apenas Treasury pode editar o parecer de Treasury.';
  end if;
  if new.tech_comment is distinct from old.tech_comment and actor <> 'Tech' then
    raise exception 'Apenas Tech pode editar o parecer de Tech.';
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Bloqueio de edição de casos já mesclados (exceto durante o merge).
-- -----------------------------------------------------------------------------
create or replace function block_merged_edits()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('tracer.bypass', true), '') = 'on' then
    return new;
  end if;
  if old.merged_into is not null then
    raise exception 'Este caso foi mesclado. Edite o caso master.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cases_block_merged on cases;
create trigger trg_cases_block_merged
  before update on cases
  for each row
  execute function block_merged_edits();

-- -----------------------------------------------------------------------------
-- 4. Helper: combina dois textos de parecer preservando a origem.
-- -----------------------------------------------------------------------------
create or replace function combine_comment(a text, b text, from_case text)
returns text
language sql
immutable
as $$
  select case
    when coalesce(b, '') = '' then a
    when coalesce(a, '') = '' then b
    else a || E'\n\n[de ' || from_case || '] ' || b
  end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Função principal: merge_cases(master, secundário).
-- -----------------------------------------------------------------------------
create or replace function merge_cases(p_master uuid, p_secondary uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m cases;
  s cases;
  actor team_area := current_area();
begin
  if p_master = p_secondary then
    raise exception 'Não é possível unificar um caso com ele mesmo.';
  end if;

  select * into m from cases where id = p_master;
  select * into s from cases where id = p_secondary;
  if m.id is null or s.id is null then
    raise exception 'Caso não encontrado.';
  end if;
  if m.merged_into is not null then
    raise exception 'O caso master já foi mesclado em outro.';
  end if;
  if s.merged_into is not null then
    raise exception 'O caso secundário já foi mesclado em outro.';
  end if;

  -- Libera as travas de comentário/merge só nesta transação.
  perform set_config('tracer.bypass', 'on', true);

  -- Master: mantém o que tem, preenche vazios do secundário, junta pareceres.
  update cases set
    account_id       = coalesce(nullif(m.account_id, ''), s.account_id),
    order_id         = coalesce(nullif(m.order_id, ''), s.order_id),
    e2e_id           = coalesce(nullif(m.e2e_id, ''), s.e2e_id),
    tax_id           = coalesce(nullif(m.tax_id, ''), s.tax_id),
    tx_date          = coalesce(m.tx_date, s.tx_date),
    amount           = coalesce(m.amount, s.amount),
    summary          = coalesce(nullif(m.summary, ''), s.summary),
    due_date         = coalesce(m.due_date, s.due_date),
    next_action      = coalesce(nullif(m.next_action, ''), s.next_action),
    task_url         = coalesce(nullif(m.task_url, ''), s.task_url),
    op_comment       = combine_comment(m.op_comment, s.op_comment, s.case_number),
    clearing_comment = combine_comment(m.clearing_comment, s.clearing_comment, s.case_number),
    treasury_comment = combine_comment(m.treasury_comment, s.treasury_comment, s.case_number),
    tech_comment     = combine_comment(m.tech_comment, s.tech_comment, s.case_number),
    last_updated_by  = coalesce(actor, m.last_updated_by)
  where id = p_master;

  -- Secundário: marcado como mesclado (fica travado a partir de agora).
  update cases set
    merged_into = p_master,
    last_updated_by = coalesce(actor, s.last_updated_by)
  where id = p_secondary;

  -- Histórico dos dois lados.
  insert into case_events (case_id, changed_by, field, old_value, new_value)
  values
    (p_master,    actor, 'merged',      null, s.case_number),
    (p_secondary, actor, 'merged_into', null, m.case_number);
end;
$$;

grant execute on function merge_cases(uuid, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. View: expõe merged_into e o número do master (merged_into_number).
-- -----------------------------------------------------------------------------
drop view if exists cases_enriched cascade;

create view cases_enriched
with (security_invoker = on) as
select
  c.*,

  (select mc.case_number from cases mc where mc.id = c.merged_into) as merged_into_number,

  exists (
    select 1 from cases o
    where o.id <> c.id and c.order_id is not null and o.order_id = c.order_id
      and o.merged_into is null
  ) as dup_order,

  exists (
    select 1 from cases o
    where o.id <> c.id and c.e2e_id is not null and o.e2e_id = c.e2e_id
      and o.merged_into is null
  ) as dup_e2e,

  coalesce((
    select array_agg(distinct o.case_number order by o.case_number)
    from cases o
    where o.id <> c.id and c.order_id is not null and o.order_id = c.order_id
      and o.merged_into is null
  ), '{}') as dup_order_cases,

  coalesce((
    select array_agg(distinct o.case_number order by o.case_number)
    from cases o
    where o.id <> c.id and c.e2e_id is not null and o.e2e_id = c.e2e_id
      and o.merged_into is null
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

comment on view cases_enriched is 'cases + merge + dup_order/dup_e2e (ignorando casos já mesclados) + missing_info.';
